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
          } catch (shareError) {
            if (shareError.name !== "AbortError") {
              downloadImage(canvas);
            }
          }
        } else {
          downloadImage(canvas);
          alert(
            "Sharing is not supported on this browser/device. The receipt image has been downloaded instead."
          );
        }
        setIsSharing(false);
      }, "image/png");
    } catch (error) {
      alert(
        "An error occurred while trying to create the receipt screenshot."
      );
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
      <div className="w-full bg-slate-100 min-h-[85vh] flex items-center py-16 px-6 font-sans text-slate-900 print:hidden">
        <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

          {/* Left Section */}
          <div className="lg:col-span-7 flex flex-col justify-center">

            {/* Professional Header */}
            <div className="relative rounded-xl shadow-lg mb-12 p-10 bg-gradient-to-br from-indigo-700 via-purple-700 to-pink-600 text-white">
              <div className="relative z-10">
                <div className="mb-8 hidden lg:block">
                  <img
                    src={logo}
                    alt="Satyalok"
                    className="h-14 w-auto object-contain brightness-0 invert"
                  />
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-white/20 rounded-md flex items-center justify-center border border-white/40">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="3"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h2 className="text-sm font-semibold uppercase tracking-wider">
                    Payment Successful
                  </h2>
                </div>

                <h1 className="text-3xl lg:text-4xl font-bold leading-tight">
                  Colors of Kindness!
                </h1>
                <p className="text-lg text-pink-100 mt-2">
                  Thank you for spreading joy this Holi.
                </p>
              </div>
            </div>

            <div className="text-lg text-slate-600 leading-relaxed mb-12 space-y-4">
              <p>
                {message ||
                  "Thank you for your valuable contribution. Just as Holi brings people together in a celebration of colors, your generosity brings hope and vibrancy to lives that need it most."}
              </p>
              <p>
                By supporting Satyalok, you are helping paint a brighter, more colorful future for underprivileged children.
              </p>
            </div>

            <div className="flex flex-wrap gap-4 pt-6 border-t border-slate-300">

              <button
                onClick={handleShare}
                disabled={isSharing}
                className={`inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-md text-sm font-semibold hover:bg-black transition ${
                  isSharing ? "opacity-70 cursor-wait" : ""
                }`}
              >
                {isSharing ? "Preparing..." : "Share Receipt"}
              </button>

              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-300 rounded-md text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Print
              </button>

              <a
                href="https://donate.satyalok.in"
                className="inline-flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-md text-sm font-semibold hover:bg-slate-900 transition"
              >
                Contribute Again
              </a>
            </div>
          </div>

          {/* Receipt Card */}
          <div
            className="lg:col-span-5 w-full"
            ref={receiptRef}
          >
            <div className="bg-white border border-slate-300 shadow-lg rounded-xl overflow-hidden">

              <div className="bg-slate-50 p-6 border-b border-slate-300 flex justify-between items-center">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    Total Contribution
                  </p>
                  <div className="text-3xl font-bold text-slate-900">
                    {formattedAmount}
                  </div>
                </div>

                <div className="bg-white p-3 border border-slate-300 rounded-lg">
                  <QRCodeSVG value={statusUrl} size={72} level="H" />
                </div>
              </div>

              <div className="p-8">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Transaction Details
                  </h3>
                  <img
                    src={logo}
                    alt="Satyalok"
                    className="h-6 w-auto opacity-60 grayscale"
                  />
                </div>

                <dl className="space-y-4 text-sm">
                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-slate-500 font-medium">
                      Date & Time
                    </dt>
                    <dd className="col-span-2 text-right font-medium">
                      {formatDate(createdAt)}
                    </dd>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-slate-500 font-medium">
                      Receipt No.
                    </dt>
                    <dd className="col-span-2 text-right font-mono break-all">
                      {merchantTransactionId}
                    </dd>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-slate-500 font-medium">
                      Transaction ID
                    </dt>
                    <dd className="col-span-2 text-right font-mono break-all">
                      {transactionId}
                    </dd>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <dt className="text-slate-500 font-medium">
                      Method
                    </dt>
                    <dd className="col-span-2 text-right uppercase bg-slate-200 text-slate-700 py-1 px-3 rounded-md text-xs font-semibold inline-block justify-self-end">
                      {paymentInstrument.type}
                    </dd>
                  </div>

                  {paymentInstrument.type in TransactionNumber && (
                    <div className="grid grid-cols-3 gap-4">
                      <dt className="text-slate-500 font-medium">
                        {TransactionNumber[paymentInstrument.type].label}
                      </dt>
                      <dd className="col-span-2 text-right font-mono text-xs break-all">
                        {paymentInstrument[
                          TransactionNumber[paymentInstrument.type]?.field
                        ]?.replace("_", " ")}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div className="bg-slate-50 p-5 border-t border-slate-300 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-semibold">
                  Scan QR to verify status
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  Satyalok - A New Hope
                </p>
              </div>
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