import Link from "next/link";
import EventCard from "@/components/events/EventCard";
import HeroSlider, { type HeroSlide } from "@/components/home/HeroSlider";
import EventRow from "@/components/home/EventRow";
import PresaleEventCard from "@/components/home/PresaleEventCard";
import { apiFetch } from "@/lib/api";
import type { EventListItem, EventsResponse } from "@/types/event";

export const instant = false;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const FALLBACK_IMAGE = "https://placehold.co/800x450?text=No+Image";
const HERO_LIMIT = 5;
const ROW_LIMIT = 10;

async function getUpcomingEvents(): Promise<EventListItem[] | null> {
  try {
    const data = await apiFetch<EventsResponse>("/events?limit=50");
    return data.events;
  } catch {
    return null;
  }
}

function getTotalSold (event: EventListItem) {
  return event.ticketTypes.reduce((sum, t) => sum + t.sold, 0);
}

function findActivePresale(event: EventListItem, now: Date) {
  return (
    event.ticketTypes.find(
      (t) =>
        t.name.toLowerCase().includes("presale") &&
        new Date(t.saleStart) <= now &&
        (!t.saleEnd || new Date(t.saleEnd) > now) &&
        t.quota - t.sold > 0,
    ) ?? null
  );
}

function RowEventCard({ event }: { event: EventListItem }) {
  const cheapest = event.ticketTypes[0] ?? null;
  return (
    <div className="w-56 shrink-0 snap-start sm:w-60">
      <EventCard
        slug={event.slug}
        title={event.title}
        cityName={event.cityName}
        provinceName={event.provinceName}
        thumbnailImage={event.thumbnailImage ?? FALLBACK_IMAGE}
        price={cheapest ? cheapest.priceNormal : null}
        priceAnchor={cheapest?.priceAnchor ?? null}
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 text-lg font-bold text-neutral-900 md:text-xl">{children}</h2>;
}

export default async function HomePage() {
  const events = await getUpcomingEvents();
  const now = new Date();

  const heroSlides: HeroSlide[] = (events ?? [])
    .filter((e) => e.thumbnailImage)
    .slice(0, HERO_LIMIT)
    .map((e) => ({ slug: e.slug, title: e.title, image: e.thumbnailImage ?? FALLBACK_IMAGE }));

  const presaleItems = (events ?? [])
    .map((event) => ({ event, ticket: findActivePresale(event, now) }))
    .filter((item) => item.ticket !== null)
    .slice(0, ROW_LIMIT);

  const hotThisWeek = (events ?? [])
    .filter((e) => {
      const start = new Date(e.eventStartDate).getTime();
      return start >= now.getTime() && start <= now.getTime() + WEEK_MS;
    })
    .slice(0, ROW_LIMIT);

  const popular = [...(events ?? [])]
    .sort((a, b) => getTotalSold(b) - getTotalSold(a))
    .slice(0, ROW_LIMIT);

  return (
    <>
      <main className="bg-linear-to-b from-[#f3e8bf] via-white to-white pb-16">
        <div className="mx-auto max-w-6xl space-y-12 px-4 pt-6">
          {events === null ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-600">
              Failed to load events. Please refresh the page.
            </p>
          ) : (
            <>
              {/* HERO SLIDER */}
              {heroSlides.length > 0 && <HeroSlider slides={heroSlides} />}

              {/* PRESALE: hidden when there is no active presale */}
              {presaleItems.length > 0 && (
                <section className="rounded-3xl bg-linear-to-r from-[#EA580C] via-amber-300 to-amber-50 p-5 md:p-6">
                  <SectionTitle>Presale Event</SectionTitle>
                  <EventRow label="Presale events">
                    {presaleItems.map(({ event, ticket }) =>
                      ticket ? (
                        <PresaleEventCard
                          key={event.id}
                          slug={event.slug}
                          title={event.title}
                          cityName={event.cityName}
                          provinceName={event.provinceName}
                          thumbnailImage={event.thumbnailImage ?? FALLBACK_IMAGE}
                          ticketName={ticket.name}
                          price={ticket.priceNormal}
                          priceAnchor={ticket.priceAnchor}
                          sold={ticket.sold}
                          quota={ticket.quota}
                          saleEnd={ticket.saleEnd}
                        />
                      ) : null,
                    )}
                  </EventRow>
                </section>
              )}

              {/* HOT THIS WEEK: hidden when nothing starts this week */}
              {hotThisWeek.length > 0 && (
                <section>
                  <SectionTitle>Hot Event This Week</SectionTitle>
                  <EventRow label="Hot events this week">
                    {hotThisWeek.map((event) => (
                      <RowEventCard key={event.id} event={event} />
                    ))}
                  </EventRow>
                </section>
              )}

              {/* POPULAR */}
              <section>
                <SectionTitle>Popular Event</SectionTitle>
                {popular.length > 0 ? (
                  <EventRow label="Popular events">
                    {popular.map((event) => (
                      <RowEventCard key={event.id} event={event} />
                    ))}
                  </EventRow>
                ) : (
                  <p className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
                    No events yet. Check back soon!
                  </p>
                )}
              </section>

              <div className="flex justify-center">
                <Link
                  href="/browse"
                  className="rounded-full border border-[#EA580C] px-8 py-2.5 text-sm font-semibold text-[#EA580C] hover:bg-orange-50"
                >
                  See More Events
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}