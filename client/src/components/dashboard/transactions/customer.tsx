import Link from "next/link";
import type { Metadata } from "next";
import { Receipt } from "lucide-react";
import TransactionStatusBadge from "@/components/customer/TransactionStatusBadge";
import CancelOrderButton from "@/components/customer/CancelOrderButton";
import { requireCustomer } from "@/lib/auth.server";
import { apiFetchServer } from "@/lib/api.server";
import { formatRupiah } from "@/lib/format";
import { getTransactionTotal } from "@/lib/transaction";
import type { TransactionDetail, TransactionListResponse, TransactionStatus } from "@/types/transaction";

export const instant = false;
export const metadata: Metadata = { title: "Transactions" };

const PAGE_SIZE = 10;

// Filter tabs (values must match what the backend accepts)
const FILTERS: { label: string; value: TransactionStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Waiting Payment", value: "WAITING_PAYMENT" },
  { label: "Paid", value: "PAID" },
  { label: "Expired", value: "EXPIRED" },
  { label: "Cancelled", value: "CANCELLED" },
];
const VALID_STATUSES = FILTERS.map((f) => f.value).filter(Boolean) as string[];

type TransactionsQuery = {
  status?: string;
  page?: string;
};

function buildHref(status: string, page: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/dashboard-customer/transactions?${query}` : "/dashboard-customer/transactions";
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jakarta",
  });
}

/* ---------- Small pieces shared by the table (desktop) and the cards (mobile) ---------- */

function DeadlineNote({ transaction, now }: { transaction: TransactionDetail; now: number }) {
  if (transaction.status !== "WAITING_PAYMENT") return null;
  const isOver = new Date(transaction.paymentDeadline).getTime() <= now;
  return (
    <p className={`mt-1 text-[11px] ${isOver ? "text-red-500" : "text-neutral-400"}`}>
      {isOver ? "Payment time is over" : `Pay before ${formatDateTime(transaction.paymentDeadline)}`}
    </p>
  );
}

function TransactionActions({ transaction }: { transaction: TransactionDetail }) {
  return (
    <div className="flex items-center gap-4 md:flex-col md:items-center md:gap-1.5">
      <Link
        href={`/cart/checkout/invoice?id=${transaction.id}`}
        className="whitespace-nowrap text-xs font-semibold text-[#EA580C] hover:underline"
      >
        View Invoice
      </Link>
      {transaction.status === "WAITING_PAYMENT" && (
        <CancelOrderButton transactionId={transaction.id} eventTitle={transaction.event.title} />
      )}
    </div>
  );
}

/* ---------- Page ---------- */

type TransactionsPageProps = {
  searchParams: Promise<TransactionsQuery>;
};

export default async function CustomerTransactionsD({ searchParams }: TransactionsPageProps) {
  await requireCustomer();

  const query = await searchParams;
  // Never trust the URL: only accept known statuses and a positive page number
  const status = query.status && VALID_STATUSES.includes(query.status) ? query.status : "";
  const page = Math.max(1, Math.floor(Number(query.page)) || 1);

  const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
  if (status) params.set("status", status);

  let data: TransactionListResponse | null = null;
  try {
    data = await apiFetchServer<TransactionListResponse>(`/transactions?${params.toString()}`);
  } catch {
    data = null;
  }

  const now = Date.now();
  const activeFilter = FILTERS.find((f) => f.value === status) ?? FILTERS[0];
  const transactions = data?.transactions ?? [];

  return (
    <main className="">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">Transactions</h1>
        <p className="mt-1 text-sm text-neutral-500">Your order history and payment status.</p>
      </div>

      {/* FILTER TABS */}
      <nav aria-label="Filter transactions" className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const isActive = f.value === status;
          return (
            <Link
              key={f.label}
              href={buildHref(f.value, 1)}
              aria-current={isActive ? "page" : undefined}
              className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                isActive ? "bg-[#FFF5ED] text-[#BB4D00]" : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {/* ERROR */}
      {data === null && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">Failed to load transactions. Please refresh the page.</p>
      )}

      {/* EMPTY */}
      {data && transactions.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <Receipt className="size-10 text-neutral-300" />
          <p className="font-semibold text-neutral-700">
            {status ? `No ${activeFilter.label.toLowerCase()} transactions` : "No transactions yet"}
          </p>
          {status ? (
            <Link href="/dashboard-customer/transactions" className="text-sm font-semibold text-[#EA580C] hover:underline">
              Show all transactions
            </Link>
          ) : (
            <Link
              href="/browse"
              className="rounded-full bg-[#EA580C] px-5 py-2 text-sm font-bold text-white hover:bg-[#BB4D00]"
            >
              Browse Events
            </Link>
          )}
        </div>
      )}

      {transactions.length > 0 && (
        <>
          {/* DESKTOP / TABLET: TABLE (md and up) */}
          <div className="hidden md:block">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="border-b border-neutral-100 text-xs text-neutral-400">
                <tr>
                  <th className="w-[34%] pb-3 font-medium">Event</th>
                  <th className="w-[16%] px-2 pb-3 text-center font-medium">Ticket</th>
                  <th className="w-[18%] px-2 pb-3 text-center font-medium">Status</th>
                  <th className="w-[16%] px-2 pb-3 text-right font-medium">Total</th>
                  <th className="w-[16%] pb-3 text-center font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 align-top text-neutral-700">
                {transactions.map((t) => (
                  <tr key={t.id}>
                    <td className="py-4 pr-3">
                      <Link
                        href={`/cart/checkout/invoice?id=${t.id}`}
                        className="line-clamp-2 font-semibold text-neutral-900 hover:text-[#EA580C]"
                      >
                        {t.event.title}
                      </Link>
                      <p className="mt-1 text-[11px] text-neutral-400">
                        #{t.id.slice(0, 8).toUpperCase()} · {formatDateTime(t.createdAt)}
                      </p>
                    </td>
                    <td className="px-2 py-4 text-center text-xs">
                      {t.ticketType.name} × {t.quantity}
                    </td>
                    <td className="px-2 py-4 text-center">
                      <TransactionStatusBadge status={t.status} />
                      <DeadlineNote transaction={t} now={now} />
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 text-right font-semibold text-neutral-900">
                      {formatRupiah(getTransactionTotal(t))}
                    </td>
                    <td className="py-4">
                      <TransactionActions transaction={t} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE: CARDS (below md) */}
          <ul className="divide-y divide-neutral-100 md:hidden">
            {transactions.map((t) => (
              <li key={t.id} className="space-y-2 py-4">
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/cart/checkout/invoice?id=${t.id}`}
                    className="line-clamp-2 text-sm font-bold text-neutral-900 hover:text-[#EA580C]"
                  >
                    {t.event.title}
                  </Link>
                  <TransactionStatusBadge status={t.status} />
                </div>
                <p className="text-xs text-neutral-500">
                  {t.ticketType.name} × {t.quantity} · #{t.id.slice(0, 8).toUpperCase()}
                </p>
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-neutral-900">{formatRupiah(getTransactionTotal(t))}</p>
                    <DeadlineNote transaction={t} now={now} />
                  </div>
                  <TransactionActions transaction={t} />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* PAGINATION */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={buildHref(status, page - 1)} className="rounded-full border border-neutral-200 px-4 py-1.5 hover:bg-neutral-50">
              Previous
            </Link>
          ) : (
            <span className="rounded-full border border-neutral-100 px-4 py-1.5 text-neutral-300">Previous</span>
          )}
          <span className="text-neutral-500">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          {page < data.pagination.totalPages ? (
            <Link href={buildHref(status, page + 1)} className="rounded-full border border-neutral-200 px-4 py-1.5 hover:bg-neutral-50">
              Next
            </Link>
          ) : (
            <span className="rounded-full border border-neutral-100 px-4 py-1.5 text-neutral-300">Next</span>
          )}
        </div>
      )}
    </main>
  );
}