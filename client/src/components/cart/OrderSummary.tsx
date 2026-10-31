import { formatRupiah } from "@/lib/format";

type OrderSummaryProps = {
  quantity: number;
  subtotal: number;
  voucherDiscount: number;
  pointDiscount: number;
  total: number;
};

// Small component for one row, only used in this file
function SummaryRow({ label, value, isDiscount = false }: { label: string; value: string; isDiscount?: boolean }) {
  return (
    <div className={`flex justify-between ${isDiscount ? "font-medium text-red-500" : ""}`}>
      <span>{label}</span>
      <span className={isDiscount ? "" : "font-semibold text-neutral-800"}>{value}</span>
    </div>
  );
}

export default function OrderSummary({ quantity, subtotal, voucherDiscount, pointDiscount, total }: OrderSummaryProps) {
  return (
    <section className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
      <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-800">Order Summary</h2>

      <div className="space-y-2 text-xs text-neutral-600">
        <SummaryRow label="Ticket Quantity" value={`${quantity}x Ticket`} />
        <SummaryRow label="Subtotal" value={formatRupiah(subtotal)} />
        {voucherDiscount > 0 && (
          <SummaryRow label="Voucher Discount" value={`−${formatRupiah(voucherDiscount)}`} isDiscount />
        )}
        {pointDiscount > 0 && (
          <SummaryRow label="Point Discount" value={`−${formatRupiah(pointDiscount)}`} isDiscount />
        )}
      </div>

      <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
        <span className="text-sm font-bold text-neutral-800">Total Amount</span>
        <span className="text-base font-bold text-amber-600">{formatRupiah(total)}</span>
      </div>
    </section>
  );
}