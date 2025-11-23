"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, Bug, ExternalLink } from "lucide-react";
import logo from "../../assets/logo.png";

const baseURL = "https://satyalok.in";

const menuItems = [
    { name: "Home", href: `${baseURL}/` },
    { name: "About", href: `${baseURL}/about` },
    { name: "Social Activities", href: `${baseURL}/socialactivities` },
    { name: "Get Involved", href: `${baseURL}/join` },
    { name: "Media", href: `${baseURL}/gallery` },
    { name: "Contact", href: `${baseURL}/contact` },
];

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Handle scroll effect for shadow/transparency
    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            // FIX: Use empty string instead of "unset" for better mobile support
            document.body.style.overflow = "";
        }

        // Cleanup function to ensure scroll is restored if component unmounts
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMenuOpen]);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <header
            className={`sticky top-0 z-50 w-full transition-all duration-300 ${scrolled || isMenuOpen
                ? "bg-white/90 backdrop-blur-md shadow-sm"
                : "bg-white"
                }`}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-20 items-center justify-between">
                    {/* Logo Section */}
                    <div className="flex-shrink-0 cursor-pointer transition-opacity hover:opacity-80">
                        <a href={`${baseURL}/`}>
                            <img src={logo} alt="Satyalok Logo" className="h-12 w-auto sm:h-14" />
                        </a>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex lg:items-center lg:space-x-8">
                        <nav className="flex space-x-6">
                            {menuItems.map((item) => (
                                <a
                                    key={item.name}
                                    href={item.href}
                                    className="text-sm font-medium text-gray-700 transition-colors hover:text-blue-700 hover:underline underline-offset-4"
                                >
                                    {item.name}
                                </a>
                            ))}
                        </nav>

                        <div className="h-6 w-px bg-gray-200" aria-hidden="true" />

                        <a
                            href="https://wa.me/918210228101?text=Hi%2C%20I%20am%20facing%20an%20issue%20with%20Satyalok%20Donation%20Portal."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group inline-flex items-center rounded-full border border-red-100 bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-all hover:bg-red-600 hover:text-white hover:shadow-md"
                        >
                            <Bug className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12" />
                            Report Issue
                        </a>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="lg:hidden">
                        <button
                            type="button"
                            onClick={toggleMenu}
                            className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 transition-colors hover:bg-gray-100 focus:outline-none"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div
                className={`fixed inset-0 z-40 transform bg-white transition-transform duration-300 ease-in-out lg:hidden ${isMenuOpen ? "translate-x-0" : "translate-x-full"
                    }`}
                style={{ top: "80px" }} // Adjust based on header height
            >
                <div className="flex h-full flex-col justify-between overflow-y-auto p-6 pb-24">
                    <nav className="space-y-2">
                        {menuItems.map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="flex items-center rounded-lg px-4 py-3 text-base font-medium text-gray-900 transition-colors hover:bg-blue-50 hover:text-blue-700"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                {item.name}
                            </a>
                        ))}
                    </nav>

                    <div className="mt-8 border-t border-gray-100 pt-8">
                        <p className="mb-4 px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            Support
                        </p>
                        <a
                            href="https://wa.me/918210228101?text=Hi%2C%20I%20am%20facing%20an%20issue%20with%20Satyalok%20Donation%20Portal."
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex w-full items-center justify-center rounded-lg bg-red-50 px-4 py-3 text-base font-semibold text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                        >
                            <Bug className="mr-2 h-5 w-5" />
                            Report an Issue
                        </a>
                    </div>
                </div>
            </div>
        </header>
    );
}