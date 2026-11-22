import { useEffect, useState } from "react";
import axios from "axios";
import { openRazorpayCheckout } from "../../utils/razorpayCheckout";
import ModeSwitch from "./ModeSwitch";
import MonthlyPledgeForm from "./MonthlyPledgeForm";
/* eslint-disable react/prop-types -- InputField is a local presentational helper. */
import {
    Heart,
    Lock,
    Info,
    CreditCard,
    Loader2,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    User,
    Mail,
    Phone,
    Repeat
} from "lucide-react";
import bgImage from "../../assets/images/image_3.jpeg";
import logo from "../../assets/logo_white.png";
import Header from "../header/Header";
import Loading from "../loading/Loading";
import ErrorCard from "../error/ErrorCard";
import { isMaintainanceMode } from "../../../config";
import Maintainance from "../maintainance/Maintainance";
import InputField from "./InputField";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const impactFacts = [
    { title: "Empowering Lives", desc: "500+ students have gained access to quality education through Satyalok." },
    { title: "Tax Benefits", desc: "Your generous donations are eligible for 80G tax exemptions." }
];

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
    const [show80GInfo, setShow80GInfo] = useState(false); // New state for Info toggle
    const [errorMessage, setErrorMessage] = useState("");
    const [serverStatus, setServerStatus] = useState("checking");
    const [serverVersion, setServerVersion] = useState("");
    const [loading, setLoading] = useState(false);
    // Which frequency the donor picked. The switch slides between the two.
    const [mode, setMode] = useState("once");
    // Which one-time rails are actually configured on this deployment.
    const [providers, setProviders] = useState({ phonepe: true, razorpay: false });
    const [provider, setProvider] = useState("phonepe");
    const [factIndex, setFactIndex] = useState(0);

    // Derived state for Impact Calculation
    const currentAmount = Number(formData.amount) || 0;
    const childrenSupported = Math.floor(currentAmount / 500);
    const deficitForOneChild = 500 - currentAmount;

    // Check Server Health & Rotate Facts
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

        const interval = setInterval(() => {
            setFactIndex((prev) => (prev + 1) % impactFacts.length);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const fieldsConfig = [
        { label: "Full Name", name: "name", type: "text", placeholder: "e.g. Rohan Kumar", icon: User, validation: (v) => !v.trim() && "Name is required" },
        { label: "Email Address", name: "email", type: "email", placeholder: "you@example.com", icon: Mail, validation: (v) => (!v ? "Email is required" : !/\S+@\S+\.\S+/.test(v) ? "Invalid email format" : null) },
        { label: "Mobile Number", name: "phone", type: "tel", placeholder: "XXXXXXXXXX", icon: Phone, validation: (v) => (!v ? "Required" : !/^\d{10}$/.test(v) ? "Must be 10 digits" : null) },
    ];

    const predefinedAmounts = [100, 500, 1000, 2100, 5100];

    const validate = () => {
        const newErrors = {};
        
        if (!formData.amount) newErrors.amount = "Amount is required";
        else if (isNaN(formData.amount) || Number(formData.amount) <= 0) newErrors.amount = "Enter valid amount";

        if (taxExemption && !formData.pan) newErrors.pan = "PAN is required for 80G";
        else if (taxExemption && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan)) newErrors.pan = "Invalid PAN format";

        fieldsConfig.forEach((field) => {
            const error = field.validation(formData[field.name]);
            if (error) newErrors[field.name] = error;
        });

        return newErrors;
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: null });
    };

    const payWithRazorpay = async () => {
        const res = await axios.post(`${BACKEND_URL}/payment/razorpay/order`, formData);
        const order = res.data?.data;

        if (!res.data?.success || !order?.orderId) {
            throw new Error(res.data?.message || "Failed to start the payment.");
        }

        await openRazorpayCheckout({
            options: {
                key: order.keyId,
                order_id: order.orderId,
                amount: order.amount,
                currency: order.currency,
                name: order.name,
                description: order.description,
                prefill: order.prefill,
                notes: order.notes,
                theme: order.theme,
            },
            onSuccess: async (response) => {
                setLoading(true);
                try {
                    const verified = await axios.post(
                        `${BACKEND_URL}/payment/razorpay/verify`,
                        response,
                    );

                    if (verified.data?.success) {
                        window.location.href = `/status/${verified.data.data.merchantTransactionId}`;
                        return;
                    }

                    setErrorMessage(
                        verified.data?.message || "We could not verify the payment.",
                    );
                } catch (error) {
                    setErrorMessage(
                        error.response?.data?.message ||
                            "We could not verify the payment. If money was debited, it will be reconciled automatically.",
                    );
                } finally {
                    setLoading(false);
                }
            },
            onDismiss: () => setLoading(false),
            onFailed: (response) => {
                setErrorMessage(
                    response?.error?.description ||
                        "The payment failed. Please try again.",
                );
                setLoading(false);
            },
        });

        // Checkout is open; the modal now owns the flow.
        setLoading(false);
    };

    const handleFormSubmit = async () => {
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        try {
            setLoading(true);

            if (provider === "razorpay") {
                await payWithRazorpay();
                return;
            }

            const res = await axios.post(`${BACKEND_URL}/order`, formData);
            if (res.data.success) {
                window.location.href = res.data.data.instrumentResponse.redirectInfo.url;
            } else {
                setErrorMessage(res.data.message || "Failed to initiate payment.");
                setLoading(false);
            }
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message ||
                    error.message ||
                    "Network error. Please try again.",
            );
            setLoading(false);
        }
    };

    // Which rails exist on this deployment? Failures fall back to PhonePe, the
    // behaviour this page has always had.
    useEffect(() => {
        if (!BACKEND_URL) return;

        axios
            .get(`${BACKEND_URL}/payment/providers`)
            .then((res) => {
                const next = {
                    phonepe: res.data?.oneTime?.phonepe !== false,
                    razorpay: Boolean(res.data?.oneTime?.razorpay),
                };
                setProviders(next);
                if (!next.phonepe && next.razorpay) setProvider("razorpay");
            })
            .catch(() => {
                setProviders({ phonepe: true, razorpay: false });
                setProvider("phonepe");
            });
    }, []);

    if (isMaintainanceMode) return <Maintainance />;
    if (loading) return <div className="flex h-screen items-center justify-center bg-[#efe9df]"><Loading /></div>;

    return (
        <div className="flex min-h-screen lg:h-screen w-full flex-col overflow-x-hidden bg-[#f7f4ee] font-sans selection:bg-[#e3d9ca] selection:text-[#1f1b16]">
            <Header />

            <main
                id="donation-main"
                className="relative flex flex-grow flex-col lg:h-[calc(100vh-80px)] lg:flex-row lg:overflow-hidden"
            >
                
                {/* LEFT SECTION */}
                <div className="relative order-1 h-72 lg:h-full lg:w-5/12 xl:w-1/2 overflow-hidden bg-[#1f1b16] flex-shrink-0">
                    <img src={bgImage} alt="Donate Background" className="absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-overlay transition-transform duration-[20s] hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1f1b16] via-[#1f1b16]/60 to-transparent lg:bg-gradient-to-r lg:from-[#1f1b16] lg:via-[#1f1b16]/80 lg:to-transparent" />

                    <div className="absolute inset-0 flex flex-col justify-between p-8 lg:p-12 xl:p-16 z-10">
                        <div>
                            <img src={logo} alt="Satyalok" className="mb-8 w-32 opacity-90 lg:w-40" />
                            <h1 className="mb-4 text-3xl font-medium leading-tight text-[#fdfbf7] lg:text-5xl">
                                Fund a school year.<br />Once, or every month.
                            </h1>
                            <p className="max-w-md text-[#d6cec2] lg:text-lg">
                                Your contribution directly funds education and healthcare initiatives for underprivileged communities.
                            </p>
                        </div>

                        {/* Dynamic Impact Matrix */}
                        <div className="hidden lg:block w-full max-w-md">
                            <div className="rounded-2xl border border-[#fdfbf7]/15 bg-[#1f1b16]/60 p-6 relative min-h-[140px] overflow-hidden">
                                {impactFacts.map((fact, idx) => (
                                    <div
                                        key={idx}
                                        className={`absolute inset-0 p-6 flex flex-col justify-center transition-colors duration-700 ease-in-out ${
                                            idx === factIndex
                                                ? "opacity-100 translate-y-0"
                                                : "opacity-0 translate-y-4 pointer-events-none"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <Sparkles className="text-[#8fc7a8] h-4 w-4" />
                                            <p className="text-[11px] font-medium text-[#8fc7a8]">{fact.title}</p>
                                        </div>
                                        <p className="text-white text-lg font-medium leading-relaxed">{fact.desc}</p>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="flex gap-2 mt-5 px-2">
                                {impactFacts.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`h-1 rounded-full transition-colors duration-500 ${idx === factIndex ? "w-8 bg-[#15803d]" : "w-2 bg-white/30"}`} 
                                    />
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* RIGHT SECTION */}
                <div className="order-2 flex w-full flex-col bg-[#f7f4ee] lg:h-full lg:w-7/12 xl:w-1/2 lg:overflow-y-auto">
                    <div className="mx-auto w-full max-w-2xl flex-grow px-6 py-10 lg:px-12 lg:py-16">

                        <div className="mb-8 border-b border-[rgba(31,27,22,0.09)] pb-6">
                            <h2 className="flex items-center gap-3 text-2xl font-semibold text-[#1f1b16]">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe9df] text-[#0f5fa5]">
                                    {mode === "monthly" ? (
                                        <Repeat className="h-5 w-5" strokeWidth={1.5} />
                                    ) : (
                                        <Heart className="h-5 w-5 fill-current" />
                                    )}
                                </span>
                                {mode === "monthly" ? "Give monthly" : "Make a donation"}
                            </h2>
                            <p className="mt-2 text-sm text-[#5e554a]">
                                {mode === "monthly"
                                    ? "One mandate, the same date each month. Cancel or skip any month."
                                    : "Choose your impact, claim tax benefits, and securely complete your contribution."}
                            </p>

                            <div className="mt-5">
                                <ModeSwitch value={mode} onChange={setMode} />
                            </div>
                        </div>

                        <form
                            className={mode === "once" ? "space-y-10" : "hidden"}
                        >
                            
                            {/* SECTION 1: Amount Section */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="pl-mono w-6 text-[11px] text-[#6b6257]">01</span>
                                        <h3 className="text-[15px] font-medium text-[#1f1b16]">Contribution Amount</h3>
                                    </div>
                                    <p className="text-sm text-[#5e554a] mb-4 ml-8">Select an amount or enter any custom amount.</p>
                                </div>
                                
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {predefinedAmounts.map((amt) => (
                                        <button
                                            key={amt}
                                            type="button"
                                            onClick={() => {
                                                setFormData({ ...formData, amount: amt.toString() });
                                                if (errors.amount) setErrors({ ...errors, amount: null });
                                            }}
                                            aria-pressed={formData.amount === amt.toString()}
                                            className={`rounded-[10px] py-3 text-sm font-medium transition-[background-color,border-color,transform] ${
                                                formData.amount === amt.toString()
                                                    ? "scale-[1.02] bg-[#1f1b16] text-[#fdfbf7] shadow-sm"
                                                    : "border border-[rgba(31,27,22,0.12)] bg-white text-[#1f1b16] hover:border-[rgba(31,27,22,0.2)] hover:bg-[#faf7f1]"
                                            }`}
                                        >
                                            ₹{amt.toLocaleString()}
                                        </button>
                                    ))}
                                </div>

                                <div className="relative flex items-center mt-2">
                                    <span className="absolute left-4 text-[#6b6257] font-medium text-lg">₹</span>
                                    <input
                                        type="number"
                                        name="amount"
                                        aria-label="Donation amount in rupees"
                                        required
                                        value={formData.amount}
                                        onChange={handleChange}
                                        placeholder="Enter custom amount"
                                        className={`w-full rounded-xl bg-white px-4 pl-9 py-4 text-lg font-semibold text-[#1f1b16] outline-none ring-1 transition-colors focus:ring-2 shadow-sm ${
                                            errors.amount 
                                                ? "ring-red-300 focus:ring-red-500 bg-red-50" 
                                                : "ring-[rgba(31,27,22,0.14)] focus:ring-[#0f5fa5] hover:ring-[rgba(31,27,22,0.22)]"
                                        }`}
                                    />
                                </div>
                                {errors.amount && <p className="text-xs font-medium text-[#b4463c]">{errors.amount}</p>}

                                {/* Dynamic Impact Card */}
                                <div className="mt-4 rounded-xl border border-[rgba(31,27,22,0.09)] bg-[#efe9df] p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-white p-1.5 rounded-lg shadow-sm text-[#0f5fa5] shrink-0 mt-0.5">
                                            <Sparkles size={16} />
                                        </div>
                                        <div>
                                            <h4 className="mb-1 text-xs font-semibold text-[#1f1b16]">Your impact</h4>
                                            {currentAmount >= 500 ? (
                                                <p className="text-sm font-medium text-[#5e554a] leading-snug">
                                                    You are supporting <span className="font-semibold text-[#0f5fa5] bg-[#e3d9ca] px-1.5 py-0.5 rounded">{childrenSupported} child{childrenSupported > 1 ? 'ren' : ''}</span> with essential education materials.
                                                </p>
                                            ) : currentAmount > 0 ? (
                                                <p className="text-sm font-medium text-[#5e554a] leading-snug">
                                                    You&apos;re providing crucial supplies. Add{' '}
                                                    <button 
                                                        type="button" 
                                                        onClick={() => {
                                                            setFormData({ ...formData, amount: '500' });
                                                            if (errors.amount) setErrors({ ...errors, amount: null });
                                                        }}
                                                        className="font-semibold text-[#0f5fa5] underline decoration-[#0f5fa5]/40 underline-offset-2 hover:text-[#1f1b16]"
                                                    >
                                                        ₹{deficitForOneChild} more
                                                    </button>{' '}
                                                    to fully sponsor 1 student!
                                                </p>
                                            ) : (
                                                <p className="text-sm font-medium text-[#0f5fa5]">Enter an amount above to see your impact.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px w-full bg-[#efe9df]"></div>

                            {/* SECTION 2: Tax Exemption */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="pl-mono w-6 text-[11px] text-[#6b6257]">02</span>
                                    <h3 className="text-[15px] font-medium text-[#1f1b16]">Tax Benefits</h3>
                                </div>
                                
                                <div className="bg-[#efe9df] border border-[rgba(31,27,22,0.12)] rounded-2xl p-5 transition-colors hover:border-[rgba(31,27,22,0.2)]">
                                    <div className="flex items-center justify-between cursor-pointer" onClick={() => setTaxExemption(!taxExemption)}>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-semibold text-[#1f1b16]">Claim 80G Tax Exemption?</p>
                                                {/* Info Button - Stops propagation so it doesn't trigger the toggle */}
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShow80GInfo(!show80GInfo);
                                                    }}
                                                    className={`p-1 rounded-full transition-colors ${show80GInfo ? 'text-[#0f5fa5] bg-[#efe9df]' : 'text-[#6b6257] hover:text-[#0f5fa5] hover:bg-[#efe9df]'}`}
                                                    title="What is 80G?"
                                                >
                                                    <Info size={16} />
                                                </button>
                                            </div>
                                            <p className="text-xs text-[#5e554a] mt-0.5">Generate a certificate to save on income tax.</p>
                                        </div>
                                        <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center shrink-0 ${taxExemption ? 'bg-[#1f1b16]' : 'bg-[#c9bfae]'}`}>
                                            <div className={`w-4 h-4 rounded-full bg-white absolute transition-transform duration-300 shadow-sm ${taxExemption ? 'translate-x-7' : 'translate-x-1'}`} />
                                        </div>
                                    </div>

                                    {/* Collapsible Info Box */}
                                    <div className={`transition-colors duration-300 ease-in-out overflow-hidden ${show80GInfo ? 'max-h-32 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                        <div className="bg-[#fdfbf7] border border-[rgba(31,27,22,0.09)] p-3 rounded-xl text-xs text-[#5e554a] leading-relaxed shadow-sm">
                                            <strong>Section 80G</strong> allows you to claim tax deductions on donations made to approved charitable organizations like Satyalok. A tax receipt will be generated automatically after successful payment.
                                        </div>
                                    </div>

                                    {/* PAN Input */}
                                    <div className={`transition-colors duration-300 ease-in-out overflow-hidden px-1 ${taxExemption ? 'max-h-40 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
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
                                        <div className="mt-2 flex items-start gap-2 rounded bg-[#fdfbf7] p-2 text-xs text-[#0f5fa5]">
                                            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                            <span>Valid PAN is mandatory for 80G tax exemption certificate generation.</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-px w-full bg-[#efe9df]"></div>

                            {/* SECTION 3: Personal Details */}
                            <div className="space-y-5">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="pl-mono w-6 text-[11px] text-[#6b6257]">03</span>
                                    <h3 className="text-[15px] font-medium text-[#1f1b16]">Your Details</h3>
                                </div>
                                <InputField {...fieldsConfig[0]} value={formData.name} onChange={handleChange} error={errors.name} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <InputField {...fieldsConfig[1]} value={formData.email} onChange={handleChange} error={errors.email} />
                                    <InputField {...fieldsConfig[2]} value={formData.phone} onChange={handleChange} error={errors.phone} />
                                </div>
                            </div>

                            {(providers.razorpay || !providers.phonepe) && (
                                <>
                                    <div className="h-px w-full bg-[#efe9df]"></div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="pl-mono w-6 text-[11px] text-[#6b6257]">04</span>
                                            <h3 className="text-[15px] font-medium text-[#1f1b16]">Payment Method</h3>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {providers.phonepe && (
                                                <button
                                                    type="button"
                                                    onClick={() => setProvider("phonepe")}
                                                    className={`rounded-xl border p-4 text-left transition-colors ${
                                                        provider === "phonepe"
                                                            ? "border-[#1f1b16] bg-[#efe9df] ring-2 ring-[#1f1b16]/10"
                                                            : "border-[rgba(31,27,22,0.12)] bg-white hover:border-[rgba(31,27,22,0.2)]"
                                                    }`}
                                                >
                                                    <span className="block text-sm font-semibold text-[#1f1b16]">PhonePe</span>
                                                    <span className="mt-0.5 block text-xs text-[#5e554a]">UPI, cards and wallets</span>
                                                </button>
                                            )}
                                            {providers.razorpay && (
                                                <button
                                                    type="button"
                                                    onClick={() => setProvider("razorpay")}
                                                    className={`rounded-xl border p-4 text-left transition-colors ${
                                                        provider === "razorpay"
                                                            ? "border-[#1f1b16] bg-[#efe9df] ring-2 ring-[#1f1b16]/10"
                                                            : "border-[rgba(31,27,22,0.12)] bg-white hover:border-[rgba(31,27,22,0.2)]"
                                                    }`}
                                                >
                                                    <span className="block text-sm font-semibold text-[#1f1b16]">Razorpay</span>
                                                    <span className="mt-0.5 block text-xs text-[#5e554a]">UPI, cards, netbanking</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Submit Action */}
                            <div className="pt-6">
                                <button
                                    type="button"
                                    disabled={loading}
                                    onClick={handleFormSubmit}
                                    className="pl-btn-primary"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : `Proceed to Pay ₹${currentAmount ? currentAmount.toLocaleString() : '0'}`}
                                    {!loading && <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />}
                                </button>

                                <div className="mt-6 flex justify-center gap-6 text-[11px] text-[#6b6257]">
                                    <div className="flex items-center gap-1.5"><Lock size={12} /> SSL secured</div>
                                    <div className="w-1 h-1 rounded-full bg-[#c9bfae]"></div>
                                    <div className="flex items-center gap-1.5"><CheckCircle2 size={12} /> {provider === "razorpay" ? "Razorpay" : "PhonePe"}</div>
                                </div>
                            </div>
                        </form>

                        {mode === "monthly" && (
                            <MonthlyPledgeForm onSwitchBack={() => setMode("once")} />
                        )}

                        {/* Footer & Status */}
                        <footer className="mt-12 border-t border-[rgba(31,27,22,0.09)] pt-6 text-center">
                            <p className="text-xs text-[#6b6257]">
                                By donating, you agree to our <a href="/terms" className="underline decoration-[rgba(31,27,22,0.2)] underline-offset-2 hover:text-[#5e554a]">Terms</a> and <a href="/privacy" className="underline decoration-[rgba(31,27,22,0.2)] underline-offset-2 hover:text-[#5e554a]">Privacy Policy</a>.
                            </p>

                            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[rgba(31,27,22,0.09)] bg-[#efe9df] px-3 py-1.5 shadow-sm">
                                <span
                                    className={`relative inline-flex h-2 w-2 rounded-full ring-2 ${
                                        serverStatus === "alive"
                                            ? "bg-[#15803d] ring-[#15803d]/20"
                                            : serverStatus === "checking"
                                              ? "bg-[#b98314] ring-[#b98314]/20"
                                              : "bg-[#b4463c] ring-[#b4463c]/20"
                                    }`}
                                ></span>
                                <span className="text-[11px] font-medium text-[#5e554a]">
                                    System {serverStatus === 'checking' ? 'Connecting' : serverStatus === 'alive' ? `Online${serverVersion ? ` · v${serverVersion}` : ""}` : 'Offline'}
                                </span>
                            </div>
                        </footer>
                    </div>
                </div>
            </main>

            {errorMessage && <ErrorCard message={errorMessage} setMessage={setErrorMessage} />}
        </div>
    );
}

export default Payment;