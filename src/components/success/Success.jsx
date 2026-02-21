import React from "react";
import PropTypes from "prop-types";
import logo from "../../assets/logo.png";

function Success({
    amount,
    merchantTransactionId,
    transactionId,
    paymentInstrument,
    message,
    createdAt,
}) {
    const formatAmount = (val) => {
        return val.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const formatDate = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    const TransactionNumber = {
        UPI: { label: "UTR Number", field: "utr" },
        CARD: { label: "Card Type", field: "cardType" },
    };

    // Helper to render a data row
    const DataRow = ({ label, value, fontClass = "font-mono" }) => (
        <div className="flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                {label}
            </span>
            <span className={`text-sm text-slate-800 break-all ${fontClass}`}>
                {value || "N/A"}
            </span>
        </div>
    );

    DataRow.propTypes = {
        label: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        fontClass: PropTypes.string,
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-8 print:bg-white print:p-0">
            {/* Max-w-7xl Container */}
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center">
                
                {/* LEFT COLUMN: Receipt Card (Spans 6 columns on lg) */}
                <div className="lg:col-span-6 xl:col-span-5 lg:col-start-2 bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100 print:shadow-none print:border-none print:w-full max-w-lg mx-auto w-full">
                    
                    {/* Header Section */}
                    <div className="bg-emerald-500 p-8 text-center text-white print:bg-white print:text-emerald-800">
                        <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-5 backdrop-blur-sm print:bg-emerald-100">
                            <svg className="w-8 h-8 text-white print:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight mb-2">Donation Successful</h2>
                        <p className="text-emerald-50 font-medium text-sm print:text-emerald-600">{message}</p>
                        
                        <div className="mt-6">
                            <span className="text-5xl font-extrabold tracking-tight">
                                <span className="text-3xl opacity-80 mr-1">₹</span>
                                {formatAmount(amount / 100)}
                            </span>
                        </div>
                    </div>

                    {/* Dashed Divider for Receipt Look */}
                    <div className="relative flex justify-center print:hidden">
                        <div className="absolute -top-3 left-0 w-6 h-6 bg-slate-50 rounded-full border-r border-slate-100"></div>
                        <div className="w-full border-t-2 border-dashed border-slate-200 mt-0"></div>
                        <div className="absolute -top-3 right-0 w-6 h-6 bg-slate-50 rounded-full border-l border-slate-100"></div>
                    </div>

                    {/* Ticket Details */}
                    <div className="p-8">
                        <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                            <DataRow label="Date & Time" value={formatDate(createdAt)} fontClass="font-sans font-medium" />
                            <DataRow label="Ref. Number" value={merchantTransactionId} />
                            <DataRow label="PhonePe ID" value={transactionId} />
                            <DataRow label="Payment Method" value={paymentInstrument.type} fontClass="font-sans font-medium" />

                            {paymentInstrument.type in TransactionNumber && (
                                <div className="col-span-2 bg-slate-50 rounded-lg p-4 border border-slate-100">
                                    <DataRow
                                        label={TransactionNumber[paymentInstrument.type].label}
                                        value={paymentInstrument[TransactionNumber[paymentInstrument.type]?.field]?.replace("_", " ")}
                                    />
                                </div>
                            )}
                        </div>
                        
                        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                            <p className="text-xs text-slate-400">
                                A copy of this receipt has been sent to your registered email.
                            </p>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Impact Message & Actions (Spans 6 columns on lg) */}
                <div className="lg:col-span-5 flex flex-col justify-center text-center lg:text-left print:hidden max-w-lg mx-auto lg:max-w-none w-full">
                    <div className="mb-8 hidden lg:block">
                         <img src={logo} alt="Satyalok" className="h-16 w-auto grayscale hover:grayscale-0 transition-all duration-300" />
                    </div>
                    
                    <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                        Thank you for your generosity.
                    </h1>
                    
                    <p className="text-lg text-slate-600 leading-relaxed mb-10">
                        Your contribution makes a real difference. With your support, we can continue our mission of providing free education and accessible healthcare to underprivileged children, giving them the foundation they need to thrive.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <button
                            onClick={() => window.print()}
                            className="inline-flex justify-center items-center gap-2 px-6 py-3.5 bg-white border-2 border-slate-200 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            Print Receipt
                        </button>
                        
                        <a
                            href="https://donate.satyalok.in"
                            className="inline-flex justify-center items-center gap-2 px-6 py-3.5 bg-indigo-600 border-2 border-indigo-600 rounded-xl text-white font-semibold hover:bg-indigo-700 hover:border-indigo-700 transition-all shadow-sm shadow-indigo-200"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                            Donate Again
                        </a>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-200">
                        <p className="text-sm text-slate-500">
                            Questions about your donation? Reach out to us at <a href="mailto:info@satyalok.in" className="text-indigo-600 font-medium hover:underline">info@satyalok.in</a>
                        </p>
                        <div className="mt-4">
                            <a href="https://www.satyalok.in" className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
                                &larr; Return to Homepage
                            </a>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

Success.propTypes = {
    amount: PropTypes.number.isRequired,
    merchantTransactionId: PropTypes.string.isRequired,
    transactionId: PropTypes.string.isRequired,
    paymentInstrument: PropTypes.shape({
        type: PropTypes.string.isRequired,
        utr: PropTypes.string,
        cardType: PropTypes.string,
    }).isRequired,
    message: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
};

export default Success;