"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../providers/auth-provider";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { SearchForm } from "../ui/searchForm";
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
import { useAuthModal } from "../providers/auth-modal-provider";

export default function navbarNotLoggedIn() {
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);
  const [isScrolled, setIsScrolled] = useState(false);
    const { openLogin } = useAuthModal();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      id="mainNav"
      aria-label="Navigasi utama"
      className={`${isScrolled ? "bg-white/90" : "bg-[#f3e8bf] "}`}
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
          className="hidden items-center gap-0.5 whitespace-nowrap text-sm font-bold lg:inline-flex"
        >
          Discover
        </Link>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              openLogin();
            }}
            className="rounded-full border border-amber-500 px-7 py-2 text-base font-bold text-amber-700 transition-colors hover:bg-amber-200"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-full border border-amber-500 bg-amber-500 px-7 py-2 text-base font-bold text-white transition-colors hover:bg-amber-600"
          >
            Register
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Tutup menu" : "Buka menu"}
          className="ml-auto inline-flex size-10 items-center justify-center border-amber-500 text-amber-600 lg:hidden"
        >
          <span className="relative block h-4 w-5" aria-hidden="true">
            <span
              className={`absolute left-0 h-0.5 w-full rounded bg-current transition-all duration-300 motion-reduce:transition-none ${
                open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 rounded bg-current transition-opacity duration-200 motion-reduce:transition-none ${
                open ? "opacity-0" : "opacity-100"
              }`}
            />
            <span
              className={`absolute left-0 h-0.5 w-full rounded bg-current transition-all duration-300 motion-reduce:transition-none ${
                open
                  ? "top-1/2 -translate-y-1/2 -rotate-45"
                  : "top-full -translate-y-full"
              }`}
            />
          </span>
        </button>
      </div>

      <div
        id="mobile-menu"
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none lg:hidden ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-4 border-t border-amber-100 px-4 py-4">
            <Link
              href="/browse"
              onClick={closeMenu}
              className="text-sm text-center font-bold text-gray-900"
            >
              Discover
            </Link>
            <Link
              href="#"
              onClick={closeMenu}
              className="text-sm text-center  font-bold text-amber-500"
            >
              Create Event+
            </Link>
            <div className="flex flex-col gap-3">
              <Link
                href="/login"
                onClick={closeMenu}
                className="rounded-full border border-amber-500 px-6 py-2 text-center text-sm font-bold text-amber-700"
              >
                Login
              </Link>
              <Link
                href="/register"
                onClick={closeMenu}
                className="rounded-full bg-amber-500 px-6 py-2 text-center text-sm font-bold text-white"
              >
                Register
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
