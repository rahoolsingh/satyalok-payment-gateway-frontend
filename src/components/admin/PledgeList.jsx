/* eslint-disable react/prop-types -- Small local presentational helpers; this
   admin bundle does not use the prop-types package. */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Ban,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock,
    IndianRupee,
    Loader2,
    RefreshCw,
    Repeat,
    RotateCcw,
    Search,
    X,
} from "lucide-react";
import adminApi from "./adminApi";

const PAGE_SIZE = 25;

const STATUS_META = {
    PENDING_AUTH: {
        label: "Awaiting approval",
        className: "bg-amber-50 text-amber-700 border-amber-200",
        Icon: Clock,
    },
    ACTIVE: {
        label: "Active",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
        Icon: CheckCircle2,
    },
    PAUSED: {
        label: "Paused",
        className: "bg-slate-100 text-slate-700 border-slate-200",
        Icon: Clock,
    },
    PAST_DUE: {
        label: "Past due",
        className: "bg-red-50 text-red-700 border-red-200",
        Icon: RotateCcw,
    },
    CANCELLED: {
        label: "Cancelled",
        className: "bg-slate-100 text-slate-500 border-slate-200",
        Icon: Ban,
    },
    COMPLETED: {
        label: "Completed",
        className: "bg-blue-50 text-blue-700 border-blue-200",
        Icon: CheckCircle2,
    },
    AUTH_FAILED: {
        label: "Auth failed",
        className: "bg-red-50 text-red-700 border-red-200",
        Icon: Ban,
    },
};

const STATUS_OPTIONS = [
    { value: "", label: "All statuses" },
    ...Object.entries(STATUS_META).map(([value, meta]) => ({
        value,
        label: meta.label,
    })),
];

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

const StatusBadge = ({ status }) => {
    const meta = STATUS_META[status] || STATUS_META.PENDING_AUTH;

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium border ${meta.className}`}
        >
            <meta.Icon className="w-3.5 h-3.5" />
            {meta.label}
        </span>
    );
};

const StatCard = ({ Icon, label, value, sub }) => (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm p-3 sm:p-4 flex items-start gap-2.5 sm:gap-4 min-w-0">
        <div className="p-1.5 sm:p-2 rounded-md shrink-0 bg-blue-50 text-blue-600">
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
            <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">
                {label}
            </p>
            <p className="text-lg sm:text-2xl font-semibold text-slate-900 mt-0.5 tabular-nums truncate">
                {value}
            </p>
            {sub && (
                <p className="text-[10px] sm:text-xs text-slate-400 mt-1 truncate">
                    {sub}
                </p>
            )}
        </div>
    </div>
);

const DetailRow = ({ label, value }) => (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
        <span className="text-xs text-slate-500 shrink-0">{label}</span>
        <span className="text-xs text-slate-800 text-right break-all">
            {value || "—"}
        </span>
    </div>
);

const DEBIT_STATUS_META = {
    SUCCESS: "bg-emerald-50 text-emerald-700 border-emerald-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
    SKIPPED: "bg-slate-100 text-slate-600 border-slate-200",
    UNKNOWN: "bg-amber-50 text-amber-700 border-amber-200",
    REDEEMING: "bg-blue-50 text-blue-700 border-blue-200",
    NOTIFIED: "bg-blue-50 text-blue-700 border-blue-200",
    SCHEDULED: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function PledgeList() {
    const [pledges, setPledges] = useState([]);
    const [stats, setStats] = useState({ statuses: {}, monthlyCommitted: 0 });
    const [meta, setMeta] = useState({ total: 0, pages: 1 });
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState({ search: "", status: "" });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState(null);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState("");
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);

    const notify = (msg, type = "success") => {
        setToast({ msg, type });
        window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 3200);
    };

    const fetchPledges = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: PAGE_SIZE };
            if (filters.search.trim()) params.search = filters.search.trim();
            if (filters.status) params.status = filters.status;

            const { data } = await adminApi.get("/admin/pledges", { params });
            setPledges(data.items || []);
            setStats(data.stats || { statuses: {}, monthlyCommitted: 0 });
            setMeta({ total: data.total || 0, pages: data.pages || 1 });
            setError("");
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Failed to load pledges.",
            );
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        const t = window.setTimeout(fetchPledges, 300);
        return () => window.clearTimeout(t);
    }, [fetchPledges]);

    useEffect(() => {
        // A filter change always restarts from the first page.
        setPage(1);
    }, [filters]);

    useEffect(() => () => window.clearTimeout(toastTimer.current), []);

    const openDetail = async (pledge) => {
        setSelected(pledge);
        setDetail(null);
        setDetailLoading(true);
        try {
            const { data } = await adminApi.get(`/admin/pledges/${pledge._id}`);
            setDetail(data.data);
        } catch (err) {
            notify(
                err.response?.data?.message || "Failed to load pledge detail.",
                "error",
            );
            setSelected(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetail = () => {
        setSelected(null);
        setDetail(null);
    };

    const reloadDetail = async (pledgeId) => {
        const { data } = await adminApi.get(`/admin/pledges/${pledgeId}`);
        setDetail(data.data);
    };

    const handleCancel = async (pledge) => {
        const reason = window.prompt(
            `Cancel the ${currency(pledge.amount)}/month pledge of ${
                pledge.donor?.name || "this donor"
            }?\n\nOptional reason (shown in the audit trail):`,
            "Cancelled by Satyalok admin",
        );
        if (reason === null) return;

        setActionLoading("cancel");
        try {
            await adminApi.post(`/admin/pledges/${pledge._id}/cancel`, {
                reason,
            });
            notify("Pledge cancelled. No further debits will run.");
            await fetchPledges();
            if (selected?._id === pledge._id) await reloadDetail(pledge._id);
        } catch (err) {
            notify(
                err.response?.data?.message || "Failed to cancel the pledge.",
                "error",
            );
        } finally {
            setActionLoading("");
        }
    };

    const handleRetry = async (pledge) => {
        if (!window.confirm("Queue one more debit attempt for this cycle?"))
            return;

        setActionLoading("retry");
        try {
            const { data } = await adminApi.post(
                `/admin/pledges/${pledge._id}/retry`,
            );
            notify(data.message || "Retry queued.");
            await fetchPledges();
            await reloadDetail(pledge._id);
        } catch (err) {
            notify(
                err.response?.data?.message || "Failed to queue a retry.",
                "error",
            );
        } finally {
            setActionLoading("");
        }
    };

    const handleSync = async (pledge) => {
        setActionLoading("sync");
        try {
            await adminApi.post("/admin/pledges/sync-setup", {
                pledgeRef: pledge.pledgeRef,
            });
            notify("Pledge reconciled with the gateway.");
            await fetchPledges();
            await reloadDetail(pledge._id);
        } catch (err) {
            notify(
                err.response?.data?.message || "Could not sync this pledge.",
                "error",
            );
        } finally {
            setActionLoading("");
        }
    };

    const statusCounts = stats.statuses || {};
    const activeCount = statusCounts.ACTIVE || 0;

    const latestDebit = useMemo(() => detail?.debits?.[0] || null, [detail]);
    const canRetry =
        latestDebit &&
        ["FAILED", "UNKNOWN"].includes(latestDebit.status) &&
        !["CANCELLED", "COMPLETED"].includes(detail?.pledge?.status);
    const canCancel =
        detail?.pledge &&
        !["CANCELLED", "COMPLETED"].includes(detail.pledge.status);

    return (
        <div className="space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                    <Repeat className="w-5 h-5 text-blue-600 shrink-0" />
                    <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">
                        Monthly pledges
                    </h1>
                </div>
                <button
                    type="button"
                    onClick={fetchPledges}
                    className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    Icon={CheckCircle2}
                    label="Active mandates"
                    value={activeCount}
                    sub="Uninterrupted auto-debits"
                />
                <StatCard
                    Icon={IndianRupee}
                    label="Monthly committed"
                    value={currency(stats.monthlyCommitted)}
                    sub="Across active pledges"
                />
                <StatCard
                    Icon={Clock}
                    label="Awaiting approval"
                    value={statusCounts.PENDING_AUTH || 0}
                    sub="Donor has not approved yet"
                />
                <StatCard
                    Icon={RotateCcw}
                    label="Past due"
                    value={statusCounts.PAST_DUE || 0}
                    sub="Retries exhausted"
                />
            </div>

            <div className="bg-white rounded-md border border-slate-200 shadow-sm">
                <div className="p-3 sm:p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="search"
                            value={filters.search}
                            onChange={(e) =>
                                setFilters((prev) => ({
                                    ...prev,
                                    search: e.target.value,
                                }))
                            }
                            placeholder="Search name, email, phone, pledge or mandate id"
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(e) =>
                            setFilters((prev) => ({
                                ...prev,
                                status: e.target.value,
                            }))
                        }
                        className="px-3 py-2 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                {error && (
                    <p className="m-3 sm:m-4 text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                        {error}
                    </p>
                )}

                {loading && (
                    <p className="sm:hidden px-4 py-10 text-center text-slate-500 text-sm">
                        <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                        Loading pledges…
                    </p>
                )}

                {!loading && pledges.length === 0 && (
                    <p className="sm:hidden px-4 py-10 text-center text-slate-500 text-sm">
                        No pledges match these filters.
                    </p>
                )}

                <ul className="sm:hidden divide-y divide-slate-100">
                    {!loading &&
                        pledges.map((pledge) => (
                            <li key={pledge._id}>
                                <button
                                    type="button"
                                    onClick={() => openDetail(pledge)}
                                    className="w-full text-left px-4 py-3 active:bg-slate-50"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium text-slate-900 truncate">
                                                {pledge.donor?.name || "—"}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {pledge.donor?.email}
                                            </p>
                                            <p className="text-xs text-slate-400 font-mono mt-0.5">
                                                {pledge.pledgeRef}
                                            </p>
                                        </div>
                                        <StatusBadge status={pledge.status} />
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                        <span className="font-semibold text-slate-900 tabular-nums">
                                            {currency(pledge.amount)}
                                            <span className="font-normal text-slate-500">
                                                /mo
                                            </span>
                                        </span>
                                        <span className="tabular-nums">
                                            {pledge.cyclesCompleted || 0} paid
                                        </span>
                                        <span>
                                            {pledge.status === "ACTIVE" ||
                                            pledge.status === "PAUSED"
                                                ? `next ${formatDate(
                                                      pledge.nextDebitAt,
                                                  )}`
                                                : formatDate(pledge.createdAt)}
                                        </span>
                                    </div>
                                </button>
                            </li>
                        ))}
                </ul>

                <div className="overflow-x-auto hidden sm:block">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-slate-500 bg-slate-50 border-b border-slate-200">
                                <th className="px-3 sm:px-4 py-2.5 font-medium">
                                    Donor
                                </th>
                                <th className="px-3 sm:px-4 py-2.5 font-medium">
                                    Amount
                                </th>
                                <th className="px-3 sm:px-4 py-2.5 font-medium">
                                    Status
                                </th>
                                <th className="px-3 sm:px-4 py-2.5 font-medium">
                                    Paid
                                </th>
                                <th className="px-3 sm:px-4 py-2.5 font-medium">
                                    Next debit
                                </th>
                                <th className="px-3 sm:px-4 py-2.5 font-medium">
                                    Started
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-slate-500"
                                    >
                                        <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                                        Loading pledges…
                                    </td>
                                </tr>
                            )}

                            {!loading && pledges.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-10 text-center text-slate-500"
                                    >
                                        No pledges match these filters.
                                    </td>
                                </tr>
                            )}

                            {!loading &&
                                pledges.map((pledge) => (
                                    <tr
                                        key={pledge._id}
                                        onClick={() => openDetail(pledge)}
                                        className="hover:bg-slate-50 cursor-pointer"
                                    >
                                        <td className="px-3 sm:px-4 py-3">
                                            <div className="font-medium text-slate-900">
                                                {pledge.donor?.name || "—"}
                                            </div>
                                            <div className="text-xs text-slate-500 truncate max-w-[220px]">
                                                {pledge.donor?.email}
                                            </div>
                                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                                                {pledge.pledgeRef}
                                            </div>
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                                            {currency(pledge.amount)}
                                            <span className="text-xs font-normal text-slate-500">
                                                /mo
                                            </span>
                                        </td>
                                        <td className="px-3 sm:px-4 py-3">
                                            <StatusBadge
                                                status={pledge.status}
                                            />
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 text-slate-700 tabular-nums">
                                            {pledge.cyclesCompleted || 0}
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 text-slate-700 whitespace-nowrap">
                                            {pledge.status === "ACTIVE" ||
                                            pledge.status === "PAUSED"
                                                ? formatDate(pledge.nextDebitAt)
                                                : "—"}
                                        </td>
                                        <td className="px-3 sm:px-4 py-3 text-slate-500 whitespace-nowrap">
                                            {formatDate(pledge.createdAt)}
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-3 sm:px-4 py-3 border-t border-slate-200 flex items-center justify-between gap-3 text-xs text-slate-500">
                    <span className="truncate">
                        {meta.total} pledge{meta.total === 1 ? "" : "s"} · page{" "}
                        {page} of {meta.pages}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(p - 1, 1))}
                            disabled={page <= 1 || loading}
                            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                setPage((p) => Math.min(p + 1, meta.pages))
                            }
                            disabled={page >= meta.pages || loading}
                            className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                            aria-label="Next page"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {selected && (
                <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/40 p-0 sm:p-4">
                    <div className="w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-t-lg sm:rounded-lg border border-slate-200 shadow-xl">
                        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <h2 className="text-base font-semibold text-slate-900 truncate">
                                    {detail?.pledge?.donor?.name ||
                                        selected.donor?.name}{" "}
                                    · {currency(selected.amount)}/mo
                                </h2>
                                <p className="text-xs text-slate-500 font-mono truncate">
                                    {selected.pledgeRef}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeDetail}
                                className="p-1.5 rounded-md text-slate-500 hover:bg-slate-100 shrink-0"
                                aria-label="Close"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {detailLoading && (
                            <div className="p-10 text-center text-slate-500">
                                <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
                                Loading ledger…
                            </div>
                        )}

                        {detail && !detailLoading && (
                            <div className="p-4 sm:p-6 space-y-6">
                                <div className="flex flex-wrap items-center gap-2">
                                    <StatusBadge
                                        status={detail.pledge.status}
                                    />
                                    {detail.pledge.donor?.taxBenefit && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                            80G · PAN{" "}
                                            {detail.pledge.donor?.panMasked ||
                                                "on file"}
                                        </span>
                                    )}
                                    {detail.pledge.providerCancelPending && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-sm text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                                            Gateway cancel pending
                                        </span>
                                    )}
                                </div>

                                <div className="grid sm:grid-cols-2 gap-x-8">
                                    <div>
                                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                            Donor
                                        </h3>
                                        <DetailRow
                                            label="Name"
                                            value={detail.pledge.donor?.name}
                                        />
                                        <DetailRow
                                            label="Email"
                                            value={detail.pledge.donor?.email}
                                        />
                                        <DetailRow
                                            label="Phone"
                                            value={detail.pledge.donor?.phone}
                                        />
                                        <DetailRow
                                            label="Instrument"
                                            value={
                                                detail.pledge.maskedInstrument ||
                                                detail.pledge.donor?.maskedVpa
                                            }
                                        />
                                    </div>
                                    <div>
                                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                                            Mandate
                                        </h3>
                                        <DetailRow
                                            label="Amount"
                                            value={`${currency(
                                                detail.pledge.amount,
                                            )} / month`}
                                        />
                                        <DetailRow
                                            label="Started"
                                            value={formatDate(
                                                detail.pledge.startedAt,
                                            )}
                                        />
                                        <DetailRow
                                            label="Next debit"
                                            value={formatDate(
                                                detail.pledge.nextDebitAt,
                                            )}
                                        />
                                        <DetailRow
                                            label="Expires"
                                            value={formatDate(
                                                detail.pledge.expiresAt,
                                            )}
                                        />
                                        <DetailRow
                                            label="Cycles paid"
                                            value={String(
                                                detail.pledge
                                                    .cyclesCompleted || 0,
                                            )}
                                        />
                                        <DetailRow
                                            label="Lifetime"
                                            value={currency(
                                                (detail.pledge
                                                    .totalDonatedPaise || 0) /
                                                    100,
                                            )}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                        Consent
                                    </h3>
                                    <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-md p-3 leading-5">
                                        {detail.pledge.consent?.text}
                                    </p>
                                    <p className="text-[11px] text-slate-400 mt-1.5">
                                        v{detail.pledge.consent?.version} ·
                                        accepted{" "}
                                        {formatDate(
                                            detail.pledge.consent?.acceptedAt,
                                        )}
                                        {detail.pledge.consent?.ip
                                            ? ` · IP ${detail.pledge.consent.ip}`
                                            : ""}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                                        Debit ledger
                                    </h3>
                                    <div className="overflow-x-auto border border-slate-200 rounded-md">
                                        <table className="w-full text-xs">
                                            <thead>
                                                <tr className="bg-slate-50 text-slate-500 text-left border-b border-slate-200">
                                                    <th className="px-3 py-2 font-medium">
                                                        Cycle
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Attempt
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Status
                                                    </th>
                                                    <th className="px-3 py-2 font-medium">
                                                        Scheduled
                                                    </th>
                                                    <th className="px-3 py-2 font-medium hidden sm:table-cell">
                                                        Order id
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {detail.debits.length === 0 && (
                                                    <tr>
                                                        <td
                                                            colSpan={5}
                                                            className="px-3 py-6 text-center text-slate-500"
                                                        >
                                                            No debits yet. The
                                                            first one is
                                                            collected when the
                                                            mandate is approved.
                                                        </td>
                                                    </tr>
                                                )}
                                                {detail.debits.map((debit) => (
                                                    <tr key={debit._id}>
                                                        <td className="px-3 py-2 tabular-nums">
                                                            {debit.cycleNumber}
                                                        </td>
                                                        <td className="px-3 py-2 tabular-nums">
                                                            {debit.attempt}
                                                        </td>
                                                        <td className="px-3 py-2">
                                                            <span
                                                                className={`inline-flex px-1.5 py-0.5 rounded-sm border font-medium ${
                                                                    DEBIT_STATUS_META[
                                                                        debit
                                                                            .status
                                                                    ] ||
                                                                    "bg-slate-100 text-slate-600 border-slate-200"
                                                                }`}
                                                            >
                                                                {debit.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-2 text-slate-600 whitespace-nowrap">
                                                            {formatDate(
                                                                debit.scheduledFor,
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 font-mono text-slate-500 truncate max-w-[180px] hidden sm:table-cell">
                                                            {debit.merchantOrderId ||
                                                                "—"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-2 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleSync(detail.pledge)
                                        }
                                        disabled={Boolean(actionLoading)}
                                        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50"
                                    >
                                        {actionLoading === "sync" ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-4 h-4" />
                                        )}
                                        Sync with gateway
                                    </button>
                                    {canRetry && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleRetry(detail.pledge)
                                            }
                                            disabled={Boolean(actionLoading)}
                                            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 rounded-md hover:bg-blue-100 disabled:opacity-50"
                                        >
                                            {actionLoading === "retry" ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <RotateCcw className="w-4 h-4" />
                                            )}
                                            Retry debit
                                        </button>
                                    )}
                                    {canCancel && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleCancel(detail.pledge)
                                            }
                                            disabled={Boolean(actionLoading)}
                                            className="inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-red-700 border border-red-200 bg-red-50 rounded-md hover:bg-red-100 disabled:opacity-50"
                                        >
                                            {actionLoading === "cancel" ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Ban className="w-4 h-4" />
                                            )}
                                            Cancel pledge
                                        </button>
                                    )}
                                </div>

                                {detail.pledge.cancellationReason && (
                                    <p className="text-xs text-slate-500">
                                        Cancellation:{" "}
                                        {detail.pledge.cancellationReason} (
                                        {detail.pledge.cancelledBy || "unknown"})
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {toast && (
                <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[92vw]">
                    <p
                        className={`px-4 py-2 rounded-md shadow-lg text-sm border ${
                            toast.type === "error"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                        }`}
                    >
                        {toast.msg}
                    </p>
                </div>
            )}
        </div>
    );
}