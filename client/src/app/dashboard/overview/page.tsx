import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth.server";
import CustomerSidebar from "@/components/sidebar/customerSidebar";
import OrganizerSidebar from "@/components/sidebar/organizerSidebar";
import CustOverviewDashboard from "@/components/dashboard/overview/customer-Doverview";
import OrgOverviewDashboard from "@/components/dashboard/overview/organizer-Doverview";

export const metadata: Metadata = { title: "Overview" };

function VerifyingFallback() {
  return (
    <div className="flex min-h-[50vh] w-full flex-1 items-center justify-center rounded-2xl bg-white p-6 text-sm text-neutral-500 md:p-8">
      Verifying dashboard access ...
    </div>
  );
}

// Komponen async: cookie dibaca di sini, jadi harus di dalam <Suspense>
async function OverviewContent() {
  const user = await getCurrentUser();

  if (!user) redirect("/error/401");
  if (user.role !== "ORGANIZER" && user.role !== "CUSTOMER") redirect("/error/403");

  const isOrganizer = user.role === "ORGANIZER";

  return (
    <>
      {isOrganizer ? <OrganizerSidebar /> : <CustomerSidebar />}
          <div className="w-full bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-neutral-100">
      <div className="w-full flex-1 p-4 md:p-8">{isOrganizer ? <OrgOverviewDashboard /> : <CustOverviewDashboard />}</div>
    </div>
    </>
  );
}

export default function OverviewPage() {
  return (
    <div className="mx-auto flex container max-w-8xl flex-col items-start gap-6 md:flex-row">
      <Suspense fallback={<VerifyingFallback />}>
        <OverviewContent />
      </Suspense>
    </div>
  );
}