import PropTypes from "prop-types";
import logo from "../../assets/logo.png";
import paymentDoneAnimation from "../../assets/Successfully-Done.gif";
import receiptBg from "../../assets/receipt-bg.gif";

function Success({
    amount,
    merchantTransactionId,
    transactionId,
    paymentInstrument,
    message,
    createdAt
}) {
    const formatAmount = (amount) => {
        return amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const convertToTimestamp = (isoString) {
        const date = new Date(isoString);

        // Pad numbers with a leading zero if single digit (e.g., 9 -> 09)
        const pad = (num) => num.toString().padStart(2, '0');

        const day = pad(date.getDate());
        const month = pad(date.getMonth() + 1); // Months are 0-indexed
        const year = date.getFullYear();

        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());

        return `${day}-${month}-${year} ${hours}:${minutes}`;
    }

    const TransactionNumber = {
        UPI: {
            label: "UTR Number",
            field: "utr",
        },
        CARD: {
            label: "Card Type",
            field: "cardType",
        },
    };

    return (
        <div className="max-w-lg mx-auto flex flex-col justify-center items-center">
            <div className="relative bg-white overflow-hidden drop-shadow-2xl print:drop-shadow-none rounded-lg">
                {/* Reflection effect sun */}
                <i className="absolute bottom-8 right-0 -m-8 w-32 h-32 rounded-full bg-gradient-to-b from-yellow-500 via-yellow-500/40 to-transparent opacity-50 z-0"></i>

                <img
                    className="w-full max-w-52 object-center z-0 m-auto -mb-16"
                    src={receiptBg}
                    alt=""
                />

                <div className="relative p-8">
                    <div className="">
                        <p className="text-xl font-semibold text-center text-green-500 mb-5">
                            Donation Received
                        </p>
                        <h1 className="text-2xl font-extrabold font-sans text-center text-green-500">
                            <span className="mr-1 font-extrabold">INR</span>
                            {formatAmount(amount / 100)}
                        </h1>

                        <p className="font-medium text-center font-sans">
                            {message}
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 md:gap-2 my-4">
                        <div className="md:border md:px-3 py-2 border-gray-700">
                            <p className="text-sm text-blue-900">Ref. Number</p>
                            <p className="text-sm font-mono">
                                {merchantTransactionId}
                            </p>
                        </div>

                        <div className="md:border md:px-3 py-2 border-gray-700">
                            <p className="text-sm text-blue-900">
                                Payment Time
                            </p>
                            <p className="text-sm font-mono">
                                {convertToTimestamp(createdAt)}
                            </p>
                        </div>

                        <div className="md:border md:px-3 py-2 border-gray-700">
                            <p className="text-sm text-blue-900">
                                PhonePe Transaction ID
                            </p>
                            <p className="text-sm font-mono">{transactionId}</p>
                        </div>

                        <div className="md:border md:px-3 py-2 border-gray-700">
                            <p className="text-sm text-blue-900">
                                Payment Method
                            </p>
                            <p className="text-sm font-mono">
                                {paymentInstrument.type}
                            </p>
                        </div>

                        {paymentInstrument.type in TransactionNumber && (
                            <div className="md:border md:px-3 py-2 border-gray-700 md:col-span-2">
                                <p className="text-sm text-blue-900">
                                    {
                                        TransactionNumber[
                                            paymentInstrument.type
                                        ].label
                                    }
                                </p>
                                <p className="text-sm font-mono">
                                    {paymentInstrument[
                                        TransactionNumber[
                                            paymentInstrument.type
                                        ]?.field
                                    ].replace("_", " ")}
                                </p>
                            </div>
                        )}
                    </div>

                    <p className="text-justify text-xs text-gray-700 border border-gray-700 border-dashed -mx-2 sm:mx-0 p-2">
                        Dear Donor,
                        <br />
                        Thank you for your generous donation. Your small
                        contribution can make a big difference. Your donated
                        amount will be used for the welfare of society. Thank
                        you for your support ❤️.
                        <br />
                        <br />
                        Regards,
                        <br />
                        Satyalok Team
                    </p>

                    <div className="my-8">
                        <img
                            src={logo}
                            alt="Satyalok logo"
                            className="max-w-48"
                        />

                        <div>
                            <p className="text-sm font-bold">
                                Thank you for your donation.
                            </p>
                            <p className="text-sm mb-2">
                                For any queries, contact{" "}
                                <a
                                    href="mailto:info@satyalok.in"
                                    className="underline underline-offset-4"
                                >
                                    info@satyalok.in
                                </a>
                            </p>
                        </div>
                    </div>

                    <div className="text-justify text-xs font-sans text-gray-500">
                        <p className="mb-4">
                            If you opted for a tax benefit, your certificate is
                            sent to your email. Please check your inbox. In case
                            you don&apos;t receive the certificate, please check
                            your spam folder or contact us at{" "}
                            <a
                                href="mailto:info@satyalok.in"
                                className="underline underline-offset-4"
                            >
                                info@satyalok.in
                            </a>
                        </p>
                    </div>

                    <div className="mt-8 text-center print:hidden divide-x bg-purple-800/90 py-2 rounded-full divide-gray-400 text-white flex text-xs md:text-sm z-20">
                        <button
                            className="px-5 flex flex-col md:flex-row md:gap-1.5 justify-center items-center text-center w-[33%]"
                            onClick={() => window.print()}
                        >
                            <i className="fas fa-print"></i>
                            <span>Print Receipt</span>
                        </button>

                        <a
                            className="px-5 flex flex-col md:flex-row md:gap-1.5 justify-center items-center text-center w-[33%]"
                            href="https://donate.satyalok.in"
                        >
                            <i className="fas fa-undo"></i>
                            <span>Donate Again</span>
                        </a>

                        <a
                            className="px-5 flex flex-col md:flex-row md:gap-1.5 justify-center items-center text-center w-[33%]"
                            href="https://www.satyalok.in"
                        >
                            <i className="fas fa-home"></i>
                            <span>Back Home</span>
                        </a>
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
    message: PropTypes.string.isRequired,
};

export default Success;
