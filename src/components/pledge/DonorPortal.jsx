import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PropTypes from "prop-types";
import { Loader2, RefreshCw } from "lucide-react";
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

/** Semantic colour only where it carries meaning. */
const TONE = {
    ACTIVE: "bg-[#16a34a]",
    PAUSED: "bg-[#b98314]",
    PAST_DUE: "bg-[#b4463c]",
    PENDING_AUTH: "bg-[#b98314]",
    AUTH_FAILED: "bg-[#b4463c]",
    CANCELLED: "bg-[#a89e92]",
    COMPLETED: "bg-[#a89e92]",
};

const Dot = ({ status }) => (
    <span className="flex items-center gap-2">
        <span className={"h-1.5 w-1.5 shrink-0 rounded-full " + (TONE[status] || TONE.CANCELLED)} />
        <span className="pl-secondary text-[13px]">
            {String(status).replace(/_/g, " ").toLowerCase()}
        </span>
    </span>
);

Dot.propTypes = { status: PropTypes.string.isRequired };

const Figure = ({ label, value }) => (
    <div className="px-5 py-4">
        <p className="pl-muted text-[12px]">{label}</p>
        <p className="pl-tabular mt-1 text-[24px] font-medium leading-none">{value}</p>
    </div>
);

Figure.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string.isRequired };

const Row = ({ label, value }) => (
    <div className="flex items-baseline justify-between gap-6 py-2.5">
        <dt className="pl-muted text-[13px]">{label}</dt>
        <dd className="pl-secondary text-right text-[13px]">{value || "—"}</dd>
    </div>
);

Row.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string };
Row.defaultProps = { value: "" };

/** Email lookup for a donor who lost the manage link. */
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
        <form onSubmit={submit} className="pl-card mt-6 p-6">
            <label htmlFor="email" className="pl-secondary mb-1.5 block text-[13px] font-medium">
                Email you pledged with
            </label>
            <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="pl-field"
            />
            <button type="submit" disabled={loading} className="pl-btn-primary mt-4">
                {loading && <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />}
                Email me a link
            </button>
            {message && (
                <p className="pl-muted mt-3 text-[12px] leading-5">{message}</p>
            )}
        </form>
    );
};

/**
 * Donor self-service, reached through a signed magic link.
 * Skip, pause, resume and cancel are all one click away, as the RBI framework
 * expects a payer to be able to do.
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
            <div className="pl-page min-h-screen">
                <Header />
                <div className="mx-auto max-w-lg px-6 py-20">
                    <p className="pl-mono pl-muted text-[12px]">Monthly giving</p>
                    <h1 className="pl-display mt-3 text-[32px] leading-tight">
                        Manage your monthly pledge
                    </h1>
                    <p className="pl-secondary mt-3 text-[14px] leading-6">
                        Enter the email you pledged with and we will send a link to view,
                        pause or cancel it.
                    </p>
                    <LinkRequestForm />
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="pl-page min-h-screen">
                <Header />
                <div className="mx-auto max-w-lg px-6 py-20">
                    <h1 className="pl-display text-[32px] leading-tight">Link unavailable</h1>
                    <p className="pl-secondary mt-3 text-[14px] leading-6">{error}</p>
                    <LinkRequestForm />
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="pl-page min-h-screen">
                <Header />
                <p className="pl-mono pl-muted mx-auto max-w-lg px-6 py-24 text-[12px]">
                    Loading the pledge
                </p>
            </div>
        );
    }

    const { pledge, debits, donations } = data;
    const isCancelled = ["CANCELLED", "COMPLETED"].includes(pledge.status);
    const isPaused = pledge.status === "PAUSED";

    return (
        <div className="pl-page min-h-screen">
            <Header />

            <div className="mx-auto max-w-2xl px-6 py-16">
                <div className="flex items-start justify-between gap-6">
                    <div>
                        <p className="pl-mono pl-muted text-[12px]">{pledge.pledgeRef}</p>
                        <h1 className="pl-display mt-2 text-[28px] leading-tight">
                            {currency(pledge.amount)} a month
                        </h1>
                    </div>
                    <div className="pt-6">
                        <Dot status={pledge.status} />
                    </div>
                </div>

                {notice && (
                    <p className="pl-accent mt-4 text-[13px] leading-5">{notice}</p>
                )}
                {error && (
                    <p className="mt-4 text-[13px] leading-5 text-[#b4463c]">{error}</p>
                )}

                <div className="pl-card mt-8 divide-y divide-[rgba(31,27,22,0.09)] sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                    <Figure label="Donated so far" value={currency(pledge.totalDonated)} />
                    <Figure label="Debits made" value={String(pledge.cyclesCompleted)} />
                    <Figure
                        label="Next debit"
                        value={isCancelled ? "—" : formatDate(pledge.nextDebitAt)}
                    />
                </div>

                <dl className="pl-hairline mt-6 divide-y border-t text-[13px]">
                    <Row label="Donor" value={pledge.donor?.name} />
                    <Row label="Mobile" value={pledge.donor?.phone} />
                    <Row label="Debited from" value={pledge.maskedInstrument} />
                    <Row
                        label="80G receipts"
                        value={
                            pledge.donor?.taxBenefit
                                ? "Included, PAN " + pledge.donor.panMasked
                                : "Not requested"
                        }
                    />
                    <Row label="Started" value={formatDate(pledge.startedAt)} />
                    <Row label="Mandate valid until" value={formatDate(pledge.expiresAt)} />
                </dl>

                {!isCancelled && (
                    <div className="mt-8">
                        <p className="pl-secondary text-[13px]">
                            Changes apply immediately. Cancelling stops every future debit.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    runAction("skip", "This month's donation is skipped")
                                }
                                disabled={Boolean(busy) || isPaused}
                                className="pl-btn-quiet"
                            >
                                Skip this month
                            </button>

                            {isPaused ? (
                                <button
                                    type="button"
                                    onClick={() => runAction("resume", "The pledge is active again")}
                                    disabled={Boolean(busy)}
                                    className="pl-btn-quiet"
                                >
                                    Resume
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => runAction("pause", "The pledge is paused")}
                                    disabled={Boolean(busy)}
                                    className="pl-btn-quiet"
                                >
                                    Pause
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => setConfirmCancel(true)}
                                disabled={Boolean(busy)}
                                className="pl-btn-quiet text-[#b4463c]"
                                style={{ borderColor: "rgba(180,70,60,0.32)" }}
                            >
                                Cancel pledge
                            </button>
                        </div>

                        {confirmCancel && (
                            <div className="pl-raised mt-4 rounded-[10px] p-4">
                                <p className="pl-secondary text-[13px] leading-5">
                                    This cancels the mandate and stops every future debit. You
                                    can start a new pledge any time.
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            runAction("cancel", "The pledge is cancelled")
                                        }
                                        disabled={busy === "cancel"}
                                        className="pl-btn-quiet text-[#b4463c]"
                                        style={{ borderColor: "rgba(180,70,60,0.32)" }}
                                    >
                                        {busy === "cancel" && (
                                            <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                                        )}
                                        Cancel the pledge
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setConfirmCancel(false)}
                                        className="pl-btn-quiet"
                                    >
                                        Keep it
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-8">
                    <div className="flex items-center justify-between">
                        <p className="pl-secondary text-[13px] font-medium">Debit history</p>
                        <button
                            type="button"
                            onClick={load}
                            className="pl-muted inline-flex items-center gap-1.5 text-[12px] hover:text-[#1f1b16]"
                        >
                            <RefreshCw size={13} strokeWidth={1.5} /> Refresh
                        </button>
                    </div>

                    {debits.length === 0 ? (
                        <p className="pl-muted mt-3 text-[13px]">
                            No debits yet. The first one happens when you approve the mandate.
                        </p>
                    ) : (
                        <ul className="pl-hairline mt-3 divide-y border-t">
                            {debits.map((debit) => (
                                <li
                                    key={debit.cycleNumber + "-" + debit.attempt}
                                    className="flex items-center justify-between gap-4 py-3"
                                >
                                    <div className="flex items-baseline gap-4">
                                        <span className="pl-mono pl-muted w-[88px] shrink-0 whitespace-nowrap text-[12px]">
                                            {formatDate(debit.scheduledFor)}
                                        </span>
                                        <span className="pl-tabular text-[13px]">
                                            {currency(debit.amount)}
                                        </span>
                                        {debit.failedReason && (
                                            <span className="pl-muted text-[12px]">
                                                {debit.failedReason}
                                            </span>
                                        )}
                                    </div>
                                    <Dot status={debit.status} />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {donations.length > 0 && (
                    <div className="mt-8">
                        <p className="pl-secondary text-[13px] font-medium">Receipts</p>
                        <ul className="pl-hairline mt-3 divide-y border-t">
                            {donations.map((donation) => (
                                <li
                                    key={donation.transactionId}
                                    className="flex items-center justify-between gap-4 py-3 text-[13px]"
                                >
                                    <span className="pl-secondary pl-tabular">
                                        {formatDate(donation.donatedAt)} · {currency(donation.amount)}
                                    </span>
                                    <span className="pl-mono pl-muted text-[11px]">
                                        {donation.certificate ? "80G emailed" : "Receipt emailed"}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <p className="pl-muted mt-8 text-[12px] leading-5">
                    This page shows no full account number or UPI ID. Every debit is
                    notified 24 hours ahead. To dispute a charge, reply to its receipt.
                </p>

                <Link
                    to="/"
                    className="pl-muted mt-6 inline-block text-[13px] hover:text-[#1f1b16]"
                >
                    Satyalok donations
                </Link>
            </div>
        </div>
    );
}

export default DonorPortal;
