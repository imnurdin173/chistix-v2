// Shapes for the review feature.
// They follow the Review model in schema.prisma and the review API
// (server/src/routes/review.router.ts, mounted at /api/reviews).

import type { TransactionDetail } from "@/types/transaction";

// One review, as returned by GET /api/reviews/:eventId/reviews
export interface EventReview {
  id: string;
  rating: number; // 1–5
  reviewDesc: string | null;
  eventId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
}

// Response of GET /api/reviews/:eventId/reviews
export interface EventReviewsResponse {
  reviews: EventReview[];
  ratingSummary: {
    average: number;
    total: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Body we send to POST /api/reviews/:eventId/reviews
export interface CreateReviewInput {
  rating: number;
  reviewDesc?: string;
}

// A review the logged-in customer wrote, together with its event
export interface MyReview {
  review: EventReview;
  event: TransactionDetail["event"];
}

// A finished event shown in the "Need Review" tab
export interface ReviewCandidate {
  event: TransactionDetail["event"];
  ticketName: string;
  quantity: number;
  attendedTicketId: string | null; // null = bought a ticket but did not attend
  attendedAt: string | null;
}
