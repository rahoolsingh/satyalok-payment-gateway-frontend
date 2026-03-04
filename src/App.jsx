import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Payment from "./components/payment/Payment";
import Status from "./components/status/Status";
import NotFound from "./components/notFound/NotFound";
import PaymentRedirects from "./components/payment-redirects/PaymentRedirects";

import AdminRoutes from "./components/admin/AdminRoutes";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Payment />} />
                <Route path="/status/:id" element={<Status />} />
                <Route path="/payment-redirects/:id" element={<PaymentRedirects />} />
                <Route path="/admin/*" element={<AdminRoutes />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;
