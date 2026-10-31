"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

/*
 * NOTE: Terms & Conditions
 * The event table has no "terms" column yet, so this section only shows the description.
 * To add per-event terms written by the organizer:
 */

// Descriptions longer than this are collapsed with a "Read more" button
const MAX_COLLAPSED_CHARS = 400;
const MAX_COLLAPSED_LINES = 6;

export default function EventDescription({ description }: { description: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLong =
    description.length > MAX_COLLAPSED_CHARS || description.split("\n").length > MAX_COLLAPSED_LINES;
  const isCollapsed = isLong && !isExpanded;

  return (
    <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div
        className={`relative space-y-2 overflow-hidden p-5 transition-[max-height] duration-500 ${
          isCollapsed ? "max-h-56" : "max-h-[3000px]"
        }`}
      >
        <h2 className="font-bold text-neutral-900">Description</h2>
        <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">{description}</p>

        {/* White fade at the bottom while collapsed */}
        {isCollapsed && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-white to-transparent" />
        )}
      </div>

      {/* Only show the button when the description is long */}
      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          className="flex w-full items-center justify-center gap-1 border-t border-neutral-100 py-2.5 text-xs font-semibold text-neutral-500 hover:text-orange-600"
        >
          {isExpanded ? "Show less" : "Read more"}
          <ChevronDown className={`size-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
        </button>
      )}
    </section>
  );
}