import React, { useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import adminApi from "./adminApi";

const today = new Date().toISOString().slice(0, 10);

const FIELD = ({ label, required, error, children }) => (
    <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
        {children}
        {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
    </div>
);

const INPUT = (props) => (
    <input {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white transition-colors" />
);

const SELECT = ({ children, ...props }) => (
    <select {...props} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white transition-colors appearance-none">
        {children}
    </select>
);

export default function OfflineDonationModal({ isOpen, onClose, onAddSuccess }) {
    const [form, setForm] = useState({
        name: "", email: "", mobile: "", amount: "",
        paymentMethod: "cash", externalTransactionId: "", donationDate: today,
        panNumber: "", taxBenefit: false,
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState("");

    if (!isOpen) return null;

    const set = (field, value) => {
        setForm(p => ({ ...p, [field]: value }));
        if (errors[field]) setErrors(p => ({ ...p, [field]: "" }));
    };

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = "Name is required";
        if (!form.email.trim()) e.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
        if (!form.mobile.trim()) e.mobile = "Mobile is required";
        else if (!/^\d{10}$/.test(form.mobile)) e.mobile = "Must be 10 digits";
        if (!form.amount) e.amount = "Amount is required";
        else if (isNaN(form.amount) || Number(form.amount) <= 0) e.amount = "Must be a positive number";
        if (form.taxBenefit && !form.panNumber.trim()) e.panNumber = "PAN is required for 80G";
        else if (form.taxBenefit && form.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber)) e.panNumber = "Invalid PAN format (e.g. ABCDE1234F)";
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        setApiError("");
        try {
            const { data } = await adminApi.post("/admin/donations", form);
            if (data.success) {
                setForm({ name: "", email: "", mobile: "", amount: "", paymentMethod: "cash", externalTransactionId: "", donationDate: today, panNumber: "", taxBenefit: false });
                setErrors({});
                onAddSuccess();
                onClose();
            } else {
                setApiError(data.message || "Failed to add donation");
            }
        } catch (err) {
            setApiError(err.response?.data?.message || "Server error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[92vh]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-slate-800">Add Offline Donation</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Manually log a cash/UPI/bank transfer donation</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {apiError && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            {apiError}
                        </div>
                    )}

                    <form id="offline-form" onSubmit={handleSubmit} className="space-y-4">
                        {/* Donor Info */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                                <FIELD label="Donor Name" required error={errors.name}>
                                    <INPUT type="text" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Full Name" />
                                </FIELD>
                            </div>
                            <FIELD label="Email" required error={errors.email}>
                                <INPUT type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="donor@email.com" />
                            </FIELD>
                            <FIELD label="Mobile" required error={errors.mobile}>
                                <INPUT type="text" value={form.mobile} onChange={e => set("mobile", e.target.value)} placeholder="10-digit number" maxLength={10} />
                            </FIELD>
                        </div>

                        {/* Payment Info */}
                        <div className="grid grid-cols-2 gap-3">
                            <FIELD label="Amount (₹)" required error={errors.amount}>
                                <INPUT type="number" min="1" value={form.amount} onChange={e => set("amount", e.target.value)} placeholder="e.g. 1000" />
                            </FIELD>
                            <FIELD label="Donation Date" required>
                                <INPUT type="date" value={form.donationDate} max={today} onChange={e => set("donationDate", e.target.value)} />
                            </FIELD>
                            <FIELD label="Payment Method" required>
                                <SELECT value={form.paymentMethod} onChange={e => set("paymentMethod", e.target.value)}>
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI (Direct)</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                    <option value="other">Other</option>
                                </SELECT>
                            </FIELD>
                            <FIELD label="Transaction / Reference ID">
                                <INPUT type="text" value={form.externalTransactionId} onChange={e => set("externalTransactionId", e.target.value)} placeholder="UTR / Cheque No. / Ref" />
                            </FIELD>
                        </div>

                        {/* 80G / Tax Benefit */}
                        <div className="rounded-xl border border-slate-200 overflow-hidden">
                            <label className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={form.taxBenefit}
                                    onChange={e => set("taxBenefit", e.target.checked)}
                                    className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                                />
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">80G Tax Exemption</p>
                                    <p className="text-xs text-slate-500">PAN is mandatory. Certificate can be downloaded from the donations table after saving.</p>
                                </div>
                            </label>
                            {form.taxBenefit && (
                                <div className="border-t border-slate-100 px-4 pb-4 pt-3 bg-slate-50">
                                    <FIELD label="PAN Number" required error={errors.panNumber}>
                                        <INPUT
                                            type="text"
                                            value={form.panNumber}
                                            onChange={e => set("panNumber", e.target.value.toUpperCase())}
                                            placeholder="ABCDE1234F"
                                            maxLength={10}
                                        />
                                    </FIELD>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button type="submit" form="offline-form" disabled={loading} className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-60">
                        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Donation
                    </button>
                </div>
            </div>
        </div>
    );
}
