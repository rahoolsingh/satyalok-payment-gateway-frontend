/**
 * Razorpay Checkout loader.
 *
 * The script is loaded on demand so the one-time donation page keeps its current
 * weight until someone actually chooses Razorpay. Both the one-time flow (order
 * id) and the monthly flow (subscription id) use the same checkout.
 */

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";
const SCRIPT_ID = "razorpay-checkout-js";

let loading = null;

export const loadRazorpayCheckout = () => {
    if (typeof window === "undefined") {
        return Promise.reject(new Error("Razorpay Checkout needs a browser."));
    }

    if (window.Razorpay) return Promise.resolve(window.Razorpay);

    if (loading) return loading;

    loading = new Promise((resolve, reject) => {
        const existing = document.getElementById(SCRIPT_ID);

        if (existing) {
            existing.addEventListener("load", () => resolve(window.Razorpay));
            existing.addEventListener("error", () =>
                reject(new Error("Could not load Razorpay Checkout.")),
            );
            return;
        }

        const script = document.createElement("script");
        script.id = SCRIPT_ID;
        script.src = SCRIPT_SRC;
        script.async = true;
        script.onload = () => {
            if (window.Razorpay) resolve(window.Razorpay);
            else reject(new Error("Razorpay Checkout did not initialise."));
        };
        script.onerror = () => {
            loading = null;
            reject(new Error("Could not load Razorpay Checkout."));
        };

        document.body.appendChild(script);
    });

    return loading;
};

/**
 * Open Checkout and resolve when it is open. Payment success arrives through
 * `onSuccess` after the donor completes it; `onDismiss` fires on close.
 */
export const openRazorpayCheckout = async ({
    options,
    onSuccess,
    onDismiss,
    onFailed,
}) => {
    const Razorpay = await loadRazorpayCheckout();

    const checkout = new Razorpay({
        ...options,
        modal: {
            ondismiss: onDismiss,
            escape: true,
        },
        handler: onSuccess,
    });

    checkout.on("payment.failed", (response) => {
        if (onFailed) onFailed(response);
    });

    checkout.open();
    return checkout;
};