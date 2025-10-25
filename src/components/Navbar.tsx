"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { User, LogOut, Key  } from "lucide-react";
import { useToggle } from "../contexts/toggle";
import ToggleButton from "./toggle-button";
import { useUser, useClerk, SignInButton, UserButton } from "@clerk/nextjs";

interface NavItem {
  name: string;
  href: string;
}

export default function Navbar() {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isToggled } = useToggle();
  const [isScrolled, setIsScrolled] = useState(false);
  const { isSignedIn, user, isLoaded } = useUser();
  const { signOut } = useClerk();

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // scroll effect
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Helper functions
  const getInitials = (email?: string, name?: string) => {
    if (name) return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    if (email) return email.split("@")[0].slice(0, 2).toUpperCase();
    return "U";
  };

  const authNavigation: NavItem[] = [
    { name: "Home", href: "/home" },
    { name: "Create", href: "/create" },
    { name: "My Designs", href: "/designs" },
    { name: "My Channels", href: "/channels" },
  ];

  const landingPageNavigation: NavItem[] = [
    { name: "Pricing", href: "#pricing" },
    { name: "Features", href: "#features" },
  ];

  const filteredNavItems = authNavigation.filter(item => item.href !== pathname);
  const navigation = isSignedIn ? filteredNavItems : landingPageNavigation;
  const homeRoute = isSignedIn ? "/home" : "/";

  return (
    <header
      className={`flex items-center justify-between whitespace-nowrap px-10 py-4 sticky top-0 z-50 transition-all duration-300 ${
        isScrolled
          ? isToggled
            ? "bg-gray-900/10 border-b border-gray-700 text-white backdrop-blur-md shadow-lg"
            : "bg-white/10 border-b border-slate-200 text-slate-900 backdrop-blur-md shadow-lg"
          : isToggled
          ? "bg-transparent border-transparent text-white"
          : "bg-transparent border-transparent text-slate-900"
      }`}
    >
      {/* Logo */}
      <Link
        href={homeRoute}
        className={`flex items-center gap-4 hover:opacity-80 transition-opacity ${
          isToggled ? "text-white" : "text-slate-900"
        }`}
      >
        <svg
          className={`h-8 w-8 ${isToggled ? "text-blue-400" : "text-[var(--primary-color)]"}`}
          fill="none"
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M44 4H30.6666V17.3334H17.3334V30.6666H4V44H44V4Z" fill="currentColor" />
        </svg>
        <h2
          className={`text-xl font-bold leading-tight tracking-[-0.015em] transition-colors duration-300 ${
            isToggled ? "text-white" : "text-slate-900"
          }`}
        >
          ThumbGen
        </h2>
      </Link>

      {/* Navigation */}
      <div className="flex items-center gap-8">
        <nav className="hidden md:flex items-center gap-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                pathname === item.href
                  ? isToggled
                    ? "text-blue-400 font-semibold"
                    : "text-slate-900 font-semibold"
                  : isToggled
                  ? "text-gray-300 hover:text-white"
                  : "text-black hover:text-gray-500"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <ToggleButton />

          {!isLoaded ? (
            <div className="flex items-center justify-center h-10 px-5">
              <div
                className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${
                  isToggled ? "border-gray-600" : "border-slate-300"
                }`}
              />
            </div>
          ) : isSignedIn ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                className={`flex items-center justify-center w-10 h-10 rounded-full overflow-hidden transition-all cursor-pointer focus:outline-none ${
                  isToggled
                    ? "bg-gray-700 hover:ring-gray-500"
                    : "bg-slate-300 hover:ring-slate-400"
                }`}
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                <Image
                  src={user?.imageUrl || "/default-avatar.png"}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </button>

              {isDropdownOpen && (
                <div
                  className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg border py-2 z-50 ${
                    isToggled ? "bg-gray-800 border-gray-600" : "bg-white border-slate-200"
                  }`}
                >
                  <div className={`px-4 py-3 border-b ${isToggled ? "border-gray-600" : "border-slate-200"}`}>
                    <div className="flex items-center gap-3">
                      <Image
                        src={user?.imageUrl || "/default-avatar.png"}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${isToggled ? "text-white" : "text-slate-900"}`}>
                          {user?.fullName || getInitials(user?.primaryEmailAddress?.emailAddress, user?.fullName ||"")}
                        </p>
                        <p className={`text-xs ${isToggled ? "text-gray-400" : "text-slate-500"}`}>
                          {user?.primaryEmailAddress?.emailAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <Link
                      href="/profile"
                      className={`flex w-full items-center gap-3 px-4 py-2 text-sm ${
                        isToggled
                          ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>

                    <button
                      onClick={() => signOut()}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 ${
                        isToggled ? "hover:bg-red-900/30" : "hover:bg-red-50"
                      }`}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <SignInButton mode="modal" fallbackRedirectUrl="/home">
              <button
                className={`flex min-w-[84px] items-center justify-center rounded-lg h-10 px-5 text-sm font-bold shadow-sm hover:shadow-md ${
                  isToggled
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-[var(--primary-color)] hover:bg-blue-600 text-slate-50"
                }`}
              >
                Start Creating
              </button>
            </SignInButton>
          )}
        </div>
      </div>
    </header>
  );
}
