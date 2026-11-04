import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth.server";
import CustomerSidebar from "@/components/sidebar/customerSidebar";
import OrganizerSidebar from "@/components/sidebar/organizerSidebar";
import CustomerReviewsD, { ReviewsQuery } from "@/components/dashboard/reviews/customer-reviews";
import OrganizerReviewsD from "@/components/dashboard/reviews/organizer-reviews";

export const metadata: Metadata = { title: "Review Event Dashboard" };

type ReviewsPageProps = {
  searchParams: Promise<ReviewsQuery>;
};

function VerifyingFallback() {
  return (
    <div className="flex min-h-[50vh] w-full flex-1 items-center justify-center rounded-2xl bg-white p-6 text-sm text-neutral-500 md:p-8">
      Verifying dashboard access ...
    </div>
  );
}

async function ReviewsContent({ searchParams }: ReviewsPageProps) {
  const user = await getCurrentUser();

  if (!user) redirect("/error/401");
  if (user.role !== "ORGANIZER" && user.role !== "CUSTOMER") redirect("/error/403");

  const isOrganizer = user.role === "ORGANIZER";

  return (
    <>
      {isOrganizer ? <OrganizerSidebar /> : <CustomerSidebar />}
      <div className="w-full flex-1">
        {isOrganizer ? (
          <OrganizerReviewsD />
        ) : (
          <CustomerReviewsD searchParams={searchParams} />
        )}
      </div>
    </>
  );
}

export default async function ReviewsPage(props: ReviewsPageProps) {
  return (
    <div className="mx-auto flex container max-w-8xl flex-col items-start gap-6 md:flex-row">
      <Suspense fallback={<VerifyingFallback />}>
        <ReviewsContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}