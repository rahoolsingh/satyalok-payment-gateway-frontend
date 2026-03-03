import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { Share2, Download, CheckCircle2 } from "lucide-react";
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

  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount / 100);

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
      scale: 3, // High resolution for crisp text
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
        link.download = `Receipt_${merchantTransactionId}.png`;
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
              text: "Transaction receipt for my contribution.",
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
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:py-12 flex flex-col items-center font-sans">
      
      {/* Container locked to max-w-lg. 
        This ensures it looks like a clean, constrained receipt card on desktop, 
        but fluidly fills the screen on mobile. 
      */}
      <div className="relative w-full max-w-lg">
        
        {/* Action Bar - Excluded from Image Capture */}
        <div 
          data-html2canvas-ignore="true" 
          className="flex justify-end gap-3 mb-4"
        >
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Download size={16} /> 
            {isProcessing ? "Processing..." : "Download"}
          </button>
          <button
            onClick={handleShare}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-black transition-colors shadow-sm disabled:opacity-50"
          >
            <Share2 size={16} /> 
            Share
          </button>
        </div>

        {/* RECEIPT CARD */}
        <div
          ref={receiptRef}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          {/* Top Section */}
          <div className="p-6 sm:p-8">
            <div className="flex justify-between items-center mb-8">
              <img src={logo} alt="Satyalok" className="h-6 sm:h-8" />
              <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-semibold">
                <CheckCircle2 size={14} />
                Success
              </div>
            </div>

            <div className="text-center mb-2">
              <p className="text-sm font-medium text-gray-500 mb-1">Amount Paid</p>
              <h1 className="text-4xl sm:text-5xl font-light text-gray-900 tracking-tight">
                {formattedAmount}
              </h1>
            </div>
          </div>

          {/* Dashed Separator */}
          <div className="relative flex items-center justify-center px-6">
            <div className="absolute left-0 w-3 h-6 bg-gray-100 rounded-r-full border-y border-r border-gray-200"></div>
            <div className="w-full border-t-2 border-dashed border-gray-200"></div>
            <div className="absolute right-0 w-3 h-6 bg-gray-100 rounded-l-full border-y border-l border-gray-200"></div>
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
              <div className="col-span-2 bg-gray-50 rounded-lg p-3 sm:p-4 mt-2">
                <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Transaction ID</span>
                <span className="block text-sm sm:text-base font-mono text-gray-900 break-all leading-tight">
                  {transactionId}
                </span>
              </div>

              <div className="col-span-2 bg-gray-50 rounded-lg p-3 sm:p-4">
                <span className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Receipt Number</span>
                <span className="block text-sm font-mono text-gray-900 break-all leading-tight">
                  {merchantTransactionId}
                </span>
              </div>

              {paymentInstrument.type in TransactionDetails && paymentInstrument[TransactionDetails[paymentInstrument.type]?.field] && (
                <div className="col-span-2 bg-gray-50 rounded-lg p-3 sm:p-4">
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
          <div className="bg-gray-50 px-6 py-5 sm:px-8 border-t border-gray-100 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Satyalok</p>
              <p className="text-xs text-gray-500 mt-0.5 max-w-[200px] leading-relaxed">
                Scan QR to verify transaction authenticity.
              </p>
            </div>
            <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm shrink-0">
              <QRCodeSVG value={statusUrl} size={56} level="L" />
            </div>
          </div>
        </div>
      </div>

      <div data-html2canvas-ignore="true" className="mt-8 mb-4">
        <a
          href="https://donate.satyalok.in"
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Return Home
        </a>
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