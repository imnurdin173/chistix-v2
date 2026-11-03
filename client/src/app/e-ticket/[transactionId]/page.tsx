import Link from "next/link";
import { cache } from "react";
import type { Metadata } from "next";
import { ArrowLeft, Ticket } from "lucide-react";
import DownloadTicketPdfButton from "@/components/customer/DownloadTicketPdfButton";
import TicketQrCode from "@/components/customer/TicketQrCode";
import { ApiError } from "@/lib/api";
import { apiFetchServer } from "@/lib/api.server";
import { requireCustomer } from "@/lib/auth.server";
import { formatRupiah } from "@/lib/format";
import { formatEventSchedule } from "@/lib/date";
import { getTransactionTotal } from "@/lib/transaction";
import type { TransactionDetail } from "@/types/transaction";

export const instant = false;

type ETicketPageProps = {
  params: Promise<{ transactionId: string }>;
};

// cache(): generateMetadata and the page share one API call
const getTransaction = cache(async (id: string) => {
  try {
    return await apiFetchServer<TransactionDetail>(`/transactions/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && [400, 403, 404].includes(error.status)) return null;
    throw error;
  }
});

// Tab title = default PDF file name
export async function generateMetadata({ params }: ETicketPageProps): Promise<Metadata> {
  const { transactionId } = await params;
  try {
    const t = await getTransaction(transactionId);
    return { title: t ? `E-Ticket - ${t.event.title}` : "E-Ticket" };
  } catch {
    return { title: "E-Ticket" };
  }
}

function ETicketMessage({ title, message, href, linkLabel }: { title: string; message: string; href: string; linkLabel: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md space-y-3 rounded-3xl bg-white p-8 text-center shadow-sm">
        <Ticket className="mx-auto size-10 text-neutral-300" />
        <h1 className="text-lg font-bold text-neutral-900">{title}</h1>
        <p className="text-sm text-neutral-500">{message}</p>
        <Link
          href={href}
          className="inline-block rounded-full bg-[#EA580C] px-5 py-2 text-sm font-bold text-white hover:bg-[#BB4D00]"
        >
          {linkLabel}
        </Link>
      </div>
    </main>
  );
}

function TicketRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-6">
      <span className="shrink-0 text-slate-500">{label}</span>
      <span className={`text-right font-bold text-black ${mono ? "font-mono tracking-wider" : ""}`}>{value}</span>
    </div>
  );
}

export default async function ETicketPage({ params }: ETicketPageProps) {
  const user = await requireCustomer();
  const { transactionId } = await params;
  const t = await getTransaction(transactionId);

  // ----- STATES WITHOUT TICKETS -----
  if (!t) {
    return (
      <ETicketMessage
        title="E-ticket not found"
        message="This order does not exist or is not yours."
        href="/dashboard-customer/tickets"
        linkLabel="Back to My Tickets"
      />
    );
  }
  if (t.status !== "PAID") {
    return (
      <ETicketMessage
        title="E-tickets are issued after payment"
        message="Complete the payment for this order to get your e-tickets."
        href={`/cart/checkout/invoice?id=${t.id}`}
        linkLabel="View Invoice"
      />
    );
  }
  const tickets = t.tickets ?? [];
  if (tickets.length === 0) {
    return (
      <ETicketMessage
        title="Your e-tickets are being issued"
        message="Your payment is confirmed. Please check back in a few minutes."
        href="/dashboard-customer/tickets"
        linkLabel="Back to My Tickets"
      />
    );
  }

  const schedule = formatEventSchedule(t.event.eventStartDate, t.event.eventEndDate);
  const location = `${t.event.venueAddress}, ${t.event.cityName}, ${t.event.provinceName}`;
  const total = formatRupiah(getTransactionTotal(t));

  // ----- E-TICKETS: one page per ticket when printed -----
  return (
    <main className="min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      {/* TOOLBAR: screen only */}
      <div className="mx-auto mb-2 flex max-w-[420px] items-center justify-between px-4 print:hidden">
        <Link href="/dashboard-customer/tickets" className="flex items-center gap-1.5 text-sm font-semibold text-neutral-600 hover:text-neutral-900">
          <ArrowLeft className="size-4" />
          My Tickets
        </Link>
        <DownloadTicketPdfButton
          eventTitle={t.event.title}
          customerName={user.name}
          ticketTypeName={t.ticketType.name}
          schedule={schedule}
          location={location}
          total={total}
          orderId={t.id.slice(0, 8).toUpperCase()}
          tickets={tickets.map((ticket) => ({ id: ticket.id, ticketCode: ticket.ticketCode, isAttended: ticket.isAttended }))}
        />
      </div>
      <div className="mb-6" />

      <div className="flex flex-col items-center gap-8 px-4 print:gap-0 print:px-0">
        {tickets.map((ticket, i) => (
          <article
            key={ticket.id}
            className="w-full max-w-[420px] break-inside-avoid rounded-[20px] border-2 border-slate-800 bg-white p-8 text-sm print:mt-16 print:break-after-page print:last:break-after-auto"
          >
            {/* HEADER */}
            <div className="text-center">
              <h1 className="text-2xl font-extrabold tracking-wide text-black">E-TICKET</h1>
              <p className="mt-2 font-bold text-black">The bill has been paid</p>
              {ticket.isAttended ? (
                <p className="mt-1 text-xs font-semibold text-red-600">This ticket has already been used.</p>
              ) : (
                <p className="mt-1 text-xs text-slate-500">Valid ticket. Guest may enter.</p>
              )}
            </div>

            {/* DETAILS */}
            <div className="mt-6 space-y-3.5">
              <TicketRow label="Event" value={t.event.title} />
              <TicketRow label="Customer" value={user.name} />
              <TicketRow label="Ticket Type" value={t.ticketType.name} />
              <TicketRow label="Date & Time" value={schedule} />
              <TicketRow label="Location" value={location} />
              <div className="space-y-3.5 border-t border-slate-300 pt-3.5">
                <TicketRow label="Total Amount" value={total} />
                <TicketRow label="Ticket ID" value={ticket.ticketCode} mono />
              </div>
            </div>

            {/* QR */}
            <div className="mt-6 flex flex-col items-center">
              {ticket.qrToken ? (
                <TicketQrCode ticketId={ticket.id} value={ticket.qrToken} />
              ) : (
                <div className="flex size-40 items-center justify-center rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400">
                  QR code not available yet
                </div>
              )}
              <p className="mt-3 text-[11px] text-slate-500">Show this QR code at the event entrance</p>
              <p className="mt-1 text-[11px] text-slate-400">
                Ticket {i + 1} of {tickets.length}
              </p>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}