import { useState, useEffect, useMemo } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
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
} from "lucide-react";
import OfflineDonationModal from "./OfflineDonationModal";
import adminApi from "./adminApi";

// Stats Card (Microsoft Fluent inspired - clean, subtle borders)
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div className="bg-white rounded-md border border-slate-200 shadow-sm p-4 flex items-start gap-4 transition-shadow hover:shadow-md">
        <div className={`p-2 rounded-md ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{label}</p>
            <p className="text-2xl font-semibold text-slate-900 mt-0.5">
                {value}
            </p>
            {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
    </div>
);

// Get default date range (last 7 days)
const getDefaultDates = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);
    return {
        startDate: start.toISOString().slice(0, 10),
        endDate: end.toISOString().slice(0, 10),
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

    // TanStack Sorting State
    const [sorting, setSorting] = useState([]);

    const fetchDonations = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.search) params.search = filters.search;
            if (filters.paymentMethod)
                params.paymentMethod = filters.paymentMethod;
            if (filters.status) params.status = filters.status;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const { data } = await adminApi.get("/admin/donations", { params });
            if (data.success) {
                setDonations(data.data);
                setStats(data.stats);
            }
        } catch (error) {
            console.error(
                "Failed to fetch donations:",
                error.response?.data || error.message,
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const t = setTimeout(fetchDonations, 300);
        return () => clearTimeout(t);
    }, [filters]);

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
            if (data.success) fetchDonations();
            else alert(data.message || "Failed to delete.");
        } catch (err) {
            alert(err.response?.data?.message || "Error deleting donation.");
        }
    };

    const handleResendReceipt = async (id) => {
        if (!window.confirm("Resend receipt to this donor?")) return;
        try {
            const { data } = await adminApi.post(
                `/admin/donations/${id}/resend-receipt`,
            );
            alert(
                data.success
                    ? "Receipt resent successfully."
                    : data.message || "Failed.",
            );
        } catch (err) {
            alert(err.response?.data?.message || "Error resending receipt.");
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
            alert("Failed to generate certificate. Please try again.");
        } finally {
            setGenerating80g(null);
        }
    };

    const f = (field, value) =>
        setFilters((prev) => ({ ...prev, [field]: value }));
    const hasActiveFilters =
        filters.search || filters.paymentMethod || filters.status;

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
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-800 tracking-tight">
                        Donations
                    </h1>
                    <p className="text-sm text-slate-500">
                        {loading
                            ? "Loading..."
                            : `${donations.length} record${donations.length !== 1 ? "s" : ""} in selected range`}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    <button
                        onClick={() => setHideSensitive((p) => !p)}
                        className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium border shadow-sm transition-colors ${hideSensitive ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
                        title={
                            hideSensitive
                                ? "Sensitive data hidden"
                                : "Sensitive data visible"
                        }
                    >
                        {hideSensitive ? (
                            <EyeOff className="w-4 h-4 mr-1.5" />
                        ) : (
                            <Eye className="w-4 h-4 mr-1.5" />
                        )}
                        {hideSensitive
                            ? "Sensitive hidden"
                            : "Sensitive visible"}
                    </button>
                    <button
                        onClick={handleExportCSV}
                        disabled={!donations.length}
                        className="inline-flex items-center px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm transition-colors"
                    >
                        <Download className="w-4 h-4 mr-1.5" /> Export CSV
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-1.5" /> Add Offline Entry
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && !loading && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        icon={BarChart3}
                        label="Total Records"
                        value={stats.total}
                        sub={`${filters.startDate} → ${filters.endDate}`}
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
            <div className="bg-white p-4 rounded-md border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search name, email, mobile, txn id..."
                            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 transition-shadow"
                            value={filters.search}
                            onChange={(e) => f("search", e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select
                            className="block pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white transition-shadow"
                            value={filters.paymentMethod}
                            onChange={(e) => f("paymentMethod", e.target.value)}
                        >
                            <option value="">All Methods</option>
                            <option value="phonepe">PhonePe</option>
                            <option value="cash">Cash</option>
                            <option value="upi">UPI</option>
                            <option value="bank_transfer">Bank Transfer</option>
                            <option value="cheque">Cheque</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="relative">
                        <select
                            disabled={true}
                            className="block px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white transition-shadow"
                            value={filters.status}
                        >
                            <option value="success">Success</option>
                        </select>
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={() =>
                                setFilters((prev) => ({
                                    ...prev,
                                    search: "",
                                    paymentMethod: "",
                                    status: "",
                                }))
                            }
                            className="text-sm text-red-500 hover:text-red-700 font-medium px-2"
                        >
                            Clear
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            className="block pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 transition-shadow"
                            value={filters.startDate}
                            onChange={(e) => f("startDate", e.target.value)}
                        />
                    </div>
                    <span className="text-slate-400 text-sm">to</span>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            className="block pl-9 pr-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700 transition-shadow"
                            value={filters.endDate}
                            min={filters.startDate}
                            onChange={(e) => f("endDate", e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() =>
                                setFilters((prev) => ({
                                    ...prev,
                                    ...getDefaultDates(),
                                }))
                            }
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1.5 border border-blue-200 rounded-md bg-blue-50 transition-colors"
                        >
                            Last 7 days
                        </button>
                        <button
                            onClick={() => {
                                const end = new Date(),
                                    start = new Date();
                                start.setDate(1);
                                f(
                                    "startDate",
                                    start.toISOString().slice(0, 10),
                                );
                                f("endDate", end.toISOString().slice(0, 10));
                            }}
                            className="text-xs text-slate-600 hover:text-slate-800 font-medium px-2 py-1.5 border border-slate-200 rounded-md bg-slate-50 transition-colors"
                        >
                            This month
                        </button>
                        <button
                            onClick={() => {
                                const end = new Date(),
                                    start = new Date();
                                start.setFullYear(start.getFullYear(), 0, 1);
                                f(
                                    "startDate",
                                    start.toISOString().slice(0, 10),
                                );
                                f("endDate", end.toISOString().slice(0, 10));
                            }}
                            className="text-xs text-slate-600 hover:text-slate-800 font-medium px-2 py-1.5 border border-slate-200 rounded-md bg-slate-50 transition-colors"
                        >
                            This year
                        </button>
                    </div>
                </div>
            </div>

            {/* TanStack Data Table */}
            <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
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
                                                className="px-4 py-3 whitespace-nowrap"
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

            <OfflineDonationModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAddSuccess={fetchDonations}
            />
        </div>
    );
}
