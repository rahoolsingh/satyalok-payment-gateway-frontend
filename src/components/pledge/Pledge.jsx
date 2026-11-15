import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { ArrowRight, Loader2, XCircle } from "lucide-react";
import Header from "../header/Header";
import ErrorCard from "../error/ErrorCard";
import { createPledge, extractApiError, fetchPlans, newIdempotencyKey } from "./pledgeApi";
import { openRazorpayCheckout } from "../../utils/razorpayCheckout";

const currency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);

/** Next three debit dates, same day each month, clamped to shorter months. */
const nextDebitDates = (count = 3) => {
    const today = new Date();
    const dates = [];

    for (let step = 1; step <= count; step += 1) {
        const monthStart = new Date(today.getFullYear(), today.getMonth() + step, 1);
        const daysInMonth = new Date(
            monthStart.getFullYear(),
            monthStart.getMonth() + 1,
            0,
        ).getDate();

        dates.push(
            new Date(
                monthStart.getFullYear(),
                monthStart.getMonth(),
                Math.min(today.getDate(), daysInMonth),
            ),
        );
    }

    return dates;
};

const formatDay = (date) =>
    new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(date);

const monthLabel = () =>
    new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric" })
        .format(new Date());

/** The one rich element: the artefact the donor actually receives. */
const ReceiptPreview = ({ amount, name, taxBenefit }) => (
    <figure className="pl-receipt mt-10">
        <div className="flex items-baseline justify-between px-5 pt-5">
            <p className="pl-mono pl-muted text-[11px]">SL/26-27/001184</p>
            <p className="pl-mono pl-muted text-[11px]">{monthLabel()}</p>
        </div>

        <figcaption className="pl-muted px-5 pt-5 text-[12px]">
            Donation receipt, preview
        </figcaption>

        <div className="px-5 pb-5">
            <p className="pl-display pl-tabular mt-1 text-[36px] leading-none">
                {currency(amount)}
            </p>

            <dl className="mt-5 space-y-2 text-[13px]">
                <div className="flex justify-between gap-6">
                    <dt className="pl-muted">Donor</dt>
                    <dd className="pl-secondary truncate">{name || "Your name"}</dd>
                </div>
                <div className="flex justify-between gap-6">
                    <dt className="pl-muted">Frequency</dt>
                    <dd className="pl-secondary pl-tabular">1 per month</dd>
                </div>
                <div className="flex justify-between gap-6">
                    <dt className="pl-muted">80G certificate</dt>
                    <dd className="pl-secondary">
                        {taxBenefit ? "Included" : "Not requested"}
                    </dd>
                </div>
            </dl>
        </div>

        <div className="pl-perf pl-perf-notch relative flex items-center justify-between px-5 py-3">
            <p className="pl-mono pl-muted text-[11px]">Issued after every debit</p>
            <span
                aria-hidden="true"
                className="pl-mono pl-muted flex h-8 w-8 -rotate-6 items-center justify-center rounded-full border border-dashed text-[9px] leading-none"
                style={{ borderColor: "rgba(31,27,22,0.4)" }}
            >
                80G
            </span>
        </div>
    </figure>
);

ReceiptPreview.propTypes = {
    amount: PropTypes.number,
    name: PropTypes.string,
    taxBenefit: PropTypes.bool,
};

ReceiptPreview.defaultProps = {
    amount: 0,
    name: "",
    taxBenefit: false,
};

/** One ledger row: label, then the supporting line. No decorative icon. */
const Fact = ({ title, children }) => (
    <li className="py-4 first:pt-0 last:pb-0">
        <p className="text-[14px] font-medium">{title}</p>
        <p className="pl-secondary mt-0.5 text-[13px] leading-5">{children}</p>
    </li>
);

Fact.propTypes = {
    title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
};

const Field = ({ label, name, type, placeholder, value, onChange, error, hint }) => (
    <div>
        <label htmlFor={name} className="pl-secondary mb-1.5 block text-[13px] font-medium">
            {label}
        </label>
        <input
            id={name}
            type={type}
            name={name}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            autoComplete="off"
            aria-invalid={Boolean(error)}
            className={"pl-field " + (error ? "pl-field-error" : "")}
        />
        {error ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#b4463c]">
                <XCircle size={14} strokeWidth={1.5} />
                {error}
            </p>
        ) : (
            hint && <p className="pl-muted mt-1.5 text-[12px]">{hint}</p>
        )}
    </div>
);

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

/**
 * Shown when the programme is not switched on yet (missing gateway credentials).
 * The one-time donation flow is the only live path, so that is where we send people.
 */
const ComingSoon = ({ plans, rules }) => (
    <div className="pl-page min-h-screen">
        <Header />

        <div className="mx-auto max-w-lg px-6 py-16">
            <p className="pl-mono pl-muted text-[12px]">Monthly giving</p>

            <h1 className="pl-display mt-4 text-[34px] leading-[1.1]">
                Monthly giving is coming soon
            </h1>

            <p className="pl-secondary mt-4 text-[15px] leading-6">
                We are finishing the bank approvals for automatic monthly debits. Until
                then, a one-time donation reaches the same children today.
            </p>

            {plans.length > 0 && (
                <ul className="pl-hairline mt-8 divide-y border-t">
                    {plans.map((plan) => (
                        <li
                            key={plan.id}
                            className="flex items-baseline justify-between py-3"
                        >
                            <span className="pl-tabular text-[14px]">
                                {currency(plan.amount)} a month
                            </span>
                            <span className="pl-mono pl-muted text-[11px]">coming soon</span>
                        </li>
                    ))}
                </ul>
            )}

            <Link to="/" className="pl-btn-primary mt-8">
                Give once instead
                <ArrowRight size={16} strokeWidth={1.5} />
            </Link>

            <p className="pl-muted mt-4 text-[12px] leading-5">
                Want to be told when monthly giving opens? Email{" "}
                <a
                    href={"mailto:" + (rules ? rules.grievanceEmail : "support@satyalok.in")}
                    className="pl-accent underline underline-offset-2"
                >
                    {rules ? rules.grievanceEmail : "support@satyalok.in"}
                </a>
                .
            </p>
        </div>
    </div>
);

ComingSoon.propTypes = {
    plans: PropTypes.arrayOf(PropTypes.object),
    rules: PropTypes.object,
};

ComingSoon.defaultProps = {
    plans: [],
    rules: null,
};

/**
 * Monthly pledge form.
 *
 * Paper-and-ink direction: the chrome stays quiet and the one rich element is a
 * live preview of the receipt the donor will actually receive.
 */
function Pledge() {
    const navigate = useNavigate();

    const [plans, setPlans] = useState([]);
    const [rules, setRules] = useState(null);
    const [planId, setPlanId] = useState("monthly_500");
    const [customAmount, setCustomAmount] = useState("500");

    const [form, setForm] = useState({ name: "", email: "", phone: "", vpa: "", pan: "" });
    const [want80G, setWant80G] = useState(false);
    const [consent, setConsent] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [submitted, setSubmitted] = useState(false);
    const [capability, setCapability] = useState(null);

    const idempotencyKey = useRef(newIdempotencyKey());

    useEffect(() => {
        fetchPlans()
            .then((data) => {
                setCapability({
                    available: data.available !== false,
                    provider: data.provider || null,
                    requiresVpa: data.requiresVpa !== false,
                    previewPlans: data.previewPlans || data.plans || [],
                });
                setPlans(data.plans || []);
                setRules(data.rules || null);

                if (data.plans && data.plans.length) {
                    setPlanId(data.plans[0].id);
                    setCustomAmount(String(data.plans[0].amount));
                }
            })
            .catch(() => {
                setErrorMessage(
                    "The monthly amounts could not be loaded. Refresh the page to try again.",
                );
            });
    }, []);

    const amount = useMemo(() => {
        if (planId === "custom") return Number(customAmount) || 0;
        const preset = plans.find((plan) => plan.id === planId);
        return preset ? preset.amount : 0;
    }, [planId, customAmount, plans]);

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

        if (!Number.isInteger(amount) || amount < 100) {
            next.amount = "Minimum is " + currency(100) + " a month";
        }

        if (rules && rules.maxAmount && amount > rules.maxAmount) {
            next.amount = "Maximum is " + currency(rules.maxAmount) + " a month";
        }

        if (!consent) next.consent = "Tick the authorisation to continue";

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
                    planId: planId,
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

            setSubmitted(true);

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

            navigate("/pledge/status?ref=" + encodeURIComponent(pledge.pledgeRef));
        } catch (error) {
            setErrorMessage(extractApiError(error));
        } finally {
            setLoading(false);
        }
    };

    // Programme not switched on: show the honest "coming soon" screen instead of
    // a form that would fail at the gateway.
    if (capability && capability.available === false) {
        return <ComingSoon plans={capability.previewPlans} rules={rules} />;
    }

    return (
        <div className="pl-page min-h-screen">
            <Header />

            <div className="mx-auto max-w-6xl px-6 py-16 lg:py-20">
                <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:gap-20">
                    <div className="lg:sticky lg:top-24 lg:self-start">
                        <p className="pl-mono pl-muted text-[12px]">Monthly giving</p>

                        <h1 className="pl-display mt-4 text-[36px] leading-[1.06] sm:text-[46px]">
                            {currency(amount)} a month can change a child&apos;s whole year
                        </h1>

                        <p className="pl-secondary mt-5 max-w-md text-[15px] leading-6">
                            Teachers and students can plan around a pledge in a way they
                            never can around a one-time gift. Your auto-debit mandate is
                            set up once and debits on the same date each month.
                        </p>

                        <ul className="pl-hairline mt-8 divide-y border-t">
                            <Fact title="RBI-compliant auto-debit">
                                You approve the mandate with your bank (UPI or card). We never
                                see your account credentials.
                            </Fact>
                            <Fact title="Told before every debit">
                                An email reaches you at least 24 hours before each charge.
                            </Fact>
                            <Fact title="Cancel any time">
                                Skip a month, pause, or stop entirely from the link in any
                                receipt.
                            </Fact>
                        </ul>

                        <ReceiptPreview
                            amount={amount}
                            name={form.name}
                            taxBenefit={want80G}
                        />

                        <p className="pl-muted mt-4 text-[12px] leading-5">
                            One debit per month, same amount each time. Every debit gets
                            its own receipt and 80G certificate.
                        </p>

                        <div className="mt-8">
                            <p className="pl-secondary text-[13px] font-medium">
                                Next debits
                            </p>
                            <ul className="pl-hairline mt-2 divide-y border-t">
                                {nextDebitDates().map((date) => (
                                    <li
                                        key={date.toISOString()}
                                        className="flex items-baseline justify-between py-2.5"
                                    >
                                        <span className="pl-mono pl-muted text-[12px]">
                                            {formatDay(date)}
                                        </span>
                                        <span className="pl-tabular text-[13px]">
                                            {currency(amount)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                            <p className="pl-muted mt-2 text-[12px]">
                                Same date each month. A missed month is retried three
                                times before it is skipped.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="pl-card p-6 sm:p-8" noValidate>
                        <h2 className="text-[16px] font-medium">Set up your monthly pledge</h2>
                        <p className="pl-secondary mt-1 text-[13px]">
                            About a minute. You approve the mandate with your bank at the end.
                        </p>

                        <fieldset className="mt-6">
                            <legend className="pl-secondary mb-2 text-[13px] font-medium">
                                Amount each month
                            </legend>

                            <div className="space-y-2">
                                {plans.map((plan) => {
                                    const selected = planId === plan.id;

                                    return (
                                        <label
                                            key={plan.id}
                                            className={
                                                "flex cursor-pointer items-center justify-between gap-4 rounded-[10px] border px-4 py-3 transition-colors " +
                                                (selected
                                                    ? "border-[#1f1b16] bg-[#f2ece3]"
                                                    : "border-[rgba(31,27,22,0.12)] bg-white hover:bg-[#faf7f1]")
                                            }
                                        >
                                            <input
                                                type="radio"
                                                name="plan"
                                                value={plan.id}
                                                checked={selected}
                                                onChange={() => {
                                                    setPlanId(plan.id);
                                                    setCustomAmount(String(plan.amount));
                                                    setErrors((prev) => ({
                                                        ...prev,
                                                        amount: undefined,
                                                    }));
                                                }}
                                                className="sr-only"
                                            />

                                            <span className="flex items-center gap-3">
                                                <span
                                                    aria-hidden="true"
                                                    className={
                                                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border " +
                                                        (selected
                                                            ? "border-[#1376c8]"
                                                            : "border-[rgba(31,27,22,0.3)]")
                                                    }
                                                >
                                                    {selected && (
                                                        <span className="h-2 w-2 rounded-full bg-[#1376c8]" />
                                                    )}
                                                </span>

                                                <span>
                                                    <span className="pl-tabular block text-[14px] font-medium">
                                                        {currency(plan.amount)} a month
                                                    </span>
                                                    <span className="pl-muted block text-[12px]">
                                                        {plan.impact}
                                                    </span>
                                                </span>
                                            </span>

                                            <span className="pl-mono pl-muted shrink-0 text-[12px]">
                                                {currency(plan.amount * 12)}/yr
                                            </span>
                                        </label>
                                    );
                                })}

                                <label
                                    className={
                                        "flex cursor-pointer items-center justify-between gap-4 rounded-[10px] border px-4 py-3 transition-colors " +
                                        (planId === "custom"
                                            ? "border-[#1f1b16] bg-[#f2ece3]"
                                            : "border-[rgba(31,27,22,0.12)] bg-white hover:bg-[#faf7f1]")
                                    }
                                >
                                    <input
                                        type="radio"
                                        name="plan"
                                        value="custom"
                                        checked={planId === "custom"}
                                        onChange={() => setPlanId("custom")}
                                        className="sr-only"
                                    />

                                    <span className="flex items-center gap-3">
                                        <span
                                            aria-hidden="true"
                                            className={
                                                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border " +
                                                (planId === "custom"
                                                    ? "border-[#1376c8]"
                                                    : "border-[rgba(31,27,22,0.3)]")
                                            }
                                        >
                                            {planId === "custom" && (
                                                <span className="h-2 w-2 rounded-full bg-[#1376c8]" />
                                            )}
                                        </span>
                                        <span className="text-[14px] font-medium">
                                            Choose my own amount
                                        </span>
                                    </span>
                                </label>

                                {planId === "custom" && (
                                    <div className="rounded-[10px] border border-[rgba(31,27,22,0.12)] bg-white p-4">
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
                                        {errors.amount && (
                                            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#b4463c]">
                                                <XCircle size={14} strokeWidth={1.5} />
                                                {errors.amount}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </fieldset>

                        <fieldset className="mt-7">
                            <legend className="pl-secondary mb-3 text-[13px] font-medium">
                                Your details
                            </legend>

                            <div className="space-y-4">
                                <Field
                                    label="Full name"
                                    name="name"
                                    placeholder="As printed on your PAN"
                                    value={form.name}
                                    onChange={handleChange}
                                    error={errors.name}
                                />

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
                                    <Field
                                        label="UPI ID to debit"
                                        name="vpa"
                                        placeholder="yourname@okhdfcbank"
                                        value={form.vpa}
                                        onChange={handleChange}
                                        error={errors.vpa}
                                        hint="Used only to send the mandate request to your bank"
                                    />
                                )}
                            </div>
                        </fieldset>

                        <div className="mt-7">
                            <label className="flex cursor-pointer items-start gap-3">
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
                                <div className="mt-4">
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
                        </div>

                        <div className="mt-7 rounded-[10px] border border-[rgba(31,27,22,0.12)] bg-[#faf7f1] p-4">
                            <p className="pl-mono pl-muted text-[11px]">Authorisation</p>
                            <p className="pl-secondary mt-2 text-[13px] leading-[1.65]">
                                I authorise Satyalok to debit{" "}
                                <span className="pl-tabular font-medium">{currency(amount)}</span>{" "}
                                from my UPI account (or the payment method I approve) every month, starting with the first
                                debit when I approve this mandate, until I cancel. I will be
                                told at least 24 hours before each debit. One debit a month,
                                for the same amount, for 5 years or until cancelled.
                            </p>
                        </div>

                        <label className="mt-4 flex cursor-pointer items-start gap-3">
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
                                <a
                                    href={rules ? rules.termsUrl : "/terms"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="pl-accent underline underline-offset-2"
                                >
                                    terms
                                </a>{" "}
                                and{" "}
                                <a
                                    href={rules ? rules.privacyUrl : "/privacy"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="pl-accent underline underline-offset-2"
                                >
                                    privacy policy
                                </a>
                                , and to the recurring debit above.
                            </span>
                        </label>

                        {errors.consent && (
                            <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#b4463c]">
                                <XCircle size={14} strokeWidth={1.5} />
                                {errors.consent}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || submitted}
                            className="pl-btn-primary mt-6"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} strokeWidth={1.5} className="animate-spin" />
                                    Setting up your mandate
                                </>
                            ) : (
                                <>
                                    Continue to UPI mandate
                                    <ArrowRight size={16} strokeWidth={1.5} />
                                </>
                            )}
                        </button>

                        <p className="pl-mono pl-muted mt-4 text-[11px] leading-5">
                            256-bit TLS · RBI e-mandate · PhonePe UPI AutoPay
                        </p>

                        <p className="pl-muted mt-3 text-[12px] leading-5">
                            Nothing is debited until you approve the mandate in your UPI
                            app. Your first debit happens at that moment.
                        </p>
                    </form>
                </div>
            </div>

            {errorMessage && (
                <ErrorCard message={errorMessage} setMessage={setErrorMessage} />
            )}
        </div>
    );
}

export default Pledge;
