import Link from "next/link";
import { CalendarDays, MapPin, Ticket } from "lucide-react";
import { apiFetchServer } from "@/lib/api.server";
import { formatEventSchedule } from "@/lib/date";
import type { TransactionDetail, TransactionListResponse } from "@/types/transaction";

const FALLBACK_IMAGE = "https://placehold.co/400x300?text=No+Image";

async function getPaidTransactions(): Promise<TransactionDetail[] | null> {
  try {
    const data = await apiFetchServer<TransactionListResponse>("/transactions?status=PAID&limit=50");
    return data.transactions;
  } catch {
    return null;
  }
}

function TicketCard({ transaction: t, isPast }: { transaction: TransactionDetail; isPast: boolean }) {
  return (
    <article className={`flex gap-4 rounded-2xl border border-neutral-100 bg-white p-3 shadow-xs ${isPast ? "opacity-70" : ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={t.event.thumbnailImage ?? FALLBACK_IMAGE}
        alt={t.event.title}
        className="aspect-[4/3] w-28 shrink-0 rounded-xl object-cover sm:w-40"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-bold text-neutral-900 sm:text-base">{t.event.title}</h3>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
              isPast ? "bg-neutral-100 text-neutral-500" : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {isPast ? "Ended" : "Upcoming"}
          </span>
        </div>

        <p className="flex items-center gap-1.5 text-xs text-neutral-500">
          <CalendarDays className="size-3.5 shrink-0" />
          {formatEventSchedule(t.event.eventStartDate, t.event.eventEndDate)}
        </p>
        <p className="flex items-center gap-1.5 text-xs text-neutral-500">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">
            {t.event.venueAddress}, {t.event.cityName}
          </span>
        </p>
        <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-700">
          <Ticket className="size-3.5 shrink-0 text-[#EA580C]" />
          {t.ticketType.name} × {t.quantity}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="text-[11px] text-neutral-400">Order #{t.id.slice(0, 8).toUpperCase()}</span>
          <div className="flex items-center gap-3">
            <Link
              href={`/cart/checkout/invoice?id=${t.id}`}
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 hover:underline"
            >
              Invoice
            </Link>
            <Link
              href={`/e-ticket/${t.id}`}
              className="rounded-full bg-[#EA580C] px-3 py-1 text-xs font-bold text-white hover:bg-[#BB4D00]"
            >
              E-Ticket
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

// Tab "My Tickets" of /customer
export default async function TicketsTab() {
  const transactions = await getPaidTransactions();
  const now = Date.now();

  const upcoming = (transactions ?? [])
    .filter((t) => new Date(t.event.eventEndDate).getTime() >= now)
    .sort((a, b) => new Date(a.event.eventStartDate).getTime() - new Date(b.event.eventStartDate).getTime());

  const past = (transactions ?? [])
    .filter((t) => new Date(t.event.eventEndDate).getTime() < now)
    .sort((a, b) => new Date(b.event.eventStartDate).getTime() - new Date(a.event.eventStartDate).getTime());

  return (
    <main className="space-y-6 rounded-2xl border border-neutral-100 bg-white p-6 shadow-xs md:p-8">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">My Tickets</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Events you have paid for. Download your e-tickets and show the QR code at the entrance.
        </p>
      </div>

      {transactions === null && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">Failed to load your tickets. Please refresh the page.</p>
      )}

      {transactions !== null && transactions.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Ticket className="size-10 text-neutral-300" />
          <p className="font-semibold text-neutral-700">No tickets yet</p>
          <p className="text-sm text-neutral-500">Tickets you buy will appear here after payment.</p>
          <Link
            href="/browse"
            className="mt-2 rounded-full bg-[#EA580C] px-5 py-2 text-sm font-bold text-white hover:bg-[#BB4D00]"
          >
            Browse Events
          </Link>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">Upcoming ({upcoming.length})</h2>
          {upcoming.map((t) => (
            <TicketCard key={t.id} transaction={t} isPast={false} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide text-neutral-500">Past Events ({past.length})</h2>
          {past.map((t) => (
            <TicketCard key={t.id} transaction={t} isPast />
          ))}
        </section>
      )}
    </main>
  );
}