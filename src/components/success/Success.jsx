import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from 'html2canvas'; // Requirement: npm install html2canvas
import logo from "../../assets/logo.png";

function Success({
    amount,
    merchantTransactionId,
    transactionId,
    paymentInstrument,
    message,
    createdAt,
}) {
    const receiptRef = useRef(null); // Ref for the area to capture as a screenshot
    const [isSharing, setIsSharing] = useState(false);

    // Dynamic URL for status redirection/verification
    const statusUrl = `https://donate.satyalok.in/status/${merchantTransactionId}`;

    // Utilizing Intl.NumberFormat for precise Indian Rupee formatting
    const formattedAmount = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
    }).format(amount / 100);

    const formatDate = (isoString) => {
        if (!isoString) return new Date().toLocaleDateString('en-IN');
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(new Date(isoString));
    };

    const TransactionNumber = {
        UPI: { label: "UPI UTR", field: "utr" },
        CARD: { label: "Card Type", field: "cardType" },
    };

    // Function to handle generating screenshot and sharing
    const handleShare = async () => {
        if (!receiptRef.current || isSharing) return;
        setIsSharing(true);

        try {
            // Generate canvas from the DOM element
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2, // Higher scale for better image quality
                backgroundColor: '#ffffff', // Ensure white background
                logging: false,
                useCORS: true // Needed if any images inside are served from a different origin
            });

            canvas.toBlob(async (blob) => {
                if (!blob) {
                     alert("Failed to generate receipt image.");
                     setIsSharing(false);
                     return;
                }

                const file = new File([blob], `satyalok-receipt-${merchantTransactionId}.png`, { type: 'image/png' });

                // Check if Web Share API is supported and can share files
                if (navigator.canShare && navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: 'My Contribution to Satyalok',
                            text: `I just contributed towards a brighter future with Satyalok. Receipt Status: ${statusUrl} #Satyalok #EducationForAll #HoliHai`,
                            files: [file],
                        });
                    } catch (shareError) {
                        if (shareError.name !== 'AbortError') {
                             console.error('Error sharing:', shareError);
                             // Fallback to download if share fails genuinely
                             downloadImage(canvas);
                        }
                    }
                } else {
                    // Fallback for desktop/unsupported browsers: Download the image
                    downloadImage(canvas);
                    alert("Sharing is not supported on this browser/device. The receipt image has been downloaded instead.");
                }
                setIsSharing(false);
            }, 'image/png');

        } catch (error) {
            console.error("Screenshot failed:", error);
            alert("An error occurred while trying to create the receipt screenshot.");
            setIsSharing(false);
        }
    };

    const downloadImage = (canvas) => {
        const link = document.createElement('a');
        link.download = `satyalok-receipt-${merchantTransactionId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };


    return (
        <>
            {/* =========================================
                WEB UI (On-Screen Receipt)
                ========================================= */}
            <div className="w-full bg-slate-50 min-h-[85vh] flex items-center py-12 px-4 sm:px-6 lg:px-8 print:hidden font-sans text-slate-900">
                <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">

                    {/* Left Column: Thank You Copy with HOLI HEADER */}
                    <div className="lg:col-span-7 flex flex-col justify-center lg:pr-8 order-2 lg:order-1">

                        {/* --- HOLI THEMED HEADER START --- */}
                        <div className="relative overflow-hidden rounded-2xl shadow-xl mb-10 p-8 lg:p-10 bg-gradient-to-br from-pink-600 via-purple-600 to-yellow-500 text-white">
                             {/* Decorative Splash Pattern overlay */}
                            <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")` }}></div>
                            
                            <div className="relative z-10">
                                <div className="mb-8 hidden lg:block">
                                    {/* Using brighter logo placeholder if needed, or filter existing one for white text support */}
                                    <img src={logo} alt="Satyalok" className="h-14 w-auto object-contain brightness-0 invert drop-shadow-md" />
                                </div>

                                <div className="flex items-center gap-3 mb-6">
                                    <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/40">
                                        <svg className="w-5 h-5 text-white drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                    <h2 className="text-sm font-bold text-white uppercase tracking-wider drop-shadow-sm">Payment Successful</h2>
                                </div>

                                <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-2 drop-shadow-md leading-tight">
                                    Colors of Kindness!
                                </h1>
                                <p className="text-xl font-medium text-pink-100 drop-shadow">Thank you for spreading joy this Holi.</p>
                            </div>
                        </div>
                        {/* --- HOLI THEMED HEADER END --- */}


                        <div className="text-lg text-slate-600 leading-relaxed mb-10 space-y-4 px-2">
                            <p>
                                {message || "Thank you for your valuable contribution. Just as Holi brings people together in a celebration of colors, your generosity brings hope and vibrancy to lives that need it most."}
                            </p>
                            <p>
                                By supporting Satyalok, you are helping paint a brighter, more colorful future for underprivileged children.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-200">
                            {/* NEW SHARE BUTTON */}
                            <button
                                onClick={handleShare}
                                disabled={isSharing}
                                className={`inline-flex flex-1 sm:flex-none justify-center items-center gap-2 px-6 py-3 bg-indigo-600 border border-transparent rounded-lg text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm ${isSharing ? 'opacity-70 cursor-wait' : ''}`}
                            >
                                {isSharing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Preparing...
                                    </>
                                ) : (
                                    <>
                                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                        Share Receipt
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => window.print()}
                                className="inline-flex flex-1 sm:flex-none justify-center items-center gap-2 px-6 py-3 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
                            >
                                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                Print
                            </button>

                            <a
                                href="https://donate.satyalok.in"
                                className="inline-flex flex-1 sm:flex-none justify-center items-center gap-2 px-6 py-3 bg-[#0067b8] border border-transparent rounded-lg text-sm font-semibold text-white hover:bg-[#005da6] transition-colors shadow-sm"
                            >
                                Contribute Again
                            </a>
                        </div>
                    </div>

                    {/* Right Column: Web Receipt Card with QR - THIS AREA WILL BE SCREENSHOTTED */}
                    <div className="lg:col-span-5 w-full order-1 lg:order-2 mb-12 lg:mb-0" ref={receiptRef}>
                        <div className="bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden relative">
                            {/* Slight decorative top border for the receipt card */}
                            <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500"></div>

                            <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Total Contribution</p>
                                    <div className="text-4xl font-extrabold text-slate-900 tracking-tight">
                                        {formattedAmount}
                                    </div>
                                </div>
                                {/* QR Code for status tracking */}
                                <div className="bg-white p-2 border border-slate-200 rounded-xl shadow-sm">
                                    <QRCodeSVG value={statusUrl} size={72} level="H" />
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                                     <h3 className="text-lg font-bold text-slate-900">Transaction Details</h3>
                                     <img src={logo} alt="Satyalok" className="h-6 w-auto opacity-50 grayscale" />
                                </div>


                                <dl className="space-y-5 text-sm">
                                    <div className="grid grid-cols-3 gap-4">
                                        <dt className="text-slate-500 font-medium">Date & Time</dt>
                                        <dd className="col-span-2 text-slate-900 font-medium text-right">{formatDate(createdAt)}</dd>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <dt className="text-slate-500 font-medium">Receipt No.</dt>
                                        <dd className="col-span-2 text-slate-900 font-medium text-right font-mono break-all">{merchantTransactionId}</dd>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <dt className="text-slate-500 font-medium">Transaction ID</dt>
                                        <dd className="col-span-2 text-slate-900 font-medium text-right font-mono break-all ">{transactionId}</dd>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <dt className="text-slate-500 font-medium">Method</dt>
                                        <dd className="col-span-2 text-slate-900 font-medium text-right uppercase bg-slate-100 py-1 px-3 rounded-full inline-block justify-self-end">{paymentInstrument.type}</dd>
                                    </div>

                                    {paymentInstrument.type in TransactionNumber && (
                                        <div className="grid grid-cols-3 gap-4 items-center">
                                            <dt className="text-slate-500 font-medium">{TransactionNumber[paymentInstrument.type].label}</dt>
                                            <dd className="col-span-2 text-slate-700 text-right font-mono text-xs break-all">
                                                {paymentInstrument[TransactionNumber[paymentInstrument.type]?.field]?.replace("_", " ")}
                                            </dd>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            <div className="bg-slate-50 p-5 border-t border-slate-200 text-center">
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1 font-bold">Scan QR to verify status</p>
                                <p className="text-xs text-slate-500 font-medium">
                                    Satyalok - A New Hope
                                </p>
                            </div>
                        </div>
                         <p className="text-center text-xs text-slate-400 mt-4 lg:hidden">The section above will be captured when sharing.</p>
                    </div>

                </div>
            </div>

            {/* =========================================
                PRINT UI (Formal Indian NGO Receipt) - NO CHANGES HERE
                ========================================= */}
            <div className="hidden print:block w-full max-w-4xl mx-auto bg-white text-black p-2 font-sans">
                 {/* ... (The Print UI remains exactly the same as the original code) ... */}
                 {/* Header: Organization & QR Verification */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                    <div className="flex flex-col gap-4">
                        <img src={logo} alt="Satyalok Logo" className="h-16 max-w-fit w-auto object-contain object-left" />
                        <div>
                            <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
                                Satyalok - A New Hope
                            </h2>
                            <p className="text-xs text-slate-600">Email: info@satyalok.in | Web: www.satyalok.in</p>
                        </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                        <h1 className="text-2xl font-bold text-slate-800 uppercase mb-2">Donation Receipt</h1>
                        <p className="text-sm"><span className="font-semibold text-slate-600">Date: </span>{formatDate(createdAt)}</p>
                        <p className="text-sm"><span className="font-semibold text-slate-600">Receipt No: </span>{merchantTransactionId}</p>

                        {/* Print QR Code */}
                        <div className="mt-4 p-2 border border-slate-200 rounded bg-white flex flex-col items-center">
                            <QRCodeSVG value={statusUrl} size={80} />
                        </div>
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

                {/* Footer */}
                <div className="flex justify-between items-end mt-20 pt-8 border-t border-slate-200">
                    <div className="text-[10px] text-slate-500 max-w-md leading-tight">
                        <p className="font-bold text-slate-700 mb-1">Important Information:</p>
                        <ul className="list-disc pl-3 space-y-1">
                            <li>This is a computer-generated receipt and requires no physical signature.</li>
                            <li>Please retain this document for your financial and tax records.</li>
                            <li>You can verify this receipt online by scanning the QR code above.</li>
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