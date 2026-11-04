"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquare, Star } from "lucide-react";
import type { EventReview } from "@/types/review";

// Reviews come from GET /api/reviews/:eventId/reviews (loaded in app/events/[slug]/page.tsx)
type EventReviewsProps = {
  reviews: EventReview[];
  average: number; // average rating calculated by the backend
  total: number; // number of reviews
};

function StarRating({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${score} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`size-4 ${i <= score ? "fill-amber-400 text-amber-400" : "text-neutral-300"}`} />
      ))}
    </div>
  );
}

// "Rina Ayu" → "RA"
function getInitials(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatReviewDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

export default function EventReviews({ reviews, average, total }: EventReviewsProps) {
  const [index, setIndex] = useState(0);

  // EMPTY STATE: no reviews yet
  if (reviews.length === 0) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-neutral-900">Reviews</h2>
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <MessageSquare className="size-8 text-neutral-300" />
          <p className="text-sm font-medium text-neutral-600">No reviews yet</p>
          <p className="text-xs text-neutral-400">Reviews will appear here after attendees share their experience.</p>
        </div>
      </section>
    );
  }

  const review = reviews[index];

  const goPrev = () => setIndex((index - 1 + reviews.length) % reviews.length);
  const goNext = () => setIndex((index + 1) % reviews.length);

  return (
    <section className="space-y-4 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-neutral-900">Reviews</h2>
        <p className="flex items-center gap-1 text-sm text-neutral-600">
          <Star className="size-4 fill-amber-400 text-amber-400" />
          <span className="font-semibold text-neutral-900">{average.toFixed(1)}</span>
          <span>({total} {total === 1 ? "review" : "reviews"})</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Previous review"
          onClick={goPrev}
          className="hidden shrink-0 rounded-full p-1 text-neutral-400 hover:bg-white hover:text-neutral-700 sm:block"
        >
          <ChevronLeft className="size-5" />
        </button>

        <article className="flex flex-1 gap-4 rounded-xl bg-white p-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-amber-100 text-lg font-bold text-amber-700 ring-2 ring-orange-400">
            {getInitials(review.user.name)}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-neutral-900">{review.user.name}</p>
                <p className="text-[11px] text-neutral-400">{formatReviewDate(review.createdAt)}</p>
              </div>
              <StarRating score={review.rating} />
            </div>

            {review.reviewDesc ? (
              <p className="text-sm leading-relaxed text-neutral-700">{review.reviewDesc}</p>
            ) : (
              <p className="text-xs italic text-neutral-400">No written review.</p>
            )}
          </div>
        </article>

        <button
          type="button"
          aria-label="Next review"
          onClick={goNext}
          className="hidden shrink-0 rounded-full p-1 text-neutral-400 hover:bg-white hover:text-neutral-700 sm:block"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="flex justify-center gap-1.5">
        {reviews.map((r, i) => (
          <button
            key={r.id}
            type="button"
            aria-label={`Show review ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-[#EA580C]" : "w-2 bg-neutral-300"}`}
          />
        ))}
      </div>
    </section>
  );
}