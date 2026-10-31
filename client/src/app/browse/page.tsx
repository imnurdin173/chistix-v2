import Link from "next/link";
import EventCard from "@/components/events/EventCard";
import EventToolbar from "@/components/events/EventToolbar";
import EventFilterSidebar from "@/components/events/EventFilterSidebar";
import EventPagination from "@/components/events/EventPagination";
import { apiFetch } from "@/lib/api";
import { toDigits } from "@/lib/format";
import type { EventsResponse } from "@/types/event";

export const instant = false;

const EVENTS_PER_PAGE = 9;

// Isi URL apa adanya (masih teks mentah, belum tentu valid)
type BrowseQuery = {
  search?: string;
  category?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string;
};

// Isi URL yang sudah dibersihkan
type BrowseFilters = {
  search: string;
  category: string;
  location: string;
  minPrice: string; // angka murni, contoh "40000"
  maxPrice: string;
};

async function getEvents(filters: BrowseFilters, page: number) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(EVENTS_PER_PAGE));
  if (filters.search) params.set("search", filters.search);
  if (filters.category) params.set("category", filters.category);
  // TODO: aktifkan setelah backend mendukung
  // if (filters.location) params.set("location", filters.location);
  // if (filters.minPrice) params.set("minPrice", filters.minPrice);
  // if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);

  try {
    return await apiFetch<EventsResponse>(`/events?${params.toString()}`);
  } catch {
    return null;
  }
}

type BrowsePageProps = {
  searchParams: Promise<BrowseQuery>;
};

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const query = await searchParams;

  // Bersihkan isi URL sebelum dipakai: harga dijamin angka murni
  const filters: BrowseFilters = {
    search: query.search?.trim() ?? "",
    category: query.category ?? "",
    location: query.location ?? "",
    minPrice: toDigits(query.minPrice ?? ""),
    maxPrice: toDigits(query.maxPrice ?? ""),
  };

  const currentPage = Math.max(1, Number(query.page) || 1);
  const data = await getEvents(filters, currentPage);
  const isFiltering = Object.values(filters).some(Boolean);

  return (
    <main className="bg-amber-50/60 py-8">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <EventFilterSidebar
            defaultValues={{
              category: filters.category,
              location: filters.location,
              minPrice: filters.minPrice,
              maxPrice: filters.maxPrice,
            }}
          />
        </aside>

        <section className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <EventToolbar defaultSearch={filters.search} />
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-neutral-900">
              All Events {data && `(${data.pagination.total})`}
            </h2>

            {!data && (
              <p className="py-10 text-center text-sm text-red-600">
                Failed to load events. Please refresh the page.
              </p>
            )}

            {data && data.events.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm text-neutral-500">
                  {isFiltering ? "No events match your search or filters." : "No events available yet."}
                </p>
                {(isFiltering || currentPage > 1) && (
                  <Link
                    href="/browse"
                    className="mt-3 inline-block text-sm font-semibold text-orange-600 hover:underline"
                  >
                    {isFiltering ? "Clear all filters" : "Back to first page"}
                  </Link>
                )}
              </div>
            )}

            {data && data.events.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.events.map((event) => {
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

                <EventPagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  searchParams={query}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}