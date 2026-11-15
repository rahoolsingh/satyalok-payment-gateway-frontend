import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Payment from "./components/payment/Payment";
import Status from "./components/status/Status";
import NotFound from "./components/notFound/NotFound";
import PaymentRedirects from "./components/payment-redirects/PaymentRedirects";
import Pledge from "./components/pledge/Pledge";
import PledgeStatus from "./components/pledge/PledgeStatus";
import DonorPortal from "./components/pledge/DonorPortal";

import AdminRoutes from "./components/admin/AdminRoutes";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Payment />} />
                <Route path="/status/:id" element={<Status />} />
                <Route path="/payment-redirects/:id" element={<PaymentRedirects />} />

                {/* Monthly recurring donations (UPI AutoPay mandates) */}
                <Route path="/pledge" element={<Pledge />} />
                <Route path="/pledge/status" element={<PledgeStatus />} />
                <Route path="/pledge/manage" element={<DonorPortal />} />
                <Route path="/pledge/manage/:token" element={<DonorPortal />} />

                <Route path="/admin/*" element={<AdminRoutes />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
}

export default App;
