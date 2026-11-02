"use client";

import { useAuth } from "../providers/auth-provider";
import { useEffect, useState } from "react";
import Link from 'next/link';
import Image from "next/image";
import TopBar from "./topBar";
import NavbarNotLoggedIn from "./navbarNotLoggedIn";
import NavbarOrganizer from "./navbarOrganizer";
import NavbarCust from "./navbarCust";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const disabledRoutes = ["/login", "/register", "/verify-registration","/forgot-password","/reset-password"];
  const isAuthPage = pathname.startsWith("/auth") || disabledRoutes.includes(pathname);
  // if (loading) return null; //untuk skeleton
  const [open, setOpen] = useState(false);

  if (isAuthPage) return null;

  return (
    <header className="sticky top-0 z-50 w-full border-b">
      <TopBar />
      {(() => {
        if (!user) {
          return <NavbarNotLoggedIn />;
        }

        if (user.role === "ORGANIZER") {
          return <NavbarOrganizer />;
        }
        return <NavbarCust />;
      })()}
    </header>
  );
}
