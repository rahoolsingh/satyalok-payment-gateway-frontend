import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import {
    AlertTriangle,
    CheckCircle2,
    Clock,
    Download,
    Loader2,
    PauseCircle,
    PlayCircle,
    RefreshCw,
    Repeat,
    ShieldCheck,
    SkipForward,
    XCircle,
} from "lucide-react";
import Header from "../header/Header";
import {
    cancelPledge,
    extractApiError,
    fetchPortal,
    pausePledge,
    requestPortalLink,
    resumePledge,
    skipCycle,
} from "./pledgeApi";

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

const STATUS_STYLES = {
    ACTIVE: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    PAUSED: "bg-amber-50 text-amber-700 ring-amber-200",
    PAST_DUE: "bg-red-50 text-red-700 ring-red-200",
    CANCELLED: "bg-slate-100 text-slate-600 ring-slate-200",
    COMPLETED: "bg-blue-50 text-blue-700 ring-blue-200",
    PENDING_AUTH: "bg-amber-50 text-amber-700 ring-amber-200",
    AUTH_FAILED: "bg-red-50 text-red-700 ring-red-200",
};

const Badge = ({ status }) => (
    <span
        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ring-1 ${
            STATUS_STYLES[status] || "bg-slate-100 text-slate-600 ring-slate-200"
        }`}
    >
        {status.replace(/_/g, " ")}
    </span>
);

const Info = ({ label, value }) => (
    <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {label}
        </p>
        <p className="mt-0.5 font-medium text-slate-800">{value || "—"}</p>
    </div>
);

Badge.propTypes = {
    status: PropTypes.string.isRequired,
};

Info.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

Info.defaultProps = {
    value: "",
};

/** Email lookup shown when the donor has lost their manage link. */
const LinkRequestForm = () => {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const response = await requestPortalLink(email.trim());
            setMessage(response.message);
        } catch (error) {
            setMessage(extractApiError(error));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form
            onSubmit={submit}
            className="mx-auto mt-8 max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
            <label htmlFor="email" className="text-sm font-semibold text-slate-700">
                Email you pledged with
            </label>
            <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none ring-1 ring-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-600"
            />
            <button
                type="submit"
                disabled={loading}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-70"
            >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Email me a manage link
            </button>
            {message && (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
                    {message}
                </p>
            )}
        </form>
    );
};

/**
 * Donor self-service portal, reached through a signed magic link.
 *
 * Everything the RBI framework expects a payer to be able to do is one click
 * away: see what will be debited and when, skip a month, pause, or cancel.
 */
function DonorPortal() {
    const { token } = useParams();

    const [data, setData] = useState(null);
    const [error, setError] = useState("");
    const [busy, setBusy] = useState("");
    const [notice, setNotice] = useState("");
    const [confirmCancel, setConfirmCancel] = useState(false);

    const load = useCallback(async () => {
        if (!token) return;

        try {
            const response = await fetchPortal(token);
            setData(response.data);
            setError("");
        } catch (err) {
            setError(
                err?.response?.data?.message ||
                    "This link is invalid or has expired. Request a new one below.",
            );
        }
    }, [token]);

    useEffect(() => {
        load();
    }, [load]);

    const runAction = async (action, label) => {
        setBusy(action);
        setNotice("");

        try {
            if (action === "skip") await skipCycle(token);
            if (action === "pause") await pausePledge(token, "Paused by donor");
            if (action === "resume") await resumePledge(token);
            if (action === "cancel") await cancelPledge(token, "Cancelled by donor");

            await load();
            setNotice(label);
        } catch (err) {
            setError(extractApiError(err));
        } finally {
            setBusy("");
            setConfirmCancel(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header />
                <div className="mx-auto max-w-2xl px-4 py-20 text-center">
                    <Repeat className="mx-auto h-10 w-10 text-blue-600" />
                    <h1 className="mt-4 text-2xl font-bold text-slate-900">
                        Manage your monthly pledge
                    </h1>
                    <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
                        Enter the email you pledged with and we&apos;ll send you a secure
                        link to view, pause or cancel your pledge.
                    </p>
                </div>
                <LinkRequestForm />
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header />
                <div className="mx-auto max-w-2xl px-4 py-20 text-center">
                    <XCircle className="mx-auto h-10 w-10 text-red-500" />
                    <h1 className="mt-4 text-2xl font-bold text-slate-900">
                        Link unavailable
                    </h1>
                    <p className="mx-auto mt-3 max-w-md text-sm text-slate-600">
                        {error}
                    </p>
                </div>
                <LinkRequestForm />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Header />
                <div className="flex justify-center py-32">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            </div>
        );
    }

    const { pledge, debits, donations } = data;
    const isCancelled = ["CANCELLED", "COMPLETED"].includes(pledge.status);
    const isPaused = pledge.status === "PAUSED";

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <div className="mx-auto max-w-3xl px-4 py-12">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            Your pledge
                        </p>
                        <h1 className="mt-1 font-mono text-lg font-bold text-slate-900">
                            {pledge.pledgeRef}
                        </h1>
                    </div>
                    <Badge status={pledge.status} />
                </div>

                {notice && (
                    <p className="mt-5 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        {notice}
                    </p>
                )}

                {error && (
                    <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </p>
                )}

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Monthly
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {currency(pledge.amount)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Donated so far
                        </p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                            {currency(pledge.totalDonated)}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                            Next debit
                        </p>
                        <p className="mt-1 text-lg font-bold text-slate-900">
                            {isCancelled ? "—" : formatDate(pledge.nextDebitAt)}
                        </p>
                    </div>
                </div>

                <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <Info label="Donor" value={pledge.donor?.name} />
                        <Info label="Mobile" value={pledge.donor?.phone} />
                        <Info
                            label="Debited from"
                            value={pledge.maskedInstrument || "Linked UPI account"}
                        />
                        <Info
                            label="80G receipts"
                            value={
                                pledge.donor?.taxBenefit
                                    ? `Yes · PAN ${pledge.donor.panMasked}`
                                    : "Not requested"
                            }
                        />
                        <Info label="Started" value={formatDate(pledge.startedAt)} />
                        <Info
                            label="Mandate valid until"
                            value={formatDate(pledge.expiresAt)}
                        />
                    </div>
                </div>

                {!isCancelled && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-sm font-bold text-slate-900">
                            Manage this pledge
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                            Changes apply immediately. Cancelling stops every future debit.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2.5">
                            <button
                                type="button"
                                onClick={() =>
                                    runAction("skip", "This month's donation is skipped.")
                                }
                                disabled={Boolean(busy) || isPaused}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                                {busy === "skip" ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <SkipForward className="h-4 w-4" />
                                )}
                                Skip this month
                            </button>

                            {isPaused ? (
                                <button
                                    type="button"
                                    onClick={() =>
                                        runAction("resume", "Your pledge is active again.")
                                    }
                                    disabled={Boolean(busy)}
                                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                    {busy === "resume" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <PlayCircle className="h-4 w-4" />
                                    )}
                                    Resume
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() =>
                                        runAction("pause", "Your pledge is paused.")
                                    }
                                    disabled={Boolean(busy)}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    {busy === "pause" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <PauseCircle className="h-4 w-4" />
                                    )}
                                    Pause
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setConfirmCancel(true)}
                                disabled={Boolean(busy)}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                                <XCircle className="h-4 w-4" />
                                Cancel pledge
                            </button>
                        </div>

                        {confirmCancel && (
                            <div className="mt-4 rounded-xl bg-red-50 p-4">
                                <p className="flex items-start gap-2 text-sm text-red-800">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                                    This cancels your mandate and stops all future debits.
                                    You can start a new pledge any time.
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            runAction(
                                                "cancel",
                                                "Your pledge has been cancelled.",
                                            )
                                        }
                                        disabled={busy === "cancel"}
                                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                                    >
                                        {busy === "cancel" && (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        )}
                                        Yes, cancel my pledge
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmCancel(false)}
                                        className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                                    >
                                        Keep it
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <p className="text-sm font-bold text-slate-900">Debit history</p>
                        <button
                            type="button"
                            onClick={load}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
                        >
                            <RefreshCw size={13} /> Refresh
                        </button>
                    </div>

                    {debits.length === 0 && (
                        <p className="px-5 py-8 text-center text-sm text-slate-500">
                            No debits yet. Your first one happens when you approve the mandate.
                        </p>
                    )}

                    <ul className="divide-y divide-slate-100">
                        {debits.map((debit) => (
                            <li
                                key={`${debit.cycleNumber}-${debit.attempt}`}
                                className="flex items-center justify-between gap-3 px-5 py-3.5"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                            debit.status === "SUCCESS"
                                                ? "bg-emerald-50"
                                                : debit.status === "FAILED"
                                                  ? "bg-red-50"
                                                  : "bg-slate-100"
                                        }`}
                                    >
                                        {debit.status === "SUCCESS" ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                        ) : debit.status === "FAILED" ? (
                                            <XCircle className="h-4 w-4 text-red-500" />
                                        ) : (
                                            <Clock className="h-4 w-4 text-slate-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-900">
                                            {currency(debit.amount)} · Month {debit.cycleNumber}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {formatDate(debit.scheduledFor)}
                                            {debit.failedReason ? ` · ${debit.failedReason}` : ""}
                                        </p>
                                    </div>
                                </div>

                                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                    {debit.status.toLowerCase()}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                {donations.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
                        <p className="text-sm font-bold text-slate-900">Receipts</p>
                        <ul className="mt-3 divide-y divide-slate-100">
                            {donations.map((donation) => (
                                <li
                                    key={donation.transactionId}
                                    className="flex items-center justify-between py-2.5 text-sm"
                                >
                                    <span className="text-slate-600">
                                        {formatDate(donation.donatedAt)} · {currency(donation.amount)}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                        <Download size={13} />
                                        {donation.certificate ? "80G emailed" : "Receipt emailed"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <p className="mt-6 flex items-start gap-2 rounded-xl bg-white p-4 text-xs leading-relaxed text-slate-500 ring-1 ring-slate-200">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    This page never shows your full account number or UPI ID. Every debit is
                    notified 24 hours in advance, and you can dispute any charge by replying
                    to your receipt email.
                </p>

                <div className="mt-6 text-center">
                    <Link
                        to="/"
                        className="text-sm font-semibold text-slate-500 hover:text-slate-700"
                    >
                        Back to Satyalok donations
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default DonorPortal;
