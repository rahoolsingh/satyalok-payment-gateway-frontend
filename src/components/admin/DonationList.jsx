import React, { useState, useEffect } from "react";
import { Download, Plus, Search, Mail, Trash2, Filter, Calendar } from "lucide-react";
import OfflineDonationModal from "./OfflineDonationModal";
import adminApi from "./adminApi";

export default function DonationList() {
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: "",
        paymentMethod: "",
        startDate: "",
        endDate: "",
    });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const fetchDonations = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filters.search) params.search = filters.search;
            if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
            if (filters.startDate) params.startDate = filters.startDate;
            if (filters.endDate) params.endDate = filters.endDate;

            const { data } = await adminApi.get("/admin/donations", { params });
            if (data.success) {
                setDonations(data.data);
            }
        } catch (error) {
            console.error("Failed to fetch donations:", error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            fetchDonations();
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [filters]);

    const handleExportCSV = () => {
        if (donations.length === 0) return;
        const headers = ["Date", "Name", "Email", "Mobile", "Amount", "Method", "Txn ID", "Tax Benefit", "Status"];
        const csvRows = [headers.join(",")];

        donations.forEach(d => {
            const row = [
                new Date(d.createdAt).toLocaleString(),
                d.name,
                d.email,
                d.mobile,
                d.amount,
                d.paymentMethod || "phonepe",
                d.merchantTransactionId,
                d.taxBenefit ? "Yes" : "No",
                d.success ? "Success" : "Failed"
            ].map(val => `"${val}"`);
            csvRows.push(row.join(","));
        });

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `donations_export_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this donation record? This action cannot be undone.")) return;

        try {
            const { data } = await adminApi.delete(`/admin/donations/${id}`);
            if (data.success) {
                fetchDonations();
                alert("Donation deleted successfully.");
            } else {
                alert(data.message || "Failed to delete.");
            }
        } catch (error) {
            alert(error.response?.data?.message || "Error deleting donation.");
        }
    };

    const handleResendReceipt = async (id) => {
        if (!window.confirm("Resend receipt to this donor?")) return;

        try {
            const { data } = await adminApi.post(`/admin/donations/${id}/resend-receipt`);
            if (data.success) {
                alert("Receipt resent successfully.");
            } else {
                alert(data.message || "Failed to resend receipt.");
            }
        } catch (error) {
            alert(error.response?.data?.message || "Error resending receipt.");
        }
    };

    const handleFilterChange = (field, value) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleClearFilters = () => {
        setFilters({ search: "", paymentMethod: "", startDate: "", endDate: "" });
    };

    const hasActiveFilters = filters.search || filters.paymentMethod || filters.startDate || filters.endDate;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Donations</h1>
                    <p className="text-sm text-slate-500">
                        {loading ? "Loading..." : `${donations.length} record${donations.length !== 1 ? "s" : ""} found`}
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleExportCSV} disabled={donations.length === 0} className="inline-flex items-center px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm disabled:opacity-50">
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </button>
                    <button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-lg text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> Add Offline Entry
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Search */}
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name, email, mobile or transaction id..."
                            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={filters.search}
                            onChange={(e) => handleFilterChange("search", e.target.value)}
                        />
                    </div>
                    {/* Payment Method */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-4 w-4 text-slate-400" />
                        </div>
                        <select
                            className="block w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none bg-white min-w-[150px]"
                            value={filters.paymentMethod}
                            onChange={(e) => handleFilterChange("paymentMethod", e.target.value)}
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
                </div>

                {/* Date Range Row */}
                <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="date"
                            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                            value={filters.startDate}
                            onChange={(e) => handleFilterChange("startDate", e.target.value)}
                            title="Start Date"
                        />
                    </div>
                    <span className="text-slate-400 text-sm font-medium">to</span>
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="date"
                            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                            value={filters.endDate}
                            min={filters.startDate}
                            onChange={(e) => handleFilterChange("endDate", e.target.value)}
                            title="End Date"
                        />
                    </div>
                    {hasActiveFilters && (
                        <button onClick={handleClearFilters} className="text-sm text-red-500 hover:text-red-700 font-medium whitespace-nowrap transition-colors">
                            Clear all
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Donor</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Method</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">Loading donations...</td>
                                </tr>
                            ) : donations.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-slate-500">
                                        No donations found.{hasActiveFilters && " Try clearing the filters."}
                                    </td>
                                </tr>
                            ) : (
                                donations.map((donation) => (
                                    <tr key={donation._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(donation.createdAt).toLocaleDateString("en-IN")}<br />
                                            <span className="text-xs">{new Date(donation.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900">{donation.name}</div>
                                            <div className="text-sm text-slate-500">{donation.email}</div>
                                            <div className="text-xs text-slate-400">{donation.mobile}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-slate-900">₹{donation.amount?.toLocaleString("en-IN")}</div>
                                            <div className="text-xs text-slate-400">
                                                PAN Number: {donation.taxBenefit ? donation.panNumber : ""}
                                            </div>
                                            {donation.taxBenefit && <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800 mt-1">80G</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 capitalize">
                                                {(donation.paymentMethod || "phonepe").replace("_", " ")}
                                            </span>
                                            {donation.createdByAdmin && <span className="ml-2 text-xs text-blue-600 font-medium">(Manual)</span>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {donation.success ? (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">Success</span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Failed</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end space-x-2">
                                                {donation.success && (
                                                    <button onClick={() => handleResendReceipt(donation._id)} title="Resend Receipt" className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors">
                                                        <Mail className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {donation.createdByAdmin && (
                                                    <button onClick={() => handleDelete(donation._id)} title="Delete Record" className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors">
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
