import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import {
    CheckCircle2,
    Clock,
    XCircle,
    CalendarClock,
    ShieldCheck,
    RefreshCw,
    ArrowLeft,
} from "lucide-react";
import Header from "../header/Header";
import Loading from "../loading/Loading";
import { fetchPledgeStatus } from "./pledgeApi";

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 45; // ~3 minutes, then we ask the donor to check their email

const currency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);

const formatDate = (value) =>
    value
        ? new Intl.DateTimeFormat("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
          }).format(new Date(value))
        : "—";

const Row = ({ label, value, mono = false }) => (
    <div className="flex items-center justify-between py-3 text-sm">
        <span className="text-slate-500">{label}</span>
        <span
            className={`text-right font-semibold text-slate-900 ${
                mono ? "font-mono text-xs tracking-tight" : ""
            }`}
        >
            {value || "—"}
        </span>
    </div>
);

Row.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    mono: PropTypes.bool,
};

Row.defaultProps = {
    value: "",
    mono: false,
};

/**
 * Shown right after the donor is sent to their UPI app to approve the mandate.
 *
 * The donor usually approves in-app without returning to this tab, so we poll the
 * server (which reconciles with the gateway) and flip to active as soon as the
 * mandate is live.
 */
function PledgeStatus() {
    const [params] = useSearchParams();
    const pledgeRef = params.get("ref");

    const [status, setStatus] = useState(null);
    const [error, setError] = useState("");
    const [pollCount, setPollCount] = useState(0);

    const load = useCallback(async () => {
        if (!pledgeRef) return;

        try {
            const response = await fetchPledgeStatus(pledgeRef);
            setStatus(response.data);
            setError("");
        } catch (err) {
            setError(err?.response?.data?.message || "Could not load your pledge.");
        }
    }, [pledgeRef]);

    useEffect(() => {
        load();
    }, [load]);

    useEffect(() => {
        if (!pledgeRef) return undefined;
        if (status && status.status !== "PENDING_AUTH") return undefined;
        if (pollCount >= MAX_POLLS) return undefined;

        const timer = setTimeout(() => {
            setPollCount((count) => count + 1);
            load();
        }, POLL_INTERVAL_MS);

        return () => clearTimeout(timer);
    }, [pledgeRef, status, pollCount, load]);

    if (!pledgeRef) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header />
                <div className="mx-auto max-w-xl px-4 py-24 text-center">
                    <h1 className="text-2xl font-bold text-slate-900">
                        No pledge reference found
                    </h1>
                    <p className="mt-3 text-slate-600">
                        This link is missing a pledge reference. Start a pledge, or use the
                        link we emailed you.
                    </p>
                    <Link
                        to="/pledge"
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                        Start a monthly pledge
                    </Link>
                </div>
            </div>
        );
    }

    const isActive = status?.status === "ACTIVE";
    const isFailed = ["AUTH_FAILED", "CANCELLED"].includes(status?.status);
    const waiting = !isActive && !isFailed;


    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <div className="mx-auto max-w-2xl px-4 py-16">
                <Link
                    to="/"
                    className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700"
                >
                    <ArrowLeft size={16} /> Back to donations
                </Link>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-8 text-center">
                        {waiting && (
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                                <Clock className="h-8 w-8 text-amber-500" />
                            </div>
                        )}

                        {isActive && (
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
                                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                            </div>
                        )}

                        {isFailed && (
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                                <XCircle className="h-8 w-8 text-red-500" />
                            </div>
                        )}

                        <h1 className="text-2xl font-bold text-slate-900">
                            {waiting && "Approve the mandate in your UPI app"}
                            {isActive && "Your monthly pledge is active"}
                            {isFailed && "We couldn't activate this pledge"}
                        </h1>

                        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-600">
                            {waiting &&
                                "Open your UPI app and approve the mandate request. This page updates automatically — you can close it once you've approved."}
                            {isActive &&
                                "Thank you! Your first donation has been received and your monthly auto-debit is now live. A receipt is on its way to your inbox."}
                            {isFailed &&
                                "The mandate was not approved, so no money has been debited. You can try again with a different UPI ID."}
                        </p>
                    </div>

                    {status && (
                        <div className="divide-y divide-slate-100 px-8 py-6">
                            <Row label="Pledge reference" value={status.pledgeRef} mono />
                            <Row
                                label="Monthly amount"
                                value={`${currency(status.amount)} / month`}
                            />
                            <Row
                                label="Status"
                                value={status.status.replace(/_/g, " ").toLowerCase()}
                            />
                            <Row label="Next debit" value={formatDate(status.nextDebitAt)} />
                            <Row
                                label="Debited from"
                                value={status.maskedInstrument || "Linked UPI account"}
                            />
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-3 bg-slate-50 px-8 py-4">
                        <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
                            <ShieldCheck size={14} className="text-emerald-600" />
                            RBI e-mandate compliant · cancel anytime
                        </span>

                        <button
                            type="button"
                            onClick={() => {
                                setPollCount(0);
                                load();
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                            <RefreshCw size={13} /> Refresh
                        </button>
                    </div>
                </div>

                {waiting && pollCount >= MAX_POLLS && (
                    <p className="mt-6 flex items-start gap-2 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
                        Still waiting? If you approved the mandate we&apos;ve emailed your
                        confirmation and a manage link. Otherwise start again with a
                        different UPI ID.
                    </p>
                )}

                {error && (
                    <p className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </p>
                )}

                {!status && !error && (
                    <div className="mt-10 flex justify-center">
                        <Loading />
                    </div>
                )}

                {isActive && (
                    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center">
                        <p className="text-sm text-slate-600">
                            Manage your pledge any time using the link in your welcome
                            email, or request a fresh link.
                        </p>
                        <Link
                            to="/pledge/manage"
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            Manage my pledge
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PledgeStatus;
