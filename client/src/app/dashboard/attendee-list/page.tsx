"use client"

import { useAuth } from "@/components/providers/auth-provider";
import CustomerSidebar from "@/components/sidebar/customerSidebar";
import OrganizerSidebar from "@/components/sidebar/organizerSidebar";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AttendeeDLayout() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const allowed = !loading && user?.role === "ORGANIZER";

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/error/401");
    else if (user.role !== "ORGANIZER") router.replace("/error/403");
  }, [user, loading, router]);

  return (

    <div className="mx-auto flex container max-w-8xl flex-col items-start gap-6 md:flex-row">
      {allowed}

      <div className="w-full flex-1">
        {!allowed && (
          <div className="flex min-h-[50vh] bg-white w-full rounded-2xl p-6 md:p-8  items-center justify-center text-sm text-neutral-500">
            Verifying dashboard access ...
          </div>
        )}

        <div hidden={!allowed}>
          {user?.role == "ORGANIZER" ? (
            <OrganizerSidebar />
          ) : (
            <CustomerSidebar />
          )}
        </div>
      </div>
      <main
        hidden={!allowed}
        className="w-full bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-neutral-100"
      >
        Attendee
      </main>
    </div>
  );
}