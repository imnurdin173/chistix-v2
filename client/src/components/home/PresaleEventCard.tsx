"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format";

type PresaleEventCardProps = {
  slug: string;
  title: string;
  cityName: string;
  provinceName: string;
  thumbnailImage: string;
  ticketName: string;
  price: number;
  priceAnchor: number | null;
  sold: number;
  quota: number;
  saleEnd: string | null;
};

function getTimeLeft(endIso: string, now: number) {
  const diff = Math.max(0, new Date(endIso).getTime() - now);
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
  };
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span
        suppressHydrationWarning
        className="min-w-7 rounded-md bg-neutral-900 px-1 py-0.5 text-center text-[11px] font-bold text-white"
      >
        {String(value).padStart(2, "0")}
      </span>
      <span className="mt-0.5 text-[8px] uppercase tracking-wide text-neutral-400">{label}</span>
    </div>
  );
}

export default function PresaleEventCard({
  slug,
  title,
  cityName,
  provinceName,
  thumbnailImage,
  ticketName,
  price,
  priceAnchor,
  sold,
  quota,
  saleEnd,
}: PresaleEventCardProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!saleEnd) return;
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [saleEnd]);

  const remaining = Math.max(0, quota - sold);
  const soldPercent = quota > 0 ? Math.min(100, Math.round((sold / quota) * 100)) : 0;
  const isLimited = remaining <= quota * 0.2;
  const timeLeft = saleEnd ? getTimeLeft(saleEnd, now) : null;

  return (
    <Link
      href={`/events/${slug}`}
      className="flex w-[300px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:w-[340px]"
    >
      {/* LANDSCAPE IMAGE */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumbnailImage} alt={title} className="aspect-[2/1] w-full object-cover" />
        {isLimited && (
          <span className="absolute left-2 top-2 rounded-md bg-[#EA580C] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
            Limited Stock
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] text-neutral-500">
            {cityName}, {provinceName}
          </p>
          <h3 className="truncate text-sm font-semibold text-neutral-900">{title}</h3>
        </div>

        {/* PRICE (left) + COUNTDOWN (right) */}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-block rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-700">
              {ticketName}
            </span>
            <p className="mt-1 flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-sm font-bold text-[#EA580C]">{price === 0 ? "Free" : formatRupiah(price)}</span>
              {priceAnchor != null && priceAnchor > price && (
                <span className="text-[10px] text-neutral-400 line-through">{formatRupiah(priceAnchor)}</span>
              )}
            </p>
          </div>

          {timeLeft && (
            <div className="flex shrink-0 gap-1" aria-label="Presale ends in">
              <TimeBox value={timeLeft.days} label="day" />
              <TimeBox value={timeLeft.hours} label="hr" />
              <TimeBox value={timeLeft.minutes} label="min" />
            </div>
          )}
        </div>

        {/* QUOTA PROGRESS */}
        <div className="mt-auto space-y-1">
          <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
            <div className="h-full rounded-full bg-[#EA580C]" style={{ width: `${soldPercent}%` }} />
          </div>
          <div className="flex justify-between text-[10px] text-neutral-500">
            <span>{soldPercent}% sold</span>
            <span>{remaining.toLocaleString("id-ID")} left</span>
          </div>
        </div>
      </div>
    </Link>
  );
}