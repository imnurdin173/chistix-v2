import React from "react";
import type { OrganizerEventStatus } from "@/types/organizer";

interface EventStatusBadgeProps {
    status: OrganizerEventStatus | string
}

export default function EventStatusBadge({status}: EventStatusBadgeProps) {
    const normalizedStatus = (status || "DRAFT").replace("_", "").toUpperCase()
    const getStyle = () => {
        switch (normalizedStatus) {
            case "ONGOING":
            case "ON STAGE":
                return "bg-rose-100 text-rose-700 border border-rose-300 font-bold"
            case "PUBLISHED":
            case "UPCOMING":
                return "bg-emerald-100 text-emerald-700 border border-emerald-200"
            case "DRAFT":
                return "bg-neutral-100 text-neutral-500 border border-neutral-200"
            case "COMPLETED":
            case "ENDED":
                return "bg-amber-100 text-amber-700 border border-amber-200"
            case "CANCELED":
                return "bg-red-100 text-red-700 border border-red-200";
            default:
                return "bg-neutral-100 text-neutral-700"
        }
    }
    const isLive = normalizedStatus === "ONGOING" || normalizedStatus === "ON STAGE"
    const label = isLive ? "Live: On Stage" : normalizedStatus.charAt(0) + normalizedStatus.slice(1).toLowerCase()
  return (
    <span
    className={`px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${getStyle()}`}
    >
        {isLive && (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping inline-block"/>
        )}
        {label}
    </span>
  )
}
