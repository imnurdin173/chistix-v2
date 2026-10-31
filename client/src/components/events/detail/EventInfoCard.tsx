import { MapPin } from "lucide-react";
import { formatEventSchedule } from "@/lib/date";
import { getCategoryLabel } from "@/lib/categories";

type EventInfoCardProps = {
  startDate: string;
  endDate: string;
  venueAddress: string;
  cityName: string;
  provinceName: string;
  mapsUrl: string | null;
  organizerName: string;
  category: string;
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 border-b border-neutral-100 py-3 text-sm last:border-b-0 sm:grid-cols-[140px_1fr]">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="font-medium text-neutral-900">{children}</dd>
    </div>
  );
}

export default function EventInfoCard({
  startDate,
  endDate,
  venueAddress,
  cityName,
  provinceName,
  mapsUrl,
  organizerName,
  category,
}: EventInfoCardProps) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white px-5 py-2 shadow-sm">
      <dl>
        <InfoRow label="Date">{formatEventSchedule(startDate, endDate)}</InfoRow>

        <InfoRow label="Location">
          <span className="text-orange-700">
            {venueAddress}, {cityName}, {provinceName}
          </span>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-100"
            >
              <MapPin className="size-3" />
              Open in Maps
            </a>
          )}
        </InfoRow>

        <InfoRow label="Organizer">
          <span className="text-orange-700">{organizerName}</span>
        </InfoRow>

        <InfoRow label="Category">
          <span className="text-orange-700">{getCategoryLabel(category)}</span>
        </InfoRow>
      </dl>
    </section>
  );
}