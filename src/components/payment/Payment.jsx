import { useEffect, useState } from "react";
import axios from "axios";
import {
    Heart,
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
import logo from "../../assets/logo_white.png";
import Header from "../header/Header";
import Loading from "../loading/Loading";
import ErrorCard from "../error/ErrorCard";
import { isMaintainanceMode } from "../../../config";
import Maintainance from "../maintainance/Maintainance";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Refined, Modern Input Field (Familiar but cleaner)
const InputField = ({ label, name, type, placeholder, value, onChange, error, icon: Icon }) => (
    <div className="space-y-1.5 w-full">
        <label className="text-sm font-semibold text-slate-700">
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
            <p className="flex items-center text-xs font-medium text-red-600 mt-1">
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
        amount: "1000",
        pan: "",
    });

    const [errors, setErrors] = useState({});
    const [taxExemption, setTaxExemption] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [serverStatus, setServerStatus] = useState("checking");
    const [serverVersion, setServerVersion] = useState("");
    const [loading, setLoading] = useState(false);

    // Derived state for Impact Calculation
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
        { label: "Full Name", name: "name", type: "text", placeholder: "e.g. Rohan Kumar", icon: User, validation: (v) => !v.trim() && "Name is required" },
        { label: "Email Address", name: "email", type: "email", placeholder: "you@example.com", icon: Mail, validation: (v) => (!v ? "Email is required" : !/\S+@\S+\.\S+/.test(v) ? "Invalid email format" : null) },
        { label: "Mobile Number", name: "phone", type: "tel", placeholder: "XXXXXXXXXX", icon: Phone, validation: (v) => (!v ? "Required" : !/^\d{10}$/.test(v) ? "Must be 10 digits" : null) },
    ];

    const predefinedAmounts = [500, 1000, 2100, 5100];

    const validate = () => {
        const newErrors = {};
        fieldsConfig.forEach((field) => {
            const error = field.validation(formData[field.name]);
            if (error) newErrors[field.name] = error;
        });

        if (!formData.amount) newErrors.amount = "Amount is required";
        else if (isNaN(formData.amount) || Number(formData.amount) <= 0) newErrors.amount = "Enter valid amount";

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
        <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
            <Header />

            {/* Restored Split Screen Layout */}
            <div className="flex flex-grow flex-col lg:flex-row">
                
                {/* Left Section: Hero Image */}
                <div className="relative order-1 h-72 lg:h-auto lg:w-5/12 xl:w-1/2 overflow-hidden bg-slate-900">
                    <img src={bgImage} alt="Donate Background" className="absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-overlay transition-transform duration-[15s] hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent lg:bg-gradient-to-r lg:from-slate-900 lg:via-slate-900/80 lg:to-transparent" />

                    <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-16">
                        <img src={logo} alt="Satyalok" className="mb-8 w-32 opacity-90 lg:w-40" />
                        <h1 className="mb-4 text-3xl font-bold leading-tight text-white lg:text-5xl">
                            Empower a Life,<br />Build a Future.
                        </h1>
                        <p className="mb-8 max-w-md text-slate-300 lg:text-lg">
                            Your contribution directly funds education and healthcare initiatives for underprivileged communities.
                        </p>
                        
                        <div className="hidden lg:flex items-center gap-4 text-sm font-medium text-slate-300 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm max-w-md">
                            <Shield className="text-emerald-400 h-6 w-6 shrink-0" />
                            <p>Bank-grade 256-bit SSL encryption. Your data is perfectly secure.</p>
                        </div>
                    </div>
                </div>

                {/* Right Section: Donation Form */}
                <div className="order-2 flex w-full flex-col bg-white lg:w-7/12 xl:w-1/2 overflow-y-auto">
                    <div className="mx-auto w-full max-w-2xl flex-grow px-6 py-10 lg:px-12 lg:py-16">

                        <div className="mb-8 border-b border-slate-100 pb-6">
                            <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                    <Heart className="h-5 w-5 fill-current" />
                                </span>
                                Make a Donation
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">Please enter your details and select your contribution amount below.</p>
                        </div>

                        <form className="space-y-8">
                            
                            {/* 80G Toggle (Professional Switch) */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 transition-all hover:border-slate-300">
                                <div className="flex items-center justify-between cursor-pointer" onClick={() => setTaxExemption(!taxExemption)}>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900">Claim 80G Tax Exemption?</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Avail tax benefits on this donation.</p>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${taxExemption ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white absolute transition-transform duration-300 ${taxExemption ? 'translate-x-7' : 'translate-x-1'}`} />
                                    </div>
                                </div>

                                {/* PAN Input (Slides down) */}
                                <div className={`transition-all duration-300 ease-in-out overflow-hidden ${taxExemption ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                    <InputField
                                        label="PAN Number"
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
                                    <div className="mt-2 flex items-start gap-2 rounded bg-blue-50/50 p-2 text-xs text-blue-700">
                                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>Valid PAN is mandatory for 80G tax exemption certificate generation.</span>
                                    </div>
                                </div>
                            </div>

                            {/* Standard Fields */}
                            <div className="space-y-5">
                                <InputField {...fieldsConfig[0]} value={formData.name} onChange={handleChange} error={errors.name} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <InputField {...fieldsConfig[1]} value={formData.email} onChange={handleChange} error={errors.email} />
                                    <InputField {...fieldsConfig[2]} value={formData.phone} onChange={handleChange} error={errors.phone} />
                                </div>
                            </div>

                            <div className="h-px w-full bg-slate-100"></div>

                            {/* Amount Section (Foolproof Input + Shortcuts) */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-900 mb-2">Donation Amount (INR)</label>
                                    {/* Always Visible Input */}
                                    <div className="relative flex items-center">
                                        <span className="absolute left-4 text-slate-400 font-medium text-lg">₹</span>
                                        <input
                                            type="number"
                                            name="amount"
                                            value={formData.amount}
                                            onChange={handleChange}
                                            placeholder="Enter amount"
                                            className={`w-full rounded-xl border-0 px-4 pl-9 py-4 text-lg font-bold text-slate-900 outline-none ring-1 transition-all focus:ring-2 ${
                                                errors.amount 
                                                    ? "bg-red-50 ring-red-300 focus:ring-red-500" 
                                                    : "bg-slate-50 ring-slate-200 focus:bg-white focus:ring-blue-600 hover:ring-slate-300"
                                            }`}
                                        />
                                    </div>
                                    {errors.amount && <p className="text-xs font-medium text-red-600 mt-1.5">{errors.amount}</p>}
                                </div>

                                {/* Shortcut Buttons update the input above */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {predefinedAmounts.map((amt) => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, amount: amt.toString() });
                                                if (errors.amount) setErrors({ ...errors, amount: null });
                                            }}
                                            className={`rounded-lg border py-2.5 text-sm font-semibold transition-all active:scale-95 ${
                                                formData.amount === amt.toString()
                                                    ? "border-blue-600 bg-blue-50 text-blue-700"
                                                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                                            }`}
                                        >
                                            ₹{amt.toLocaleString()}
                                        </button>
                                    ))}
                                </div>

                                {/* Dynamic Impact Card */}
                                <div className="mt-2 bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-100 rounded-xl p-4 shadow-sm">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-white p-1.5 rounded-lg shadow-sm text-emerald-600 shrink-0 mt-0.5">
                                            <Sparkles size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 mb-1">Your Impact</h4>
                                            {currentAmount >= 500 ? (
                                                <p className="text-sm font-medium text-emerald-900 leading-snug">
                                                    You are supporting <span className="font-bold text-emerald-700 bg-emerald-200/50 px-1.5 py-0.5 rounded">{childrenSupported} child{childrenSupported > 1 ? 'ren' : ''}</span> with essential education materials.
                                                </p>
                                            ) : currentAmount > 0 ? (
                                                <p className="text-sm font-medium text-emerald-900 leading-snug">
                                                    You're providing crucial supplies. Add{' '}
                                                    <button 
                                                        type="button" 
                                                        onClick={() => {
                                                            setFormData({ ...formData, amount: '500' });
                                                            if (errors.amount) setErrors({ ...errors, amount: null });
                                                        }}
                                                        className="font-bold text-emerald-700 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-800"
                                                    >
                                                        ₹{deficitForOneChild} more
                                                    </button>{' '}
                                                    to fully sponsor 1 student!
                                                </p>
                                            ) : (
                                                <p className="text-sm font-medium text-emerald-700">Enter an amount above to see your impact.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Submit Action */}
                            <div className="pt-6">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleFormSubmit}
                                    className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70 disabled:transform-none"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `Proceed to Pay ₹${currentAmount ? currentAmount.toLocaleString() : '0'}`}
                                    {!loading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                                </button>

                                <div className="mt-6 flex justify-center gap-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                    <div className="flex items-center gap-1.5"><Lock size={12} /> SSL Secured</div>
                                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                                    <div className="flex items-center gap-1.5"><CheckCircle2 size={12} /> PhonePe Gateway</div>
                                </div>
                            </div>
                        </form>

                        {/* Footer & Status */}
                        <div className="mt-12 border-t border-slate-100 pt-6 text-center">
                            <p className="text-xs text-slate-400">
                                By donating, you agree to our <a href="/terms" className="underline decoration-slate-300 underline-offset-2 hover:text-slate-600">Terms</a> and <a href="/privacy" className="underline decoration-slate-300 underline-offset-2 hover:text-slate-600">Privacy Policy</a>.
                            </p>

                            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 shadow-sm">
                                <span className="relative flex h-2 w-2">
                                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${serverStatus === 'alive' ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                                    <span className={`relative inline-flex h-2 w-2 rounded-full ${serverStatus === 'alive' ? 'bg-emerald-500' : serverStatus === 'checking' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    System {serverStatus === 'checking' ? 'Connecting' : serverStatus === 'alive' ? `Online (v${serverVersion})` : 'Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {errorMessage && <ErrorCard message={errorMessage} setMessage={setErrorMessage} />}
        </div>
    );
}

export default Payment;