import PropTypes from "prop-types";
import logo from "../../assets/logo.png";
// Assuming you still want to use the gif, but a static icon is often more professional for the receipt itself.
// If you prefer the gif, replace the CheckCircleIcon SVG below with your img tag.

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
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                {label}
            </span>
            <span className={`text-sm text-slate-900 break-all ${fontClass}`}>
                {value}
            </span>
        </div>
    );

    DataRow.propTypes = {
        label: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        fontClass: PropTypes.string,
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 print:bg-white print:p-0">
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 print:shadow-none print:border-none">
                
                {/* Header Section */}
                <div className="bg-emerald-50 p-8 text-center border-b border-emerald-100">
                    <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                        {/* Simple SVG Checkmark - simpler and cleaner than a GIF for a receipt */}
                        <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-emerald-800 mb-1">Donation Successful</h2>
                    <p className="text-emerald-600 font-medium">{message}</p>
                    
                    <div className="mt-6">
                        <span className="text-4xl font-extrabold text-slate-900">
                            <span className="text-2xl text-slate-500 mr-1">₹</span>
                            {formatAmount(amount / 100)}
                        </span>
                    </div>
                </div>

                {/* Ticket Details */}
                <div className="p-6 sm:p-8">
                    {/* Transaction Details Grid */}
                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <DataRow 
                                label="Date & Time" 
                                value={formatDate(createdAt)} 
                            />
                            <DataRow 
                                label="Ref. Number" 
                                value={merchantTransactionId} 
                            />
                            <DataRow 
                                label="PhonePe ID" 
                                value={transactionId} 
                            />
                            <DataRow 
                                label="Payment Method" 
                                value={paymentInstrument.type} 
                            />

                            {paymentInstrument.type in TransactionNumber && (
                                <div className="col-span-2">
                                    <DataRow
                                        label={TransactionNumber[paymentInstrument.type].label}
                                        value={paymentInstrument[TransactionNumber[paymentInstrument.type]?.field]?.replace("_", " ")}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Message Section */}
                    <div className="mt-8">
                        <div className="flex items-center justify-center mb-4 opacity-80">
                            <img src={logo} alt="Satyalok" className="h-10 w-auto grayscale hover:grayscale-0 transition-all" />
                        </div>
                        <div className="text-center">
                            <p className="text-sm text-slate-600 italic leading-relaxed px-4">
                                &quot;Dear Donor, thank you for your generous contribution. Your support helps us make a real difference in society.&quot;
                            </p>
                            <p className="mt-4 text-xs text-slate-400">
                                A copy of this receipt has been sent to your email.
                                <br />
                                Questions? <a href="mailto:info@satyalok.in" className="text-indigo-600 hover:underline">info@satyalok.in</a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Action Footer */}
                <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors shadow-sm"
                    >
                        <i className="fas fa-print text-sm"></i>
                        <span>Download / Print</span>
                    </button>
                    
                    <a
                        href="https://donate.satyalok.in"
                        className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 bg-indigo-600 border border-transparent rounded-lg text-white font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <i className="fas fa-heart text-sm"></i>
                        <span>Donate Again</span>
                    </a>
                </div>
                
                <div className="text-center pb-4 pt-2 print:hidden">
                     <a href="https://www.satyalok.in" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
                        &larr; Return to Home
                    </a>
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
    createdAt: PropTypes.string, // Added missing propType
};

export default Success;