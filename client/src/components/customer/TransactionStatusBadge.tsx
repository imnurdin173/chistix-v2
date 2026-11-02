import type { TransactionStatus } from "@/types/transaction";

const STATUS_STYLE: Record<TransactionStatus, { label: string; className: string }> = {
  WAITING_PAYMENT: { label: "Waiting Payment", className: "bg-amber-50 text-amber-700" },
  WAITING_CONFIRM: { label: "Waiting Confirmation", className: "bg-sky-50 text-sky-700" },
  PAID: { label: "Paid", className: "bg-emerald-50 text-emerald-700" },
  EXPIRED: { label: "Expired", className: "bg-neutral-100 text-neutral-500" },
  CANCELLED: { label: "Cancelled", className: "bg-red-50 text-red-600" },
};

export default function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  const style = STATUS_STYLE[status];
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold ${style.className}`}>
      {style.label}
    </span>
  );
}