import React, { useRef, useState } from "react";
import PropTypes from "prop-types";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
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
  const [isSharing, setIsSharing] = useState(false);

  const statusUrl = `https://donate.satyalok.in/status/${merchantTransactionId}`;

  const formattedAmount = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount / 100);

  const formatDate = (isoString) => {
    if (!isoString) return new Date().toLocaleDateString("en-IN");
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(isoString));
  };

  const TransactionNumber = {
    UPI: { label: "UPI UTR", field: "utr" },
    CARD: { label: "Card Type", field: "cardType" },
  };

  const handleShare = async () => {
    if (!receiptRef.current || isSharing) return;
    setIsSharing(true);

    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false,
        useCORS: true,
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert("Failed to generate receipt image.");
          setIsSharing(false);
          return;
        }

        const file = new File(
          [blob],
          `satyalok-receipt-${merchantTransactionId}.png`,
          { type: "image/png" }
        );

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: "My Contribution to Satyalok",
              text: `I just contributed towards a brighter future with Satyalok.  

You can also be part of the change. Donate here: https://donate.satyalok.in  

Receipt Status: ${statusUrl}

#Satyalok #EducationForAll #HoliHai`,
              files: [file],
            });
          } catch (err) {
            if (err.name !== "AbortError") downloadImage(canvas);
          }
        } else {
          downloadImage(canvas);
        }
        setIsSharing(false);
      }, "image/png");
    } catch (err) {
      setIsSharing(false);
    }
  };

  const downloadImage = (canvas) => {
    const link = document.createElement("a");
    link.download = `satyalok-receipt-${merchantTransactionId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <>
      <div className="w-full bg-slate-50 min-h-screen py-8 px-4 print:hidden">

        {/* Receipt First - Especially on Mobile */}
        <div className="max-w-md lg:max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* RECEIPT SECTION */}
          <div
            ref={receiptRef}
            className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
          >

            {/* Subtle Holi Accent Strip */}
            <div className="h-2 bg-gradient-to-r from-pink-300 via-purple-300 to-yellow-300"></div>

            {/* Amount Section */}
            <div className="px-6 pt-8 pb-6 text-center border-b border-slate-200">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-2">
                Total Contribution
              </p>
              <h2 className="text-3xl font-semibold text-slate-900">
                {formattedAmount}
              </h2>
            </div>

            {/* QR */}
            <div className="flex justify-center py-6 border-b border-slate-100">
              <div className="p-3 bg-white border border-slate-200 rounded-xl">
                <QRCodeSVG value={statusUrl} size={90} level="H" />
              </div>
            </div>

            {/* Details */}
            <div className="px-6 py-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base font-semibold text-slate-800">
                  Transaction Details
                </h3>
                <img
                  src={logo}
                  alt="Satyalok"
                  className="h-5 opacity-50 grayscale"
                />
              </div>

              <dl className="space-y-5 text-sm">

                <div className="flex justify-between">
                  <dt className="text-slate-500">Date & Time</dt>
                  <dd className="font-medium text-right">
                    {formatDate(createdAt)}
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-slate-500">Receipt No.</dt>
                  <dd className="font-mono text-right break-all">
                    {merchantTransactionId}
                  </dd>
                </div>

                <div className="flex justify-between">
                  <dt className="text-slate-500">Transaction ID</dt>
                  <dd className="font-mono text-right break-all">
                    {transactionId}
                  </dd>
                </div>

                <div className="flex justify-between items-center">
                  <dt className="text-slate-500">Method</dt>
                  <dd className="uppercase bg-slate-100 px-3 py-1 rounded-md text-xs font-semibold">
                    {paymentInstrument.type}
                  </dd>
                </div>

                {paymentInstrument.type in TransactionNumber && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">
                      {TransactionNumber[paymentInstrument.type].label}
                    </dt>
                    <dd className="font-mono text-xs text-right break-all">
                      {paymentInstrument[
                        TransactionNumber[paymentInstrument.type]?.field
                      ]?.replace("_", " ")}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="bg-slate-50 text-center py-4 border-t border-slate-200">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium">
                Scan QR to verify status
              </p>
              <p className="text-xs text-slate-600">
                Satyalok - A New Hope
              </p>
            </div>
          </div>

          {/* SIDE CONTENT */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">

            <div>
              <h1 className="text-2xl font-semibold text-slate-900 mb-2">
                Colors of Kindness!
              </h1>
              <p className="text-slate-600 leading-relaxed">
                {message ||
                  "Thank you for your valuable contribution. Just as Holi brings people together in a celebration of colors, your generosity brings hope and vibrancy to lives that need it most."}
              </p>
              <p className="text-slate-600 leading-relaxed mt-3">
                By supporting Satyalok, you are helping paint a brighter, more colorful future for underprivileged children.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-200">

              <button
                onClick={handleShare}
                disabled={isSharing}
                className="px-6 py-3 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-black transition"
              >
                {isSharing ? "Preparing..." : "Share Receipt"}
              </button>

              <button
                onClick={() => window.print()}
                className="px-6 py-3 bg-white border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Print
              </button>

              <a
                href="https://donate.satyalok.in"
                className="px-6 py-3 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-900 transition"
              >
                Contribute Again
              </a>
            </div>
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