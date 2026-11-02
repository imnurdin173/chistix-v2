"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import StarRatingInput from "@/components/reviews/StarRatingInput";
import { apiFetch, ApiError } from "@/lib/api";
import { REVIEW_MAX_LENGTH } from "@/lib/constants";
import type { CreateReviewInput } from "@/types/review";

type ReviewFormProps = {
  ticketId: string;
  onCancel: () => void;
};

// Turn an API error into a message the customer understands
function getErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 400) return err.message;
    if (err.status === 401) return "Your session has ended. Please log in again.";
    if (err.status === 403) return "Only customers who attended this event can review it.";
    if (err.status === 404) return "Reviews cannot be saved yet. The review service is still being built.";
    if (err.status === 409) return "You have already reviewed this event.";
  }
  return "Failed to send your review. Please try again.";
}

export default function ReviewForm({ ticketId, onCancel }: ReviewFormProps) {
  const router = useRouter();
  const ratingLabelId = useId();
  const commentId = useId();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // stop the browser from reloading the page

    // Frontend validation: the star rating is required
    if (rating === 0) {
      setError("Please choose a star rating.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const body: CreateReviewInput = { ticketId, ratingScore: rating, reviewDesc: comment.trim() };

    try {
      await apiFetch("/reviews", { method: "POST", body: JSON.stringify(body) });
      // Success: go to the "My Review" tab, which reloads the data from the server
      router.push("/reviews?tab=mine&reviewed=1");
    } catch (err) {
      setError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-3 border-t border-neutral-100 pt-4">
      <div>
        <p id={ratingLabelId} className="text-sm font-semibold text-neutral-800">
          How was it?
        </p>
        <StarRatingInput
          value={rating}
          onChange={(value) => {
            setRating(value);
            setError("");
          }}
          labelledBy={ratingLabelId}
          disabled={isSubmitting}
        />
      </div>

      <div>
        <label htmlFor={commentId} className="sr-only">
          Your review
        </label>
        <textarea
          id={commentId}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={REVIEW_MAX_LENGTH}
          rows={4}
          disabled={isSubmitting}
          placeholder="Tell others what you liked or what could be better (optional)"
          className="w-full resize-none rounded-xl border border-neutral-200 p-3 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-[#EA580C] focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 disabled:bg-neutral-50"
        />
        <p className="text-right text-[11px] text-neutral-400">
          {comment.length}/{REVIEW_MAX_LENGTH}
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-full border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 rounded-full bg-[#EA580C] px-5 py-2 text-sm font-bold text-white hover:bg-[#BB4D00] disabled:opacity-60"
        >
          {isSubmitting && <Loader2 className="size-4 animate-spin" />}
          {isSubmitting ? "Sending..." : "Submit Review"}
        </button>
      </div>
    </form>
  );
}