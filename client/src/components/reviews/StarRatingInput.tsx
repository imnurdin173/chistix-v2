"use client";

import { useState } from "react";
import { Star } from "lucide-react";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

type StarRatingInputProps = {
  value: number; // 0 = nothing chosen yet
  onChange: (value: number) => void;
  labelledBy?: string;
  disabled?: boolean;
};

// Clickable stars. Hovering previews the score before clicking.
export default function StarRatingInput({ value, onChange, labelledBy, disabled = false }: StarRatingInputProps) {
  const [hovered, setHovered] = useState(0);
  const shown = hovered || value; // while hovering show the hovered score, otherwise the chosen one

  return (
    <div className="mt-1 flex items-center gap-3">
      <div role="radiogroup" aria-labelledby={labelledBy} className="flex gap-1" onMouseLeave={() => setHovered(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            className="rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-[#EA580C] disabled:cursor-not-allowed"
          >
            <Star
              aria-hidden="true"
              className={`size-7 ${star <= shown ? "fill-amber-400 text-amber-400" : "fill-neutral-200 text-neutral-200"}`}
            />
          </button>
        ))}
      </div>
      {shown > 0 && <span className="text-xs font-semibold text-neutral-600">{LABELS[shown]}</span>}
    </div>
  );
}