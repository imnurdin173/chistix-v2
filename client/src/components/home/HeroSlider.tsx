"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type HeroSlide = {
  slug: string;
  title: string;
  image: string;
};

const AUTOPLAY_MS = 5000;

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const hasMany = slides.length > 1;

  // Scroll the track to a slide (wraps around at both ends)
  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const target = (index + slides.length) % slides.length;
    track.scrollTo({ left: target * track.clientWidth, behavior: "smooth" });
  }

  // Keep the dots in sync when the user swipes or the slider moves
  function handleScroll() {
    const track = trackRef.current;
    if (!track) return;
    setActiveIndex(Math.round(track.scrollLeft / track.clientWidth));
  }

  // AUTOPLAY: next slide every 5s, paused on hover / for reduced-motion users
  useEffect(() => {
    if (!hasMany || isPaused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = setInterval(() => {
      const track = trackRef.current;
      if (!track) return;
      const current = Math.round(track.scrollLeft / track.clientWidth);
      const next = (current + 1) % slides.length;
      track.scrollTo({ left: next * track.clientWidth, behavior: "smooth" });
    }, AUTOPLAY_MS);

    return () => clearInterval(timer); // CLEANUP: stop the old timer
  }, [hasMany, isPaused, slides.length]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured events"
      className="group relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex snap-x snap-mandatory overflow-x-auto rounded-3xl shadow-md [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <Link
            key={slide.slug}
            href={`/events/${slide.slug}`}
            aria-label={`${slide.title} (slide ${i + 1} of ${slides.length})`}
            className="w-full shrink-0 snap-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.image} alt={slide.title} className="aspect-[16/9] w-full object-cover md:aspect-[21/9]" />
          </Link>
        ))}
      </div>

      {hasMany && (
        <>
          {/* ARROWS: desktop only, visible on hover */}
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => goTo(activeIndex - 1)}
            className="absolute left-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-800 opacity-0 shadow transition group-hover:opacity-100 hover:bg-white sm:flex"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => goTo(activeIndex + 1)}
            className="absolute right-3 top-1/2 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-neutral-800 opacity-0 shadow transition group-hover:opacity-100 hover:bg-white sm:flex"
          >
            <ChevronRight className="size-5" />
          </button>

          {/* DOTS */}
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {slides.map((slide, i) => (
              <button
                key={slide.slug}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === activeIndex}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${i === activeIndex ? "w-6 bg-white" : "w-2 bg-white/60"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}