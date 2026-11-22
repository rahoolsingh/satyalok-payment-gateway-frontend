import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    CreditCard,
    Info,
    Loader2,
    Lock,
    Mail,
    Phone,
    Sparkles,
    User,
} from "lucide-react";
import InputField from "./InputField";
import ErrorCard from "../error/ErrorCard";
import {
    createPledge,
    extractApiError,
    fetchPlans,
    newIdempotencyKey,
} from "../pledge/pledgeApi";
import { openRazorpayCheckout } from "../../utils/razorpayCheckout";

/**
 * Monthly giving form for the donation page switch.
 *
 * Deliberately built from the same parts as the one-time form — same input
 * component, same numbered section headers, same amount buttons, same impact
 * card, same submit button — so switching modes changes the fields, not the
 * design language.
 */

const DEFAULT_PLANS = [
    {
        id: "monthly_500",
        amount: 500,
        frequency: "MONTHLY",
        label: "₹500 / month",
        title: "Sponsor a child's education",
        description: "Covers books, stationery and study material for one child.",
        impact: "1 child supported every month",
        highlighted: true,
    },
    {
        id: "monthly_1000",
        amount: 1000,
        frequency: "MONTHLY",
        label: "₹1,000 / month",
        title: "Fund a study centre day",
        description: "Helps run a community study centre for a full month.",
        impact: "2 children supported every month",
    },
    {
        id: "monthly_2500",
        amount: 2500,
        frequency: "MONTHLY",
        label: "₹2,500 / month",
        title: "Sustain a mentor",
        description: "Keeps a mentor with the same children all year.",
        impact: "5 children supported every month",
    },
];

const DEFAULT_RULES = {
    minAmount: 100,
    maxAmount: 10000,
    termsUrl: "/terms",
    privacyUrl: "/privacy",
    grievanceEmail: "support@satyalok.in",
    consentVersion: "2026-11-v1",
};

const DEFAULT_CAPABILITY = {
    available: true,
    provider: "razorpay",
    requiresVpa: false,
    previewPlans: DEFAULT_PLANS,
};

const currency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);

const SectionTitle = ({ step, title }) => (
    <div className="mb-1 flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
            {step}
        </span>
        <h3 className="text-base font-bold text-slate-900">{title}</h3>
    </div>
);

const ComingSoon = ({ plans, onSwitchBack }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-wide text-slate-400">
            Monthly giving
        </p>
        <h3 className="mt-2 text-xl font-bold text-slate-900">
            Monthly giving is coming soon
        </h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">
            We are finishing the bank approvals for automatic monthly debits. A
            one-time donation reaches the same children today.
        </p>

        {plans.length > 0 && (
            <ul className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
                {plans.map((plan) => (
                    <li
                        key={plan.id}
                        className="flex items-baseline justify-between py-3"
                    >
                        <span className="text-sm font-semibold tabular-nums text-slate-800">
                            {currency(plan.amount)} a month
                        </span>
                        <span className="text-xs text-slate-400">
                            coming soon
                        </span>
                    </li>
                ))}
            </ul>
        )}

        <button
            type="button"
            onClick={onSwitchBack}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
            Give once instead
            <ArrowRight className="h-4 w-4" />
        </button>
    </div>
);

export default function MonthlyPledgeForm({ onSwitchBack }) {
    const [plans, setPlans] = useState(DEFAULT_PLANS);
    const [rules, setRules] = useState(DEFAULT_RULES);
    const [capability, setCapability] = useState(DEFAULT_CAPABILITY);
    const [planId, setPlanId] = useState("monthly_500");
    const [customAmount, setCustomAmount] = useState("500");
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        vpa: "",
        pan: "",
    });
    const [want80G, setWant80G] = useState(false);
    const [show80GInfo, setShow80GInfo] = useState(false);
    const [consent, setConsent] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const idempotencyKey = useRef(newIdempotencyKey());

    useEffect(() => {
        let alive = true;

        fetchPlans()
            .then((data) => {
                if (!alive) return;

                const apiPlans =
                    Array.isArray(data.plans) && data.plans.length
                        ? data.plans
                        : DEFAULT_PLANS;

                setCapability({
                    available: data.available !== false,
                    provider: data.provider || "razorpay",
                    requiresVpa: data.requiresVpa !== false,
                    previewPlans:
                        data.previewPlans && data.previewPlans.length
                            ? data.previewPlans
                            : DEFAULT_PLANS,
                });
                setPlans(apiPlans);
                setRules({ ...DEFAULT_RULES, ...(data.rules || {}) });

                // Keep the donor's choice if the API still offers it.
                setPlanId((current) =>
                    apiPlans.some((plan) => plan.id === current)
                        ? current
                        : apiPlans[0].id,
                );
            })
            .catch(() => {
                // Static defaults are already on screen; a slow API must never
                // blank the form.
            });

        return () => {
            alive = false;
        };
    }, []);

    const selectedPlan = plans.find((plan) => plan.id === planId) || null;
    const amount =
        planId === "custom"
            ? Number(customAmount) || 0
            : selectedPlan?.amount || 0;
    const providerName =
        capability?.provider === "phonepe_autopay" ? "PhonePe" : "Razorpay";

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: null }));
    };

    const validate = () => {
        const next = {};

        if (form.name.trim().length < 2) next.name = "Name is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
            next.email = "Enter a valid email address";
        }
        if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, "").slice(-10))) {
            next.phone = "Must be 10 digits";
        }
        if (
            capability?.requiresVpa !== false &&
            !/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(form.vpa.trim())
        ) {
            next.vpa = "Enter your UPI ID, like yourname@okhdfcbank";
        }
        if (
            want80G &&
            !/^[A-Z]{5}\d{4}[A-Z]$/.test(form.pan.trim().toUpperCase())
        ) {
            next.pan = "Invalid PAN format";
        }

        const min = rules?.minAmount || 100;
        const max = rules?.maxAmount || 10000;

        if (!Number.isInteger(amount) || amount < min) {
            next.amount = `Minimum is ${currency(min)} a month`;
        } else if (amount > max) {
            next.amount = `Maximum is ${currency(max)} a month`;
        }

        if (!consent) next.consent = "Please accept the authorisation";

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validate()) return;

        setLoading(true);
        setErrorMessage("");

        try {
            const response = await createPledge({
                idempotencyKey: idempotencyKey.current,
                payload: {
                    planId,
                    amount: planId === "custom" ? amount : undefined,
                    frequency: "MONTHLY",
                    name: form.name.trim(),
                    email: form.email.trim(),
                    phone: form.phone.replace(/\D/g, "").slice(-10),
                    vpa: form.vpa.trim(),
                    pan: want80G ? form.pan.trim().toUpperCase() : undefined,
                    consent: true,
                    channel: "web",
                },
            });

            const authorization = response.data.authorization;
            const pledge = response.data.pledge;

            if (
                authorization.mode === "RAZORPAY_CHECKOUT" &&
                authorization.razorpay
            ) {
                const rzp = authorization.razorpay;

                setLoading(false);

                await openRazorpayCheckout({
                    options: {
                        key: rzp.keyId,
                        subscription_id: rzp.subscriptionId,
                        name: rzp.name,
                        description: rzp.description,
                        prefill: rzp.prefill,
                        notes: rzp.notes,
                        theme: rzp.theme,
                    },
                    onSuccess: () => {
                        window.location.href =
                            "/pledge/status?ref=" +
                            encodeURIComponent(pledge.pledgeRef);
                    },
                    onDismiss: () => setLoading(false),
                    onFailed: (response) => {
                        setErrorMessage(
                            response?.error?.description ||
                                "The mandate could not be authorised. Please try again.",
                        );
                        setLoading(false);
                    },
                });

                return;
            }

            if (authorization.redirectUrl) {
                window.location.href = authorization.redirectUrl;
                return;
            }

            window.location.href =
                "/pledge/status?ref=" + encodeURIComponent(pledge.pledgeRef);
        } catch (err) {
            setErrorMessage(extractApiError(err));
        } finally {
            setLoading(false);
        }
    };

    if (capability.available === false) {
        return (
            <ComingSoon
                plans={capability.previewPlans}
                onSwitchBack={onSwitchBack}
            />
        );
    }

    return (
        <>
            <form onSubmit={handleSubmit} className="space-y-10" noValidate>
                {/* SECTION 1: Monthly amount */}
                <div className="space-y-4">
                    <div>
                        <SectionTitle step={1} title="Monthly amount" />
                        <p className="mb-4 ml-8 text-sm text-slate-500">
                            The same amount is debited on the same date each
                            month. You can change or cancel any time.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {plans.map((plan) => {
                            const selected = plan.id === planId;

                            return (
                                <button
                                    key={plan.id}
                                    type="button"
                                    aria-pressed={selected}
                                    onClick={() => {
                                        setPlanId(plan.id);
                                        setCustomAmount(String(plan.amount));
                                        setErrors((prev) => ({
                                            ...prev,
                                            amount: null,
                                        }));
                                    }}
                                    className={`flex items-baseline justify-center gap-1 rounded-xl py-3 text-sm font-bold transition-all ${
                                        selected
                                            ? "scale-[1.02] bg-slate-900 text-white shadow-md"
                                            : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                                    }`}
                                >
                                    {currency(plan.amount)}
                                    <span
                                        className={`text-[10px] font-medium ${
                                            selected
                                                ? "text-slate-300"
                                                : "text-slate-400"
                                        }`}
                                    >
                                        /mo
                                    </span>
                                </button>
                            );
                        })}

                        <button
                            type="button"
                            aria-pressed={planId === "custom"}
                            onClick={() => {
                                setPlanId("custom");
                                setErrors((prev) => ({
                                    ...prev,
                                    amount: null,
                                }));
                            }}
                            className={`rounded-xl py-3 text-sm font-bold transition-all ${
                                planId === "custom"
                                    ? "scale-[1.02] bg-slate-900 text-white shadow-md"
                                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-slate-100"
                            }`}
                        >
                            Custom
                        </button>
                    </div>

                    {planId === "custom" && (
                        <div className="relative flex items-center">
                            <span className="absolute left-4 text-lg font-medium text-slate-400">
                                ₹
                            </span>
                            <input
                                type="number"
                                inputMode="numeric"
                                min={rules ? rules.minAmount : 100}
                                max={rules ? rules.maxAmount : 10000}
                                step={1}
                                value={customAmount}
                                aria-label="Custom monthly amount in rupees"
                                onChange={(event) => {
                                    setCustomAmount(event.target.value);
                                    setErrors((prev) => ({
                                        ...prev,
                                        amount: null,
                                    }));
                                }}
                                className={`w-full rounded-xl bg-white px-4 py-4 pl-9 text-lg font-bold text-slate-900 outline-none ring-1 transition-all focus:ring-2 ${
                                    errors.amount
                                        ? "bg-red-50 ring-red-300 focus:ring-red-500"
                                        : "ring-slate-200 hover:ring-slate-300 focus:ring-blue-600"
                                }`}
                            />
                        </div>
                    )}

                    {planId === "custom" && (
                        <p className="text-xs text-slate-400">
                            {`Between ${currency(
                                rules ? rules.minAmount : 100,
                            )} and ${currency(
                                rules ? rules.maxAmount : 10000,
                            )} a month`}
                        </p>
                    )}

                    {errors.amount && (
                        <p className="text-xs font-medium text-red-600">
                            {errors.amount}
                        </p>
                    )}

                    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 shrink-0 rounded-lg bg-white p-1.5 text-emerald-600 shadow-sm">
                                <Sparkles size={16} />
                            </div>
                            <div>
                                <h4 className="mb-1 text-xs font-semibold text-emerald-800">
                                    Your impact
                                </h4>
                                <p className="text-sm font-medium leading-snug text-emerald-900">
                                    {selectedPlan?.impact ||
                                        "Enter an amount to see the impact."}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-px w-full bg-slate-100"></div>

                {/* SECTION 2: Tax benefits */}
                <div className="space-y-4">
                    <SectionTitle step={2} title="Tax benefits" />

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-colors hover:border-slate-300">
                        <div
                            className="flex cursor-pointer items-center justify-between"
                            onClick={() => setWant80G(!want80G)}
                        >
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <p className="text-sm font-bold text-slate-900">
                                        Claim 80G tax exemption?
                                    </p>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShow80GInfo(!show80GInfo);
                                        }}
                                        className={`rounded-full p-1 transition-colors ${
                                            show80GInfo
                                                ? "bg-blue-100 text-blue-600"
                                                : "text-slate-400 hover:bg-blue-50 hover:text-blue-600"
                                        }`}
                                        title="What is 80G?"
                                    >
                                        <Info size={16} />
                                    </button>
                                </div>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    A certificate is attached to every monthly
                                    receipt.
                                </p>
                            </div>
                            <div
                                className={`relative flex h-6 w-12 shrink-0 items-center rounded-full transition-colors ${
                                    want80G ? "bg-blue-600" : "bg-slate-300"
                                }`}
                            >
                                <div
                                    className={`absolute h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                                        want80G
                                            ? "translate-x-7"
                                            : "translate-x-1"
                                    }`}
                                />
                            </div>
                        </div>

                        {show80GInfo && (
                            <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/80 p-3 text-xs leading-relaxed text-blue-800">
                                <strong>Section 80G</strong> allows you to claim
                                tax deductions on donations made to approved
                                charitable organizations like Satyalok. A tax
                                receipt is generated automatically after each
                                successful debit.
                            </div>
                        )}

                        {want80G && (
                            <div className="mt-4 px-1">
                                <InputField
                                    label="PAN number"
                                    name="pan"
                                    type="text"
                                    placeholder="ABCDE1234F"
                                    value={form.pan}
                                    onChange={(e) => {
                                        setForm((prev) => ({
                                            ...prev,
                                            pan: e.target.value.toUpperCase(),
                                        }));
                                        setErrors((prev) => ({
                                            ...prev,
                                            pan: null,
                                        }));
                                    }}
                                    error={errors.pan}
                                    icon={CreditCard}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="h-px w-full bg-slate-100"></div>

                {/* SECTION 3: Your details */}
                <div className="space-y-5">
                    <SectionTitle step={3} title="Your details" />

                    <InputField
                        label="Full name"
                        name="name"
                        type="text"
                        placeholder="e.g. Rohan Kumar"
                        value={form.name}
                        onChange={handleChange}
                        error={errors.name}
                        icon={User}
                    />

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <InputField
                            label="Email address"
                            name="email"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={handleChange}
                            error={errors.email}
                            icon={Mail}
                        />
                        <InputField
                            label="Mobile number"
                            name="phone"
                            type="tel"
                            placeholder="XXXXXXXXXX"
                            value={form.phone}
                            onChange={handleChange}
                            error={errors.phone}
                            icon={Phone}
                        />
                    </div>

                    {capability?.requiresVpa !== false && (
                        <InputField
                            label="UPI ID to debit"
                            name="vpa"
                            type="text"
                            placeholder="yourname@okhdfcbank"
                        value={form.vpa}
                        onChange={handleChange}
                        error={errors.vpa}
                        icon={CreditCard}
                        hint="Used only to send the mandate request to your bank"
                        />
                    )}
                </div>

                {/* Authorisation */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Authorisation
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        I authorise Satyalok to debit{" "}
                        <span className="font-bold tabular-nums text-slate-900">
                            {currency(amount)}
                        </span>{" "}
                        every month, starting with the first debit when I approve
                        this mandate, until I cancel. I will be told at least 24
                        hours before each debit. One debit a month, for the same
                        amount, for 5 years or until cancelled.
                    </p>

                    <label className="mt-4 flex cursor-pointer items-start gap-3">
                        <input
                            type="checkbox"
                            checked={consent}
                            onChange={(event) => {
                                setConsent(event.target.checked);
                                setErrors((prev) => ({
                                    ...prev,
                                    consent: null,
                                }));
                            }}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded-[4px] border-slate-300 accent-blue-600"
                        />
                        <span className="text-xs leading-5 text-slate-600">
                            I agree to the{" "}
                            <Link
                                to="/terms"
                                className="font-medium text-blue-600 underline decoration-slate-300 underline-offset-2 hover:text-blue-700"
                            >
                                terms
                            </Link>{" "}
                            and{" "}
                            <Link
                                to="/privacy"
                                className="font-medium text-blue-600 underline decoration-slate-300 underline-offset-2 hover:text-blue-700"
                            >
                                privacy policy
                            </Link>
                            , and to the recurring debit above.
                        </span>
                    </label>

                    {errors.consent && (
                        <p className="mt-2 flex items-center text-xs font-medium text-red-600">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            {errors.consent}
                        </p>
                    )}
                </div>

                {/* Submit */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Opening secure checkout
                            </>
                        ) : (
                            <>
                                {`Set up ${currency(amount)} / month`}
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </>
                        )}
                    </button>

                    <div className="mt-6 flex justify-center gap-6 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <Lock size={12} /> SSL secured
                        </div>
                        <div className="h-1 w-1 rounded-full bg-slate-300"></div>
                        <div className="flex items-center gap-1.5">
                            <CheckCircle2 size={12} /> {providerName}
                        </div>
                    </div>

                    <p className="mt-5 text-center text-xs text-slate-400">
                        Cancel or skip any month from the link in your receipt.{" "}
                        <Link
                            to="/pledge"
                            className="font-medium text-slate-500 underline decoration-slate-300 underline-offset-2 hover:text-slate-700"
                        >
                            How monthly giving works
                        </Link>
                    </p>
                </div>
            </form>

            {errorMessage && (
                <ErrorCard
                    message={errorMessage}
                    setMessage={setErrorMessage}
                />
            )}
        </>
    );
}
SectionTitle.propTypes = {
    step: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
};

ComingSoon.propTypes = {
    plans: PropTypes.arrayOf(PropTypes.object),
    onSwitchBack: PropTypes.func.isRequired,
};

ComingSoon.defaultProps = {
    plans: [],
};

MonthlyPledgeForm.propTypes = {
    onSwitchBack: PropTypes.func.isRequired,
};
