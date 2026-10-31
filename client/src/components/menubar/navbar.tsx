"use client";

import { useAuth } from "../providers/auth-provider";
import { useEffect, useState } from "react";
import Link from 'next/link';
import Image from "next/image";
import TopBar from "./topBar";
import NavbarNotLoggedIn from "./navbarNotLoggedIn";
import NavbarOrganizer from "./navbarOrganizer";
import NavbarCust from "./navbarCust";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  // if (loading) return null; //untuk skeleton

  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
