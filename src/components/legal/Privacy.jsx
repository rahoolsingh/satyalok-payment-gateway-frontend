import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "../header/Header";

/**
 * Privacy notice for the recurring donation programme. The claims here mirror
 * what the backend actually does (AES-256-GCM PAN at rest, HMAC donor keys,
 * masked instrument data, expiring magic links).
 */
export default function Privacy() {
    return (
        <div className="pl-page min-h-screen">
            <Header />

            <article className="mx-auto max-w-2xl px-6 py-14">
                <Link
                    to="/"
                    className="pl-mono pl-muted inline-flex items-center gap-1.5 text-[12px] hover:underline"
                >
                    <ArrowLeft size={14} />
                    Back to giving
                </Link>

                <p className="pl-mono pl-muted mt-8 text-[12px]">
                    Last updated 15 November 2026
                </p>
                <h1 className="pl-display mt-3 text-[36px] leading-[1.1]">
                    Privacy notice
                </h1>
                <p className="pl-secondary mt-4 text-[15px] leading-7">
                    This notice covers the monthly giving programme. The
                    one-time donation flow collects the same core details and is
                    covered by the same commitments.
                </p>

                <div className="pl-secondary mt-10 space-y-8 text-[15px] leading-7">
                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            What we collect
                        </h2>
                        <ul className="mt-2 list-disc pl-5 space-y-1">
                            <li>Your name, email address and mobile number.</li>
                            <li>
                                Your UPI ID at setup, which the gateway masks
                                before we store it (for example
                                <span className="pl-mono"> do****@okhdfcbank</span>).
                            </li>
                            <li>
                                PAN, only if you ask for an 80G certificate. It
                                is encrypted with AES-256-GCM; the database
                                stores ciphertext plus a masked display value.
                            </li>
                            <li>
                                Mandate, subscription, order and transaction
                                identifiers returned by PhonePe.
                            </li>
                            <li>
                                Consent evidence: the exact wording shown, its
                                version, the time, your IP address and browser
                                user agent.
                            </li>
                            <li>
                                Operational logs and webhook events, kept for
                                audit and dispute handling.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            What we never collect
                        </h2>
                        <p className="mt-2">
                            We never receive or store your UPI PIN, card
                            numbers, bank passwords or full bank credentials.
                            The mandate is approved inside your own UPI app; the
                            money moves bank-to-bank through the gateway.
                        </p>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            Why we use it
                        </h2>
                        <p className="mt-2">
                            To set up and run your mandate, send pre-debit
                            notices and receipts, issue 80G certificates,
                            respond to support requests, prevent misuse
                            (including a donor blocklist and rate limits), and
                            meet tax, accounting and audit obligations.
                        </p>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            Who it is shared with
                        </h2>
                        <p className="mt-2">
                            PhonePe and the banking rail process the mandate and
                            debits. Our email provider delivers notices and
                            receipts. Our hosting and database providers store
                            the application data. We do not sell or rent donor
                            data, and we do not use it for advertising.
                        </p>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            How it is protected
                        </h2>
                        <p className="mt-2">
                            Traffic is encrypted in transit. PAN is encrypted at
                            rest; donor lookup uses a keyed hash (HMAC) of your
                            email rather than a plaintext index; API responses
                            expose only masked instrument data. Donor portal
                            links are signed, scoped and expire after 72 hours.
                            Admin access is cookie-based, role-checked and
                            audited.
                        </p>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            How long we keep it
                        </h2>
                        <p className="mt-2">
                            Mandate and donation records are financial records;
                            we keep them for as long as tax and accounting law
                            requires, even after a pledge is cancelled.
                            Recovery links expire after 72 hours. Operational
                            logs are kept only as long as needed for security
                            and debugging.
                        </p>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            Your choices
                        </h2>
                        <p className="mt-2">
                            You can skip, pause or cancel at any time from the
                            link in any email, or from{" "}
                            <Link
                                to="/pledge/manage"
                                className="pl-accent underline underline-offset-2"
                            >
                                the donor portal
                            </Link>
                            . To access, correct or erase data that is not
                            required for financial records, write to{" "}
                            <a
                                href="mailto:support@satyalok.in"
                                className="pl-accent underline underline-offset-2"
                            >
                                support@satyalok.in
                            </a>
                            . Cancelling a pledge stops future debits but does
                            not delete the financial record of past donations.
                        </p>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            Cookies
                        </h2>
                        <p className="mt-2">
                            Donor pages use no advertising or analytics
                            cookies. Admin sessions use a single essential
                            session cookie.
                        </p>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            Eligibility and contact
                        </h2>
                        <p className="mt-2">
                            Donors must be 18 or older and use a UPI account in
                            their own name. Questions about this notice go to{" "}
                            <a
                                href="mailto:support@satyalok.in"
                                className="pl-accent underline underline-offset-2"
                            >
                                support@satyalok.in
                            </a>
                            . See also the{" "}
                            <Link
                                to="/terms"
                                className="pl-accent underline underline-offset-2"
                            >
                                monthly giving terms
                            </Link>
                            .
                        </p>
                    </section>
                </div>
            </article>
        </div>
    );
}