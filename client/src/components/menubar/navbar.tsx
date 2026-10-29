"use client"

import TopBar from "./topBar";
import NavbarNotLoggedIn from "./navbarNotLoggedIn";
import NavbarOrganizer from "./navbarOrganizer";
import NavbarCust from "./navbarCust";
import { authClient } from "@/lib/auth-client";

export default function Navbar() {
  const { data: session, isPending } = authClient.useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b">
      <TopBar />
      {(() => {
        if (!session) {
          return <NavbarNotLoggedIn />;
        }

        if (session.user.role === "ORGANIZER") {
          return <NavbarOrganizer user={session.user}/>;
        }
        return <NavbarCust user={session.user} />;
      })()}
    </header>
  );
}
