import { useEffect, useState } from "react";
import axios from "axios";
import PropTypes from "prop-types";
import Field from "./Field"; // Assuming Field matches the prop structure
import bgImage from "../../assets/images/image_3.png";
import logo from "../../assets/logo_white.png";
import Header from "../header/Header";
import Loading from "../loading/Loading";
import ErrorCard from "../error/ErrorCard";
import { isMaintainanceMode } from "../../../config";
import Maintainance from "../maintainance/Maintainance";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

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

    useEffect(() => {
        const wakeUpBackend = async () => {
            try {
                const res = await axios.get(`${BACKEND_URL}/`);
                if (res?.data?.alive) {
                    setServerStatus("alive");
                    setServerVersion(res?.data?.commitVersion?.slice(-3));
                }
            } catch (error) {
                console.error("Failed to wake up backend server:", error);
                setServerStatus("error");
            }
        };

        wakeUpBackend();
    }, []);

    const fieldsConfig = [
        {
            label: "Full Name",
            name: "name",
            type: "text",
            placeholder: "Your Name",
            validation: (value) => !value.trim() && "Name is required",
        },
        {
            label: "Email Address",
            name: "email",
            type: "email",
            placeholder: "you@example.com",
            validation: (value) => {
                if (!value) return "Email is required";
                if (!/\S+@\S+\.\S+/.test(value)) return "Email is invalid";
                return null;
            },
        },
        {
            label: "Mobile Number",
            name: "phone",
            type: "tel",
            placeholder: "XXXXXXXXXX",
            validation: (value) => {
                if (!value) return "Mobile number is required";
                if (!/^\d{10}$/.test(value))
                    return "Mobile number must be 10 digits";
                return null;
            },
        },
        {
            label: "Donation Amount (INR)",
            name: "amount",
            type: "number",
            placeholder: "Amount",
            validation: (value) => {
                if (!value) return "Amount is required";
                if (isNaN(value) || value <= 0)
                    return "Amount must be a positive number";
                return null;
            },
        },
        {
            label: "PAN Number",
            name: "pan",
            type: "text",
            placeholder: "ABCDE1234F",
            validation: (value) =>
                taxExemption &&
                !value &&
                "PAN Number is required for tax exemption",
        },
    ];

    const predefinedAmounts = [100, 500, 1000, 5000, 10000];

    const validate = () => {
        const newErrors = {};
        fieldsConfig.forEach((field) => {
            const error = field.validation(formData[field.name]);
            if (error) {
                newErrors[field.name] = error;
            }
        });
        return newErrors;
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
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
                window.location.href =
                    res.data.data.instrumentResponse.redirectInfo.url;
            } else {
                setErrorMessage(
                    res.data.message || "Failed to process payment."
                );
                setLoading(false);
            }
        } catch (error) {
            console.error("Error occurred:", error);
            setErrorMessage("An error occurred while processing the payment.");
            setLoading(false);
        }
    };

    if (isMaintainanceMode) {
        return <Maintainance />;
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <Loading />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-white font-sans">
            <Header />

            {/* Main Content Wrapper */}
            <div className="flex-grow flex flex-col lg:flex-row">

                {/* Left Section: Hero/Image */}
                <div className="lg:w-5/12 xl:w-1/2 relative bg-slate-900 h-64 lg:h-auto lg:min-h-screen order-1 lg:order-1 overflow-hidden">
                    {/* Background Image */}
                    <img
                        src={bgImage}
                        alt="Donate to Satyalok"
                        className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />

                    {/* Gradient Overlay for Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent lg:bg-gradient-to-r lg:from-black/80 lg:via-black/40 lg:to-transparent"></div>

                    {/* Content */}
                    <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-12 text-white z-10">
                        <img
                            src={logo}
                            alt="Satyalok"
                            className="w-32 lg:w-48 mb-6 opacity-90"
                        />
                        <h1 className="text-2xl lg:text-4xl font-extrabold leading-tight mb-3">
                            Nurturing the Future Together 🌟
                        </h1>
                        <p className="text-sm lg:text-lg text-slate-200 font-medium mb-6 max-w-md">
                            Your contribution brings education, health, and hope to those who need it most.
                        </p>

                        <div className="hidden lg:block space-y-4 text-xs text-slate-400 border-t border-white/20 pt-6">
                            <p className="font-mono uppercase tracking-wider text-slate-500 mb-2">Impact Areas</p>
                            <div className="flex flex-wrap gap-2">
                                <span className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">Education</span>
                                <span className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">Health</span>
                                <span className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-sm">Environment</span>
                            </div>
                            <p className="italic mt-4 opacity-60">
                                Note: Background image is AI generated for representation.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Section: Form */}
                <div className="lg:w-7/12 xl:w-1/2 w-full order-2 lg:order-2 flex flex-col bg-white">
                    <div className="flex-grow p-6 md:p-12 lg:px-20 max-w-3xl mx-auto w-full">

                        {/* Form Header */}
                        <div className="mb-8">
                            <h2 className="text-2xl lg:text-3xl font-bold text-slate-800 flex items-center gap-3 mb-2">
                                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 text-lg">
                                    <i className="fas fa-hand-holding-heart"></i>
                                </span>
                                Make a Donation
                            </h2>
                            <p className="text-slate-500 text-sm lg:text-base pl-[3.25rem]">
                                Complete the form below to support our cause.
                            </p>
                        </div>

                        <form noValidate className="space-y-6">

                            {/* Tax Exemption Toggle (Segmented Control) */}
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Do you need 80G Tax Exemption?
                                    </label>
                                    <div className="bg-slate-200 p-1 rounded-lg inline-flex shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setTaxExemption(true)}
                                            className={`px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${taxExemption
                                                    ? "bg-white text-blue-700 shadow-sm"
                                                    : "text-slate-600 hover:text-slate-800"
                                                }`}
                                        >
                                            Yes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTaxExemption(false)}
                                            className={`px-6 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${!taxExemption
                                                    ? "bg-white text-slate-900 shadow-sm"
                                                    : "text-slate-600 hover:text-slate-800"
                                                }`}
                                        >
                                            No
                                        </button>
                                    </div>
                                </div>
                                {taxExemption && (
                                    <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded flex items-center gap-2">
                                        <i className="fas fa-info-circle"></i>
                                        PAN number is mandatory for 80G exemption.
                                    </p>
                                )}
                            </div>

                            {/* Fields Mapping */}
                            <div className="space-y-5">
                                {fieldsConfig.map((field) => {
                                    // Skip PAN if not needed
                                    if (field.name === "pan" && !taxExemption) return null;

                                    if (field.name === "amount") {
                                        return (
                                            <div key={field.name} className="space-y-3">
                                                <Field
                                                    field={field}
                                                    value={formData[field.name]}
                                                    onChange={handleChange}
                                                    error={errors[field.name]}
                                                />

                                                {/* Predefined Amount Grid */}
                                                <div>
                                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 block">
                                                        Quick Select Amount
                                                    </label>
                                                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                                                        {predefinedAmounts.map((amt) => {
                                                            const isSelected = formData.amount === amt.toString();
                                                            return (
                                                                <button
                                                                    key={amt}
                                                                    type="button"
                                                                    onClick={() => setFormData({ ...formData, amount: amt.toString() })}
                                                                    className={`py-2 px-1 text-sm font-medium rounded border transition-all duration-200 ${isSelected
                                                                            ? "bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200 ring-offset-1"
                                                                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50"
                                                                        }`}
                                                                >
                                                                    ₹{amt.toLocaleString()}
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <Field
                                            key={field.name}
                                            field={field}
                                            value={formData[field.name]}
                                            onChange={handleChange}
                                            error={errors[field.name]}
                                        />
                                    );
                                })}
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4">
                                <button
                                    type="button"
                                    onClick={handleFormSubmit}
                                    className="w-full bg-blue-600 text-white text-lg font-semibold py-3.5 rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
                                >
                                    <span>Proceed to Pay</span>
                                    <i className="fas fa-arrow-right text-sm"></i>
                                </button>

                                <div className="mt-4 flex items-center justify-center text-slate-400 text-xs gap-4">
                                    <span className="flex items-center gap-1"><i className="fas fa-lock"></i> SSL Secured</span>
                                    <span className="flex items-center gap-1"><i className="fas fa-shield-alt"></i> 100% Safe</span>
                                </div>
                            </div>
                        </form>

                        {/* Footer Links */}
                        <div className="mt-10 pt-6 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-400 mb-3">
                                By continuing, you agree to Satyalok's <a href="/terms-condition" className="underline hover:text-slate-600">Terms</a> & <a href="/privacy-policy" className="underline hover:text-slate-600">Privacy Policy</a>
                            </p>

                            {/* Server Status Indicator */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-100">
                                <div className="relative flex h-2 w-2">
                                    {serverStatus === "alive" && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${serverStatus === "alive" ? "bg-green-500" :
                                            serverStatus === "error" ? "bg-red-500" : "bg-yellow-500"
                                        }`}></span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">
                                    System: {serverStatus === "checking" ? "Connecting..." : serverStatus === "alive" ? `Online (${serverVersion || "v1.0"})` : "Offline"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {errorMessage && (
                <ErrorCard
                    message={errorMessage}
                    setMessage={setErrorMessage}
                />
            )}
        </div>
    );
}

Payment.propTypes = {
    // Define prop types if Payment receives any props, though here it seems self-contained
};

export default Payment;