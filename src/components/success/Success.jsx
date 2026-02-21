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
    // Utilizing Intl.NumberFormat for precise Indian Rupee (Lakh/Crore) formatting
    const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount / 100);

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

    return (
        <>
            {/* =========================================
                WEB UI (Corporate & Clean)
                ========================================= */}
            <div className="w-full bg-transparent min-h-[85vh] flex items-center py-16 px-4 sm:px-6 lg:px-8 print:hidden font-sans text-slate-900">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                    
                    {/* Left Column: Impact Copy & Actions (Spans 7 columns) */}
                    <div className="lg:col-span-7 flex flex-col justify-center lg:pr-8">
                        <div className="mb-8 hidden lg:block">
                            <img src={logo} alt="Satyalok" className="h-12 w-auto object-contain grayscale opacity-80" />
                        </div>
                        
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center border border-green-200">
                                <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wide">Payment Successful</h2>
                        </div>

                        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight mb-6">
                            Thank you for your support!
                        </h1>
                        
                        <div className="text-lg text-slate-600 leading-relaxed mb-8 space-y-4">
                            <p>
                                {message || "Thank you for your valuable contribution. In India, every step towards accessible education and healthcare creates a ripple effect of progress for generations to come."}
                            </p>
                            <p>
                                By supporting Satyalok, you are doing more than making a donation—you are giving an underprivileged child the foundation to break the cycle of poverty and build a brighter tomorrow. 
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-200">
                            <button
                                onClick={() => window.print()}
                                className="inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-white border border-slate-300 rounded text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                Print Receipt
                            </button>
                            
                            <a
                                href="https://donate.satyalok.in"
                                className="inline-flex justify-center items-center gap-2 px-6 py-2.5 bg-[#0067b8] border border-transparent rounded text-sm font-semibold text-white hover:bg-[#005da6] transition-colors shadow-sm"
                            >
                                Make Another Contribution
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                            </a>
                        </div>
                    </div>

                    {/* Right Column: Web Receipt Card (Spans 5 columns) */}
                    <div className="lg:col-span-5 w-full">
                        <div className="bg-white border border-slate-200 shadow-sm rounded-md overflow-hidden">
                            <div className="bg-slate-50 p-6 border-b border-slate-200">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Total Contribution</p>
                                <div className="text-4xl font-bold text-slate-900 tracking-tight">
                                    {formattedAmount}
                                </div>
                            </div>
                            
                            <div className="p-6">
                                <h3 className="text-sm font-semibold text-slate-900 mb-4 pb-2 border-b border-slate-100">Transaction Details</h3>
                                
                                <dl className="space-y-4 text-sm">
                                    <div className="grid grid-cols-3 gap-4">
                                        <dt className="text-slate-500 font-medium">Date & Time</dt>
                                        <dd className="col-span-2 text-slate-900 text-right">{formatDate(createdAt)}</dd>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <dt className="text-slate-500 font-medium">Receipt No.</dt>
                                        <dd className="col-span-2 text-slate-900 text-right font-mono break-all">{merchantTransactionId}</dd>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <dt className="text-slate-500 font-medium">Transaction ID</dt>
                                        <dd className="col-span-2 text-slate-900 text-right font-mono break-all">{transactionId}</dd>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <dt className="text-slate-500 font-medium">Method</dt>
                                        <dd className="col-span-2 text-slate-900 text-right uppercase">{paymentInstrument.type}</dd>
                                    </div>
                                    
                                    {paymentInstrument.type in TransactionNumber && (
                                        <div className="grid grid-cols-3 gap-4">
                                            <dt className="text-slate-500 font-medium">{TransactionNumber[paymentInstrument.type].label}</dt>
                                            <dd className="col-span-2 text-slate-900 text-right font-mono">
                                                {paymentInstrument[TransactionNumber[paymentInstrument.type]?.field]?.replace("_", " ")}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            <div className="bg-slate-50 p-4 border-t border-slate-200 text-center">
                                <p className="text-xs text-slate-500">
                                    A copy of this receipt has been emailed to you for your records.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            {/* =========================================
                PRINT UI (Formal Indian NGO Receipt)
                ========================================= */}
            <div className="hidden print:block w-full max-w-4xl mx-auto bg-white text-black p-12 font-sans">
                {/* Header: Organization Details */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                    <div className="flex flex-col items-center gap-4">
                        <img src={logo} alt="Satyalok Logo" className="h-16 w-auto" />
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Satyalok</h2>
                            <p className="text-xs text-slate-600 mt-1">Empowering through Education & Healthcare</p>
                            <p className="text-xs text-slate-600">Registered Office: Ranchi, Jharkhand, India</p>
                            <p className="text-xs text-slate-600">Email: info@satyalok.in | Web: www.satyalok.in</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-2xl font-bold text-slate-800 uppercase mb-2">Donation Receipt</h1>
                        <p className="text-sm"><span className="font-semibold text-slate-600">Date: </span>{formatDate(createdAt)}</p>
                        <p className="text-sm"><span className="font-semibold text-slate-600">Receipt No: </span>{merchantTransactionId}</p>
                    </div>
                </div>

                {/* Acknowledgment Message */}
                <div className="mb-8 text-sm leading-relaxed text-slate-800">
                    <p className="mb-4"><strong>Dear Donor,</strong></p>
                    <p>
                        We gratefully acknowledge the receipt of your generous contribution. Your support is instrumental in advancing our grassroots initiatives. By investing in the fundamental rights of education and healthcare, you are actively participating in the nation-building process.
                    </p>
                </div>

                {/* Formal Transaction Table */}
                <table className="w-full mb-10 border border-slate-300">
                    <thead>
                        <tr className="bg-slate-100 border-b border-slate-300">
                            <th className="py-2 px-4 text-left text-xs font-bold text-slate-800 uppercase tracking-wider">Description</th>
                            <th className="py-2 px-4 text-right text-xs font-bold text-slate-800 uppercase tracking-wider">Amount / Details</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        <tr className="border-b border-slate-200">
                            <td className="py-3 px-4 text-slate-800">Bank Transaction ID</td>
                            <td className="py-3 px-4 font-mono text-right">{transactionId}</td>
                        </tr>
                        <tr className="border-b border-slate-200">
                            <td className="py-3 px-4 text-slate-800">Payment Mode</td>
                            <td className="py-3 px-4 text-right uppercase">{paymentInstrument.type}</td>
                        </tr>
                        {paymentInstrument.type in TransactionNumber && (
                            <tr className="border-b border-slate-200">
                                <td className="py-3 px-4 text-slate-800">{TransactionNumber[paymentInstrument.type].label}</td>
                                <td className="py-3 px-4 font-mono text-right">
                                    {paymentInstrument[TransactionNumber[paymentInstrument.type]?.field]?.replace("_", " ")}
                                </td>
                            </tr>
                        )}
                        <tr className="bg-slate-50 border-t-2 border-slate-800">
                            <td className="py-4 px-4 font-bold text-slate-900 uppercase">Total Contribution Received</td>
                            <td className="py-4 px-4 font-bold text-slate-900 text-right text-lg">{formattedAmount}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Footer & Authorized Signatory */}
                <div className="flex justify-between items-end mt-20 pt-8 border-t border-slate-200">
                    <div className="text-[10px] text-slate-500 max-w-md leading-tight">
                        <p className="font-bold text-slate-700 mb-1">Important Information:</p>
                        <ul className="list-disc pl-3 space-y-1">
                            <li>This is a computer-generated receipt and requires no physical signature.</li>
                            <li>Please retain this document for your financial and tax records.</li>
                            <li>Donations once processed are non-refundable.</li>
                        </ul>
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