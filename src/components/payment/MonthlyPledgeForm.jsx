import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import {
    createPledge,
    extractApiError,
    fetchPlans,
    newIdempotencyKey,
} from "../pledge/pledgeApi";
import { openRazorpayCheckout } from "../../utils/razorpayCheckout";

/**
 * Compact monthly giving form for the donation page switch.
 *
 * Same rules as the full /pledge page (server resolves the amount, idempotency
 * key, Razorpay checkout, status hand-off) but scoped to the few decisions a
 * donor makes here: how much, who they are, and consent.
 */

const currency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);

const Field = ({ label, name, type, placeholder, value, onChange, error, hint }) => (
    <div>
        <label
            htmlFor={`monthly-${name}`}
            className="pl-secondary mb-1.5 block text-[13px] font-medium"
        >
            {label}
        </label>
        <input
            id={`monthly-${name}`}
            name={name}
            type={type}
            value={value}
            placeholder={placeholder}
            onChange={onChange}
            autoComplete="off"
            aria-invalid={Boolean(error)}
            className={"pl-field " + (error ? "pl-field-error" : "")}
        />
        {error ? (
            <p className="mt-1.5 text-[12px] text-[#b4463c]">{error}</p>
        ) : (
            hint && <p className="pl-muted mt-1.5 text-[12px]">{hint}</p>
        )}
    </div>
);

const ComingSoon = ({ plans, onSwitchBack }) => (
    <div className="pl-card p-6 sm:p-8">
        <p className="pl-mono pl-muted text-[12px]">Monthly giving</p>
        <h3 className="pl-display mt-2 text-[26px] leading-[1.15]">
            Monthly giving is coming soon
        </h3>
        <p className="pl-secondary mt-3 text-[15px] leading-6">
            We are finishing the bank approvals for automatic monthly debits. A
            one-time donation reaches the same children today.
        </p>

        {plans.length > 0 && (
            <ul className="pl-hairline mt-6 divide-y border-t">
                {plans.map((plan) => (
                    <li
                        key={plan.id}
                        className="flex items-baseline justify-between py-3"
                    >
                        <span className="pl-tabular text-[14px]">
                            {currency(plan.amount)} a month
                        </span>
                        <span className="pl-mono pl-muted text-[11px]">
                            coming soon
                        </span>
                    </li>
                ))}
            </ul>
        )}

        <button
            type="button"
            onClick={onSwitchBack}
            className="pl-btn-primary mt-6"
        >
            Give once instead
            <ArrowRight size={16} strokeWidth={1.5} />
        </button>
    </div>
);

export default function MonthlyPledgeForm({ onSwitchBack }) {
    const [plans, setPlans] = useState([]);
    const [rules, setRules] = useState(null);
    const [capability, setCapability] = useState(null);
    const [planId, setPlanId] = useState("");
    const [customAmount, setCustomAmount] = useState("");
    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
        vpa: "",
        pan: "",
    });
    const [want80G, setWant80G] = useState(false);
    const [consent, setConsent] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const idempotencyKey = useRef(newIdempotencyKey());

    useEffect(() => {
        fetchPlans()
            .then((data) => {
                setCapability({
                    available: data.available !== false,
                    provider: data.provider || null,
                    requiresVpa: data.requiresVpa !== false,
                    previewPlans: data.previewPlans || [],
                });
                setPlans(data.plans || []);
                setRules(data.rules || null);

                if (data.plans && data.plans.length) {
                    setPlanId(data.plans[0].id);
                    setCustomAmount(String(data.plans[0].amount));
                }
            })
            .catch(() => {
                setError(
                    "The monthly amounts could not be loaded. Refresh the page to try again.",
                );
            });
    }, []);

    const selectedPlan = plans.find((plan) => plan.id === planId) || null;
    const amount =
        planId === "custom" ? Number(customAmount) || 0 : selectedPlan?.amount || 0;

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const validate = () => {
        const next = {};

        if (form.name.trim().length < 2) next.name = "Enter your full name";

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
            next.email = "Enter a valid email address";
        }

        if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, "").slice(-10))) {
            next.phone = "Enter a 10 digit mobile number";
        }

        if (
            capability?.requiresVpa !== false &&
            !/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(form.vpa.trim())
        ) {
            next.vpa = "Enter your UPI ID, for example yourname@okhdfcbank";
        }

        if (want80G && !/^[A-Z]{5}\d{4}[A-Z]$/.test(form.pan.trim().toUpperCase())) {
            next.pan = "PAN looks like ABCDE1234F";
        }

        const min = rules?.minAmount || 100;
        const max = rules?.maxAmount || 10000;

        if (!Number.isInteger(amount) || amount < min) {
            next.amount = `Minimum is ${currency(min)} a month`;
        } else if (amount > max) {
            next.amount = `Maximum is ${currency(max)} a month`;
        }

        if (!consent) next.consent = "Tick the authorisation to continue";

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!validate()) return;

        setLoading(true);
        setError("");

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

            if (authorization.mode === "RAZORPAY_CHECKOUT" && authorization.razorpay) {
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
                        setError(
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
            setError(extractApiError(err));
        } finally {
            setLoading(false);
        }
    };

    if (!capability) {
        return (
            <div className="pl-card p-6 sm:p-8">
                {error ? (
                    <>
                        <p
                            role="alert"
                            className="text-[13px] leading-5 text-[#b4463c]"
                        >
                            {error}
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="pl-btn-quiet mt-4"
                        >
                            Try again
                        </button>
                    </>
                ) : (
                    <p className="pl-secondary flex items-center gap-2 text-[14px]">
                        <Loader2
                            size={16}
                            strokeWidth={1.5}
                            className="animate-spin"
                        />
                        Loading monthly amounts
                    </p>
                )}
            </div>
        );
    }

    if (capability.available === false) {
        return (
            <ComingSoon
                plans={capability.previewPlans}
                onSwitchBack={onSwitchBack}
            />
        );
    }

    const providerName =
        capability?.provider === "razorpay" ? "Razorpay" : "PhonePe";

    return (
        <form onSubmit={handleSubmit} className="pl-card p-6 sm:p-8" noValidate>
            <div className="flex items-baseline justify-between gap-3">
                <h3 className="text-[16px] font-medium">Set up a monthly pledge</h3>
                <span className="pl-mono pl-muted text-[11px]">
                    via {providerName}
                </span>
            </div>
            <p className="pl-secondary mt-1 text-[13px] leading-5">
                One mandate, debited on the same date each month. You approve it
                with your bank at the end.
            </p>

            <fieldset className="mt-6">
                <legend className="pl-secondary mb-2 text-[13px] font-medium">
                    Amount each month
                </legend>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {plans.map((plan) => {
                        const selected = plan.id === planId;

                        return (
                            <button
                                key={plan.id}
                                type="button"
                                onClick={() => {
                                    setPlanId(plan.id);
                                    setCustomAmount(String(plan.amount));
                                    setErrors((prev) => ({ ...prev, amount: undefined }));
                                }}
                                aria-pressed={selected}
                                className={
                                    "rounded-[10px] border px-3 py-3 text-left transition-colors " +
                                    (selected
                                        ? "border-[#1f1b16] bg-[#f2ece3]"
                                        : "border-[rgba(31,27,22,0.12)] bg-white hover:bg-[#faf7f1]")
                                }
                            >
                                <span className="pl-tabular block text-[18px] font-medium">
                                    {currency(plan.amount)}
                                </span>
                                <span className="pl-muted block text-[11px]">
                                    per month
                                </span>
                            </button>
                        );
                    })}

                    <button
                        type="button"
                        onClick={() => {
                            setPlanId("custom");
                            setErrors((prev) => ({ ...prev, amount: undefined }));
                        }}
                        aria-pressed={planId === "custom"}
                        className={
                            "rounded-[10px] border px-3 py-3 text-left transition-colors " +
                            (planId === "custom"
                                ? "border-[#1f1b16] bg-[#f2ece3]"
                                : "border-[rgba(31,27,22,0.12)] bg-white hover:bg-[#faf7f1]")
                        }
                    >
                        <span className="block text-[14px] font-medium">Custom</span>
                        <span className="pl-muted block text-[11px]">any amount</span>
                    </button>
                </div>

                {planId === "custom" && (
                    <div className="mt-2 rounded-[10px] border border-[rgba(31,27,22,0.12)] bg-white p-3">
                        <div className="flex items-center gap-2">
                            <span className="pl-mono pl-muted text-[13px]">INR</span>
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
                                        amount: undefined,
                                    }));
                                }}
                                className="pl-tabular w-full border-0 bg-transparent p-0 text-[20px] font-medium outline-none"
                            />
                        </div>
                        <p className="pl-muted mt-1 text-[12px]">
                            {"Between " +
                                currency(rules ? rules.minAmount : 100) +
                                " and " +
                                currency(rules ? rules.maxAmount : 10000) +
                                " a month"}
                        </p>
                    </div>
                )}

                {errors.amount && (
                    <p className="mt-2 text-[12px] text-[#b4463c]">
                        {errors.amount}
                    </p>
                )}

                {selectedPlan?.impact && (
                    <p className="pl-muted mt-2 text-[12px]">
                        {selectedPlan.impact}
                    </p>
                )}
            </fieldset>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <Field
                        label="Full name"
                        name="name"
                        placeholder="As printed on your PAN"
                        value={form.name}
                        onChange={handleChange}
                        error={errors.name}
                    />
                </div>
                <Field
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    error={errors.email}
                />
                <Field
                    label="Mobile"
                    name="phone"
                    type="tel"
                    placeholder="10 digit number"
                    value={form.phone}
                    onChange={handleChange}
                    error={errors.phone}
                />
                {capability?.requiresVpa !== false && (
                    <div className="sm:col-span-2">
                        <Field
                            label="UPI ID to debit"
                            name="vpa"
                            placeholder="yourname@okhdfcbank"
                            value={form.vpa}
                            onChange={handleChange}
                            error={errors.vpa}
                            hint="Used only to send the mandate request to your bank"
                        />
                    </div>
                )}
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3">
                <input
                    type="checkbox"
                    checked={want80G}
                    onChange={(event) => setWant80G(event.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded-[4px] border-[rgba(31,27,22,0.3)] accent-[#1376c8]"
                />
                <span>
                    <span className="block text-[14px] font-medium">
                        Add an 80G tax receipt
                    </span>
                    <span className="pl-muted block text-[12px] leading-5">
                        Needs your PAN. The certificate is attached to every
                        monthly receipt.
                    </span>
                </span>
            </label>

            {want80G && (
                <div className="mt-3">
                    <Field
                        label="PAN"
                        name="pan"
                        placeholder="ABCDE1234F"
                        value={form.pan}
                        onChange={(event) => {
                            const value = event.target.value.toUpperCase();
                            setForm((prev) => ({ ...prev, pan: value }));
                            setErrors((prev) => ({ ...prev, pan: undefined }));
                        }}
                        error={errors.pan}
                        hint="Encrypted at rest, used only for the certificate"
                    />
                </div>
            )}

            <div className="mt-5 rounded-[10px] border border-[rgba(31,27,22,0.12)] bg-[#faf7f1] p-4">
                <p className="pl-mono pl-muted text-[11px]">Authorisation</p>
                <p className="pl-secondary mt-2 text-[13px] leading-[1.65]">
                    I authorise Satyalok to debit{" "}
                    <span className="pl-tabular font-medium">
                        {currency(amount)}
                    </span>{" "}
                    every month, starting with the first debit when I approve
                    this mandate, until I cancel. I will be told at least 24
                    hours before each debit. One debit a month, for the same
                    amount, for 5 years or until cancelled.
                </p>
            </div>

            <label className="mt-3 flex cursor-pointer items-start gap-3">
                <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => {
                        setConsent(event.target.checked);
                        setErrors((prev) => ({ ...prev, consent: undefined }));
                    }}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded-[4px] border-[rgba(31,27,22,0.3)] accent-[#1376c8]"
                />
                <span className="pl-secondary text-[12px] leading-5">
                    I agree to the{" "}
                    <Link
                        to="/terms"
                        className="pl-accent underline underline-offset-2"
                    >
                        terms
                    </Link>{" "}
                    and{" "}
                    <Link
                        to="/privacy"
                        className="pl-accent underline underline-offset-2"
                    >
                        privacy policy
                    </Link>
                    , and to the recurring debit above.
                </span>
            </label>

            {errors.consent && (
                <p className="mt-1.5 text-[12px] text-[#b4463c]">
                    {errors.consent}
                </p>
            )}

            {error && (
                <p
                    role="alert"
                    className="mt-4 rounded-[10px] border border-[#b4463c]/20 bg-[#b4463c]/5 px-3 py-2 text-[13px] leading-5 text-[#b4463c]"
                >
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={loading || !capability}
                className="pl-btn-primary mt-5"
            >
                {loading ? (
                    <>
                        <Loader2
                            size={16}
                            strokeWidth={1.5}
                            className="animate-spin"
                        />
                        Opening secure checkout
                    </>
                ) : (
                    <>
                        Continue with {currency(amount)} a month
                        <ArrowRight size={16} strokeWidth={1.5} />
                    </>
                )}
            </button>

            <div className="pl-muted mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
                <span>Cancel any time</span>
                <Link
                    to="/pledge"
                    className="pl-accent underline underline-offset-2"
                >
                    How monthly giving works
                </Link>
            </div>
        </form>
    );
}
Field.propTypes = {
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    error: PropTypes.string,
    hint: PropTypes.string,
};

Field.defaultProps = {
    type: "text",
    placeholder: "",
    value: "",
    error: undefined,
    hint: undefined,
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
