import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { LogOut, HeartHandshake, Repeat, Loader2, Menu, X } from "lucide-react";
import adminApi from "./adminApi";

export default function DashboardLayout() {
    const navigate = useNavigate();
    const [authChecking, setAuthChecking] = useState(true);
    // The sidebar is an overlay drawer below lg, a permanent rail from lg up
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // On mount, verify the admin is still authenticated
    useEffect(() => {
        const checkAuth = async () => {
            try {
                await adminApi.get("/admin/me");
            } catch {
                navigate("/admin/login", { replace: true });
            } finally {
                setAuthChecking(false);
            }
        };
        checkAuth();
    }, []);

    const handleLogout = async () => {
        try {
            await adminApi.post("/admin/logout");
        } catch {
            // continue regardless
        }
        navigate("/admin/login");
    };

    if (authChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Tap-anywhere backdrop: only exists while the drawer is open on phones */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                    className="fixed inset-0 bg-slate-900/40 z-20 lg:hidden"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`w-64 max-w-[85vw] bg-white border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-30 transition-transform duration-200 ease-out lg:translate-x-0 ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200">
                    <span className="text-xl font-bold text-blue-600 truncate">
                        Satyalok Admin
                    </span>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close menu"
                        className="lg:hidden p-1.5 -mr-1.5 rounded-md text-slate-500 hover:bg-slate-100"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                    <NavLink
                        to="/admin/dashboard"
                        end
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                            }`
                        }
                    >
                        <HeartHandshake className="w-5 h-5 mr-3" />
                        Donations
                    </NavLink>

                    <NavLink
                        to="/admin/dashboard/pledges"
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                                isActive
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                            }`
                        }
                    >
                        <Repeat className="w-5 h-5 mr-3" />
                        Monthly pledges
                    </NavLink>
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
            <main className="flex-1 min-w-0 flex flex-col min-h-screen lg:ml-64">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between gap-3 px-3 sm:px-6 lg:px-8 sticky top-0 z-10">
                    <div className="flex items-center gap-2 min-w-0">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            aria-label="Open menu"
                            aria-expanded={sidebarOpen}
                            className="lg:hidden p-2 -ml-1 rounded-md text-slate-600 hover:bg-slate-100"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                        <h2 className="text-base sm:text-lg font-semibold text-slate-800 truncate">
                            Admin Dashboard
                        </h2>
                    </div>
                    <div className="flex items-center space-x-4 shrink-0">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center border border-blue-200">
                            <span className="text-sm font-medium text-blue-700">
                                A
                            </span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-3 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
