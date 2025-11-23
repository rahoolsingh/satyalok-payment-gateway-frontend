import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Success from "../success/Success";
import Failure from "../failure/Failure";
import Loading from "../loading/Loading";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

function Status() {
    const [paymentData, setPaymentData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { id: txnId } = useParams();

    useEffect(() => {
        fetch(`${BACKEND_URL}/status?id=${txnId}`)
            .then((res) => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then((data) => {
                // console.log(data);
                setPaymentData(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setError("Failed to fetch payment status.");
                setLoading(false);
            });
    }, [txnId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen text-lg font-semibold">
                <Loading />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen text-red-600 text-lg font-semibold">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center md:p-6">
            {paymentData?.success === true && (
                <Success {...paymentData.data} message={paymentData.message} createdAt={paymentData.createdAt} />
            )}

            {paymentData?.success === false && <Failure data={paymentData} />}

            {/* if no data is returned, show a generic error message */}

            {paymentData?.success === undefined && (
                <div className="flex flex-col items-center justify-center text-white">
                    <h1 className="text-4xl font-bold mb-4">
                        No payment data available
                    </h1>
                    <p className="text-lg text-center mb-8 max-w-lg">
                        Make sure you have the correct transaction ID or try to
                        make a new payment.
                    </p>
                    <button
                        className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                        onClick={() => (window.location.href = "/")}
                    >
                        Retry Payment
                    </button>
                </div>
            )}
        </div>
    );
}

export default Status;
