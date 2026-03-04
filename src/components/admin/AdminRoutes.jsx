import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./AdminLogin";
import AdminForgotPassword from "./AdminForgotPassword";
import DashboardLayout from "./DashboardLayout";
import DonationList from "./DonationList";

const AdminRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/forgot-password" element={<AdminForgotPassword />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DonationList />} />
            </Route>
            <Route path="*" element={<Navigate to="/admin/login" />} />
        </Routes>
    );
};

export default AdminRoutes;
