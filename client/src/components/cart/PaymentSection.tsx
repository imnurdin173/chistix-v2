import { CreditCard, Loader2, ShieldCheck } from "lucide-react";
import { formatRupiah } from "@/lib/format";

type PaymentSectionProps = {
  total: number;
  isSubmitting: boolean;
  error: string;
  onCheckout: () => void;
};

export default function PaymentSection({ total, isSubmitting, error, onCheckout }: PaymentSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-neutral-700">
        <CreditCard className="size-4" />
        Payment
      </h2>

      {/* TODO: add the Midtrans logo here once an official SVG is available */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="flex items-start gap-2 text-xs text-neutral-600">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
          You will be redirected to Midtrans secure checkout to choose your payment method.
        </p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>}

      <button
        type="button"
        onClick={onCheckout}
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Check Out · ${formatRupiah(total)}`
        )}
      </button>
    </section>
  );
}