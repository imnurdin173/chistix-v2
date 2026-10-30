import Link from "next/link";
import EventCard from "@/components/events/EventCard";
import EventToolbar from "@/components/events/EventToolbar";
import EventFilterSidebar from "@/components/events/EventFilterSidebar";
import EventPagination from "@/components/events/EventPagination"; // BARU
import { apiFetch } from "@/lib/api";
import type { EventsResponse } from "@/types/event";

export const instant = false;

// BARU: jumlah event per halaman (ubah ke 1 sementara untuk mengetes)
const EVENTS_PER_PAGE = 9;

type BrowseQuery = {
  search?: string;
  category?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  page?: string; // BARU
};

async function getEvents(query: BrowseQuery, page: number) {
  const params = new URLSearchParams();
  params.set("page", String(page));                // BARU
  params.set("limit", String(EVENTS_PER_PAGE));    // BARU
  if (query.search) params.set("search", query.search);
  if (query.category) params.set("category", query.category);
  // TODO: aktifkan setelah backend mendukung
  // if (query.location) params.set("location", query.location);
  // if (query.minPrice) params.set("minPrice", query.minPrice);
  // if (query.maxPrice) params.set("maxPrice", query.maxPrice);

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

  // BARU: ubah teks "2" jadi angka 2; kalau kosong/aneh → halaman 1
  const currentPage = Math.max(1, Number(query.page) || 1);

  const data = await getEvents(query, currentPage);

  const isFiltering = Boolean(
    query.search || query.category || query.location || query.minPrice || query.maxPrice,
  );

  return (
    <main className="bg-amber-50/60 py-8">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 md:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <EventFilterSidebar
            defaultValues={{
              category: query.category ?? "",
              location: query.location ?? "",
              minPrice: query.minPrice ?? "",
              maxPrice: query.maxPrice ?? "",
            }}
          />
        </aside>

        <section className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
            <EventToolbar defaultSearch={query.search ?? ""} />
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-neutral-900">
              Semua Event {data && `(${data.pagination.total})`}
            </h2>

            {!data && (
              <p className="py-10 text-center text-sm text-red-600">
                Gagal memuat event. Coba muat ulang halaman.
              </p>
            )}

            {data && data.events.length === 0 && (
              <div className="py-10 text-center">
                <p className="text-sm text-neutral-500">
                  {isFiltering
                    ? "Tidak ada event yang cocok dengan pencarian atau filter kamu."
                    : "Belum ada event yang tersedia."}
                </p>
                {(isFiltering || currentPage > 1) && (
                  <Link
                    href="/browse"
                    className="mt-3 inline-block text-sm font-semibold text-orange-600 hover:underline"
                  >
                    {isFiltering ? "Hapus semua filter" : "Kembali ke halaman pertama"}
                  </Link>
                )}
              </div>
            )}

            {data && data.events.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {data.events.map((event) => {
                    const termurah = event.ticketTypes[0] ?? null;
                    return (
                      <EventCard
                        key={event.id}
                        slug={event.slug}
                        title={event.title}
                        cityName={event.cityName}
                        provinceName={event.provinceName}
                        thumbnailImage={event.thumbnailImage ?? "https://placehold.co/400x360?text=No+Image"}
                        price={termurah ? termurah.priceNormal : null}
                        priceAnchor={termurah?.priceAnchor ?? null}
                      />
                    );
                  })}
                </div>

                {/* BARU */}
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