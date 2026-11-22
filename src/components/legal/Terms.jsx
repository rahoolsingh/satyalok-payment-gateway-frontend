import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "../header/Header";

/**
 * Programme terms for monthly giving. Linked from the pledge consent checkbox
 * and the receipt emails, so the wording here must match what the backend
 * records in `Pledge.consent.text`.
 */
export default function Terms() {
    return (
        <div className="pl-page min-h-screen">
            <Header />

            <main id="terms-main" className="mx-auto max-w-2xl px-6 py-14">
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
                    Monthly giving terms
                </h1>
                <p className="pl-secondary mt-4 text-[15px] leading-7">
                    These terms apply when you set up a monthly donation to
                    Satyalok through UPI AutoPay. They are written to be read,
                    not to hide anything. The consent you tick on the pledge
                    form is recorded with its exact wording, version, time and
                    IP address.
                </p>

                <div className="pl-secondary mt-10 space-y-8 text-[15px] leading-7">
                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            1. What you are authorising
                        </h2>
                        <p className="mt-2">
                            You authorise Satyalok to debit a fixed amount from
                            the UPI account linked to your UPI ID, once every
                            month, until you cancel, the mandate expires, or the
                            programme ends. The first debit happens when you
                            approve the mandate in your UPI app with your UPI
                            PIN — that approval is the authorisation
                            transaction.
                        </p>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            2. Amount and validity
                        </h2>
                        <p className="mt-2">
                            You choose one of the published monthly amounts (for
                            example ₹500) or a custom amount within the limits
                            shown on the pledge page. The amount is fixed for
                            the life of the mandate; it is never read from your
                            browser. Mandates are valid for five years from the
                            date of approval unless a shorter period applies.
                        </p>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            3. Notice before every debit
                        </h2>
                        <p className="mt-2">
                            At least 24 hours before each monthly debit we send
                            you an email and the gateway sends a pre-debit
                            notification. The email includes the amount, the
                            date, and links to skip that month or cancel.
                        </p>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            4. Your controls
                        </h2>
                        <p className="mt-2">
                            Every email we send contains a personal management
                            link. With it you can skip the next debit, pause,
                            resume, or cancel the pledge — no password, no
                            retention flow. You can also request a fresh link at{" "}
                            <Link to="/pledge/manage" className="pl-accent underline underline-offset-2">
                                the donor portal
                            </Link>
                            , or revoke the mandate from your UPI app. A
                            revocation in the app is mirrored onto your pledge.
                        </p>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            5. Failed debits
                        </h2>
                        <p className="mt-2">
                            If a debit fails (for example, insufficient
                            balance), we try again on the next day, then three
                            days later, then seven days later, each with a fresh
                            24-hour notice. If all attempts fail, the pledge is
                            marked past due and we email you. No additional
                            charge, penalty or interest is applied.
                        </p>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            6. Receipts and 80G
                        </h2>
                        <p className="mt-2">
                            After each successful debit you receive an email
                            receipt and, if you provided a PAN, an 80G
                            certificate for that donation. Your PAN is stored
                            encrypted; only a masked value is displayed. We
                            absorb all gateway fees — the full amount you pledge
                            reaches the programme.
                        </p>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            7. Refunds
                        </h2>
                        <p className="mt-2">
                            Donations are voluntary and generally
                            non-refundable. If a debit was made in error, after
                            you cancelled, or without a valid mandate, write to
                            our grievance contact within seven days with the
                            reference from your receipt. Verified erroneous
                            debits are refunded to the source account.
                        </p>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            8. Grievances and disputes
                        </h2>
                        <p className="mt-2">
                            Write to{" "}
                            <a
                                href="mailto:support@satyalok.in"
                                className="pl-accent underline underline-offset-2"
                            >
                                support@satyalok.in
                            </a>{" "}
                            with your pledge reference. We acknowledge within
                            two business days and work to resolve within seven
                            business days. Every webhook and debit attempt is
                            recorded, so we can reconstruct exactly what
                            happened.
                        </p>
                    </section>

                    <section>
                        <h2 className="pl-display text-[22px] text-[#1f1b16]">
                            9. Changes
                        </h2>
                        <p className="mt-2">
                            If these terms change materially, we email active
                            donors before the change takes effect. A new consent
                            version is recorded when you next act on the pledge.
                            You can always cancel instead. See also our{" "}
                            <Link
                                to="/privacy"
                                className="pl-accent underline underline-offset-2"
                            >
                                privacy notice
                            </Link>
                            .
                        </p>
                    </section>
                </div>
            </main>
        </div>
    );
}