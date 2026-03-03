import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import { Share2, Download, CheckCircle2 } from "lucide-react"; // Optional: assumes lucide-react is installed
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
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(isoString ? new Date(isoString) : new Date());
  };

  const captureReceipt = async () => {
    if (!receiptRef.current) return null;
    return await html2canvas(receiptRef.current, {
      scale: 3, // Higher scale for professional print quality
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });
  };

  const handleDownload = async () => {
    setIsProcessing(true);
    const canvas = await captureReceipt();
    if (canvas) {
      const link = document.createElement("a");
      link.download = `Satyalok_Receipt_${merchantTransactionId}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
    setIsProcessing(false);
  };

  const handleShare = async () => {
    setIsProcessing(true);
    const canvas = await captureReceipt();
    if (!canvas) {
      setIsProcessing(false);
      return;
    }

    canvas.toBlob(async (blob) => {
      const file = new File([blob], "receipt.png", { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: "Satyalok Contribution Receipt",
            text: "I just supported Satyalok in bringing education to children. Join the movement!",
            files: [file],
          });
        } catch (err) {
          if (err.name !== "AbortError") handleDownload();
        }
      } else {
        handleDownload();
      }
      setIsProcessing(false);
    }, "image/png");
  };

  return (
    <div className="min-h-screen bg-slate-100 py-12 px-4 flex flex-col items-center">
      {/* Success Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 text-green-600 rounded-full mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Contribution Successful</h1>
        <p className="text-slate-500">Thank you for being a part of Satyalok</p>
      </div>

      <div className="relative w-full max-w-md">
        {/* ACTION BUTTONS - These will NOT appear in the downloaded image */}
        <div
          data-html2canvas-ignore="true"
          className="absolute -top-12 right-0 flex gap-3"
        >
          <button
            onClick={handleDownload}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-50 transition shadow-sm"
          >
            <Download size={14} /> {isProcessing ? "..." : "Download"}
          </button>
          <button
            onClick={handleShare}
            disabled={isProcessing}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-medium hover:bg-black transition shadow-sm"
          >
            <Share2 size={14} /> Share
          </button>
        </div>

        {/* ACTUAL RECEIPT */}
        <div
          ref={receiptRef}
          className="bg-white shadow-xl rounded-xl overflow-hidden border border-slate-200"
        >
          {/* Holi Brand Strip */}
          <div className="h-1.5 bg-gradient-to-r from-pink-400 via-purple-400 to-orange-400" />

          <div className="p-8">
            <div className="flex justify-between items-start mb-10">
              <div>
                <img src={logo} alt="Satyalok" className="h-8 mb-2" />
                <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Official Donation Receipt</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase">Amount Paid</p>
                <p className="text-2xl font-bold text-slate-900">{formattedAmount}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between pb-3 border-b border-slate-50">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Date</span>
                <span className="text-sm font-medium text-slate-800">{formatDate(createdAt)}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-slate-50">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Receipt No.</span>
                <span className="text-sm font-mono text-slate-800">{merchantTransactionId}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-slate-50">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Method</span>
                <span className="text-sm font-semibold text-slate-800 uppercase">{paymentInstrument.type}</span>
              </div>
              {paymentInstrument.utr && (
                <div className="flex justify-between pb-3 border-b border-slate-50">
                  <span className="text-xs text-slate-500 uppercase tracking-wider">UTR Reference</span>
                  <span className="text-sm font-mono text-slate-800">{paymentInstrument.utr}</span>
                </div>
              )}
            </div>

            {/* QR & Verification */}
            <div className="flex items-center gap-6 p-4 bg-slate-50 rounded-lg">
              <div className="bg-white p-1 border border-slate-200 rounded">
                <QRCodeSVG value={statusUrl} size={64} level="M" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">Secure Verification</p>
                <p className="text-[10px] text-slate-500 leading-tight mt-1">
                  Scan this code to verify the authenticity of this transaction on the Satyalok portal.
                </p>
              </div>
            </div>
          </div>

          {/* Footer Message */}
          <div className="bg-slate-900 text-white p-6 text-center">
            <p className="text-xs italic opacity-90 mb-1">
              "Your kindness creates a canvas of opportunity for those in need."
            </p>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Satyalok - A New Hope</p>
          </div>
        </div>
      </div>

      <a
        href="https://donate.satyalok.in"
        className="mt-8 text-sm font-medium text-slate-500 hover:text-slate-800 transition"
      >
        ← Back to Donation Page
      </a>
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
  }).isRequired,
  message: PropTypes.string,
  createdAt: PropTypes.string,
};

export default Success;