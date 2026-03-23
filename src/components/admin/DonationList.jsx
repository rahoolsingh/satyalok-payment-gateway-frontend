import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import OfflineDonationModal from "./OfflineDonationModal";
import adminApi from "./adminApi";

// Stats Card
const StatCard = ({ icon: Icon, label, value, sub, color }) => (
    <div
        className={`bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-start gap-4`}
    >
        <div className={`p-2.5 rounded-lg ${color}`}>
            <Icon className="w-5 h-5" />
        </div>
        <div>
            <p className="text-sm text-slate-500 font-medium">{label}</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
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
    const [filters, setFilters] = useState({
        search: "",
        paymentMethod: "",
        status: "",
        ...getDefaultDates(),
    });
    const [hideSensitive, setHideSensitive] = useState(true); // hidden by default
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [generating80g, setGenerating80g] = useState(null); // id of donation generating cert

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
                new Date(d.donationDate).toLocaleDateString("en-IN")
                    ? new Date(d.donationDate).toLocaleDateString("en-IN")
                    : new Date(d.createdAt).toLocaleDateString("en-IN"), // fallback to createdAt if donationDate is missing
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
                {
                    responseType: "blob",
                },
            );
            const url = URL.createObjectURL(
                new Blob([response.data], { type: "application/pdf" }),
            );
            const a = document.createElement("a");
            a.href = url;
            a.download = `80G_${donation.merchantTransactionId}.pdf`;
            a.click();
            URL.revokeObjectURL(url);

            // Ask to mail after download
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        Donations
                    </h1>
                    <p className="text-sm text-slate-500">
                        {loading
                            ? "Loading..."
                            : `${donations.length} record${donations.length !== 1 ? "s" : ""} in selected range`}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                    {/* Sensitive data toggle */}
                    <button
                        onClick={() => setHideSensitive((p) => !p)}
                        className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium border shadow-sm transition-colors ${hideSensitive ? "bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
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
                        className="inline-flex items-center px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 shadow-sm"
                    >
                        <Download className="w-4 h-4 mr-1.5" /> Export CSV
                    </button>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center px-3 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
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
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                {/* Row 1: Search + Method + Status */}
                <div className="flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search name, email, mobile, txn id..."
                            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={filters.search}
                            onChange={(e) => f("search", e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select
                            className="block pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
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
                            className="block px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            value={filters.status}
                            onChange={(e) => f("status", e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="success">Success</option>
                            <option value="failed">Failed</option>
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
                            className="text-sm text-red-500 hover:text-red-700 font-medium"
                        >
                            Clear
                        </button>
                    )}
                </div>
                {/* Row 2: Date Range */}
                <div className="flex flex-wrap gap-3 items-center">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            className="block pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                            value={filters.startDate}
                            onChange={(e) => f("startDate", e.target.value)}
                        />
                    </div>
                    <span className="text-slate-400 text-sm">to</span>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="date"
                            className="block pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                            value={filters.endDate}
                            min={filters.startDate}
                            onChange={(e) => f("endDate", e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() =>
                            setFilters((prev) => ({
                                ...prev,
                                ...getDefaultDates(),
                            }))
                        }
                        className="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 border border-blue-200 rounded-md bg-blue-50"
                    >
                        Last 7 days
                    </button>
                    <button
                        onClick={() => {
                            const end = new Date(),
                                start = new Date();
                            start.setDate(1);
                            f("startDate", start.toISOString().slice(0, 10));
                            f("endDate", end.toISOString().slice(0, 10));
                        }}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 border border-slate-200 rounded-md bg-slate-50"
                    >
                        This month
                    </button>
                    <button
                        onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setFullYear(start.getFullYear(), 0, 1);
                            f("startDate", start.toISOString().slice(0, 10));
                            f("endDate", end.toISOString().slice(0, 10));
                        }}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium px-2 py-1 border border-slate-200 rounded-md bg-slate-50"
                    >
                        This year
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Donor
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Amount
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Method / TxnID
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-6 py-16 text-center text-slate-400"
                                    >
                                        Loading donations...
                                    </td>
                                </tr>
                            ) : !donations.length ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-6 py-16 text-center text-slate-400"
                                    >
                                        No donations found for the selected
                                        filters.
                                    </td>
                                </tr>
                            ) : (
                                donations.map((d) => (
                                    <tr
                                        key={d._id}
                                        className="hover:bg-slate-50 transition-colors"
                                    >
                                        <td className="px-5 py-3 whitespace-nowrap text-slate-500">
                                            <div>
                                                {new Date(
                                                    d.donationDate ||
                                                        d.createdAt,
                                                ).toLocaleDateString("en-IN")}
                                            </div>
                                            <div className="text-xs text-slate-400">
                                                {new Date(
                                                    d.donationDate ||
                                                        d.createdAt,
                                                ).toLocaleTimeString("en-IN", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <div className="font-medium text-slate-900">
                                                {d.name}
                                            </div>
                                            {/* Receipt ID — always shown, not sensitive */}
                                            <div
                                                className="text-xs text-slate-400 font-mono mt-0.5"
                                                title="Receipt / Reference ID"
                                            >
                                                {d.merchantTransactionId}
                                            </div>
                                            {d.taxBenefit && (
                                                <div className="text-xs text-slate-400 mt-0.5">
                                                    PAN:{" "}
                                                    {hideSensitive
                                                        ? "••••••••••"
                                                        : d.panNumber}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap text-slate-500">
                                            <div>{mask(d.email)}</div>
                                            <div className="text-xs">
                                                {mask(String(d.mobile || ""))}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            <div className="font-semibold text-slate-900">
                                                ₹
                                                {d.amount?.toLocaleString(
                                                    "en-IN",
                                                )}
                                            </div>
                                            {d.taxBenefit && (
                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 mt-1">
                                                    80G
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 capitalize">
                                                {(
                                                    d.paymentMethod || "phonepe"
                                                ).replace("_", " ")}
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
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap">
                                            {d.success ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Success
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                                    <XCircle className="w-3 h-3" />
                                                    Failed
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 whitespace-nowrap text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {d.success && (
                                                    <button
                                                        onClick={() =>
                                                            handleResendReceipt(
                                                                d._id,
                                                            )
                                                        }
                                                        title="Resend Receipt"
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                                    >
                                                        <Mail className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {/* 80G button: show whenever the donation has taxBenefit + panNumber + success */}
                                                {d.taxBenefit &&
                                                    d.panNumber &&
                                                    d.success && (
                                                        <button
                                                            onClick={() =>
                                                                handle80GDownload(
                                                                    d,
                                                                )
                                                            }
                                                            title={
                                                                d.createdByAdmin
                                                                    ? "Download 80G Certificate"
                                                                    : "Download 80G Certificate"
                                                            }
                                                            disabled={
                                                                generating80g ===
                                                                d._id
                                                            }
                                                            className="p-1.5 text-violet-600 hover:bg-violet-50 rounded-md transition-colors disabled:opacity-50 text-xs font-bold border border-violet-200 hover:border-violet-400"
                                                        >
                                                            {generating80g ===
                                                            d._id ? (
                                                                <span className="text-xs">
                                                                    …
                                                                </span>
                                                            ) : (
                                                                "80G"
                                                            )}
                                                        </button>
                                                    )}
                                                {d.createdByAdmin && (
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(d._id)
                                                        }
                                                        title="Delete Record"
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
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
