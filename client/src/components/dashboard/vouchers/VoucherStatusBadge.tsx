import React from "react";

interface VoucherStatusBadgeProps {
  status: "ACTIVE" | "SCHEDULED" | "EXPIRED" | string;
}

export default function VoucherStatusBadge({ status }: VoucherStatusBadgeProps) {
  const norm = (status || "").toUpperCase();

  const getStyle = () => {
    switch (norm) {
      case "ACTIVE":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "SCHEDULED":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "EXPIRED":
        return "bg-neutral-100 text-neutral-500 border-neutral-200";
      default:
        return "bg-neutral-100 text-neutral-700 border-neutral-200";
    }
  };

  return (
    <span
      className={`px-2.5 py-1 rounded-full text-xs font-semibold border inline-block capitalize ${getStyle()}`}
    >
      {norm.toLowerCase()}
    </span>
  );
}