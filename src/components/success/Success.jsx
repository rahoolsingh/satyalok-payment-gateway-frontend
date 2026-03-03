import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { Share2, Download, CheckCircle2, Heart } from "lucide-react";
import logo from "../../assets/logo.png";

function Success({
  amount,
  merchantTransactionId,
  transactionId,
  paymentInstrument,
  message,
  createdAt,
}) {
  const receiptRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const statusUrl = `https://donate.satyalok.in/status/${merchantTransactionId}`;
  const donationInRs = amount / 100;

  // Impact Calculation based on ₹500 per child (₹1000 = 2 children)
  const childrenSupported = Math.floor(donationInRs / 500);

  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(donationInRs);

  const formatDate = (isoString) => {
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(isoString ? new Date(isoString) : new Date());
  };

  const captureReceipt = async () => {
    if (!receiptRef.current) return null;
    return await html2canvas(receiptRef.current, {
      scale: 3, 
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });
  };

  const handleDownload = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const canvas = await captureReceipt();
      if (canvas) {
        const link = document.createElement("a");
        link.download = `Satyalok_Receipt_${merchantTransactionId}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    try {
      const canvas = await captureReceipt();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        const file = new File([blob], `Receipt_${merchantTransactionId}.png`, { type: "image/png" });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: "Contribution Receipt",
              text: "I just supported Satyalok. Join the movement to provide education for all!",
              files: [file],
            });
          } catch (err) {
            if (err.name !== "AbortError") handleDownload();
          }
        } else {
          handleDownload();
        }
      }, "image/png");
    } finally {
      setIsProcessing(false);
    }
  };

  const TransactionDetails = {
    UPI: { label: "UPI UTR", field: "utr" },
    CARD: { label: "Card Type", field: "cardType" },
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:py-16 font-sans w-full">
      
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-12 lg:gap-20 items-center lg:items-start">
        
        {/* LEFT COLUMN: Impact & Actions */}
        <div className="w-full lg:w-1/2 flex flex-col order-1">
          
          <div className="mb-8 text-center lg:text-left">
            <div className="inline-flex items-center justify-center lg:justify-start gap-2 text-green-600 mb-3">
              <CheckCircle2 size={24} />
              <span className="font-semibold tracking-wide uppercase text-sm">Payment Successful</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-light text-gray-900 tracking-tight mb-4">
              Thank you!
            </h1>
            <p className="text-gray-500 text-lg">
              Your contribution of {formattedAmount} has been received securely.
            </p>
          </div>

          {/* IMPACT CARD */}
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
            <div className="flex items-center gap-2 text-emerald-800 mb-3">
              <Heart size={18} fill="currentColor" />
              <h2 className="text-xs font-bold uppercase tracking-widest">Your Impact</h2>
            </div>
            
            <h3 className="text-2xl sm:text-3xl font-light text-emerald-950 mb-4">
              {childrenSupported >= 1 
                ? `${childrenSupported} Child${childrenSupported > 1 ? 'ren' : ''} supported with education` 
                : "Crucial learning materials provided"}
            </h3>
            
            <p className="text-emerald-800/80 leading-relaxed text-sm sm:text-base">
              This contribution helps provide educational support to children from vulnerable backgrounds, including learning materials and academic assistance, enabling their overall development and future opportunities.
            </p>
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-col gap-4">
            
            {/* Primary Receipt Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleDownload}
                disabled={isProcessing}
                className="flex-1 flex justify-center items-center gap-2 px-6 py-3.5 bg-white border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
              >
                <Download size={18} /> 
                {isProcessing ? "Processing..." : "Download Receipt"}
              </button>
              <button
                onClick={handleShare}
                disabled={isProcessing}
                className="flex-1 flex justify-center items-center gap-2 px-6 py-3.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-black transition-colors shadow-sm disabled:opacity-50"
              >
                <Share2 size={18} /> 
                Share Receipt
              </button>
            </div>

            {/* Contribute Again Button */}
            <a
              href="https://donate.satyalok.in"
              className="flex justify-center items-center gap-2 w-full px-6 py-3.5 bg-emerald-100/50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition-colors shadow-sm"
            >
              <Heart size={16} className="text-emerald-600" />
              Make Another Contribution
            </a>

          </div>

        </div>

        {/* RIGHT COLUMN: The Receipt */}
        <div className="w-full lg:w-1/2 flex justify-center lg:justify-end order-2">
          
          <div
            ref={receiptRef}
            className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
          >
            {/* Top Section */}
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-center mb-8">
                <img src={logo} alt="Satyalok" className="h-7 sm:h-8" />
                <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                  Receipt
                </span>
              </div>

              <div className="text-center mb-2">
                <p className="text-sm font-medium text-gray-500 mb-1">Amount Paid</p>
                <h2 className="text-4xl sm:text-5xl font-light text-gray-900 tracking-tight">
                  {formattedAmount}
                </h2>
              </div>
            </div>

            {/* Dashed Separator */}
            <div className="relative flex items-center justify-center px-6">
              <div className="absolute left-0 w-4 h-8 bg-gray-50 rounded-r-full border-y border-r border-gray-200" style={{ marginLeft: "-1px" }}></div>
              <div className="w-full border-t-2 border-dashed border-gray-200"></div>
              <div className="absolute right-0 w-4 h-8 bg-gray-50 rounded-l-full border-y border-l border-gray-200" style={{ marginRight: "-1px" }}></div>
            </div>

            {/* Details Section */}
            <div className="p-6 sm:p-8">
              <div className="grid grid-cols-2 gap-4">
                
                {/* Short Data: Horizontal Split */}
                <div className="col-span-1 flex flex-col">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Date</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(createdAt)}</span>
                </div>
                
                <div className="col-span-1 flex flex-col items-end text-right">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Method</span>
                  <span className="text-sm font-medium text-gray-900 uppercase">{paymentInstrument.type}</span>
                </div>

                {/* Long Data: Vertical Stack with Break-All */}
                <div className="col-span-2 bg-gray-50 rounded-xl p-4 mt-2 border border-gray-100">
                  <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Transaction ID</span>
                  <span className="block text-sm sm:text-base font-mono text-gray-900 break-all leading-tight">
                    {transactionId}
                  </span>
                </div>

                <div className="col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Receipt Number</span>
                  <span className="block text-sm font-mono text-gray-900 break-all leading-tight">
                    {merchantTransactionId}
                  </span>
                </div>

                {paymentInstrument.type in TransactionDetails && paymentInstrument[TransactionDetails[paymentInstrument.type]?.field] && (
                  <div className="col-span-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                      {TransactionDetails[paymentInstrument.type].label}
                    </span>
                    <span className="block text-sm font-mono text-gray-900 break-all leading-tight">
                      {paymentInstrument[TransactionDetails[paymentInstrument.type].field].replace("_", " ")}
                    </span>
                  </div>
                )}
                
              </div>
            </div>

            {/* Footer & QR */}
            <div className="bg-gray-50 px-6 py-6 sm:px-8 border-t border-gray-100 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Satyalok</p>
                <p className="text-xs text-gray-500 mt-1 max-w-[200px] leading-relaxed">
                  Scan QR code to instantly verify this transaction.
                </p>
              </div>
              <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm shrink-0">
                <QRCodeSVG value={statusUrl} size={56} level="L" />
              </div>
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
  message: PropTypes.string,
  createdAt: PropTypes.string,
};

export default Success;