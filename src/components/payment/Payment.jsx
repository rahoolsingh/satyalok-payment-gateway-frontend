import { useEffect, useState } from "react";
import axios from "axios";
import {
    Shield,
    Lock,
    AlertCircle,
    Info,
    CreditCard,
    Loader2,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    User,
    Mail,
    Phone
} from "lucide-react";
import bgImage from "../../assets/images/image_3.jpeg";
import logo from "../../assets/logo_white.png"; // Assuming you have a dark logo for the light side
import Header from "../header/Header";
import Loading from "../loading/Loading";
import ErrorCard from "../error/ErrorCard";
import { isMaintainanceMode } from "../../../config";
import Maintainance from "../maintainance/Maintainance";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Refined, Modern Input Field
const InputField = ({ label, name, type, placeholder, value, onChange, error, icon: Icon }) => (
    <div className="space-y-1.5 w-full">
        <label className="text-[13px] font-semibold text-slate-700">
            {label}
        </label>
        <div className="relative flex items-center">
            {Icon && (
                <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Icon size={18} />
                </div>
            )}
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={`w-full rounded-xl border-0 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none ring-1 transition-all placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:ring-2 ${
                    error
                        ? "ring-red-300 focus:ring-red-500 bg-red-50/50"
                        : "ring-slate-200 focus:ring-blue-600 hover:ring-slate-300"
                } ${Icon ? "pl-11" : ""}`}
            />
        </div>
        {error && (
            <p className="flex items-center text-[11px] font-medium text-red-600 mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                {error}
            </p>
        )}
    </div>
);

function Payment() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        amount: "1000", // Defaulting to a higher, more impactful amount
        pan: "",
    });

    const [errors, setErrors] = useState({});
    const [taxExemption, setTaxExemption] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [serverStatus, setServerStatus] = useState("checking");
    const [serverVersion, setServerVersion] = useState("");
    const [loading, setLoading] = useState(false);
    const [customAmount, setCustomAmount] = useState(false);

    const currentAmount = Number(formData.amount) || 0;
    const childrenSupported = Math.floor(currentAmount / 500);
    const deficitForOneChild = 500 - currentAmount;

    useEffect(() => {
        const wakeUpBackend = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/`);
                if (res?.data?.alive) {
                    setServerStatus("alive");
                    setServerVersion(res?.data?.commitVersion?.slice(-3));
                }
            } catch (error) {
                console.error("Backend Error:", error);
                setServerStatus("error");
            }
        };
        wakeUpBackend();
    }, []);

    const fieldsConfig = [
        { label: "Full Name", name: "name", type: "text", placeholder: "e.g. Rahul Singh", icon: User, validation: (v) => !v.trim() && "Name is required" },
        { label: "Email Address", name: "email", type: "email", placeholder: "you@example.com", icon: Mail, validation: (v) => (!v ? "Email is required" : !/\S+@\S+\.\S+/.test(v) ? "Invalid email format" : null) },
        { label: "Phone Number", name: "phone", type: "tel", placeholder: "9876543210", icon: Phone, validation: (v) => (!v ? "Required" : !/^\d{10}$/.test(v) ? "Must be 10 digits" : null) },
    ];

    const predefinedAmounts = [500, 1000, 2500, 5000];

    const validate = () => {
        const newErrors = {};
        fieldsConfig.forEach((field) => {
            const error = field.validation(formData[field.name]);
            if (error) newErrors[field.name] = error;
        });

        if (!formData.amount) newErrors.amount = "Amount is required";
        else if (isNaN(formData.amount) || Number(formData.amount) < 100) newErrors.amount = "Minimum amount is ₹100";

        if (taxExemption && !formData.pan) newErrors.pan = "PAN is required for 80G";
        else if (taxExemption && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) newErrors.pan = "Invalid PAN format";

        return newErrors;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
    };

    const handleFormSubmit = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setLoading(true);
            const res = await axios.post(`${BACKEND_URL}/order`, formData);
            if (res.data.success) {
                window.location.href = res.data.data.instrumentResponse.redirectInfo.url;
            } else {
                setErrorMessage(res.data.message || "Failed to initiate payment.");
                setLoading(false);
            }
        } catch (error) {
            setErrorMessage("Network error. Please try again.");
            setLoading(false);
        }
    };

    if (isMaintainanceMode) return <Maintainance />;
    if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50"><Loading /></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans selection:bg-blue-100 selection:text-blue-900 flex flex-col">
            <Header />

            <div className="flex-grow flex items-center justify-center p-4 sm:p-6 lg:p-8">
                {/* Main Floating Card */}
                <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl shadow-slate-200/50 overflow-hidden flex flex-col lg:flex-row border border-slate-100">
                    
                    {/* Left Panel: Branding & Trust */}
                    <div className="relative w-full lg:w-5/12 bg-slate-900 overflow-hidden hidden md:flex flex-col justify-between p-10 lg:p-12 text-white">
                        <img src={bgImage} alt="Background" className="absolute inset-0 h-full w-full object-cover opacity-40 mix-blend-overlay" />
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 via-slate-900/95 to-slate-900"></div>
                        
                        <div className="relative z-10">
                            <img src={logo} alt="Satyalok" className="h-8 mb-12 opacity-90" />
                            <h1 className="text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight mb-6">
                                Change a life<br />
                                <span className="text-blue-400">today.</span>
                            </h1>
                            <p className="text-slate-300 text-lg leading-relaxed max-w-sm">
                                100% of your donation directly funds education materials and academic support for children in need.
                            </p>
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-4 text-sm font-medium text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
                                <Shield className="text-emerald-400 h-6 w-6 shrink-0" />
                                <p>Bank-grade 256-bit SSL encryption. Your data is perfectly secure.</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel: Checkout Flow */}
                    <div className="w-full lg:w-7/12 p-6 sm:p-10 lg:p-12 flex flex-col justify-center">
                        <div className="max-w-md mx-auto w-full">
                            
                            <h2 className="text-2xl font-bold text-slate-900 mb-8 md:hidden">Complete your donation</h2>

                            <form className="space-y-8">
                                
                                {/* Section 1: Amount Selection (UX: Put the core decision first) */}
                                <div>
                                    <div className="flex justify-between items-end mb-3">
                                        <label className="text-sm font-bold text-slate-900">Select Amount</label>
                                        <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">INR (₹)</span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                        {predefinedAmounts.map((amt) => (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => { setFormData({ ...formData, amount: amt.toString() }); setCustomAmount(false); }}
                                                className={`relative h-14 rounded-xl border-2 text-base font-bold transition-all ${
                                                    formData.amount === amt.toString() && !customAmount
                                                        ? "border-blue-600 bg-blue-50 text-blue-700 ring-4 ring-blue-600/10"
                                                        : "border-slate-100 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                                }`}
                                            >
                                                ₹{amt.toLocaleString()}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom Amount Field */}
                                    <div className={`relative transition-all duration-300 overflow-hidden ${customAmount ? 'h-14 opacity-100 mb-4' : 'h-0 opacity-0'}`}>
                                        <span className="absolute left-4 top-4 text-slate-400 font-medium">₹</span>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={formData.amount}
                                            onChange={(e) => {
                                                setFormData({ ...formData, amount: e.target.value });
                                                if (errors.amount) setErrors({ ...errors, amount: null });
                                            }}
                                            placeholder="Enter custom amount"
                                            className="w-full h-full rounded-xl border-2 border-blue-600 bg-blue-50/50 px-4 pl-8 text-lg font-bold text-blue-900 outline-none"
                                        />
                                    </div>
                                    
                                    {!customAmount && (
                                        <button 
                                            type="button" 
                                            onClick={() => setCustomAmount(true)}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            Enter a custom amount
                                        </button>
                                    )}
                                    {errors.amount && <p className="text-[11px] font-medium text-red-600 mt-2">{errors.amount}</p>}
                                </div>

                                {/* Dynamic Impact Visualization */}
                                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 rounded-2xl p-5 shadow-sm">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-white p-2 rounded-xl shadow-sm text-emerald-600 shrink-0">
                                            <Sparkles size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-[13px] font-bold uppercase tracking-wider text-emerald-800 mb-1">Your Impact</h4>
                                            {currentAmount >= 500 ? (
                                                <p className="text-sm font-medium text-emerald-900 leading-snug">
                                                    You are fully supporting <span className="font-bold text-emerald-700 bg-emerald-200/50 px-1.5 py-0.5 rounded">{childrenSupported} child{childrenSupported > 1 ? 'ren' : ''}</span> with essential education materials.
                                                </p>
                                            ) : currentAmount > 0 ? (
                                                <p className="text-sm font-medium text-emerald-900 leading-snug">
                                                    You're providing crucial supplies. Add{' '}
                                                    <button 
                                                        type="button" 
                                                        onClick={() => { setFormData({ ...formData, amount: '500' }); setCustomAmount(false); }}
                                                        className="font-bold text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800"
                                                    >
                                                        ₹{deficitForOneChild} more
                                                    </button>{' '}
                                                    to fully sponsor 1 student!
                                                </p>
                                            ) : (
                                                <p className="text-sm font-medium text-emerald-700">Enter an amount to see your impact.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="h-px w-full bg-slate-100"></div>

                                {/* Section 2: Personal Details */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-slate-900">Your Details</h3>
                                    <InputField {...fieldsConfig[0]} value={formData.name} onChange={handleChange} error={errors.name} />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <InputField {...fieldsConfig[1]} value={formData.email} onChange={handleChange} error={errors.email} />
                                        <InputField {...fieldsConfig[2]} value={formData.phone} onChange={handleChange} error={errors.phone} />
                                    </div>
                                </div>

                                {/* Section 3: Tax Exemption (Modern Toggle) */}
                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
                                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setTaxExemption(!taxExemption)}>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">Claim 80G Tax Exemption?</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Avail tax benefits on this donation.</p>
                                        </div>
                                        {/* Custom Toggle Switch */}
                                        <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${taxExemption ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white absolute transition-transform duration-300 ${taxExemption ? 'translate-x-7' : 'translate-x-1'}`} />
                                        </div>
                                    </div>

                                    {/* PAN Input (Slides down smoothly) */}
                                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${taxExemption ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                        <InputField
                                            label="Permanent Account Number (PAN)"
                                            name="pan"
                                            type="text"
                                            placeholder="ABCDE1234F"
                                            value={formData.pan}
                                            onChange={(e) => {
                                                setFormData({ ...formData, pan: e.target.value.toUpperCase() });
                                                if (errors.pan) setErrors({ ...errors, pan: null });
                                            }}
                                            error={errors.pan}
                                            icon={CreditCard}
                                        />
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="pt-2">
                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={handleFormSubmit}
                                        className="group relative w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-4 text-base font-bold text-white transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none shadow-lg shadow-blue-600/20"
                                    >
                                        {loading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                Pay ₹{currentAmount.toLocaleString()} Securely
                                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </button>

                                    {/* Trust Badges */}
                                    <div className="mt-5 flex items-center justify-center gap-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                        <div className="flex items-center gap-1.5"><Lock size={12} /> Secure Checkout</div>
                                        <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                        <div className="flex items-center gap-1.5"><CheckCircle2 size={12} /> PhonePe Gateway</div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Server Status Footer */}
            <div className="py-4 text-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1.5 shadow-sm">
                    <span className="relative flex h-2 w-2">
                        <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${serverStatus === 'alive' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                        <span className={`relative inline-flex h-2 w-2 rounded-full ${serverStatus === 'alive' ? 'bg-emerald-500' : serverStatus === 'checking' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                        System {serverStatus === 'checking' ? 'Connecting' : serverStatus === 'alive' ? `Online (v${serverVersion})` : 'Offline'}
                    </span>
                </div>
            </div>

            {errorMessage && <ErrorCard message={errorMessage} setMessage={setErrorMessage} />}
        </div>
    );
}

export default Payment;