import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";

export default function OfflineDonationModal({ isOpen, onClose, onAddSuccess }) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        amount: "",
        paymentMethod: "cash",
        panNumber: "",
        taxBenefit: false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/donations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (data.success) {
                setFormData({
                    name: "", email: "", mobile: "", amount: "", paymentMethod: "cash", panNumber: "", taxBenefit: false
                });
                onAddSuccess();
                onClose();
            } else {
                setError(data.message || "Failed to add donation");
            }
        } catch (err) {
            setError("Server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <h3 className="text-lg font-semibold text-slate-800">Add Offline Donation</h3>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-100">
                            {error}
                        </div>
                    )}

                    <form id="offline-donation-form" onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Donor Name *</label>
                                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Email Address *</label>
                                <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Mobile Number *</label>
                                <input required type="text" name="mobile" value={formData.mobile} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Amount (₹) *</label>
                                <input required type="number" min="1" name="amount" value={formData.amount} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">Payment Method *</label>
                                <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none appearance-none">
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI (Direct)</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm font-medium text-slate-700">PAN Number</label>
                                <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase" placeholder="ABCDE1234F" />
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="flex items-center space-x-3 p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                                <input type="checkbox" name="taxBenefit" checked={formData.taxBenefit} onChange={handleChange} className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500" />
                                <div>
                                    <span className="block text-sm font-medium text-slate-800">80G Tax Exemption</span>
                                    <span className="block text-xs text-slate-500">Requires PAN number to generate valid certificate.</span>
                                </div>
                            </label>
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end space-x-3 sticky bottom-0">
                    <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button type="submit" form="offline-donation-form" disabled={loading} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center">
                        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Donation
                    </button>
                </div>
            </div>
        </div>
    );
}
