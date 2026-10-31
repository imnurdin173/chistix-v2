import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventInfoCard from "@/components/events/detail/EventInfoCard";
import EventDescription from "@/components/events/detail/EventDescription";
import EventReviews from "@/components/events/detail/EventReviews";
import TicketPanel from "@/components/events/detail/TicketPanel";
import ShareCard from "@/components/events/detail/ShareCard";
import SimilarEvents from "@/components/events/detail/SimilarEvents";
import { apiFetch } from "@/lib/api";
import type { EventDetail, TicketOption, TicketStatus } from "@/types/event";

export const instant = false;

const getEvent = cache(async (slug: string) => {
  try {
    const event = await apiFetch<EventDetail>(`/events/${encodeURIComponent(slug)}`);
    if (event.deletedAt || event.eventStatus !== "PUBLISHED") return null;
    return event;
  } catch {
    return null;
  }
});

type EventDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  return { title: event ? event.title : "Event not found" };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { slug } = await params;
  const event = await getEvent(slug);

  if (!event) notFound();

  const now = new Date();
  const tickets: TicketOption[] = event.ticketTypes.map((t) => {
    const remaining = Math.max(0, t.quota - t.sold);
    let status: TicketStatus = "AVAILABLE";
    if (new Date(t.saleStart) > now) status = "NOT_STARTED";
    else if (t.saleEnd && new Date(t.saleEnd) < now) status = "ENDED";
    else if (remaining === 0) status = "SOLD_OUT";

    return {
      id: t.id,
      name: t.name,
      price: t.priceNormal,
      priceAnchor: t.priceAnchor,
      remaining,
      status,
    };
  });

  return (
    <main className="bg-amber-50/60 py-8">
      <div className="mx-auto max-w-6xl space-y-8 px-4">
        <h1 className="text-2xl font-bold text-neutral-900 md:text-3xl">{event.title}</h1>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.thumbnailImage ?? "https://placehold.co/1200x800?text=No+Image"}
              alt={event.title}
              className="aspect-[3/2] w-full rounded-2xl object-cover shadow-sm"
            />

            <EventInfoCard
              startDate={event.eventStartDate}
              endDate={event.eventEndDate}
              venueAddress={event.venueAddress}
              cityName={event.cityName}
              provinceName={event.provinceName}
              mapsUrl={event.venueMapsUrl}
              organizerName={event.organizer.name}
              category={event.category}
            />

            <EventDescription description={event.description} />

            <EventReviews reviews={[]} /> {/* TODO: pass real reviews once the backend endpoint exists */}
          </div>

          {/* RIGHT COLUMN (does NOT follow the scroll) */}
          <aside className="space-y-4">
            <TicketPanel eventSlug={event.slug} tickets={tickets} />
            <ShareCard title={event.title} />
          </aside>
        </div>

        <SimilarEvents category={event.category} excludeId={event.id} />
      </div>
    </main>
  );
}