import Link from "next/link";
import { formatRupiah } from "@/lib/format";

type EventCardProps = {
  slug: string;
  title: string;
  cityName: string;
  provinceName: string;
  thumbnailImage: string;
  price: number | null;
  priceAnchor?: number | null;
};

export default function EventCard({
  slug,
  title,
  cityName,
  provinceName,
  thumbnailImage,
  price,
  priceAnchor,
}: EventCardProps) {
  return (
    <Link
      href={`/events/${slug}`}
      className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={thumbnailImage} alt={title} className="aspect-[10/9] w-full object-cover" />

      <div className="flex flex-1 flex-col p-3">
        <p className="truncate text-xs text-neutral-500">
          {cityName}, {provinceName}
        </p>
        {/* min-h keeps 1-line and 2-line titles the same height */}
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-neutral-900">{title}</h3>

        {/* mt-auto pushes the price block to the bottom of the card */}
        <div className="mt-auto pt-3">
          <p className="text-xs text-neutral-500">{price !== null ? "Start from" : "\u00A0"}</p>
          <p className="flex items-baseline gap-2">
            {price === null ? (
              <span className="text-sm font-semibold text-neutral-400">Tickets not available yet</span>
            ) : (
              <>
                <span className="text-base font-bold text-[#EA580C]">
                  {price === 0 ? "Free" : formatRupiah(price)}
                </span>
                {priceAnchor != null && priceAnchor > price && (
                  <span className="text-xs text-neutral-400 line-through">{formatRupiah(priceAnchor)}</span>
                )}
              </>
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}