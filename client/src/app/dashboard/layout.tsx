"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import OrganizerSidebar from "@/components/sidebar/organizerSidebar";
import CustomerSidebar from "@/components/sidebar/customerSidebar";

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const allowed = !loading && user?.role === "ORGANIZER";

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/error/401");
  }, [user, loading, router]);

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f4] font-sans text-neutral-800">
      <div className="w-full flex-1 p-4 md:p-8">{children}</div>
    </div>
  );
}
