"use client";

import { useState } from "react";
import { CalendarDays, Ticket } from "lucide-react";
import ReviewForm from "@/components/reviews/ReviewForm";
import type { ReviewCandidate } from "@/types/review";

const FALLBACK_IMAGE = "https://placehold.co/400x300?text=No+Image";

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

type ReviewCandidateCardProps = {
  candidate: ReviewCandidate;
  defaultOpen?: boolean; // open the form right away (used when there is only one event to review)
};

export default function ReviewCandidateCard({ candidate, defaultOpen = false }: ReviewCandidateCardProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { event } = candidate;
  const ticketId = candidate.attendedTicketId;
  const canReview = ticketId !== null;

  return (
    <article className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-xs">
      <div className="flex gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={event.thumbnailImage ?? FALLBACK_IMAGE}
          alt={event.title}
          className="aspect-[4/3] w-20 shrink-0 rounded-lg object-cover sm:w-24"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="line-clamp-2 text-sm font-bold text-neutral-900">{event.title}</h3>
          <p className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Ticket className="size-3.5 shrink-0" />
            {candidate.ticketName} × {candidate.quantity}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-neutral-400">
            <CalendarDays className="size-3.5 shrink-0" />
            {candidate.attendedAt
              ? `Attended on ${formatShortDate(candidate.attendedAt)}`
              : `Event ended on ${formatShortDate(event.eventEndDate)}`}
          </p>
        </div>

        {/* Action on the right (hidden while the form is open) */}
        {!isOpen && (
          <div className="flex shrink-0 items-end">
            {canReview ? (
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="rounded-full bg-[#EA580C] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#BB4D00]"
              >
                Write Review
              </button>
            ) : (
              <span className="max-w-28 text-right text-[11px] leading-snug text-neutral-400">
                Only attendees can review
              </span>
            )}
          </div>
        )}
      </div>

      {isOpen && ticketId !== null && <ReviewForm ticketId={ticketId} onCancel={() => setIsOpen(false)} />}
    </article>
  );
}