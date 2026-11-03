import { apiFetch } from "./api";
import type { EventReviewsResponse } from "@/types/review";

// Reviews of one event (public endpoint, no login needed)
// GET /api/reviews/:eventId/reviews
export function fetchEventReviews(eventId: string, limit = 50): Promise<EventReviewsResponse> {
  return apiFetch<EventReviewsResponse>(`/reviews/${encodeURIComponent(eventId)}/reviews?limit=${limit}`);
}
