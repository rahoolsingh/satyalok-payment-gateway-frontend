import { useEffect, useState } from "react";
import * as LottieModule from "react-lottie";

// react-lottie is CommonJS. Depending on the bundler interop the default can be
// the component itself or a namespace object wrapping it; resolve both so the
// production build (Vite 8 / Rolldown) and dev server behave identically.
const Lottie =
    LottieModule?.default?.default ||
    LottieModule?.default ||
    LottieModule;
import walletAnimation from "../../assets/lottie/wallet.json";

function Loading() {
    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: walletAnimation,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice",
        },
    };

    const [message, setMessage] = useState("Checking status");
    const [dots, setDots] = useState("...");

    const loadingMessages = [
        "Establishing connection",
        "Connecting to the server",
        "Fetching data",
        "Collecting payment details",
    ];

    const finalMessages = [
        "It sometimes takes 90 seconds",
        "We are fetching the data",
        "Please wait",
    ];

    useEffect(() => {
        let index = 0;

        const interval = setInterval(() => {
            if (index < loadingMessages.length) {
                setMessage(loadingMessages[index]);
                index++;
            } else {
                const finalMessageIndex =
                    (index - loadingMessages.length) % finalMessages.length;
                setMessage(finalMessages[finalMessageIndex]);
                index++;
            }
        }, 5000);

        return () => clearInterval(interval);
    });

    useEffect(() => {
        const interval = setInterval(() => {
            if (dots.length === 3) {
                setDots("");
            } else {
                setDots((prev) => prev + ".");
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [dots]);

    return (
        <div className="text-center">
            <Lottie options={defaultOptions} height={100} width={100} />

            <p className="text-black text-md">
                {message}
            </p>

            <p className="text-xs mt-1 font-light">
                Please do not refresh the page or go back.
            </p>

            <div className="mt-8 relative max-w-xs lg:max-w-xl text-xs lg:text-sm text-justify flex gap-3 items-center bg-green-100/60 p-3 rounded-lg font-sans">
                <div className="text-xs rounded-full min-w-6 min-h-6 flex justify-center items-center absolute -top-2.5 -left-2.5 bg-green-600">
                    <i className="fas fa-leaf text-white"></i>
                </div>
                <p className="leading-tight font-sans">
                    As a non-profit, our server spins down to{" "}
                    <b>save costs and cut our carbon footprint</b>, letting us{" "}
                    <b>focus more on our mission</b>. This may mean slower load
                    times. Thanks for your patience!
                </p>
            </div>
        </div>
    );
}

export default Loading;
