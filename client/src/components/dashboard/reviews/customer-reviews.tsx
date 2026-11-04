import Link from "next/link";
import { Check, Star } from "lucide-react";
import ReviewCandidateCard from "@/components/reviews/ReviewCandidateCard";
import StarRating from "@/components/reviews/StarRating";
import { requireCustomer } from "@/lib/auth.server";
import { apiFetchServer } from "@/lib/api.server";
import { fetchEventReviews } from "@/lib/reviews";
import type { MyReview, ReviewCandidate } from "@/types/review";
import type { TransactionDetail, TransactionListResponse } from "@/types/transaction";

const FALLBACK_IMAGE = "https://placehold.co/400x300?text=No+Image";

export type Tab = "need" | "mine";

export type ReviewsQuery = {
  tab?: string;
  reviewed?: string;
};

export type CustomerReviewsProps = {
  searchParams: Promise<ReviewsQuery>;
};

/* ---------- Data Loading ---------- */

async function getPaidTransactions(): Promise<TransactionDetail[] | null> {
  try {
    const data = await apiFetchServer<TransactionListResponse>("/transactions?status=PAID&limit=50");
    return data.transactions;
  } catch {
    return null;
  }
}

async function getMyReviews(
  transactions: TransactionDetail[],
  userId: string,
  now: number,
): Promise<MyReview[] | null> {
  const endedEvents = new Map<string, TransactionDetail["event"]>();
  for (const t of transactions) {
    if (new Date(t.event.eventEndDate).getTime() < now) endedEvents.set(t.event.id, t.event);
  }

  try {
    const results = await Promise.all(
      [...endedEvents.values()].map(async (event) => {
        const data = await fetchEventReviews(event.id);
        const review = data.reviews.find((r) => r.userId === userId);
        return review ? { review, event } : null;
      }),
    );
    return results
      .filter((item): item is MyReview => item !== null)
      .sort((a, b) => new Date(b.review.updatedAt).getTime() - new Date(a.review.updatedAt).getTime());
  } catch {
    return null;
  }
}

/* ---------- Candidates & Helpers ---------- */

function getReviewCandidates(
  transactions: TransactionDetail[],
  reviewedEventIds: Set<string>,
  now: number,
): ReviewCandidate[] {
  const byEvent = new Map<string, ReviewCandidate>();

  for (const t of transactions) {
    const hasEnded = new Date(t.event.eventEndDate).getTime() < now;
    if (!hasEnded || reviewedEventIds.has(t.event.id)) continue;

    const attendedTicket = (t.tickets ?? []).find((ticket) => ticket.isAttended) ?? null;
    const existing = byEvent.get(t.event.id);

    if (!existing || (existing.attendedTicketId === null && attendedTicket)) {
      byEvent.set(t.event.id, {
        event: t.event,
        ticketName: t.ticketType.name,
        quantity: t.quantity,
        attendedTicketId: attendedTicket?.id ?? null,
        attendedAt: attendedTicket?.attendedAt ?? null,
      });
    }
  }

  return [...byEvent.values()].sort(
    (a, b) => new Date(b.event.eventEndDate).getTime() - new Date(a.event.eventEndDate).getTime(),
  );
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function EmptyState({ title, message, children }: { title: string; message: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <Star className="size-10 text-neutral-300" />
      <p className="font-semibold text-neutral-700">{title}</p>
      <p className="max-w-sm text-sm text-neutral-500">{message}</p>
      {children}
    </div>
  );
}

function MyReviewCard({ item }: { item: MyReview }) {
  const { review, event } = item;
  return (
    <article className="flex gap-4 rounded-2xl border border-neutral-100 bg-white p-4 shadow-xs">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={event.thumbnailImage ?? FALLBACK_IMAGE}
        alt={event.title}
        className="aspect-[4/3] w-20 shrink-0 rounded-lg object-cover sm:w-24"
      />

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <Link
            href={`/events/${event.slug}`}
            className="line-clamp-2 text-sm font-bold text-neutral-900 hover:text-[#EA580C]"
          >
            {event.title}
          </Link>
          <span className="shrink-0 text-[11px] text-neutral-400">{formatShortDate(review.updatedAt)}</span>
        </div>

        <StarRating score={review.rating} />

        {review.reviewDesc ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-600">{review.reviewDesc}</p>
        ) : (
          <p className="text-xs italic text-neutral-400">No written review.</p>
        )}
      </div>
    </article>
  );
}

/* ---------- Main Component ---------- */

export default async function CustomerReviewsD({ searchParams }: CustomerReviewsProps) {
  const user = await requireCustomer();

  const query = await searchParams;
  const activeTab: Tab = query.tab === "mine" ? "mine" : "need";
  const justReviewed = query.reviewed === "1";

  const now = Date.now();
  const transactions = await getPaidTransactions();
  const myReviews = transactions === null ? null : await getMyReviews(transactions, user.id, now);

  const reviews = myReviews ?? [];
  const reviewedEventIds = new Set(reviews.map((r) => r.event.id));
  const candidates = getReviewCandidates(transactions ?? [], reviewedEventIds, now);
  const reviewableCount = candidates.filter((c) => c.attendedTicketId !== null).length;

  const tabs: { value: Tab; label: string; count: number; href: string }[] = [
    { value: "need", label: "Need Review", count: candidates.length, href: "/dashboard-customer/reviews" },
    { value: "mine", label: "My Review", count: reviews.length, href: "/dashboard-customer/reviews?tab=mine" },
  ];

  return (
    <main className="space-y-6 rounded-2xl border border-neutral-100 bg-white p-6 shadow-xs md:p-8">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Reviews</h1>
        <p className="mt-1 text-sm text-neutral-500">Share how you felt about the experience.</p>
      </div>

      {/* TABS */}
      <nav aria-label="Review tabs" className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const isActive = tab.value === activeTab;
          return (
            <Link
              key={tab.value}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                isActive ? "bg-[#FFF5ED] text-[#BB4D00]" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {tab.label} ({tab.count})
            </Link>
          );
        })}
      </nav>

      {/* SUCCESS MESSAGE */}
      {justReviewed && activeTab === "mine" && (
        <p className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          <Check className="size-4 shrink-0" />
          Thank you! Your review has been posted.
        </p>
      )}

      {/* TAB: NEED REVIEW */}
      {activeTab === "need" && (
        <section className="space-y-3">
          {transactions === null ? (
            <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">Failed to load your events. Please refresh the page.</p>
          ) : candidates.length === 0 ? (
            <EmptyState
              title="No events to review"
              message="Events appear here after they end. Only events you attended can be reviewed."
            >
              <Link
                href="/browse"
                className="mt-2 rounded-full bg-[#EA580C] px-5 py-2 text-sm font-bold text-white hover:bg-[#BB4D00]"
              >
                Browse Events
              </Link>
            </EmptyState>
          ) : (
            candidates.map((c) => (
              <ReviewCandidateCard
                key={c.event.id}
                candidate={c}
                defaultOpen={reviewableCount === 1 && c.attendedTicketId !== null}
              />
            ))
          )}
        </section>
      )}

      {/* TAB: MY REVIEW */}
      {activeTab === "mine" && (
        <section className="space-y-3">
          {myReviews === null ? (
            <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">Failed to load your reviews. Please refresh the page.</p>
          ) : reviews.length === 0 ? (
            <EmptyState title="No reviews yet" message="Reviews you write will appear here.">
              <Link href="/dashboard-customer/reviews" className="text-sm font-semibold text-[#EA580C] hover:underline">
                See events to review
              </Link>
            </EmptyState>
          ) : (
            reviews.map((item) => <MyReviewCard key={item.review.id} item={item} />)
          )}
        </section>
      )}
    </main>
  );
}