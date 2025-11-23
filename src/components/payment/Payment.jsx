import { useEffect, useState } from "react";
import axios from "axios";
import {
    Heart,
    Shield,
    Lock,
    AlertCircle,
    Check,
    Info,
    CreditCard,
    Loader2,
    ArrowRight
} from "lucide-react";
import bgImage from "../../assets/images/image_3.jpeg";
import logo from "../../assets/logo_white.png";
import Header from "../header/Header";
import Loading from "../loading/Loading";
import ErrorCard from "../error/ErrorCard";
import { isMaintainanceMode } from "../../../config";
import Maintainance from "../maintainance/Maintainance";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Reusable Input Component for consistent styling
const InputField = ({ label, name, type, placeholder, value, onChange, error, icon: Icon }) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700">
            {label}
        </label>
        <div className="relative">
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={`w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:text-slate-400 ${error
                    ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100"
                    : "border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                    } ${Icon ? "pl-10" : ""}`}
            />
            {Icon && (
                <Icon className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            )}
        </div>
        {error && (
            <p className="flex items-center text-xs text-red-600 mt-1 animate-pulse">
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
        amount: "100",
        pan: "",
    });

    const [errors, setErrors] = useState({});
    const [taxExemption, setTaxExemption] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [serverStatus, setServerStatus] = useState("checking");
    const [serverVersion, setServerVersion] = useState("");
    const [loading, setLoading] = useState(false);

    // Check Server Health
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
        { label: "Full Name", name: "name", type: "text", placeholder: "e.g. Rahul Singh", validation: (v) => !v.trim() && "Name is required" },
        { label: "Email Address", name: "email", type: "email", placeholder: "you@example.com", validation: (v) => (!v ? "Email is required" : !/\S+@\S+\.\S+/.test(v) ? "Invalid email format" : null) },
        { label: "Mobile Number", name: "phone", type: "tel", placeholder: "9876543210", validation: (v) => (!v ? "Required" : !/^\d{10}$/.test(v) ? "Must be 10 digits" : null) },
    ];

    const predefinedAmounts = [100, 500, 1000, 2100, 5100];

    const validate = () => {
        const newErrors = {};

        // Validate main fields
        fieldsConfig.forEach((field) => {
            const error = field.validation(formData[field.name]);
            if (error) newErrors[field.name] = error;
        });

        // Validate Amount
        if (!formData.amount) newErrors.amount = "Amount is required";
        else if (isNaN(formData.amount) || Number(formData.amount) <= 0) newErrors.amount = "Enter valid amount";

        // Validate PAN
        if (taxExemption && !formData.pan) newErrors.pan = "PAN is required for 80G";

        return newErrors;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear error when user types
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
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
        // FIX: Added 'overflow-x-hidden' and 'w-full' to prevent horizontal scroll issues
        <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900">
            <Header />

            <div className="flex flex-grow flex-col lg:flex-row">
                {/* Left Section: Hero & Impact */}
                <div className="relative order-1 h-72 overflow-hidden bg-slate-900 lg:order-1 lg:h-auto lg:w-5/12 xl:w-1/2">
                    <img src={bgImage} alt="Donate Background" className="absolute inset-0 h-full w-full object-cover opacity-60 transition-transform duration-[10s] hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent lg:bg-gradient-to-r lg:from-slate-900 lg:via-slate-900/60 lg:to-transparent" />

                    <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-16">
                        <img src={logo} alt="Satyalok" className="mb-8 w-32 opacity-90 lg:w-40" />
                        <h1 className="mb-4 text-3xl font-bold leading-tight text-white lg:text-5xl">
                            Empower a Life,<br />Build a Future.
                        </h1>
                        <p className="mb-8 max-w-md text-slate-300 lg:text-lg">
                            Your contribution directly funds education and healthcare initiatives for underprivileged communities.
                        </p>

                        <div className="hidden border-t border-white/10 pt-6 lg:block">
                            <div className="flex flex-wrap gap-3">
                                {["Education", "Healthcare", "Sustainability", "Community"].map((tag) => (
                                    <span key={tag} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-slate-200 backdrop-blur-sm border border-white/5">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Donation Form */}
                <div className="order-2 flex w-full flex-col bg-white lg:order-2 lg:w-7/12 xl:w-1/2">
                    <div className="mx-auto w-full max-w-2xl flex-grow px-6 py-10 lg:px-12 lg:py-16">

                        <div className="mb-8 flex items-center justify-between">
                            <div>
                                <h2 className="flex items-center gap-3 text-2xl font-bold text-slate-900">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                        <Heart className="h-4 w-4 fill-current" />
                                    </span>
                                    Make a Donation
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">Secure payment gateway powered by PhonePe</p>
                            </div>
                        </div>

                        <form className="space-y-6">
                            {/* 80G Toggle */}
                            <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                    <div>
                                        <label className="text-sm font-semibold text-slate-800">Claim Tax Exemption?</label>
                                        <p className="text-xs text-slate-500">Avail 80G benefits on your donation.</p>
                                    </div>
                                    <div className="flex rounded-lg bg-slate-200 p-1">
                                        <button
                                            type="button"
                                            onClick={() => setTaxExemption(true)}
                                            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${taxExemption ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTaxExemption(false)}
                                            className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all ${!taxExemption ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Standard Fields */}
                            <div className="grid gap-5 md:grid-cols-1">
                                {fieldsConfig.map((field) => (
                                    <InputField
                                        key={field.name}
                                        {...field}
                                        value={formData[field.name]}
                                        onChange={handleChange}
                                        error={errors[field.name]}
                                    />
                                ))}
                            </div>

                            {/* PAN Field (Conditional) */}
                            {taxExemption && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                    <InputField
                                        label="PAN Number"
                                        name="pan"
                                        type="text"
                                        placeholder="ABCDE1234F"
                                        value={formData.pan}
                                        onChange={(e) => {
                                            const val = e.target.value.toUpperCase();
                                            setFormData({ ...formData, pan: val });
                                            if (errors.pan) setErrors({ ...errors, pan: null });
                                        }}
                                        error={errors.pan}
                                        icon={CreditCard}
                                    />
                                    <div className="mt-2 flex items-start gap-2 rounded bg-blue-50 p-2 text-xs text-blue-700">
                                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                        <span>Valid PAN is mandatory for 80G tax exemption certificate generation.</span>
                                    </div>
                                </div>
                            )}

                            {/* Amount Section */}
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-slate-700">Donation Amount (INR)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-3.5 text-slate-400">₹</span>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        className={`w-full rounded-lg border px-4 pl-8 py-3 text-lg font-semibold outline-none transition-all ${errors.amount ? "border-red-300 bg-red-50" : "border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-50"}`}
                                    />
                                </div>
                                {errors.amount && <p className="text-xs text-red-600">{errors.amount}</p>}

                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                                    {predefinedAmounts.map((amt) => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, amount: amt.toString() })}
                                            className={`rounded border py-2 text-sm font-medium transition-all active:scale-95 ${formData.amount === amt.toString()
                                                ? "border-blue-600 bg-blue-600 text-white shadow-md"
                                                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50"
                                                }`}
                                        >
                                            ₹{amt.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Submit Action */}
                            <div className="pt-4">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleFormSubmit}
                                    className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Proceed to Pay"}
                                    {!loading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                                </button>

                                <div className="mt-6 flex justify-center gap-6 text-xs font-medium text-slate-400">
                                    <div className="flex items-center gap-1.5">
                                        <Lock className="h-3 w-3" /> SSL Secured
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Shield className="h-3 w-3" /> Trusted Payment
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Footer & Status */}
                        <div className="mt-12 border-t border-slate-100 pt-6 text-center">
                            <p className="text-xs text-slate-400">
                                By donating, you agree to our <a href="/terms" className="underline decoration-slate-300 underline-offset-2 hover:text-slate-600">Terms</a> and <a href="/privacy" className="underline decoration-slate-300 underline-offset-2 hover:text-slate-600">Privacy Policy</a>.
                            </p>

                            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-1">
                                <span className="relative flex h-2 w-2">
                                    <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${serverStatus === 'alive' ? 'bg-green-400' : 'bg-red-400'}`}></span>
                                    <span className={`relative inline-flex h-2 w-2 rounded-full ${serverStatus === 'alive' ? 'bg-green-500' : serverStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                </span>
                                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                                    System {serverStatus === 'checking' ? 'Connecting' : serverStatus === 'alive' ? `Online v${serverVersion}` : 'Offline'}
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