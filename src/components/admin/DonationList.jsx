/* eslint-disable react/prop-types -- StatCard / FilterChip / CopyButton are tiny local
   presentational helpers; this admin bundle does not use the prop-types package. */
import { useState, useEffect, useMemo, useRef } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
} from "@tanstack/react-table";
import {
    Download,
    Plus,
    Search,
    Mail,
    Trash2,
    Filter,
    Calendar,
    Eye,
    EyeOff,
    TrendingUp,
    IndianRupee,
    BarChart3,
    CheckCircle,
    XCircle,
    ArrowUpDown,
    ChevronUp,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Copy,
    Check,
    Phone,
    CreditCard,
    SlidersHorizontal,
    X,
} from "lucide-react";
import OfflineDonationModal from "./OfflineDonationModal";
import adminApi from "./adminApi";

// Stats Card (Microsoft Fluent inspired - clean, subtle borders)
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm p-3 sm:p-4 flex items-start gap-2.5 sm:gap-4 min-w-0 transition-shadow hover:shadow-md">
        <div className={`p-1.5 sm:p-2 rounded-md shrink-0 ${color}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
        <div className="min-w-0">
            <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">
                {label}
            </p>
            <p
                className="text-lg sm:text-2xl font-semibold text-slate-900 mt-0.5 tabular-nums truncate"
                title={typeof value === "string" ? value : undefined}
            >
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

// Format a Date as YYYY-MM-DD using *local* time.
// toISOString() is UTC, which shifted the range back a day for IST users.
const toLocalISODate = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

// Available page sizes (persisted in localStorage between visits)
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Shared labels so the select options and the filter chips can never drift apart
const METHOD_LABELS = {
    phonepe: "PhonePe",
    cash: "Cash",
    upi: "UPI",
    bank_transfer: "Bank Transfer",
    cheque: "Cheque",
    other: "Other",
};

const STATUS_LABELS = {
    success: "Successful",
    failed: "Failed",
    all: "All statuses",
};

// Removable pill describing one applied filter
const FilterChip = ({ label, onRemove }) => (
    <span className="inline-flex items-center gap-1 max-w-full pl-2 pr-1 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700">
        <span className="truncate">{label}</span>
        <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label} filter`}
            className="shrink-0 p-0.5 rounded-full hover:bg-blue-100"
        >
            <X className="w-3 h-3" />
        </button>
    </span>
);

// Get default date range (last 7 days)
const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
        startDate: toLocalISODate(start),
        endDate: toLocalISODate(end),
    };
};

export default function DonationList() {
    const [donations, setDonations] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Filters & UI State
    const [filters, setFilters] = useState({
        search: "",
        paymentMethod: "",
        status: "success",
        ...getDefaultDates(),
    });
    const [hideSensitive, setHideSensitive] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [generating80g, setGenerating80g] = useState(null);
    const [error, setError] = useState("");
    // Date window actually applied by the API (null => search spans all dates)
    const [dateRangeApplied, setDateRangeApplied] = useState(null);
    // Mobile: method/status/date filters collapse behind a toggle
    const [filtersOpen, setFiltersOpen] = useState(false);
    // Lightweight toast — alert() is jarring on phones
    const [toast, setToast] = useState(null);
    const toastTimer = useRef(null);
    // Key of the value that was just copied (shows a tick briefly)
    const [copiedKey, setCopiedKey] = useState(null);

    // TanStack Sorting + Pagination State (page size survives a reload)
    const [sorting, setSorting] = useState([]);
    const [pagination, setPagination] = useState(() => {
        const saved = Number(
            localStorage.getItem("satyalok.admin.donationPageSize"),
        );
        return {
            pageIndex: 0,
            pageSize: PAGE_SIZE_OPTIONS.includes(saved) ? saved : 25,
        };
    });

    const fetchDonations = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.search) params.search = filters.search.trim();
            if (filters.paymentMethod)
                params.paymentMethod = filters.paymentMethod;
            if (filters.status) params.status = filters.status;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const { data } = await adminApi.get("/admin/donations", { params });
            if (data.success) {
                setDonations(data.data);
                setStats(data.stats);
                setDateRangeApplied(data.dateRange || null);
                setError("");
            } else {
                setError(data.message || "Failed to load donations.");
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                    err.message ||
                    "Failed to fetch donations.",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // any filter change restarts from the first page
        setPagination((prev) => ({ ...prev, pageIndex: 0 }));
        const t = setTimeout(fetchDonations, 300);
        return () => clearTimeout(t);
    }, [filters]);

    // Remember the chosen page size across reloads
    useEffect(() => {
        try {
            localStorage.setItem(
                "satyalok.admin.donationPageSize",
                String(pagination.pageSize),
            );
        } catch {
            /* storage blocked (private mode) — nothing to do */
        }
    }, [pagination.pageSize]);

    // Clear pending timers on unmount
    useEffect(() => () => window.clearTimeout(toastTimer.current), []);

    const notify = (msg, type = "success") => {
        setToast({ msg, type });
        window.clearTimeout(toastTimer.current);
        toastTimer.current = window.setTimeout(() => setToast(null), 2800);
    };

    // Copies a value and flashes a toast; only offered while data is unmasked
    const copyText = async (key, label, value) => {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(String(value));
            setCopiedKey(key);
            window.setTimeout(() => setCopiedKey(null), 1500);
            notify(`${label} copied`);
        } catch {
            notify("Could not copy — long-press to select", "error");
        }
    };

    const CopyButton = ({ copyKey, label, value }) => (
        <button
            type="button"
            onClick={(e) => {
                e.stopPropagation();
                copyText(copyKey, label, value);
            }}
            title={`Copy ${label.toLowerCase()}`}
            aria-label={`Copy ${label.toLowerCase()}`}
            className="shrink-0 p-1.5 -m-1.5 text-slate-400 hover:text-slate-700 active:text-blue-600 rounded-md transition-colors"
        >
            {copiedKey === copyKey ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
                <Copy className="w-3.5 h-3.5" />
            )}
        </button>
    );

    const mask = (val) => (hideSensitive ? "••••••" : val);

    const handleExportCSV = () => {
        if (!donations.length) return;
        const headers = [
            "Date",
            "Name",
            "Email",
            "Mobile",
            "Amount",
            "Method",
            "Txn ID",
            "Ext Txn ID",
            "Tax Benefit",
            "PAN",
            "Status",
        ];
        const rows = donations.map((d) =>
            [
                new Date(d.donationDate || d.createdAt).toLocaleDateString(
                    "en-IN",
                ),
                d.name,
                d.email,
                d.mobile,
                d.amount,
                d.paymentMethod || "phonepe",
                d.merchantTransactionId,
                d.externalTransactionId || "",
                d.taxBenefit ? "Yes" : "No",
                d.panNumber || "",
                d.success ? "Success" : "Failed",
            ].map((v) => `"${v}"`),
        );

        const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
            "\n",
        );
        const a = document.createElement("a");
        a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        a.download = `donations_${filters.startDate}_to_${filters.endDate}.csv`;
        a.click();
    };

    const handleDelete = async (id) => {
        if (
            !window.confirm(
                "Delete this admin-created donation? This action cannot be undone.",
            )
        )
            return;
        try {
            const { data } = await adminApi.delete(`/admin/donations/${id}`);
            if (data.success) {
                notify("Donation deleted");
                fetchDonations();
            } else notify(data.message || "Failed to delete.", "error");
        } catch (err) {
            notify(
                err.response?.data?.message || "Error deleting donation.",
                "error",
            );
        }
    };

    const handleResendReceipt = async (id) => {
        if (!window.confirm("Resend receipt to this donor?")) return;
        try {
            const { data } = await adminApi.post(
                `/admin/donations/${id}/resend-receipt`,
            );
            notify(
                data.success
                    ? "Receipt resent"
                    : data.message || "Failed to resend receipt.",
                data.success ? "success" : "error",
            );
        } catch (err) {
            notify(
                err.response?.data?.message || "Error resending receipt.",
                "error",
            );
        }
    };

    const handle80GDownload = async (donation) => {
        setGenerating80g(donation._id);
        try {
            const response = await adminApi.get(
                `/admin/donations/${donation._id}/80g-certificate`,
                { responseType: "blob" },
            );
            const url = URL.createObjectURL(
                new Blob([response.data], { type: "application/pdf" }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = `80G_${donation.merchantTransactionId}.pdf`;
            a.click();
            URL.revokeObjectURL(url);

            setTimeout(() => {
                if (
                    window.confirm(
                        `Certificate downloaded!\n\nWould you like to also email it to the donor at ${donation.email}?\n\n(The 80G certificate PDF will be attached to the email)`,
                    )
                ) {
                    handleResendReceipt(donation._id);
                }
            }, 600);
        } catch (err) {
            notify("Failed to generate certificate. Please try again.", "error");
        } finally {
            setGenerating80g(null);
        }
    };

    const f = (field, value) =>
        setFilters((prev) => ({ ...prev, [field]: value }));
    const hasActiveFilters =
        Boolean(filters.search) ||
        Boolean(filters.paymentMethod) ||
        filters.status !== "success";

    const activeFilterCount =
        (filters.search ? 1 : 0) +
        (filters.paymentMethod ? 1 : 0) +
        (filters.status !== "success" ? 1 : 0);

    // Resets every filter except the date window (dates have their own presets)
    const clearFilters = () =>
        setFilters((prev) => ({
            ...prev,
            search: "",
            paymentMethod: "",
            status: "success",
        }));

    // Quick date presets — "All time" sends a window wide enough to span everything
    const datePresets = [
        {
            label: "Today",
            get: () => {
                const today = new Date();
                return [today, today];
            },
        },
        {
            label: "Yesterday",
            get: () => {
                const day = new Date();
                day.setDate(day.getDate() - 1);
                return [day, day];
            },
        },
        {
            label: "Last 7 days",
            get: () => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 7);
                return [start, end];
            },
        },
        {
            label: "This month",
            get: () => {
                const end = new Date();
                const start = new Date();
                start.setDate(1);
                return [start, end];
            },
        },
        {
            label: "This year",
            get: () => {
                const end = new Date();
                const start = new Date();
                start.setFullYear(start.getFullYear(), 0, 1);
                return [start, end];
            },
        },
        {
            label: "All time",
            get: () => [new Date(2020, 0, 1), new Date()],
        },
    ];

    // --- TanStack Table Column Definitions ---
    const columns = useMemo(
        () => [
            {
                id: "date",
                header: "Date",
                accessorFn: (row) =>
                    new Date(row.donationDate || row.createdAt).getTime(),
                cell: (info) => {
                    const dateObj = new Date(
                        info.row.original.donationDate ||
                            info.row.original.createdAt,
                    );
                    return (
                        <div className="text-slate-600">
                            <div>{dateObj.toLocaleDateString("en-IN")}</div>
                            <div className="text-xs text-slate-400">
                                {dateObj.toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: "donor",
                header: "Donor",
                accessorFn: (row) => row.name,
                cell: ({ row }) => {
                    const d = row.original;
                    return (
                        <div>
                            <div className="font-medium text-slate-900">
                                {d.name}
                            </div>
                            <div
                                className="text-xs text-slate-400 font-mono mt-0.5"
                                title="Receipt / Reference ID"
                            >
                                {d.merchantTransactionId}
                            </div>
                            {d.taxBenefit && (
                                <div className="text-xs text-slate-400 mt-0.5">
                                    PAN:{" "}
                                    {hideSensitive ? "••••••••••" : d.panNumber}
                                </div>
                            )}
                        </div>
                    );
                },
            },
            {
                id: "contact",
                header: "Contact",
                accessorFn: (row) => row.email,
                cell: ({ row }) => {
                    const d = row.original;
                    return (
                        <div className="text-slate-600">
                            <div>{mask(d.email)}</div>
                            <div className="text-xs">
                                {mask(String(d.mobile || ""))}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: "amount",
                header: "Amount",
                accessorKey: "amount",
                cell: ({ row }) => {
                    const d = row.original;
                    return (
                        <div>
                            <div className="font-semibold text-slate-900">
                                ₹{d.amount?.toLocaleString("en-IN")}
                            </div>
                            {d.taxBenefit && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 mt-1">
                                    80G
                                </span>
                            )}
                        </div>
                    );
                },
            },
            {
                id: "method",
                header: "Method / TxnID",
                accessorKey: "paymentMethod",
                cell: ({ row }) => {
                    const d = row.original;
                    return (
                        <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-medium bg-slate-100 border border-slate-200 text-slate-700 capitalize">
                                {(d.paymentMethod || "phonepe").replace(
                                    "_",
                                    " ",
                                )}
                            </span>
                            {d.createdByAdmin && (
                                <span className="ml-1.5 text-xs text-blue-600 font-medium">
                                    (Manual)
                                </span>
                            )}
                            <div
                                className="text-xs text-slate-400 mt-0.5 font-mono truncate max-w-[140px]"
                                title={
                                    d.externalTransactionId ||
                                    d.merchantTransactionId
                                }
                            >
                                {hideSensitive
                                    ? "••••••••"
                                    : (
                                          d.externalTransactionId ||
                                          d.merchantTransactionId ||
                                          ""
                                      ).slice(-12)}
                            </div>
                        </div>
                    );
                },
            },
            {
                id: "status",
                header: "Status",
                accessorKey: "success",
                cell: ({ getValue }) => {
                    const success = getValue();
                    return success ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Success
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                            <XCircle className="w-3.5 h-3.5" />
                            Failed
                        </span>
                    );
                },
            },
            {
                id: "actions",
                header: "Actions",
                enableSorting: false,
                cell: ({ row }) => {
                    const d = row.original;
                    return (
                        <div className="flex items-center justify-end gap-1">
                            {d.success && (
                                <button
                                    onClick={() => handleResendReceipt(d._id)}
                                    title="Resend Receipt"
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                    <Mail className="w-4 h-4" />
                                </button>
                            )}
                            {d.taxBenefit && d.panNumber && d.success && (
                                <button
                                    onClick={() => handle80GDownload(d)}
                                    title="Download 80G Certificate"
                                    disabled={generating80g === d._id}
                                    className="p-1.5 text-violet-600 hover:bg-violet-50 rounded transition-colors disabled:opacity-50 text-xs font-semibold border border-transparent hover:border-violet-200"
                                >
                                    {generating80g === d._id ? "..." : "80G"}
                                </button>
                            )}
                            {d.createdByAdmin && (
                                <button
                                    onClick={() => handleDelete(d._id)}
                                    title="Delete Record"
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    );
                },
            },
        ],
        [hideSensitive, generating80g, donations],
    );

    // Initialize TanStack Table
    const table = useReactTable({
        data: donations,
        columns,
        state: { sorting, pagination },
        onSortingChange: setSorting,
        onPaginationChange: setPagination,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    // Row range currently on screen (shared by the phone cards and the table)
    const firstRow = pagination.pageIndex * pagination.pageSize + 1;
    const lastRow = Math.min(
        (pagination.pageIndex + 1) * pagination.pageSize,
        donations.length,
    );

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 tracking-tight">
                        Donations
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500">
                        {loading
                            ? "Loading..."
                            : `${donations.length} record${donations.length !== 1 ? "s" : ""} in selected range`}
                    </p>
                </div>
                <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto sm:items-center sm:justify-end">
                    <button
                        onClick={() => setHideSensitive((p) => !p)}
                        className={`inline-flex items-center justify-center gap-1.5 px-2 py-2 sm:px-3 rounded-md text-xs sm:text-sm font-medium border shadow-sm transition-colors ${hideSensitive ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                        title={
                            hideSensitive
                                ? "Sensitive data hidden"
                                : "Sensitive data visible"
                        }
                        aria-label={
                            hideSensitive
                                ? "Show sensitive data"
                                : "Hide sensitive data"
                        }
                    >
                        {hideSensitive ? (
                            <EyeOff className="w-4 h-4 shrink-0" />
                        ) : (
                            <Eye className="w-4 h-4 shrink-0" />
                        )}
                        <span className="truncate">
                            <span className="sm:hidden">
                                {hideSensitive ? "Show" : "Hide"}
                            </span>
                            <span className="hidden sm:inline">
                                {hideSensitive
                                    ? "Sensitive hidden"
                                    : "Sensitive visible"}
                            </span>
                        </span>
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={!donations.length}
                        title="Export the current result set as CSV"
                        aria-label="Export CSV"
                        className="inline-flex items-center justify-center gap-1.5 px-2 py-2 sm:px-3 bg-white border border-slate-200 rounded-md text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm transition-colors"
                    >
                        <Download className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                            <span className="sm:hidden">CSV</span>
                            <span className="hidden sm:inline">Export CSV</span>
                        </span>
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        title="Add an offline donation entry"
                        aria-label="Add offline entry"
                        className="inline-flex items-center justify-center gap-1.5 px-2 py-2 sm:px-3 bg-blue-600 border border-transparent rounded-md text-xs sm:text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4 shrink-0" />
                        <span className="truncate">
                            <span className="sm:hidden">Add</span>
                            <span className="hidden sm:inline">
                                Add Offline Entry
                            </span>
                        </span>
                    </button>
                </div>
            </div>

            {/* Error banner — a failed request must never leave stale rows silently */}
            {error && (
                <div className="flex items-start justify-between gap-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span>{error}</span>
                    <button
                        onClick={fetchDonations}
                        className="shrink-0 font-medium text-red-700 underline hover:text-red-900"
                    >
                        Retry
                    </button>
                </div>
            )}

            {/* Stats Cards */}
            {stats && !loading && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                    <StatCard
                        icon={BarChart3}
                        label="Total Records"
                        value={stats.total}
                        sub={
                            dateRangeApplied
                                ? `${toLocalISODate(
                                      new Date(dateRangeApplied.start),
                                  )} → ${toLocalISODate(
                                      new Date(dateRangeApplied.end),
                                  )}`
                                : "searching all dates"
                        }
                        color="bg-blue-50 text-blue-600"
                    />
                    <StatCard
                        icon={CheckCircle}
                        label="Successful"
                        value={stats.successCount}
                        sub={`${stats.failedCount} failed`}
                        color="bg-emerald-50 text-emerald-600"
                    />
                    <StatCard
                        icon={IndianRupee}
                        label="Total Collected"
                        value={`₹${(stats.totalAmount || 0).toLocaleString("en-IN")}`}
                        sub="from successful donations"
                        color="bg-violet-50 text-violet-600"
                    />
                    <StatCard
                        icon={TrendingUp}
                        label="Avg Donation"
                        value={`₹${(stats.avgAmount || 0).toLocaleString("en-IN")}`}
                        sub="per successful donor"
                        color="bg-orange-50 text-orange-600"
                    />
                </div>
            )}

            {/* Filter Bar */}
            <div className="bg-white p-3 sm:p-4 rounded-md border border-slate-200 shadow-sm space-y-3">
                {/* Search stays visible: it is the control an admin reaches for first */}
                <div className="flex gap-2">
                    <div className="relative flex-1 min-w-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="search"
                            placeholder="Search name, email, mobile, txn id..."
                            className="block w-full pl-9 pr-9 py-2.5 sm:py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow"
                            value={filters.search}
                            onChange={(e) => f("search", e.target.value)}
                        />
                        {filters.search && (
                            <button
                                type="button"
                                onClick={() => f("search", "")}
                                title="Clear search"
                                aria-label="Clear search"
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-slate-400 hover:text-slate-700"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setFiltersOpen((open) => !open)}
                        aria-expanded={filtersOpen}
                        className={`sm:hidden shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-md text-sm font-medium border shadow-sm transition-colors ${
                            filtersOpen || activeFilterCount > 0
                                ? "bg-blue-50 border-blue-200 text-blue-700"
                                : "bg-white border-slate-200 text-slate-700"
                        }`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {activeFilterCount > 0 && (
                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] font-semibold">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* Method / status / dates: collapsible on phones, always open from sm up */}
                <div
                    className={`${filtersOpen ? "space-y-2.5" : "hidden"} sm:block sm:space-y-3`}
                >
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <select
                                title="Filter by payment method"
                                className="block w-full sm:w-auto pl-9 pr-8 py-2.5 sm:py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white transition-shadow"
                                value={filters.paymentMethod}
                                onChange={(e) =>
                                    f("paymentMethod", e.target.value)
                                }
                            >
                                <option value="">All Methods</option>
                                {Object.entries(METHOD_LABELS).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <select
                                title="Filter by payment status"
                                className="block flex-1 sm:flex-none px-3 py-2.5 sm:py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white transition-shadow"
                                value={filters.status}
                                onChange={(e) => f("status", e.target.value)}
                            >
                                {Object.entries(STATUS_LABELS).map(
                                    ([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="shrink-0 inline-flex items-center gap-1 px-3 py-2.5 sm:px-2 sm:py-2 text-sm font-medium text-red-600 border border-red-200 rounded-md bg-red-50 sm:border-0 sm:bg-transparent sm:hover:text-red-800"
                                >
                                    <X className="w-4 h-4 sm:hidden" />
                                    Clear
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 sm:items-center">
                        <div className="flex items-center gap-2">
                            <div className="relative flex-1 min-w-0">
                                <Calendar className="hidden sm:block absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="date"
                                    aria-label="Start date"
                                    className="block w-full pl-3 sm:pl-9 pr-2 py-2.5 sm:py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 transition-shadow"
                                    value={filters.startDate}
                                    onChange={(e) =>
                                        f("startDate", e.target.value)
                                    }
                                />
                            </div>
                            <span className="shrink-0 text-xs text-slate-400 sm:text-sm">
                                to
                            </span>
                            <div className="relative flex-1 min-w-0">
                                <Calendar className="hidden sm:block absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="date"
                                    aria-label="End date"
                                    className="block w-full pl-3 sm:pl-9 pr-2 py-2.5 sm:py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 transition-shadow"
                                    value={filters.endDate}
                                    min={filters.startDate}
                                    onChange={(e) =>
                                        f("endDate", e.target.value)
                                    }
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 sm:flex gap-2">
                            {datePresets.map((preset) => (
                                <button
                                    key={preset.label}
                                    type="button"
                                    onClick={() => {
                                        const [start, end] = preset.get();
                                        f("startDate", toLocalISODate(start));
                                        f("endDate", toLocalISODate(end));
                                    }}
                                    className="px-2 py-2 sm:py-1.5 text-xs font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-md hover:text-slate-800 hover:bg-slate-100 transition-colors whitespace-nowrap"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Applied filters as chips — the panel itself is collapsed on phones */}
                {activeFilterCount > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {filters.search && (
                            <FilterChip
                                label={`“${filters.search}”`}
                                onRemove={() => f("search", "")}
                            />
                        )}
                        {filters.paymentMethod && (
                            <FilterChip
                                label={
                                    METHOD_LABELS[filters.paymentMethod] ||
                                    filters.paymentMethod
                                }
                                onRemove={() => f("paymentMethod", "")}
                            />
                        )}
                        {filters.status !== "success" && (
                            <FilterChip
                                label={
                                    STATUS_LABELS[filters.status] ||
                                    filters.status
                                }
                                onRemove={() => f("status", "success")}
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Mobile card list — the table needs ~1000px, so phones get cards instead */}
            <div className="xl:hidden bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="divide-y divide-slate-100">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="p-3.5 animate-pulse">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="h-4 w-20 bg-slate-100 rounded" />
                                        <div className="h-3 w-28 bg-slate-100 rounded mt-1.5" />
                                    </div>
                                    <div className="h-5 w-20 bg-slate-100 rounded" />
                                </div>
                                <div className="h-3.5 w-40 bg-slate-100 rounded mt-3" />
                                <div className="h-3 w-52 bg-slate-100 rounded mt-2" />
                                <div className="h-3 w-44 bg-slate-100 rounded mt-1.5" />
                            </div>
                        ))}
                    </div>
                ) : table.getRowModel().rows.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                        <p className="text-sm text-slate-500">
                            No donations found for the selected filters.
                        </p>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200"
                            >
                                <X className="w-4 h-4" /> Clear filters
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {table.getRowModel().rows.map((row) => {
                            const d = row.original;
                            const dateObj = new Date(
                                d.donationDate || d.createdAt,
                            );
                            const txnRef =
                                d.externalTransactionId ||
                                d.merchantTransactionId ||
                                "";
                            return (
                                <div key={row.id} className="p-3.5 active:bg-slate-50">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-base font-semibold text-slate-900 tabular-nums">
                                                ₹
                                                {d.amount?.toLocaleString(
                                                    "en-IN",
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-400 mt-0.5">
                                                {dateObj.toLocaleDateString(
                                                    "en-IN",
                                                )}{" "}
                                                ·{" "}
                                                {dateObj.toLocaleTimeString(
                                                    "en-IN",
                                                    {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    },
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1 shrink-0">
                                            {d.success ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                    Success
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                                                    <XCircle className="w-3.5 h-3.5" />
                                                    Failed
                                                </span>
                                            )}
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[11px] font-medium bg-slate-100 border border-slate-200 text-slate-700 capitalize">
                                                {(d.paymentMethod || "phonepe").replace(
                                                    "_",
                                                    " ",
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                                        <span className="text-sm font-medium text-slate-900 break-all">
                                            {d.name}
                                        </span>
                                        {d.taxBenefit && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                80G
                                            </span>
                                        )}
                                        {d.createdByAdmin && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                                Manual
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-1.5 space-y-1 text-xs text-slate-500">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                            <span className="truncate">
                                                {mask(d.email)}
                                            </span>
                                            {!hideSensitive && d.email && (
                                                <CopyButton
                                                    copyKey={`${d._id}-email`}
                                                    label="Email"
                                                    value={d.email}
                                                />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                            <span className="truncate">
                                                {mask(String(d.mobile || ""))}
                                            </span>
                                            {!hideSensitive && d.mobile && (
                                                <CopyButton
                                                    copyKey={`${d._id}-mobile`}
                                                    label="Mobile"
                                                    value={d.mobile}
                                                />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <CreditCard className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                                            <span className="truncate font-mono">
                                                {hideSensitive
                                                    ? "••••••••••••"
                                                    : txnRef}
                                            </span>
                                            {!hideSensitive && txnRef && (
                                                <CopyButton
                                                    copyKey={`${d._id}-txn`}
                                                    label="Txn ID"
                                                    value={txnRef}
                                                />
                                            )}
                                        </div>
                                        {d.taxBenefit && (
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <span className="w-3.5 shrink-0 text-[10px] font-semibold text-slate-400">
                                                    PAN
                                                </span>
                                                <span className="truncate font-mono">
                                                    {hideSensitive
                                                        ? "••••••••••"
                                                        : d.panNumber || "—"}
                                                </span>
                                                {!hideSensitive && d.panNumber && (
                                                    <CopyButton
                                                        copyKey={`${d._id}-pan`}
                                                        label="PAN"
                                                        value={d.panNumber}
                                                    />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {/* 44px tap targets — icon-only buttons are too small on phones */}
                                    {(d.success || d.createdByAdmin) && (
                                        <div className="mt-2.5 flex items-center gap-2">
                                            {d.success && (
                                                <button
                                                    onClick={() =>
                                                        handleResendReceipt(
                                                            d._id,
                                                        )
                                                    }
                                                    className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2 rounded-md border border-slate-200 bg-white text-xs font-medium text-blue-700 active:bg-blue-50"
                                                >
                                                    <Mail className="w-4 h-4" />
                                                    Resend receipt
                                                </button>
                                            )}
                                            {d.taxBenefit &&
                                                d.panNumber &&
                                                d.success && (
                                                    <button
                                                        onClick={() =>
                                                            handle80GDownload(d)
                                                        }
                                                        disabled={
                                                            generating80g ===
                                                            d._id
                                                        }
                                                        className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[40px] px-2 rounded-md border border-violet-200 bg-violet-50 text-xs font-semibold text-violet-700 active:bg-violet-100 disabled:opacity-50"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                        {generating80g === d._id
                                                            ? "Generating..."
                                                            : "80G PDF"}
                                                    </button>
                                                )}
                                            {d.createdByAdmin && (
                                                <button
                                                    onClick={() =>
                                                        handleDelete(d._id)
                                                    }
                                                    aria-label="Delete record"
                                                    title="Delete record"
                                                    className="shrink-0 inline-flex items-center justify-center w-10 h-10 rounded-md border border-red-200 bg-white text-red-600 active:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* TanStack Data Table — xl and up; below that the cards above carry the data */}
            <div className="hidden xl:block bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm align-middle text-slate-700">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className={`px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide bg-slate-50 ${
                                                header.column.getCanSort()
                                                    ? "cursor-pointer select-none hover:bg-slate-100"
                                                    : ""
                                            }`}
                                            onClick={header.column.getToggleSortingHandler()}
                                        >
                                            <div
                                                className={`flex items-center gap-2 ${header.id === "actions" ? "justify-end" : ""}`}
                                            >
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext(),
                                                )}
                                                {header.column.getCanSort() && (
                                                    <span className="text-slate-400">
                                                        {{
                                                            asc: (
                                                                <ChevronUp className="w-3.5 h-3.5 text-slate-700" />
                                                            ),
                                                            desc: (
                                                                <ChevronDown className="w-3.5 h-3.5 text-slate-700" />
                                                            ),
                                                        }[
                                                            header.column.getIsSorted()
                                                        ] ?? (
                                                            <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-6 py-16 text-center text-slate-400"
                                    >
                                        Loading donations...
                                    </td>
                                </tr>
                            ) : table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={columns.length}
                                        className="px-6 py-16 text-center text-slate-400"
                                    >
                                        No donations found for the selected
                                        filters.
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="hover:bg-slate-50/50 transition-colors"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className={`px-3 py-3 align-top ${
                                                    cell.column.id ===
                                                        "donor" ||
                                                    cell.column.id ===
                                                        "contact"
                                                        ? "max-w-[240px] break-words"
                                                        : "whitespace-nowrap"
                                                }`}
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

            </div>

            {/* Pagination — shared by the phone cards and the desktop table */}
            {donations.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-3 sm:px-4 py-3 bg-white border border-slate-200 rounded-md shadow-sm">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 text-xs text-slate-600">
                        <select
                            aria-label="Rows per page"
                            className="px-2 py-1.5 sm:py-1 border border-slate-200 rounded bg-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={pagination.pageSize}
                            onChange={(e) =>
                                setPagination({
                                    pageIndex: 0,
                                    pageSize: Number(e.target.value),
                                })
                            }
                        >
                            {PAGE_SIZE_OPTIONS.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                            <option value={Math.max(donations.length, 1)}>
                                All ({donations.length})
                            </option>
                        </select>
                        <span className="hidden sm:inline">per page</span>
                        <span className="text-slate-300">|</span>
                        <span className="whitespace-nowrap">
                            <span className="font-medium text-slate-700">
                                {firstRow}–{lastRow}
                            </span>{" "}
                            of{" "}
                            <span className="font-medium text-slate-700">
                                {donations.length}
                            </span>
                        </span>
                    </div>

                    <div className="flex items-center justify-center gap-1">
                        <button
                            onClick={() => table.setPageIndex(0)}
                            disabled={!table.getCanPreviousPage()}
                            className="hidden sm:inline-flex p-1.5 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="First page"
                            aria-label="First page"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}
                            className="inline-flex items-center px-2.5 py-2 sm:py-1.5 text-xs font-medium border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-4 h-4 sm:hidden" />
                            <span className="hidden sm:inline">Prev</span>
                        </button>
                        <span className="px-1 sm:px-2 text-xs text-slate-600 whitespace-nowrap">
                            Page{" "}
                            <span className="font-medium text-slate-800">
                                {pagination.pageIndex + 1}
                            </span>{" "}
                            of{" "}
                            <span className="font-medium text-slate-800">
                                {Math.max(table.getPageCount(), 1)}
                            </span>
                        </span>
                        <button
                            onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}
                            className="inline-flex items-center px-2.5 py-2 sm:py-1.5 text-xs font-medium border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            aria-label="Next page"
                        >
                            <ChevronRight className="w-4 h-4 sm:hidden" />
                            <span className="hidden sm:inline">Next</span>
                        </button>
                        <button
                            onClick={() =>
                                table.setPageIndex(
                                    Math.max(table.getPageCount() - 1, 0),
                                )
                            }
                            disabled={!table.getCanNextPage()}
                            className="hidden sm:inline-flex p-1.5 border border-slate-200 rounded bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Last page"
                            aria-label="Last page"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Toast — small self-dismissing feedback (alert() is awful on phones) */}
            {toast && (
                <div
                    role="status"
                    aria-live="polite"
                    className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-[calc(100vw-2rem)] px-4 py-2.5 rounded-md shadow-lg text-sm font-medium text-white pointer-events-none ${
                        toast.type === "error" ? "bg-red-600" : "bg-slate-900"
                    }`}
                >
                    {toast.msg}
                </div>
            )}

            <OfflineDonationModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAddSuccess={fetchDonations}
            />
        </div>
    );
}
