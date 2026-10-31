import Link from "next/link";
import CartView from "@/components/cart/CartView";
import { apiFetch } from "@/lib/api";
import type { EventListItem } from "@/types/event";
import type { CartTicket } from "@/types/cart";

export const instant = false;

type CartQuery = {
  event?: string;  // event slug
  ticket?: string; // ticket type id
  qty?: string;    // ticket quantity
};

type CartResult =
  | { ok: true; ticket: CartTicket; quantity: number }
  | { ok: false; title: string; message: string };

async function getEvent(slug: string) {
  try {
    return await apiFetch<EventListItem>(`/events/${encodeURIComponent(slug)}`);
  } catch {
    return null;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

async function loadCart(query: CartQuery): Promise<CartResult> {
  // 1. Incomplete URL
  if (!query.event || !query.ticket) {
    return {
      ok: false,
      title: "Your cart is empty",
      message: "Please choose a ticket from an event detail page first.",
    };
  }

  // 2. Event not found / backend error
  const event = await getEvent(query.event);
  if (!event) {
    return {
      ok: false,
      title: "Event not found",
      message: "This event may have been removed or the link is invalid.",
    };
  }

  // 3. Ticket type not found in this event
  const ticketType = event.ticketTypes.find((t) => t.id === query.ticket);
  if (!ticketType) {
    return {
      ok: false,
      title: "Ticket type not found",
      message: `The selected ticket is not available for "${event.title}".`,
    };
  }

  // 4. Sales period
  const now = new Date();
  if (new Date(ticketType.saleStart) > now) {
    return {
      ok: false,
      title: "Sales not open yet",
      message: `${ticketType.name} tickets go on sale on ${formatDate(ticketType.saleStart)}.`,
    };
  }
  if (ticketType.saleEnd && new Date(ticketType.saleEnd) < now) {
    return {
      ok: false,
      title: "Sales closed",
      message: `Sales for ${ticketType.name} tickets have ended.`,
    };
  }

  // 5. Quota
  const remaining = ticketType.quota - ticketType.sold;
  if (remaining <= 0) {
    return {
      ok: false,
      title: "Sold out",
      message: `${ticketType.name} tickets for this event are sold out.`,
    };
  }

  // 6. Clean the quantity from the URL: min 1, max = remaining quota
  const requested = Math.floor(Number(query.qty)) || 1;
  const quantity = Math.min(Math.max(1, requested), remaining);

  // 7. All good → translate backend data into CartTicket
  return {
    ok: true,
    quantity,
    ticket: {
      ticketTypeId: ticketType.id,
      eventSlug: event.slug,
      eventTitle: event.title,
      organizerName: event.organizer.name,
      ticketName: ticketType.name,
      price: ticketType.priceNormal,
      remaining,
    },
  };
}

function CartMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="space-y-3 py-8 text-center">
      <p className="font-semibold text-neutral-900">{title}</p>
      <p className="text-sm text-neutral-500">{message}</p>
      <Link
        href="/browse"
        className="inline-block rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white hover:bg-orange-600"
      >
        Browse Events
      </Link>
    </div>
  );
}

type CartPageProps = {
  searchParams: Promise<CartQuery>;
};

export default async function CartPage({ searchParams }: CartPageProps) {
  const query = await searchParams;
  const result = await loadCart(query);

  return (
    <main className="bg-amber-50/60 px-4 py-10">
      <div className="mx-auto w-full max-w-xl space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
        <h1 className="border-b border-neutral-100 pb-4 text-xl font-bold text-neutral-900">Event Cart</h1>

        {result.ok ? (
          <CartView
            // key changes when the ticket or quantity in the URL changes
            // → React creates a fresh CartView, so its state starts from the new quantity
            key={`${result.ticket.ticketTypeId}-${result.quantity}`}
            ticket={result.ticket}
            initialQuantity={result.quantity}
            pointBalance={null} // TODO: fetch from GET /api/profile/me after login is ready
          />
        ) : (
          <CartMessage title={result.title} message={result.message} />
        )}
      </div>
    </main>
  );
}