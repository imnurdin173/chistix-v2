"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import OrganizerSidebar from "@/components/sidebar/organizerSidebar";

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/error/401");
    else if (user.role !== "ORGANIZER") router.replace("/error/403");
  }, [user, loading, router]);

  // Tahan render sampai terbukti ORGANIZER (mencegah konten sempat tampil)
  if (loading || user?.role !== "ORGANIZER") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-neutral-500">
        Verifying organizer access ...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f4] font-sans text-neutral-800">
      <div className="w-full flex-1 p-4 md:p-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 md:flex-row">
          <OrganizerSidebar />
          <div className="w-full flex-1">{children}</div>
        </div>
      </div>
    </div>
  );
}

////asdasd
