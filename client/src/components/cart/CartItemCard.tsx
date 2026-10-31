import { Minus, Plus, Ticket } from "lucide-react";
import { formatRupiah } from "@/lib/format";

type CartItemCardProps = {
  eventTitle: string;
  organizerName: string;
  ticketName: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  onQuantityChange: (qty: number) => void; // function from the parent
};

export default function CartItemCard({
  eventTitle,
  organizerName,
  ticketName,
  price,
  quantity,
  maxQuantity,
  onQuantityChange,
}: CartItemCardProps) {
  const total = price * quantity; // derived value, not state
  const canDecrease = quantity > 1;
  const canIncrease = quantity < maxQuantity;

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-wide text-neutral-700">Event Ticket</h2>

      <div className="space-y-4 rounded-2xl border border-neutral-200 p-4">
        {/* Event info */}
        <div className="flex items-start gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-amber-50">
            <Ticket className="size-6 text-amber-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-bold text-neutral-900">{eventTitle}</h3>
            <p className="text-xs text-neutral-500">{organizerName}</p>
            <span className="mt-1.5 inline-block rounded-md border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
              {ticketName}
            </span>
          </div>
        </div>

        {/* Quantity + price */}
        <div className="flex items-center justify-between border-t border-neutral-100 pt-3">
          <div className="flex items-center overflow-hidden rounded-xl border border-neutral-200">
            <button
              type="button"
              aria-label="Decrease tickets"
              onClick={() => onQuantityChange(quantity - 1)}
              disabled={!canDecrease}
              className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="min-w-10 border-x border-neutral-200 px-3 py-1.5 text-center text-sm font-bold text-neutral-900">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Increase tickets"
              onClick={() => onQuantityChange(quantity + 1)}
              disabled={!canIncrease}
              className="px-3 py-2 text-neutral-600 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="size-3.5" />
            </button>
          </div>

          <div className="text-right">
            <p className="text-base font-extrabold text-neutral-900">{formatRupiah(total)}</p>
            <p className="text-[11px] text-neutral-400">@ {formatRupiah(price)}</p>
          </div>
        </div>

        {!canIncrease && <p className="text-[11px] text-red-500">Only {maxQuantity} tickets left.</p>}
      </div>
    </section>
  );
}