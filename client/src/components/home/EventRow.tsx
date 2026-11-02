"use client";

import { useRef, useState } from "react";
import { useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type EventRowProps = {
  label: string;               // for screen readers, e.g. "Popular events"
  children: React.ReactNode;   // the cards (rendered on the server)
};

export default function EventRow({ label, children }: EventRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check whether there is more content on the left / right
  function updateArrows() {
    const row = rowRef.current;
    if (!row) return;
    setCanScrollLeft(row.scrollLeft > 4);
    setCanScrollRight(row.scrollLeft + row.clientWidth < row.scrollWidth - 4);
  }

  // Re-check when the row is resized (also runs once right after it appears)
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const observer = new ResizeObserver(() => updateArrows());
    observer.observe(row);
    return () => observer.disconnect();
  }, []);

  function scrollByPage(direction: 1 | -1) {
    const row = rowRef.current;
    if (!row) return;
    row.scrollBy({ left: direction * row.clientWidth * 0.9, behavior: "smooth" });
  }

  const arrowClass =
    "absolute top-1/2 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-neutral-700 shadow-md hover:bg-neutral-50 sm:flex";

  return (
    <div className="relative">
      <div
        ref={rowRef}
        role="region"
        aria-label={label}
        onScroll={updateArrows}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {canScrollLeft && (
        <button type="button" aria-label="Scroll left" onClick={() => scrollByPage(-1)} className={`${arrowClass} -left-4`}>
          <ChevronLeft className="size-5" />
        </button>
      )}
      {canScrollRight && (
        <button type="button" aria-label="Scroll right" onClick={() => scrollByPage(1)} className={`${arrowClass} -right-4`}>
          <ChevronRight className="size-5" />
        </button>
      )}
    </div>
  );
}