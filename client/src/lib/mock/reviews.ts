import type { MyReview } from "@/types/review";

// TEMPORARY sample data so we can design the Reviews page
// before GET /api/reviews/me exists.
// Only shown in development (see app/(myaccount)/reviews/page.tsx).
// Delete this file once the real API is ready.
export const SAMPLE_REVIEWS: MyReview[] = [
  {
    id: "sample-review-1",
    ticketId: "sample-ticket-1",
    ratingScore: 4,
    reviewDesc:
      "Seru banget! Sound system-nya mantap dan antrean masuknya cepat. Semoga tahun depan ada lagi.",
    reviewCustomerAt: "2026-09-21T10:00:00.000Z",
    orgReply: "Terima kasih sudah datang! Sampai jumpa tahun depan.",
    orgReplyAt: "2026-09-22T08:30:00.000Z",
    event: {
      id: "sample-event-1",
      title: "Indie Fest Bandung 2026",
      slug: "indie-fest-bandung-2026",
      thumbnailImage: null,
      eventStartDate: "2026-09-20T12:00:00.000Z",
      eventEndDate: "2026-09-20T22:00:00.000Z",
    },
  },
  {
    id: "sample-review-2",
    ticketId: "sample-ticket-2",
    ratingScore: 5,
    reviewDesc: null,
    reviewCustomerAt: "2026-08-15T09:00:00.000Z",
    orgReply: null,
    orgReplyAt: null,
    event: {
      id: "sample-event-2",
      title: "Startup Talk: Building in Public",
      slug: "startup-talk-building-in-public",
      thumbnailImage: null,
      eventStartDate: "2026-08-14T02:00:00.000Z",
      eventEndDate: "2026-08-14T05:00:00.000Z",
    },
  },
];