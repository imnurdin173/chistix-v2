import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { EventListItem, EventsResponse } from "@/types/event";

// Dinding #2 kemarin: halaman ini sengaja blocking (daftar event harus selalu segar)
export const instant = false;

/* ---------- helper format (dummy: tinggal di sini dulu, pindah ke lib/format.ts saat dipakai >1 file) ---------- */

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatTanggal(iso: string): string {
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function rentangTanggal(mulai: string, selesai: string): string {
  const a = formatTanggal(mulai);
  const b = formatTanggal(selesai);
  return a === b ? a : `${a} - ${b}`;
}

function potongTeks(teks: string, max: number): string {
  return teks.length > max ? `${teks.slice(0, max)}...` : teks;
}

/* ---------- pola baru: hasil sukses/gagal (discriminated union) ---------- */

type HomeResult =
  | { ok: true; data: EventsResponse }
  | { ok: false; message: string };

async function loadEvents(): Promise<HomeResult> {
  try {
    const data = await apiFetch<EventsResponse>("/events");
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : "Gagal memuat event",
    };
  }
}

/* ---------- kartu event ---------- */

function EventCard({ event }: { event: EventListItem }) {
  // "Mulai dari" = tiket termurah. Pakai reduce (bukan Math.min) karena
  // kita butuh OBJEK tiketnya, bukan cuma angkanya — untuk priceAnchor.
  const termurah =
    event.ticketTypes.length > 0
      ? event.ticketTypes.reduce((min, t) =>
          t.priceNormal < min.priceNormal ? t : min,
        )
      : null;

  const totalQuota = event.ticketTypes.reduce((sum, t) => sum + t.quota, 0);
  const totalSold = event.ticketTypes.reduce((sum, t) => sum + t.sold, 0);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {event.thumbnailImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.thumbnailImage}
          alt={event.title}
          className="h-44 w-full object-cover"
        />
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 text-sm text-gray-500">
          Tidak ada gambar
        </div>
      )}

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
            {event.category}
          </span>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {event.eventStatus}
          </span>
        </div>

        <div>
          <h2 className="line-clamp-2 text-base font-semibold text-gray-900">
            {event.title}
          </h2>
          <p className="mt-0.5 text-xs text-gray-500">
            oleh {event.organizer.name}
          </p>
        </div>

        {event.description && (
          <p className="text-sm text-gray-600">{potongTeks(event.description, 100)}</p>
        )}

        <div className="space-y-1 text-sm text-gray-600">
          <p>{rentangTanggal(event.eventStartDate, event.eventEndDate)}</p>
          <p>
            {event.cityName}, {event.provinceName}
          </p>
          {event.venueAddress && (
            <p className="text-xs text-gray-400">{potongTeks(event.venueAddress, 80)}</p>
          )}
        </div>

        {termurah && (
          <div>
            <p className="text-xs text-gray-500">Mulai dari</p>
            <p className="text-lg font-bold text-gray-900">
              {formatRupiah(termurah.priceNormal)}
              {termurah.priceAnchor != null &&
                termurah.priceAnchor > termurah.priceNormal && (
                  <span className="ml-2 text-sm font-normal text-gray-400 line-through">
                    {formatRupiah(termurah.priceAnchor)}
                  </span>
                )}
            </p>
          </div>
        )}

        {event.ticketTypes.length > 0 && (
          <ul className="space-y-1 rounded-lg bg-gray-50 p-2 text-xs text-gray-600">
            {event.ticketTypes.map((t) => (
              <li key={t.id} className="flex justify-between">
                <span>{t.name}</span>
                <span>
                  {formatRupiah(t.priceNormal)} - sisa {t.quota - t.sold}
                </span>
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-gray-500">
          Sisa total: {totalQuota - totalSold} dari {totalQuota} tiket
        </p>

        <div className="mt-auto">
          <Link
            href={`/events/${event.slug}`}
            className="block rounded-xl bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Lihat detail
          </Link>
        </div>

        {/* Mata-mata data: bukti "semua data dari database" — termasuk field yang tidak kita type.
            Dihapus saat polish nanti. */}
        <details className="rounded-lg border border-dashed border-gray-300 p-2">
          <summary className="cursor-pointer text-xs text-gray-500">
            Data mentah dari API (JSON)
          </summary>
          <pre className="mt-2 max-h-64 overflow-auto text-[10px] leading-relaxed text-gray-600">
            {JSON.stringify(event, null, 2)}
          </pre>
        </details>
      </div>
    </article>
  );
}

/* ---------- page utama ---------- */

export default async function HomePage() {
  const result = await loadEvents();

  if (!result.ok) {
    return (
      <main className="mx-auto max-w-5xl p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-700">Gagal memuat event</h1>
          <p className="mt-1 text-sm text-red-600">{result.message}</p>
          <p className="mt-3 text-xs text-red-500">
            Cek: backend hidup? API_URL sudah menunjuk ke port yang benar?
          </p>
        </div>
      </main>
    );
  }

  const { events, pagination } = result.data;

  return (
    <main className="mx-auto max-w-6xl p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Chistix - Homepage (dummy TEST INTEGRATION)</h1>
        <p className="mt-1 text-sm text-gray-500">
          {events.length} event ditampilkan - total {pagination.total} event -
          halaman {pagination.page} dari {pagination.totalPages}
        </p>
      </header>

      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
          Belum ada event di database.
        </div>
      ) : (
        <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </section>
      )}
    </main>
  );
}