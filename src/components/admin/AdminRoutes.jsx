import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./AdminLogin";
import AdminForgotPassword from "./AdminForgotPassword";
import DashboardLayout from "./DashboardLayout";
import DonationList from "./DonationList";
import PledgeList from "./PledgeList";

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/forgot-password" element={<AdminForgotPassword />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DonationList />} />
                <Route path="pledges" element={<PledgeList />} />
            </Route>
            <Route path="*" element={<Navigate to="/admin/login" />} />
        </Routes>
    );
};

export default AdminRoutes;
