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
import { fetchEventReviews } from "@/lib/reviews";
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
  searchParams: Promise<{ login?: string }>; // ?login=1 opens the login popup (sent here by the cart)
};

export async function generateMetadata({ params }: EventDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  return { title: event ? event.title : "Event not found" };
}

export default async function EventDetailPage({ params, searchParams }: EventDetailPageProps) {
  const { slug } = await params;
  const { login } = await searchParams;
  const event = await getEvent(slug);

  if (!event) notFound();

  // Latest 10 reviews + average rating (null if the request fails: the section shows "No reviews yet")
  const reviewData = await fetchEventReviews(event.id, 10).catch(() => null);

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
    <>
    <main className="bg-amber-50/60 py-8">
      <div className="mx-auto container max-w-8xl space-y-8 px-4">
        <h1 className="text-2xl font-bold text-neutral-900 md:text-3xl">{event.title}</h1>

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          {/* LEFT COLUMN */}
          <div className="space-y-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={event.coverImages?.[0] ?? "https://placehold.co/1200x800?text=No+Image"}
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

            <EventReviews
              reviews={reviewData?.reviews ?? []}
              average={reviewData?.ratingSummary.average ?? 0}
              total={reviewData?.ratingSummary.total ?? 0}
            />
          </div>

          {/* RIGHT COLUMN (does NOT follow the scroll) */}
          <aside className="lg:sticky lg:top-30 lg:h-[calc(55vh-8rem)] space-y-4">
            <TicketPanel eventSlug={event.slug} tickets={tickets} openLoginOnLoad={login === "1"} />
            <ShareCard title={event.title} />
          </aside>
        </div>

        <SimilarEvents category={event.category} excludeId={event.id} />
      </div>
    </main>
    </>
  );
}