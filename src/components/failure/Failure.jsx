import React from "react";
import PropTypes from "prop-types";
import { QRCodeSVG } from "qrcode.react";
import logo from "../../assets/logo.png";
import failImg from "../../assets/brokenCard.png";

function Failure({ data }) {
    const { message, data: paymentData } = data;
    
    // Formatting & Data extraction
    const merchantTxnId = paymentData.merchantTransactionId;
    const statusUrl = `https://donate.satyalok.in/status/${merchantTxnId}`;
    
    const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(paymentData.amount / 100);

    return (
        <div className="w-full bg-transparent min-h-[85vh] flex items-center py-16 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

                {/* Left Column: Troubleshooting & Actions */}
                <div className="lg:col-span-7 flex flex-col justify-center lg:pr-8">
                    <div className="mb-8 hidden lg:block">
                        <img src={logo} alt="Satyalok" className="h-12 w-auto object-contain grayscale opacity-80" />
                    </div>

                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center border border-red-200">
                            <svg className="w-5 h-5 text-red-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </div>
                        <h2 className="text-sm font-semibold text-red-700 uppercase tracking-wide">Transaction Failed</h2>
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                        We couldn’t process <br />your contribution.
                    </h1>

                    <div className="text-lg text-slate-600 leading-relaxed mb-8 space-y-4">
                        <p>
                            {paymentData.responseCodeDescription || "Your payment was unsuccessful due to a technical issue or was declined by the bank."}
                        </p>
                        <p className="text-base border-l-4 border-slate-200 pl-4 italic">
                            <strong>Note:</strong> If your account has been debited, the amount is usually refunded by your bank within 5-7 business days. You can scan the QR code to check the real-time status.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200">
                        <a
                            href="/"
                            className="inline-flex justify-center items-center gap-2 px-8 py-3 bg-[#0067b8] border border-transparent rounded text-sm font-semibold text-white hover:bg-[#005da6] transition-colors shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                            Retry Payment
                        </a>
                    </div>

                    <div className="mt-12 flex items-center gap-6 border-t border-slate-100 pt-6">
                        <span className="text-sm text-slate-500 font-medium">Need help?</span>
                        <a href={`https://wa.me/918210228101?text=Payment%20Issue:%20${merchantTxnId}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-green-600 hover:underline flex items-center gap-1">
                            WhatsApp Support
                        </a>
                        <a href="mailto:info@satyalok.in" className="text-sm font-bold text-blue-600 hover:underline">
                            Email Helpdesk
                        </a>
                    </div>
                </div>

                {/* Right Column: Transaction Details Card */}
                <div className="lg:col-span-5 w-full">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden">
                        <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Attempted Amount</p>
                                <div className="text-4xl font-bold text-slate-400 line-through tracking-tight">
                                    {formattedAmount}
                                </div>
                            </div>
                            <div className="bg-white p-1.5 border border-slate-200 rounded-lg shadow-sm opacity-60">
                                <QRCodeSVG value={statusUrl} size={64} level="H" />
                            </div>
                        </div>

                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">Failure Details</h3>
                            <dl className="space-y-4 text-sm">
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-slate-500 font-medium">Receipt No.</dt>
                                    <dd className="col-span-2 text-slate-900 text-right font-mono break-all">{merchantTxnId}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-slate-500 font-medium">Status</dt>
                                    <dd className="col-span-2 text-red-600 text-right font-bold uppercase">{paymentData.responseCode || "FAILED"}</dd>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <dt className="text-slate-500 font-medium">Method</dt>
                                    <dd className="col-span-2 text-slate-900 text-right uppercase">{paymentData.paymentInstrument?.type || "N/A"}</dd>
                                </div>
                            </dl>

                            <div className="mt-8 flex justify-center opacity-20 grayscale">
                                <img src={failImg} alt="Failure Illustration" className="h-32 w-auto" />
                            </div>
                        </div>

                        <div className="bg-red-50 p-4 border-t border-red-100 text-center">
                            <p className="text-[10px] text-red-400 uppercase tracking-widest">
                                Scan QR to check if status updates automatically
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

Failure.propTypes = {
    data: PropTypes.shape({
        code: PropTypes.string.isRequired,
        message: PropTypes.string.isRequired,
        data: PropTypes.shape({
            merchantTransactionId: PropTypes.string.isRequired,
            amount: PropTypes.number.isRequired,
            paymentInstrument: PropTypes.shape({
                type: PropTypes.string,
                utr: PropTypes.string,
                accountType: PropTypes.string,
            }),
            responseCode: PropTypes.string,
            responseCodeDescription: PropTypes.string,
        }).isRequired,
    }).isRequired,
};

export default Failure;