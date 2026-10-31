"use client";

import Link from "next/link";
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { TicketOption, TicketStatus } from "@/types/event";

const STATUS_LABEL: Record<TicketStatus, string> = {
  AVAILABLE: "Available",
  NOT_STARTED: "Not on sale yet",
  ENDED: "Sales ended",
  SOLD_OUT: "Sold out",
};

type TicketPanelProps = {
  eventSlug: string;
  tickets: TicketOption[];
};

export default function TicketPanel({ eventSlug, tickets }: TicketPanelProps) {
  const defaultTicket = tickets.find((t) => t.status === "AVAILABLE") ?? tickets[0];

  // ----- STATE -----
  const [selectedId, setSelectedId] = useState(defaultTicket?.id ?? "");
  const [quantity, setQuantity] = useState(1);

  if (tickets.length === 0) {
    return (
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 text-sm text-neutral-500 shadow-sm">
        Tickets for this event are not available yet.
      </section>
    );
  }

  // ----- DERIVED VALUES -----
  const selected = tickets.find((t) => t.id === selectedId) ?? tickets[0];
  const isAvailable = selected.status === "AVAILABLE";
  const maxQuantity = isAvailable ? selected.remaining : 1;
  const totalPrice = selected.price * quantity;

  const cartHref = `/cart?event=${encodeURIComponent(eventSlug)}&ticket=${selected.id}&qty=${quantity}`;

  function handleSelectTicket(id: string) {
    setSelectedId(id);
    setQuantity(1);
  }

  return (
    <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      {/* VARIANT: ticket names only */}
      <div className="space-y-2">
        <label htmlFor="variant" className="block text-sm font-semibold text-neutral-900">
          Variant
        </label>
        <select
          id="variant"
          value={selected.id}
          onChange={(e) => handleSelectTicket(e.target.value)}
          className="w-full rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-700 focus:border-orange-500 focus:outline-none"
        >
          {tickets.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* TICKET AMOUNT */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-neutral-900">Ticket Amount</p>
        <div className="inline-flex items-center overflow-hidden rounded-full border border-neutral-300">
          <button
            type="button"
            aria-label="Decrease tickets"
            onClick={() => setQuantity(quantity - 1)}
            disabled={!isAvailable || quantity <= 1}
            className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Minus className="size-3.5" />
          </button>
          <span className="min-w-10 px-2 text-center text-sm font-semibold text-neutral-900">{quantity}</span>
          <button
            type="button"
            aria-label="Increase tickets"
            onClick={() => setQuantity(quantity + 1)}
            disabled={!isAvailable || quantity >= maxQuantity}
            className="px-3 py-1.5 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
        {isAvailable && selected.remaining <= 20 && (
          <p className="text-xs text-red-500">Only {selected.remaining} tickets left!</p>
        )}
      </div>

      {/* PRICE (follows the selected variant and quantity) */}
      <div className="flex items-start justify-between border-t border-neutral-100 pt-4">
        <span className="text-sm text-neutral-500">Price</span>
        <div className="text-right">
          <div className="flex items-baseline justify-end gap-2">
            {selected.priceAnchor != null && selected.priceAnchor > selected.price && (
              <span className="text-xs text-neutral-400 line-through">
                {formatRupiah(selected.priceAnchor * quantity)}
              </span>
            )}
            <span className="text-lg font-bold text-orange-600">
              {selected.price === 0 ? "Free" : formatRupiah(totalPrice)}
            </span>
          </div>
          {quantity > 1 && selected.price > 0 && (
            <p className="text-[11px] text-neutral-400">
              {quantity} × {formatRupiah(selected.price)}
            </p>
          )}
        </div>
      </div>

      {/* ORDER BUTTON */}
      {isAvailable ? (
        <Link
          href={cartHref}
          className="block w-full rounded-full bg-orange-500 py-3 text-center text-sm font-bold text-white hover:bg-orange-600"
        >
          Order Ticket
        </Link>
      ) : (
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-full bg-orange-200 py-3 text-sm font-bold text-white"
        >
          {STATUS_LABEL[selected.status]}
        </button>
      )}
    </section>
  );
}