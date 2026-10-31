"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../providers/auth-provider";
import {
  Search,
  ShoppingBag,
  Ticket,
  User,
  ChevronDown,
  Menu,
  X,
  Folder,
  PlusCircle,
} from "lucide-react";
import { SearchForm } from "../ui/searchForm";
import { Chevron } from "../ui/chevron";

export default function navbarOrganizer() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { user, loading, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const handleSignOut = async () => {
    setLoggingOut(true);
    await logout();
    setLoggingOut(false);
    router.push("/");
    router.refresh();
  };

  return (
    <nav
      id="mainNav"
      aria-label="Navigasi utama"
      className={`${isScrolled ? "bg-white/90" : "bg-amber-50"}`}
    >
      <div className="container mx-auto flex max-w-8xl items-center gap-4 px-4 py-2 sm:py-6 sm:px-6 lg:gap-6">
        <Link href="/" className="shrink-0" onClick={closeMenu}>
          <Image
            src="/chistix-logo.png"
            alt="Chistix"
            width={120}
            height={40}
            className="hidden h-9 w-auto sm:block"
            priority
          />
          <Image
            src="/favicon.png"
            alt="Chistix"
            width={120}
            height={40}
            className="h-14 w-auto mx-0 sm:hidden"
            priority
          />
        </Link>

        <Link
          href="#"
          className="hidden whitespace-nowrap text-base font-bold text-amber-500 hover:underline md:inline"
        >
          Create Event+
        </Link>
        <div className="mx-2 max-w-md flex-1 md:block">
          <SearchForm className="w-full" />
        </div>

        <Link
          href="/events"
          className="hidden items-center gap-0.5 whitespace-nowrap text-sm font-bold md:inline-flex"
        >
          Discover
        </Link>


<div
          id="UserMenu"
          className="hidden shrink-0 items-center gap-4 md:flex lg:gap-6 ml-auto"
        >
          <Link
            href="/event-manager"
            className="flex items-center gap-1 whitespace-nowrap text-xs font-bold text-neutral-800 hover:text-amber-700 transition sm:text-sm"
          >
            <Folder className="h-4 w-4 lg:h-6 lg:w-6 " />
            <span>Event Manager</span>
          </Link>
          <div
            className="relative py-2"
            ref={dropdownRef}
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <button className="flex items-center gap-1 text-neutral-800 hover:text-amber-700 transition text-sm focus:outline-none">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-400 bg-white shadow-sm">
                <User className="h-4 w-4 text-neutral-800" />
              </div>
              <ChevronDown
                className={`h-4 w-4 text-gray-600 transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-0 w-52 rounded-b-lg rounded-tl-lg border border-gray-200 bg-[#f4f5f7] p-4 shadow-xl z-50">
                <div className="text-right pb-3">
                  <h4 className="font-bold text-gray-900 text-sm">
                    <span className="truncate max-w-30 inline-block">Hello, {user?.name || "Customer"}</span>
                  </h4>
                  <div className="mt-2 flex items-center justify-end text-xs text-gray-600 px-1">
                    <span className="mr-1">Point Balance: </span>
                    <span className="font-semibold text-amber-700">
                      {user?.points ? user.points.toLocaleString("id-ID") : "0"}
                    </span>
                  </div>
                </div>

                <hr className="border-gray-200" />

                {/* Menu Navigasi */}
                <div className="pt-2 text-right text-xs font-medium text-gray-700">
                  <Link
                    href="/myaccount/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block py-2 px-2 hover:bg-gray-200/60 rounded transition"
                  >
                    Profile
                  </Link>

                  <hr className="border-gray-200 my-1" />

                  <Link
                    href="/myaccount/change-password"
                    onClick={() => setIsDropdownOpen(false)}
                    className="block py-2 px-2 hover:bg-gray-200/60 rounded transition"
                  >
                    Change Password
                  </Link>

                  <hr className="border-gray-200 my-1" />

                  <button
                    onClick={handleSignOut}
                    className="w-full text-right py-2 px-2 hover:text-amber-800 hover:bg-amber-100 rounded transition font-medium"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <div className="flex items-center gap-2 md:hidden">

            <Link href="/dashboard" className="p-1.5 text-gray-800">
              <Folder className="h-5 w-5" />
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 text-gray-800 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {isMobileMenuOpen && (
            <div className="absolute inset-x-4 top-full z-50 mt-2 space-y-3 rounded-2xl border border-amber-200 bg-white p-4 shadow-2xl md:hidden">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <p className="text-sm font-bold text-gray-800">
                    {user?.name || "Customer"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Points:{" "}
                    <span className="font-semibold text-amber-600">
                      {user?.points ?? "0"}
                    </span>
                  </p>
                </div>
                <Link
                  href="/organizer/create-event"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-600"
                >
                  + Create Event
                </Link>
              </div>

              <div className="space-y-1 text-sm font-medium text-gray-700">
                <Link
                  href="/event-manager"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded px-2 py-2 hover:bg-amber-50"
                >
                  Event Manager
                </Link>

                <hr className="border-gray-100 pt-2" />
                <Link
                  href="/myaccount/profile"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded px-2 py-2 hover:bg-amber-50"
                >
                  Profile
                </Link>
                <Link
                  href="/tickets"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded px-2 py-2 hover:bg-amber-50"
                >
                  Your Ticket
                </Link>
                <Link
                  href="/myaccount/change-password"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block rounded px-2 py-2 hover:bg-amber-50"
                >
                  Change Password
                </Link>
              </div>

              <div className="border-t border-gray-100 pt-2">
                <button
                  onClick={handleSignOut}
                  className="w-full rounded px-2 py-2 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
