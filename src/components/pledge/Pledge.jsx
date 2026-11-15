import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import {
    AlertCircle,
    ArrowRight,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    Heart,
    Info,
    Loader2,
    Lock,
    Mail,
    Phone,
    Repeat,
    ShieldCheck,
    User,
} from "lucide-react";
import Header from "../header/Header";
import ErrorCard from "../error/ErrorCard";
import { createPledge, extractApiError, fetchPlans, newIdempotencyKey } from "./pledgeApi";

const currency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(value) || 0);

const inputRing = (error) =>
    error
        ? "bg-red-50/50 ring-red-300 focus:ring-red-500"
        : "ring-slate-200 hover:ring-slate-300 focus:ring-blue-600";

const planCardClass = (selected) =>
    "flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition-all " +
    (selected
        ? "border-blue-600 bg-blue-50/60"
        : "border-slate-200 hover:border-slate-300");

const radioClass = (selected) =>
    "flex h-5 w-5 items-center justify-center rounded-full border-2 " +
    (selected ? "border-blue-600 bg-blue-600" : "border-slate-300");

const Field = (props) => {
    const { label, name, type, placeholder, value, onChange, error, icon: Icon, hint } =
        props;

    return (
        <div className="w-full space-y-1.5">
            <label htmlFor={name} className="text-sm font-semibold text-slate-700">
                {label}
            </label>
            <div className="relative flex items-center">
                {Icon && (
                    <div className="pointer-events-none absolute left-3.5 text-slate-400">
                        <Icon size={18} />
                    </div>
                )}
                <input
                    id={name}
                    type={type}
                    name={name}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    autoComplete="off"
                    className={
                        "w-full rounded-xl border-0 bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 outline-none ring-1 transition-all placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:ring-2 " +
                        inputRing(error) +
                        (Icon ? " pl-11" : "")
                    }
                />
            </div>
            {error ? (
                <p className="mt-1 flex items-center text-xs font-medium text-red-600">
                    <AlertCircle className="mr-1 h-3 w-3" />
                    {error}
                </p>
            ) : (
                hint && <p className="text-xs text-slate-400">{hint}</p>
            )}
        </div>
    );
};

Field.propTypes = {
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string,
    placeholder: PropTypes.string,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    onChange: PropTypes.func.isRequired,
    error: PropTypes.string,
    icon: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
    hint: PropTypes.string,
};

Field.defaultProps = {
    type: "text",
    placeholder: "",
    value: "",
    error: undefined,
    icon: undefined,
    hint: undefined,
};

/**
 * Monthly pledge form.
 *
 * The donor picks a tier (or a custom amount inside the server's limits), enters
 * their details plus the UPI id to be debited, and explicitly authorises the
 * recurring mandate. The disclosure text and consent checkbox are the RBI
 * "e-mandate" consent record the backend stores verbatim.
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

    // One key per form session: a retry after a network error reuses it, so the
    // server never creates a second mandate.
    const idempotencyKey = useRef(newIdempotencyKey());

    useEffect(() => {
        fetchPlans()
            .then((data) => {
                setPlans(data.plans || []);
                setRules(data.rules || null);

                if (data.plans && data.plans.length) {
                    setPlanId(data.plans[0].id);
                    setCustomAmount(String(data.plans[0].amount));
                }
            })
            .catch(() => {
                setErrorMessage(
                    "We could not load the monthly giving options. Please refresh the page.",
                );
            });
    }, []);

    const amount = useMemo(() => {
        if (planId === "custom") return Number(customAmount) || 0;
        const preset = plans.find((plan) => plan.id === planId);
        return preset ? preset.amount : 0;
    }, [planId, customAmount, plans]);

    const yearlyTotal = amount * 12;

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: undefined }));
    };

    const validate = () => {
        const next = {};

        if (form.name.trim().length < 2) next.name = "Please enter your full name.";

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
            next.email = "Enter a valid email address.";
        }

        if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, "").slice(-10))) {
            next.phone = "Enter a valid 10 digit mobile number.";
        }

        if (!/^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{2,}$/.test(form.vpa.trim())) {
            next.vpa = "Enter your UPI ID, e.g. yourname@okhdfcbank";
        }

        if (want80G && !/^[A-Z]{5}\d{4}[A-Z]$/.test(form.pan.trim().toUpperCase())) {
            next.pan = "PAN should look like ABCDE1234F.";
        }

        if (!Number.isInteger(amount) || amount < 100) {
            next.amount = "Minimum monthly amount is Rs 100.";
        }

        if (rules && rules.maxAmount && amount > rules.maxAmount) {
            next.amount = "Maximum monthly amount is " + currency(rules.maxAmount) + ".";
        }

        if (!consent) next.consent = "Please accept the auto-debit authorisation.";

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

    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <div className="mx-auto max-w-6xl px-4 py-10 lg:py-14">
                <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                    <div className="lg:pt-6">
                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700">
                            <Repeat size={13} /> Monthly giving
                        </span>

                        <h1 className="mt-5 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                            {currency(amount)} a month can change a child&apos;s whole year.
                        </h1>

                        <p className="mt-4 text-base leading-relaxed text-slate-600">
                            A monthly pledge gives our teachers and students something
                            one-time donations never can: certainty. Your UPI mandate is set
                            up once and debits automatically, and you can pause or cancel
                            whenever you like.
                        </p>

                        <ul className="mt-7 space-y-4">
                            <li className="flex gap-3.5">
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        RBI-compliant UPI AutoPay
                                    </p>
                                    <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                                        A mandate you approve with your UPI PIN. We never see
                                        or store your account details.
                                    </p>
                                </div>
                            </li>

                            <li className="flex gap-3.5">
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                                    <Lock className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        Notified before every debit
                                    </p>
                                    <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                                        An email reaches you at least 24 hours before each
                                        charge, exactly as the RBI requires.
                                    </p>
                                </div>
                            </li>

                            <li className="flex gap-3.5">
                                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                                    <Heart className="h-4 w-4 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-900">
                                        Cancel in two clicks
                                    </p>
                                    <p className="mt-0.5 text-sm leading-relaxed text-slate-500">
                                        Every email carries a manage link. No phone calls, no
                                        retention scripts.
                                    </p>
                                </div>
                            </li>
                        </ul>

                        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                                Your commitment
                            </p>
                            <div className="mt-3 flex items-end justify-between">
                                <div>
                                    <p className="text-3xl font-bold text-slate-900">
                                        {currency(amount)}
                                    </p>
                                    <p className="text-sm text-slate-500">per month</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-semibold text-slate-700">
                                        {currency(yearlyTotal)}
                                    </p>
                                    <p className="text-xs text-slate-500">per year</p>
                                </div>
                            </div>
                            <p className="mt-4 flex items-start gap-1.5 text-xs text-slate-500">
                                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                Every debit gets its own 80G receipt. Nothing is charged
                                until you approve the mandate.
                            </p>
                        </div>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8"
                    >
                        <h2 className="text-lg font-bold text-slate-900">
                            Set up your monthly pledge
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Takes about a minute. You approve the mandate in your UPI app
                            at the end.
                        </p>

                        <div className="mt-6 space-y-2.5">
                            {plans.map((plan) => {
                                const selected = planId === plan.id;

                                return (
                                    <button
                                        key={plan.id}
                                        type="button"
                                        onClick={() => {
                                            setPlanId(plan.id);
                                            setCustomAmount(String(plan.amount));
                                            setErrors((prev) => ({
                                                ...prev,
                                                amount: undefined,
                                            }));
                                        }}
                                        className={planCardClass(selected)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={radioClass(selected)}>
                                                {selected && (
                                                    <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">
                                                    {plan.label}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {plan.impact}
                                                </p>
                                            </div>
                                        </div>

                                        <span className="text-sm font-semibold text-slate-400">
                                            {currency(plan.amount * 12)}/yr
                                        </span>
                                    </button>
                                );
                            })}

                            <button
                                type="button"
                                onClick={() => setPlanId("custom")}
                                className={planCardClass(planId === "custom")}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={radioClass(planId === "custom")}>
                                        {planId === "custom" && (
                                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                        )}
                                    </div>
                                    <span className="text-sm font-bold text-slate-900">
                                        Choose my own amount
                                    </span>
                                </div>
                                <ChevronRight size={16} className="text-slate-400" />
                            </button>

                            {planId === "custom" && (
                                <div className="rounded-xl bg-slate-50 p-4">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-slate-500">
                                            Rs
                                        </span>
                                        <input
                                            type="number"
                                            inputMode="numeric"
                                            min={rules ? rules.minAmount : 100}
                                            max={rules ? rules.maxAmount : 10000}
                                            step={1}
                                            value={customAmount}
                                            onChange={(event) => {
                                                setCustomAmount(event.target.value);
                                                setErrors((prev) => ({
                                                    ...prev,
                                                    amount: undefined,
                                                }));
                                            }}
                                            className="w-full rounded-lg border-0 bg-white px-3 py-2.5 text-lg font-bold text-slate-900 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600"
                                        />
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">
                                        Between {currency(rules ? rules.minAmount : 100)} and{" "}
                                        {currency(rules ? rules.maxAmount : 10000)} per month.
                                    </p>
                                    {errors.amount && (
                                        <p className="mt-1.5 flex items-center text-xs font-medium text-red-600">
                                            <AlertCircle className="mr-1 h-3 w-3" />
                                            {errors.amount}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-7 space-y-4">
                            <Field
                                label="Full name"
                                name="name"
                                type="text"
                                placeholder="As per your PAN"
                                value={form.name}
                                onChange={handleChange}
                                error={errors.name}
                                icon={User}
                            />

                            <Field
                                label="Email"
                                name="email"
                                type="email"
                                placeholder="you@example.com"
                                value={form.email}
                                onChange={handleChange}
                                error={errors.email}
                                icon={Mail}
                            />

                            <Field
                                label="Mobile"
                                name="phone"
                                type="tel"
                                placeholder="10 digit number"
                                value={form.phone}
                                onChange={handleChange}
                                error={errors.phone}
                                icon={Phone}
                            />

                            <Field
                                label="UPI ID to be debited"
                                name="vpa"
                                type="text"
                                placeholder="yourname@okhdfcbank"
                                value={form.vpa}
                                onChange={handleChange}
                                error={errors.vpa}
                                icon={CreditCard}
                                hint="Used only to send the mandate request. Your bank details never reach us."
                            />
                        </div>

                        <div className="mt-5 rounded-xl border border-slate-200 p-4">
                            <label className="flex cursor-pointer items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={want80G}
                                    onChange={(event) => setWant80G(event.target.checked)}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>
                                    <span className="block text-sm font-semibold text-slate-800">
                                        I would like an 80G tax receipt
                                    </span>
                                    <span className="block text-xs text-slate-500">
                                        Add your PAN and we will email a certificate with
                                        every monthly receipt.
                                    </span>
                                </span>
                            </label>

                            {want80G && (
                                <div className="mt-4">
                                    <Field
                                        label="PAN"
                                        name="pan"
                                        type="text"
                                        placeholder="ABCDE1234F"
                                        value={form.pan}
                                        onChange={(event) => {
                                            const value = event.target.value.toUpperCase();
                                            setForm((prev) => ({ ...prev, pan: value }));
                                            setErrors((prev) => ({
                                                ...prev,
                                                pan: undefined,
                                            }));
                                        }}
                                        error={errors.pan}
                                        hint="Stored encrypted; used only for your 80G certificate."
                                    />
                                </div>
                            )}
                        </div>

                        <div className="mt-5 rounded-xl bg-slate-900 p-4 text-slate-100">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Auto-debit authorisation
                            </p>
                            <p className="mt-2 text-xs leading-relaxed text-slate-300">
                                I authorise Satyalok to debit <strong className="text-white">{currency(amount)}</strong>{" "}
                                from my UPI account every month until I cancel, starting with
                                the first debit when I approve this mandate. I will receive a
                                notification at least 24 hours before each debit, and I can
                                pause, skip or cancel any time from the link in every email.
                                A maximum of one debit per month applies, and the mandate
                                stays valid for 5 years or until cancelled.
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
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-xs leading-relaxed text-slate-600">
                                I agree to the{" "}
                                <a
                                    href={rules ? rules.termsUrl : "/terms"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-blue-600 underline underline-offset-2"
                                >
                                    terms
                                </a>{" "}
                                and{" "}
                                <a
                                    href={rules ? rules.privacyUrl : "/privacy"}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-semibold text-blue-600 underline underline-offset-2"
                                >
                                    privacy policy
                                </a>
                                , and I authorise the recurring debit described above.
                            </span>
                        </label>

                        {errors.consent && (
                            <p className="mt-1.5 flex items-center text-xs font-medium text-red-600">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                {errors.consent}
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || submitted}
                            className="group mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" /> Setting up
                                    your mandate
                                </>
                            ) : (
                                <>
                                    Continue to UPI mandate
                                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </button>

                        <div className="mt-5 flex flex-wrap items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <span className="flex items-center gap-1.5">
                                <Lock size={11} /> 256-bit TLS
                            </span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1.5">
                                <ShieldCheck size={11} /> RBI e-mandate
                            </span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="flex items-center gap-1.5">
                                <CreditCard size={11} /> PhonePe UPI AutoPay
                            </span>
                        </div>

                        <p className="mt-4 text-center text-[11px] text-slate-400">
                            No money is debited until you approve the mandate in your UPI
                            app. Your first debit happens at approval.
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
