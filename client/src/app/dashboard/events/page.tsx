"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import EventStatusBadge from "@/components/dashboard/events/EventStatusBadge";
import PublishConfirmation from "@/components/dashboard/events/PublishConfirmation";
import { apiFetch } from "@/lib/api";
import type { OrganizerEventItem, MyEventsResponse } from "@/types/organizer";
import {
  PencilSquareIcon,
  ArrowUpCircleIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function EventsPage() {
  const [events, setEvents] = useState<OrganizerEventItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>("All");

  const [publishTarget, setPublishTarget] = useState<OrganizerEventItem | null>(null);
  const [isPublishActionOpen, setIsPublishActionOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<OrganizerEventItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const res = await apiFetch<MyEventsResponse>(
        "/organizers/my-events?page=1&limit=50",
        {
          headers: getAuthHeaders(),
        },
      );

      const formatted = res.events.map((evt) => {
        const startDateObj = evt.eventStartDate ? new Date(evt.eventStartDate) : null;
        const endDateObj = evt.eventEndDate ? new Date(evt.eventEndDate) : null;

        const dateText =
          startDateObj && !isNaN(startDateObj.getTime())
            ? startDateObj.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "-";

        const startTimeStr =
          startDateObj && !isNaN(startDateObj.getTime())
            ? startDateObj.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

        const endTimeStr =
          endDateObj && !isNaN(endDateObj.getTime())
            ? endDateObj.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

        const timeRangeText =
          startTimeStr && endTimeStr
            ? `${startTimeStr} - ${endTimeStr} WIB`
            : startTimeStr
              ? `${startTimeStr} WIB`
              : "";

        return {
          ...evt,
          dateText,
          timeRangeText,
        };
      });

      setEvents(formatted);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load events";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const statusFilters: string[] = [
    "All",
    "Published",
    "Upcoming",
    "Ongoing",
    "Draft",
    "Ended",
  ];

  const statusPriority: Record<string, number> = {
    ONGOING: 1,
    PUBLISHED: 2,
    UPCOMING: 3,
    DRAFT: 4,
    COMPLETED: 5,
    ENDED: 6,
    CANCELLED: 7,
  };

  const filteredEvents = events.filter((event) => {
    const query = searchQuery.toLowerCase();
    const matchSearch =
      event.title.toLowerCase().includes(query) ||
      event.cityName.toLowerCase().includes(query) ||
      event.venueAddress.toLowerCase().includes(query);

    const normalizedEventStatus = (event.eventStatus || "").toLowerCase();
    const normalizedFilter = activeStatusFilter.toLowerCase();
    const matchStatus =
      activeStatusFilter === "All"
        ? true
        : normalizedEventStatus === normalizedFilter;

    return matchSearch && matchStatus;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    const priorityA = statusPriority[a.eventStatus] || 99;
    const priorityB = statusPriority[b.eventStatus] || 99;
    return priorityA - priorityB;
  });

  const handleConfirmPublish = () => {
    if (!publishTarget) return;
    setEvents((prev) =>
      prev.map((e) =>
        e.id === publishTarget.id ? { ...e, eventStatus: "PUBLISHED" } : e,
      ),
    );
    setIsPublishActionOpen(false);
    setPublishTarget(null);
  };

  const handleExecuteDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await apiFetch(`/organizers/my-events/${deleteTarget.id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      await fetchEvents();
      setDeleteTarget(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete event";
      alert(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <main className="w-full bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-neutral-100">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900">
            Your Events
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage your published, upcoming, and draft events
          </p>
        </div>
        <Link
          href="/dashboard/events/create-events"
          className="flex items-center gap-1.5 bg-[#EA580C] hover:bg-[#BB4D00] text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-xs cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create Event</span>
        </Link>
      </div>

      {errorMessage && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <MagnifyingGlassIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search event name, city, or venue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-full bg-neutral-50 focus:outline-none focus:border-[#BB4D00] placeholder:text-neutral-400"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {statusFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveStatusFilter(filter)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeStatusFilter === filter
                  ? "bg-[#FFF5ED] text-[#BB4D00] border border-[#BB4D00]/40"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs md:text-sm">
          <thead>
            <tr className="text-neutral-900 font-semibold border-b border-neutral-100">
              <th className="pb-3.5 px-4">Event</th>
              <th className="pb-3.5">Date</th>
              <th className="pb-3.5 px-4">Ticket Sold</th>
              <th className="pb-3.5 px-4 text-center">Status</th>
              <th className="pb-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {isLoading ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-12 text-neutral-400 text-sm"
                >
                  Loading events...
                </td>
              </tr>
            ) : sortedEvents.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-12 text-neutral-400 text-sm"
                >
                  No events found. Click &ldquo;Create Event&rdquo; to add your first event.
                </td>
              </tr>
            ) : (
              sortedEvents.map((event) => {
                const ticketTypes = event.ticketTypes || [];
                const totalSold = ticketTypes.reduce(
                  (sum, tier) => sum + tier.sold,
                  0,
                );
                const totalQuota = ticketTypes.reduce(
                  (sum, tier) => sum + tier.quota,
                  0,
                );
                const status = (event.eventStatus || "DRAFT").toUpperCase();

                return (
                  <tr
                    key={event.id}
                    className="hover:bg-neutral-50/50 transition-colors"
                  >
                    <td className="py-4 pr-4 max-w-64">
                      <p className="font-semibold text-neutral-900 leading-snug line-clamp-2 px-4">
                        {event.title}
                      </p>
                      <p className="text-neutral-400 text-xs mt-0.5 px-4">
                        {event.venueAddress}, {event.cityName}
                      </p>
                    </td>
                    <td className="py-4 pr-4 whitespace-nowrap text-neutral-600">
                      <p className="font-semibold text-neutral-800">
                        {event.dateText}
                      </p>
                      {event.timeRangeText ? (
                        <p className="text-neutral-400 text-xs mt-0.5 font-medium">
                          {event.timeRangeText}
                        </p>
                      ) : (
                        <p className="text-neutral-400 text-xs mt-0.5">
                          Time not specified
                        </p>
                      )}
                    </td>
                    <td className="py-4 pr-4 px-4 whitespace-nowrap text-neutral-600 font-medium">
                      {totalSold} / {totalQuota}
                    </td>
                    <td className="py-4 pr-4 px-4 text-center">
                      <EventStatusBadge status={event.eventStatus} />
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {status !== "ENDED" && status !== "COMPLETED" && (
                          <Link
                            href={`/dashboard/events/update-events?id=${event.id}`}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-[#BB4D00] hover:bg-[#FFF5ED] transition-colors cursor-pointer"
                            title="Edit Event"
                          >
                            <PencilSquareIcon className="w-4.5 h-4.5 text-black/80 hover:text-[#BB4D00]" />
                          </Link>
                        )}

                        {status === "DRAFT" && (
                          <button
                            type="button"
                            onClick={() => {
                              setPublishTarget(event);
                              setIsPublishActionOpen(true);
                            }}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-amber-400 hover:text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
                            title="Publish Event"
                          >
                            <ArrowUpCircleIcon className="w-4.5 h-4.5" />
                          </button>
                        )}

                        {status !== "ENDED" && status !== "COMPLETED" && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(event)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Event"
                          >
                            <TrashIcon className="w-4.5 h-4.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop:blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-neutral-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
              <TrashIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">Delete event?</h3>
              <p className="text-xs text-neutral-600 mt-1">
                Are you sure you want to delete <strong>{deleteTarget.title}</strong>? This action will soft-delete the event.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-full text-xs font-semibold text-neutral-600 border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-full text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <PublishConfirmation
        isOpen={isPublishActionOpen}
        eventTitle={publishTarget?.title ?? ""}
        onClose={() => {
          setIsPublishActionOpen(false);
          setPublishTarget(null);
        }}
        onConfirmPublish={handleConfirmPublish}
      />
    </main>
  );
}