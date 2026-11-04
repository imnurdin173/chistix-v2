import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth.server";
import CustomerSidebar from "@/components/sidebar/customerSidebar";
import OrganizerSidebar from "@/components/sidebar/organizerSidebar";
import CustomerTransactionsD from "@/components/dashboard/transactions/customer";
import OrganizerTransactionsD from "@/components/dashboard/transactions/organizer";

export const metadata: Metadata = { title: "Transactions Dashboard" };

// 1. Definisikan tipe untuk Query & Props
type TransactionsQuery = {
  status?: string;
  page?: string;
};

type TransactionsPageProps = {
  searchParams: Promise<TransactionsQuery>;
};

function VerifyingFallback() {
  return (
    <div className="flex min-h-[50vh] w-full flex-1 items-center justify-center rounded-2xl bg-white p-6 text-sm text-neutral-500 md:p-8">
      Verifying dashboard access ...
    </div>
  );
}

// 2. Terima searchParams di sini sebagai prop
async function TransactionsContent({ searchParams }: TransactionsPageProps) {
  const user = await getCurrentUser();

  if (!user) redirect("/error/401");
  if (user.role !== "ORGANIZER" && user.role !== "CUSTOMER") redirect("/error/403");

  const isOrganizer = user.role === "ORGANIZER";

  return (
    <>
      {isOrganizer ? <OrganizerSidebar /> : <CustomerSidebar />}
      <div className="w-full bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-neutral-100">
        <div className="w-full flex-1">
          {/* 3. Teruskan variabel searchParams (bukan nama tipe data) */}
          {isOrganizer ? (
            <OrganizerTransactionsD />
          ) : (
            <CustomerTransactionsD searchParams={searchParams} />
          )}
        </div>
      </div>
    </>
  );
}

// 4. Tangkap searchParams bawaan Next.js dari props halaman utama
export default async function TransactionsPage(props: TransactionsPageProps) {
  return (
    <div className="mx-auto flex container max-w-8xl flex-col items-start gap-6 md:flex-row">
      <Suspense fallback={<VerifyingFallback />}>
        <TransactionsContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}