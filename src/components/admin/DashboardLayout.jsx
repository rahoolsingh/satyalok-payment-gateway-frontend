import React from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, LogOut, HeartHandshake } from "lucide-react";

export default function DashboardLayout() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/logout`, {
                method: "POST",
                credentials: "include",
            });
            navigate("/admin/login");
        } catch (error) {
            console.error("Logout failed:", error);
            navigate("/admin/login");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-20">
                <div className="h-16 flex items-center px-6 border-b border-slate-200">
                    <span className="text-xl font-bold text-blue-600 truncate">Satyalok Admin</span>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    <NavLink
                        to="/admin/dashboard"
                        end
                        className={({ isActive }) =>
                            `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive
                                ? "bg-blue-50 text-blue-700"
                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                            }`
                        }
                    >
                        <HeartHandshake className="w-5 h-5 mr-3" />
                        Donations
                    </NavLink>
                    {/* Add more links here later, e.g. Settings, Users */}
                </nav>

                <div className="p-4 border-t border-slate-200">
                    <button
                        onClick={handleLogout}
                        className="flex w-full items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 flex flex-col min-h-screen">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
                    <h2 className="text-lg font-semibold text-slate-800">Admin Dashboard</h2>
                    <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                            <span className="text-sm font-medium text-blue-700">A</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
