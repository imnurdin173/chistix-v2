"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChatBubbleBottomCenterTextIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolid } from "@heroicons/react/24/solid";
import type { MyEventsResponse } from "@/types/organizer";
import type { EventReviewsResponse } from "@/types/review";

interface FormattedReviewItem {
  id: string;
  rating: number;
  reviewDesc: string;
  eventId: string;
  eventName: string;
  customerName: string;
  customerAvatar: string | null;
  createdAt: string;
}

export default function OrganizerReviewsD() {
  const [reviews, setReviews] = useState<FormattedReviewItem[]>([]);
  const [eventsList, setEventsList] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedEvent, setSelectedEvent] = useState<string>("ALL");
  const [activeStarFilter, setActiveStarFilter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  const fetchReviewsAndEvents = useCallback(async () => {
    try {
      setLoading(true);

      const resEvents = await apiFetch<MyEventsResponse>(
        "/organizers/my-events?page=1&limit=50"
      );

      const rawEvents = resEvents?.events || [];
      const mappedEvents = rawEvents.map((e) => ({
        id: e.id,
        title: e.title,
      }));
      setEventsList(mappedEvents);

      if (rawEvents.length === 0) {
        setReviews([]);
        return;
      }

      const reviewPromises = rawEvents.map(async (ev) => {
        try {
          const res = await apiFetch<EventReviewsResponse>(
            `/reviews/${ev.id}/reviews?page=1&limit=50`
          );
          const rawReviews = res?.reviews || [];
          return rawReviews.map((r) => ({
            id: r.id,
            rating: Number(r.rating) || 5,
            reviewDesc: r.reviewDesc || "No review description provided.",
            eventId: ev.id,
            eventName: ev.title,
            customerName: r.user?.name || "Anonymous Customer",
            customerAvatar: r.user?.avatar || null,
            createdAt: r.createdAt,
          }));
        } catch {
          return [];
        }
      });

      const settledResults = await Promise.all(reviewPromises);
      const mergedReviews = settledResults.flat();
      setReviews(mergedReviews);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReviewsAndEvents();
  }, [fetchReviewsAndEvents]);

  const eventFilteredReviews = useMemo(() => {
    if (selectedEvent === "ALL") return reviews;
    return reviews.filter((r) => r.eventId === selectedEvent);
  }, [reviews, selectedEvent]);

  const totalReviews = eventFilteredReviews.length;

  const averageRating = useMemo(() => {
    if (totalReviews === 0) return 0;
    const sum = eventFilteredReviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / totalReviews;
  }, [eventFilteredReviews, totalReviews]);

  const distribution = useMemo(() => {
    return [5, 4, 3, 2, 1].map((star) => {
      const count = eventFilteredReviews.filter((r) => r.rating === star).length;
      const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
      return { star, count, percentage };
    });
  }, [eventFilteredReviews, totalReviews]);

  const starFilteredReviews = useMemo(() => {
    return eventFilteredReviews.filter((r) =>
      activeStarFilter === null ? true : r.rating === activeStarFilter
    );
  }, [eventFilteredReviews, activeStarFilter]);

  const totalItems = starFilteredReviews.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedReviews = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return starFilteredReviews.slice(start, start + itemsPerPage);
  }, [starFilteredReviews, currentPage, itemsPerPage]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  };

  const starTabs = [5, 4, 3, 2, 1];

  return (
    <main className="flex-1 w-full bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-neutral-100">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-neutral-900">
          Customer Reviews
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Insights and feedback from attendees who joined your events
        </p>
      </div>

      <div className="bg-white border border-neutral-100 rounded-2xl p-6 md:p-8 mb-6 shadow-2xs">
        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-8">
          <div className="flex flex-col items-center justify-center md:border-r md:border-neutral-100 md:pr-10 shrink-0">
            <span className="text-5xl md:text-6xl font-black text-neutral-900 tracking-tight">
              {averageRating.toFixed(1).replace(".", ",")}
            </span>

            <div className="flex items-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <StarSolid
                  key={s}
                  className={`w-5 h-5 ${
                    s <= Math.round(averageRating)
                      ? "text-amber-400"
                      : "text-neutral-200"
                  }`}
                />
              ))}
            </div>

            <p className="text-xs text-neutral-400 font-medium">
              Based on {totalReviews} Reviews
            </p>
          </div>

          <div className="flex-1 w-full space-y-2.5">
            {distribution.map((item) => (
              <div key={item.star} className="flex items-center gap-3 text-xs">
                <span className="w-3 font-bold text-neutral-700 text-right">
                  {item.star}
                </span>
                <StarSolid className="w-3.5 h-3.5 text-amber-400 shrink-0" />

                <div className="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#ea580c] rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>

                <span className="w-10 text-neutral-500 font-medium text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative">
          <select
            value={selectedEvent}
            onChange={(e) => {
              setSelectedEvent(e.target.value);
              setActiveStarFilter(null);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto appearance-none bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs md:text-sm font-semibold py-2 pl-4 pr-9 rounded-full focus:outline-none focus:border-[#bb4d00] cursor-pointer"
          >
            <option value="ALL">All Events</option>
            {eventsList.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveStarFilter(null);
              setCurrentPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              activeStarFilter === null
                ? "bg-[#fff5ed] text-[#bb4d00] border border-[#bb4d00]/40 shadow-2xs"
                : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
            }`}
          >
            All
          </button>

          {starTabs.map((star) => {
            const isActive = activeStarFilter === star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => {
                  setActiveStarFilter(star);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#FFF5ED] text-[#BB4D00] border border-[#BB4D00]/40 shadow-2xs"
                    : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                }`}
              >
                <span>{star}</span>
                <StarSolid className="w-3.5 h-3.5 text-amber-400" />
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-neutral-400 text-sm">
          Loading reviews from Customer ...
        </div>
      ) : paginatedReviews.length === 0 ? (
        <div className="border border-dashed border-neutral-200 rounded-2xl py-16 px-4 text-center bg-[#FAF8F4]/40 my-2">
          <ChatBubbleBottomCenterTextIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-neutral-700">
            No reviews yet for the selected category
          </p>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Reviews from attendees will automatically appear here once customers submit their event feedback.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedReviews.map((review) => (
            <div
              key={review.id}
              className="bg-white border border-neutral-100 rounded-2xl p-5 md:p-6 shadow-2xs hover:border-neutral-200 transition-all space-y-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {review.customerAvatar ? (
                    <img
                      src={review.customerAvatar}
                      alt={review.customerName}
                      className="w-10 h-10 rounded-full object-cover border border-neutral-200 shrink-0 mt-0.5"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#FFF5ED] border border-[#BB4D00]/20 text-[#BB4D00] flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                      {getInitials(review.customerName)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-neutral-900 text-sm md:text-base">
                      {review.customerName}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5 font-medium">
                      {review.eventName}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <StarSolid
                        key={s}
                        className={`w-4 h-4 ${
                          s <= review.rating ? "text-amber-400" : "text-neutral-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-1">
                    {formatDate(review.createdAt)}
                  </span>
                </div>
              </div>

              <div className="bg-neutral-50/70 p-3.5 rounded-xl border border-neutral-100 text-xs md:text-sm text-neutral-700 leading-relaxed italic">
                <p>&ldquo;{review.reviewDesc}&rdquo;</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-neutral-100 mt-6 text-xs md:text-sm">
          <p className="text-neutral-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} reviews
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Prev</span>
            </button>
            <span className="px-3 py-1.5 font-semibold text-neutral-800">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
            >
              <span>Next</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </main>
  );
}