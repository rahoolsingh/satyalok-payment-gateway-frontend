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
  message, // Kept in props in case you need it elsewhere, but omitted from the hard receipt
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

  const TransactionDetails = {
    UPI: { label: "UPI UTR", field: "utr" },
    CARD: { label: "Card Type", field: "cardType" },
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
              text: "Transaction receipt for my contribution to Satyalok.",
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 flex flex-col items-center font-sans">
      
      {/* Container */}
      <div className="relative w-full max-w-md">
        
        {/* ACTION BUTTONS - Ignored by html2canvas */}
        <div 
          data-html2canvas-ignore="true" 
          className="flex justify-end gap-3 mb-4"
        >
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors shadow-sm disabled:opacity-50"
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
          {/* Header */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex justify-between items-start mb-8">
              <img src={logo} alt="Satyalok" className="h-7" />
              <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                Receipt
              </span>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Amount Paid</p>
              <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-3">
                {formattedAmount}
              </h1>
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium">
                <CheckCircle2 size={14} />
                Transaction Successful
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="p-8">
            <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider mb-5">
              Transaction Details
            </h3>
            
            <dl className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <dt className="text-gray-500">Date & Time</dt>
                <dd className="font-medium text-gray-900">{formatDate(createdAt)}</dd>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <dt className="text-gray-500">Receipt Number</dt>
                <dd className="font-mono text-gray-900">{merchantTransactionId}</dd>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <dt className="text-gray-500">Transaction ID</dt>
                <dd className="font-mono text-gray-900">{transactionId}</dd>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <dt className="text-gray-500">Payment Method</dt>
                <dd className="font-medium text-gray-900 uppercase">{paymentInstrument.type}</dd>
              </div>

              {paymentInstrument.type in TransactionDetails && (
                <div className="flex justify-between items-center text-sm">
                  <dt className="text-gray-500">
                    {TransactionDetails[paymentInstrument.type].label}
                  </dt>
                  <dd className="font-mono text-gray-900">
                    {paymentInstrument[TransactionDetails[paymentInstrument.type]?.field]?.replace("_", " ")}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Footer & QR */}
          <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Satyalok</p>
              <p className="text-xs text-gray-500 mt-1">
                Scan QR code to verify this receipt online.
              </p>
            </div>
            <div className="bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm shrink-0">
              <QRCodeSVG value={statusUrl} size={48} level="L" />
            </div>
          </div>
        </div>

      </div>

      <div data-html2canvas-ignore="true" className="mt-8">
        <a
          href="https://donate.satyalok.in"
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Return to Dashboard
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