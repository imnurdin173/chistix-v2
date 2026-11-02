// Shapes for the review feature.
// These follow the Review model in schema.prisma and are OUR PROPOSAL for the API.
// Confirm them with the backend teammate before the endpoints are built.

// One review written by the logged-in customer (GET /api/reviews/me)

import type { TransactionDetail } from "@/types/transaction";

export interface MyReview {
  id: string;
  ticketId: string;
  ratingScore: number; // 1–5
  reviewDesc: string | null;
  reviewCustomerAt: string;
  orgReply: string | null;
  orgReplyAt: string | null;
  event: {
    id: string;
    title: string;
    slug: string;
    thumbnailImage: string | null;
    eventStartDate: string;
    eventEndDate: string;
  };
}

// Body we send to POST /api/reviews
export interface CreateReviewInput {
  ticketId: string;
  ratingScore: number;
  reviewDesc: string;
}

// A finished event shown in the "Need Review" tab
export interface ReviewCandidate {
  event: TransactionDetail["event"];
  ticketName: string;
  quantity: number;
  attendedTicketId: string | null; // null = bought a ticket but did not attend
  attendedAt: string | null;
}