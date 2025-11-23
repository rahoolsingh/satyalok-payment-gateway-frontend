import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { XCircle, X } from "lucide-react";

function ErrorCard({ message, setMessage }) {
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        if (message) {
            setShouldRender(true);
            // Small delay to allow DOM render before adding opacity class for transition
            requestAnimationFrame(() => setIsVisible(true));

            const timer = setTimeout(() => {
                handleClose();
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleClose = () => {
        setIsVisible(false);
        // Wait for transition to finish before unmounting
        setTimeout(() => {
            setMessage("");
            setShouldRender(false);
        }, 300);
    };

    if (!shouldRender) return null;

    return (
        <div
            className={`fixed z-50 transition-all duration-500 ease-in-out ${isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                } ${
                // Mobile: Bottom Center, Desktop: Bottom Right
                window.innerWidth <= 768
                    ? "bottom-4 left-4 right-4"
                    : "bottom-8 right-8"
                }`}
        >
            <div className="flex max-w-md items-center gap-3 rounded-lg border border-red-100 bg-white/90 p-4 shadow-xl backdrop-blur-md ring-1 ring-black/5">
                <XCircle className="h-6 w-6 shrink-0 text-red-500" />

                <div className="flex-grow">
                    <h3 className="text-sm font-semibold text-gray-900">Error</h3>
                    <p className="text-sm text-gray-600">{message}</p>
                </div>

                <button
                    onClick={handleClose}
                    className="group rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}

ErrorCard.propTypes = {
    message: PropTypes.string,
    setMessage: PropTypes.func.isRequired,
};

export default ErrorCard;