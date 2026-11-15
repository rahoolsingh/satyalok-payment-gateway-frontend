import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import PropTypes from "prop-types";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Header from "../header/Header";
import { fetchPledgeStatus } from "./pledgeApi";

const POLL_INTERVAL_MS = 4000;
const MAX_POLLS = 45;

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
        : "Not scheduled";

const TONE = {
    active: "bg-[#16a34a]",
    waiting: "bg-[#b98314]",
    failed: "bg-[#b4463c]",
};

const Status = ({ tone, children }) => (
    <p className="flex items-center gap-2 text-[13px]">
        <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + TONE[tone]} />
        <span className="pl-secondary">{children}</span>
    </p>
);

Status.propTypes = {
    tone: PropTypes.oneOf(["active", "waiting", "failed"]).isRequired,
    children: PropTypes.node.isRequired,
};

const Line = ({ label, value, mono = false }) => (
    <div className="flex items-baseline justify-between gap-6 py-3">
        <dt className="pl-muted text-[13px]">{label}</dt>
        <dd
            className={
                "text-right text-[13px] " + (mono ? "pl-mono" : "pl-tabular pl-secondary")
            }
        >
            {value || "Not set"}
        </dd>
    </div>
);

Line.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    mono: PropTypes.bool,
};

Line.defaultProps = { value: "", mono: false };

/**
 * Shown after the donor is handed to their UPI app.
 *
 * The donor usually approves in-app and never returns to this tab, so the page
 * polls the API (which reconciles with the gateway) and settles itself.
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
            setError(err?.response?.data?.message || "This pledge could not be loaded");
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
            <div className="pl-page min-h-screen">
                <Header />
                <div className="mx-auto max-w-lg px-6 py-24">
                    <p className="pl-mono pl-muted text-[12px]">Monthly giving</p>
                    <h1 className="pl-display mt-3 text-[32px] leading-tight">
                        No pledge reference in this link
                    </h1>
                    <p className="pl-secondary mt-3 text-[14px] leading-6">
                        Start a pledge, or open the link from the email we sent you.
                    </p>
                    <Link to="/pledge" className="pl-btn-primary mt-6 max-w-xs">
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
        <div className="pl-page min-h-screen">
            <Header />

            <div className="mx-auto max-w-lg px-6 py-16">
                <Link
                    to="/"
                    className="pl-muted inline-flex items-center gap-1.5 text-[13px] hover:text-[#1f1b16]"
                >
                    <ArrowLeft size={14} strokeWidth={1.5} /> Donations
                </Link>

                <div className="pl-receipt mt-6">
                    <div className="flex items-baseline justify-between px-6 pt-6">
                        <p className="pl-mono pl-muted text-[11px]">
                            {status ? status.pledgeRef : "Loading"}
                        </p>
                        <p className="pl-mono pl-muted text-[11px]">
                            {status ? status.status.replace(/_/g, " ").toLowerCase() : ""}
                        </p>
                    </div>

                    <div className="px-6 pt-5">
                        <h1 className="pl-display text-[28px] leading-tight">
                            {waiting && "Approve the mandate in your UPI app"}
                            {isActive && "Your monthly pledge is active"}
                            {isFailed && "This pledge was not activated"}
                        </h1>

                        <div className="mt-3">
                            {waiting && (
                                <Status tone="waiting">
                                    Waiting for your approval. This page updates on its own.
                                </Status>
                            )}
                            {isActive && (
                                <Status tone="active">
                                    First debit received. Next debit scheduled.
                                </Status>
                            )}
                            {isFailed && (
                                <Status tone="failed">
                                    Nothing was debited. Try again with a different UPI ID.
                                </Status>
                            )}
                        </div>
                    </div>

                    {status && (
                        <dl className="pl-hairline mx-6 mt-5 divide-y border-t">
                            <Line label="Amount" value={currency(status.amount) + " a month"} />
                            <Line label="Next debit" value={formatDate(status.nextDebitAt)} />
                            <Line
                                label="Debited from"
                                value={status.maskedInstrument || "Linked UPI account"}
                            />
                            <Line
                                label="Debits so far"
                                value={String(status.cyclesCompleted || 0)}
                                mono
                            />
                        </dl>
                    )}

                    <div className="pl-perf pl-perf-notch relative mt-6 flex items-center justify-between px-6 py-3">
                        <p className="pl-mono pl-muted text-[11px]">
                            {waiting ? "Waiting for approval" : "Receipt emailed"}
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setPollCount(0);
                                load();
                            }}
                            className="pl-muted inline-flex items-center gap-1.5 text-[12px] hover:text-[#1f1b16]"
                        >
                            <RefreshCw size={13} strokeWidth={1.5} /> Refresh
                        </button>
                    </div>
                </div>

                {waiting && pollCount >= MAX_POLLS && (
                    <p className="pl-secondary mt-4 text-[13px] leading-6">
                        Still waiting. If you approved it, the confirmation email is
                        already on its way. Otherwise start again with a different UPI ID.
                    </p>
                )}

                {error && (
                    <p className="mt-4 text-[13px] leading-6 text-[#b4463c]">{error}</p>
                )}

                {!status && !error && (
                    <p className="pl-mono pl-muted mt-6 text-[12px]">Loading the pledge</p>
                )}

                {isActive && (
                    <p className="pl-secondary mt-6 text-[13px] leading-6">
                        Manage the pledge with the link in your welcome email, or{" "}
                        <Link to="/pledge/manage" className="pl-accent underline underline-offset-2">
                            request a new link
                        </Link>
                        .
                    </p>
                )}
            </div>
        </div>
    );
}

export default PledgeStatus;
