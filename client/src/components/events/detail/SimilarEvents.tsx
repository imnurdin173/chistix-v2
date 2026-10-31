import EventCard from "@/components/events/EventCard";
import { apiFetch } from "@/lib/api";
import type { EventsResponse } from "@/types/event";

type SimilarEventsProps = {
  category: string;
  excludeId: string;
};

export default async function SimilarEvents({ category, excludeId }: SimilarEventsProps) {
  let events: EventsResponse["events"] = [];
  try {
    const data = await apiFetch<EventsResponse>(`/events?category=${category}&limit=5`);
    events = data.events.filter((e) => e.id !== excludeId).slice(0, 4);
  } catch {
    return null;
  }

  if (events.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold text-neutral-900">Similar Events For You</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {events.map((event) => {
          const cheapest = event.ticketTypes[0] ?? null;
          return (
            <EventCard
              key={event.id}
              slug={event.slug}
              title={event.title}
              cityName={event.cityName}
              provinceName={event.provinceName}
              thumbnailImage={event.thumbnailImage ?? "https://placehold.co/400x360?text=No+Image"}
              price={cheapest ? cheapest.priceNormal : null}
              priceAnchor={cheapest?.priceAnchor ?? null}
            />
          );
        })}
      </div>
    </section>
  );
}