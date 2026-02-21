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
    const formattedAmount = (amount / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    const formatDate = (isoString) => {
        if (!isoString) return new Date().toLocaleDateString('en-IN');
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        }).format(new Date(isoString));
    };

    const TransactionNumber = {
        UPI: { label: "UPI UTR", field: "utr" },
        CARD: { label: "Card Type", field: "cardType" },
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <>
            {/* =========================================
                WEB UI (Hidden during print)
                ========================================= */}
            <div className="w-full bg-transparent min-h-[80vh] flex items-center py-12 px-4 sm:px-6 lg:px-8 print:hidden">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                    
                    {/* Left Column: Mission & Actions */}
                    <div className="flex flex-col justify-center text-center lg:text-left order-2 lg:order-1">
                        <div className="mb-6 hidden lg:block">
                            <img src={logo} alt="Satyalok" className="h-14 w-auto object-contain" />
                        </div>
                        
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 text-emerald-800 font-medium text-sm w-max mx-auto lg:mx-0 mb-6">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Donation Successful
                        </div>

                        <h1 className="text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
                            Thank you for being a catalyst for change.
                        </h1>
                        
                        <p className="text-lg text-slate-600 leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0">
                            {message || "Your generous contribution directly supports our mission to provide free education and accessible healthcare to underprivileged children. Together, we are building a brighter future."}
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <button
                                onClick={handlePrint}
                                className="inline-flex justify-center items-center gap-2 px-6 py-3.5 bg-white border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm group"
                            >
                                <svg className="w-5 h-5 text-slate-400 group-hover:text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                Download Receipt
                            </button>
                            
                            <a
                                href="https://donate.satyalok.in"
                                className="inline-flex justify-center items-center gap-2 px-6 py-3.5 bg-slate-900 border border-transparent rounded-xl text-white font-semibold hover:bg-slate-800 transition-all shadow-md"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                                Donate Again
                            </a>
                        </div>
                    </div>

                    {/* Right Column: Web Receipt Card */}
                    <div className="order-1 lg:order-2 w-full max-w-md mx-auto lg:ml-auto">
                        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 relative">
                            {/* Decorative top accent */}
                            <div className="h-2 w-full bg-emerald-500"></div>
                            
                            <div className="p-8">
                                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-2">Contribution Amount</p>
                                <div className="text-5xl font-extrabold text-slate-900 mb-8 tracking-tight">
                                    <span className="text-3xl font-medium text-slate-400 mr-1">₹</span>
                                    {formattedAmount}
                                </div>

                                <div className="space-y-6">
                                    <div className="flex justify-between border-b border-slate-100 pb-4">
                                        <span className="text-slate-500 text-sm">Date</span>
                                        <span className="text-slate-900 font-medium text-sm text-right">{formatDate(createdAt)}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-4">
                                        <span className="text-slate-500 text-sm">Receipt No.</span>
                                        <span className="text-slate-900 font-mono text-sm text-right break-all ml-4">{merchantTransactionId}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-4">
                                        <span className="text-slate-500 text-sm">Transaction ID</span>
                                        <span className="text-slate-900 font-mono text-sm text-right break-all ml-4">{transactionId}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-slate-100 pb-4">
                                        <span className="text-slate-500 text-sm">Payment Method</span>
                                        <span className="text-slate-900 font-medium text-sm text-right uppercase">{paymentInstrument.type}</span>
                                    </div>
                                    
                                    {paymentInstrument.type in TransactionNumber && (
                                        <div className="flex justify-between pb-2">
                                            <span className="text-slate-500 text-sm">{TransactionNumber[paymentInstrument.type].label}</span>
                                            <span className="text-slate-900 font-mono text-sm text-right ml-4">
                                                {paymentInstrument[TransactionNumber[paymentInstrument.type]?.field]?.replace("_", " ")}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                                <a href="https://www.satyalok.in" className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                                    Return to Homepage &rarr;
                                </a>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* =========================================
                PRINT UI (Hidden on screen, visible on print)
                ========================================= */}
            <div className="hidden print:block w-full max-w-4xl mx-auto bg-white text-black p-10 font-sans">
                {/* Header Section */}
                <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                    <div>
                        <img src={logo} alt="Satyalok Logo" className="h-16 w-auto mb-3" />
                        <h2 className="text-2xl font-bold tracking-tight uppercase">Satyalok</h2>
                        <p className="text-sm text-slate-600 mt-1">Providing Free Education & Healthcare</p>
                        <p className="text-sm text-slate-600">Ranchi, Jharkhand, India</p>
                        <p className="text-sm text-slate-600">info@satyalok.in | www.satyalok.in</p>
                    </div>
                    <div className="text-right">
                        <h1 className="text-3xl font-light text-slate-500 tracking-widest uppercase mb-2">Receipt</h1>
                        <p className="text-sm font-bold"><span className="text-slate-500 font-normal">Date: </span>{formatDate(createdAt)}</p>
                        <p className="text-sm font-bold"><span className="text-slate-500 font-normal">Receipt No: </span>{merchantTransactionId}</p>
                    </div>
                </div>

                {/* Acknowledgment Message */}
                <div className="mb-10 text-lg leading-relaxed">
                    <p>Dear Donor,</p>
                    <p className="mt-2">
                        We gratefully acknowledge the receipt of your generous contribution. Your support empowers us to continue our mission of bringing education and accessible healthcare to those who need it most.
                    </p>
                </div>

                {/* Transaction Details Table */}
                <table className="w-full mb-12 border-collapse">
                    <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                            <th className="py-3 px-4 text-left text-sm font-semibold text-slate-700 uppercase">Description</th>
                            <th className="py-3 px-4 text-right text-sm font-semibold text-slate-700 uppercase">Details</th>
                        </tr>
                    </thead>
                    <tbody className="border-b border-slate-300">
                        <tr className="border-b border-slate-200">
                            <td className="py-4 px-4 text-sm text-slate-700">Transaction ID</td>
                            <td className="py-4 px-4 text-sm font-mono text-right">{transactionId}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                            <td className="py-4 px-4 text-sm text-slate-700">Payment Method</td>
                            <td className="py-4 px-4 text-sm text-right uppercase">{paymentInstrument.type}</td>
                        </tr>
                        {paymentInstrument.type in TransactionNumber && (
                            <tr className="border-b border-slate-200">
                                <td className="py-4 px-4 text-sm text-slate-700">{TransactionNumber[paymentInstrument.type].label}</td>
                                <td className="py-4 px-4 text-sm font-mono text-right">
                                    {paymentInstrument[TransactionNumber[paymentInstrument.type]?.field]?.replace("_", " ")}
                                </td>
                            </tr>
                        )}
                        <tr className="bg-slate-50">
                            <td className="py-5 px-4 text-lg font-bold text-slate-900">Total Contribution Received</td>
                            <td className="py-5 px-4 text-xl font-bold text-slate-900 text-right">₹ {formattedAmount}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Footer & Signature Area */}
                <div className="flex justify-between items-end mt-24">
                    <div className="text-xs text-slate-500 max-w-sm">
                        <p className="mb-1 font-semibold text-slate-700">Terms & Conditions:</p>
                        <p>This is a computer-generated receipt and does not require a physical signature. Donations made are non-refundable.</p>
                    </div>
                    <div className="text-center">
                        <div className="w-48 border-t border-slate-800 mb-2 mx-auto"></div>
                        <p className="text-sm font-semibold">Authorized Signatory</p>
                        <p className="text-xs text-slate-600">Satyalok</p>
                    </div>
                </div>
            </div>
        </>
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
    message: PropTypes.string,
    createdAt: PropTypes.string,
};

export default Success;