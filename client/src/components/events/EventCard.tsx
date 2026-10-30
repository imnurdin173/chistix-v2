import Link from "next/link";

// 1. Tentukan "bentuk" props yang diterima kartu ini
type EventCardProps = {
    slug: string;
    title: string;
    cityName: string;
    provinceName: string;
    thumbnailImage: string;
    price: number | null;
    priceAnchor?: number | null;
};

// 2. Komponennya: props "dibongkar" langsung di parameter
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
            className="block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnailImage} alt={title} className="aspect-[10/9] w-full object-cover" />

            <div className="space-y-1 p-3">
                <p className="text-xs text-neutral-500">
                    {cityName}, {provinceName}
                </p>
                <h3 className="line-clamp-2 text-sm font-semibold text-neutral-900">{title}</h3>

                <p className="pt-2 text-xs text-neutral-500">Start from</p>
                <p className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-orange-600">
                        {price === null
                            ? "Tiket belum tersedia"
                            : price === 0
                                ? "Gratis"
                                : `Rp${price.toLocaleString("id-ID")}`}
                    </span>
                    {price !== null && priceAnchor != null && priceAnchor > price && (
                        <span className="text-xs text-neutral-400 line-through">
                            Rp{priceAnchor.toLocaleString("id-ID")}
                        </span>
                    )}
                </p>
            </div>
        </Link>
    );
}