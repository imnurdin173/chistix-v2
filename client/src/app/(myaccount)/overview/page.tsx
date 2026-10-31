import Link from "next/link";
import type { Metadata } from "next";
import { AlertCircle } from "lucide-react";
import EventCard from "@/components/events/EventCard";
import CopyButton from "@/components/customer/CopyButton";
import PaymentCountdown from "@/components/customer/PaymentCountdown";
import TransactionStatusBadge from "@/components/customer/TransactionStatusBadge";
import { requireCustomer } from "@/lib/auth.server";
import { apiFetchServer } from "@/lib/api.server";
import { apiFetch } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { getTransactionTotal } from "@/lib/transaction";
import type { TransactionListResponse } from "@/types/transaction";
import type { EventsResponse } from "@/types/event";

export const instant = false;
export const metadata: Metadata = { title: "Overview" };

const FALLBACK_IMAGE = "https://placehold.co/400x360?text=No+Image";

// Run a request; return null instead of crashing the whole page if it fails
async function safe<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch {
    return null;
  }
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

function StatCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-xl bg-[#38383A] p-4 text-white">
      <p className="text-[11px] text-neutral-300">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      <p className="mt-2 text-[10px] text-neutral-400">{note}</p>
    </div>
  );
}

export default async function OverviewPage() {
  const user = await requireCustomer();

  const [transactionData, referral, eventData] = await Promise.all([
    safe(apiFetchServer<TransactionListResponse>("/transactions?limit=50")),
    safe(apiFetchServer<{ totalReferred: number }>("/profile/referral")),
    safe(apiFetch<EventsResponse>("/events?limit=3")),
  ]);

  const transactions = transactionData?.transactions ?? [];
  const now = Date.now();

  // ----- Numbers derived from the transaction list -----
  const pendingPayment = transactions.find(
    (t) => t.status === "WAITING_PAYMENT" && new Date(t.paymentDeadline).getTime() > now,
  );

  const paid = transactions.filter((t) => t.status === "PAID");
  const upcomingPaid = paid
    .filter((t) => new Date(t.event.eventEndDate).getTime() >= now)
    .sort((a, b) => new Date(a.event.eventStartDate).getTime() - new Date(b.event.eventStartDate).getTime());
  const pastPaid = paid.filter((t) => new Date(t.event.eventEndDate).getTime() < now);

  const recentTransactions = transactions.slice(0, 5); // backend already sorts newest first

  return (
    <main className="space-y-6 rounded-2xl border border-neutral-100 bg-white p-6 shadow-xs md:p-8">
      {/* GREETING */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Hi {user.name}!</h1>
        <p className="mt-1 text-sm text-neutral-500">Here are your tickets, rewards, and orders.</p>
      </div>

      {/* PENDING PAYMENT BANNER */}
      {pendingPayment && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <AlertCircle className="size-4 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-neutral-900">Payment needed for {pendingPayment.event.title}</p>
              <p className="mt-0.5 text-xs text-neutral-500">
                {pendingPayment.ticketType.name} × {pendingPayment.quantity},{" "}
                {formatRupiah(getTransactionTotal(pendingPayment))} · time left{" "}
                <PaymentCountdown deadline={pendingPayment.paymentDeadline} />
              </p>
            </div>
          </div>
          <Link
            href={`/cart/checkout/invoice?id=${pendingPayment.id}`}
            className="rounded-full bg-[#EA580C] px-4 py-2 text-xs font-bold text-white hover:bg-[#BB4D00]"
          >
            View Order
          </Link>
        </div>
      )}

      {/* STATS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Points Balance"
          value={`${user.points.toLocaleString("id-ID")} P`}
          note={user.points > 0 ? "Use them at checkout" : "No points yet"}
        />
        <StatCard
          label="Upcoming Tickets"
          value={String(upcomingPaid.length)}
          note={upcomingPaid[0] ? `Next: ${formatShortDate(upcomingPaid[0].event.eventStartDate)}` : "No upcoming event"}
        />
        <StatCard
          label="Past Events"
          value={String(pastPaid.length)}
          note={pastPaid.length > 0 ? "Thanks for coming!" : "No past events yet"}
        />
        <StatCard
          label="Referrals"
          value={referral ? String(referral.totalReferred) : "-"}
          note={referral ? "Friends joined with your code" : "Could not load referrals"}
        />
      </div>

      {/* RECENT TRANSACTIONS + INVITE FRIENDS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-neutral-900">Recent Transactions</h2>
            <Link href="/transactions" className="text-xs font-semibold text-[#EA580C] hover:underline">
              View all
            </Link>
          </div>

          {transactionData === null ? (
            <p className="rounded-xl bg-red-50 p-4 text-xs text-red-600">Failed to load transactions.</p>
          ) : recentTransactions.length === 0 ? (
            <p className="rounded-xl bg-neutral-50 p-6 text-center text-xs text-neutral-500">No transactions yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-xs">
                <thead className="border-b border-neutral-100 text-neutral-400">
                  <tr>
                    <th className="pb-2 font-medium">Event</th>
                    <th className="px-3 pb-2 text-center font-medium">Ticket</th>
                    <th className="px-3 pb-2 text-center font-medium">Status</th>
                    <th className="pb-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50 text-neutral-600">
                  {recentTransactions.map((t) => (
                    <tr key={t.id}>
                      <td className="py-3 pr-3">
                        <Link
                          href={`/cart/checkout/invoice?id=${t.id}`}
                          className="font-semibold text-neutral-900 hover:text-[#EA580C]"
                        >
                          {t.event.title}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-center">
                        {t.ticketType.name} × {t.quantity}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <TransactionStatusBadge status={t.status} />
                      </td>
                      <td className="whitespace-nowrap py-3 text-right font-semibold text-neutral-900">
                        {formatRupiah(getTransactionTotal(t))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="flex flex-col justify-between rounded-xl border border-neutral-100 bg-neutral-50/60 p-4">
          <div>
            <h2 className="text-sm font-bold text-neutral-900">Invite Friends</h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-500">
              Share your referral code. When a friend registers with it, you get bonus points.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-[#EA580C]/30 bg-white p-2.5">
            <span className="text-sm font-bold tracking-wider text-[#EA580C]">{user.referralCode}</span>
            <CopyButton text={user.referralCode} label="Copy referral code" />
          </div>
        </section>
      </div>

      {/* EVENTS FOR YOU */}
      {eventData && eventData.events.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold text-neutral-900">Events for you</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {eventData.events.map((event) => {
              const cheapest = event.ticketTypes[0] ?? null;
              return (
                <EventCard
                  key={event.id}
                  slug={event.slug}
                  title={event.title}
                  cityName={event.cityName}
                  provinceName={event.provinceName}
                  thumbnailImage={event.thumbnailImage ?? FALLBACK_IMAGE}
                  price={cheapest ? cheapest.priceNormal : null}
                  priceAnchor={cheapest?.priceAnchor ?? null}
                />
              );
            })}
          </div>
          <div className="mt-4 text-center">
            <Link href="/browse" className="text-xs font-bold text-[#EA580C] hover:underline">
              View all events
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}