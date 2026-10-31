import { Coins } from "lucide-react";
import { formatRupiah } from "@/lib/format";

type PointSectionProps = {
  balance: number | null; // null = unknown (not logged in yet)
  isUsing: boolean;
  canUse: boolean;
  pointsUsed: number;
  pointDiscount: number;
  onToggle: () => void;
};

export default function PointSection({
  balance,
  isUsing,
  canUse,
  pointsUsed,
  pointDiscount,
  onToggle,
}: PointSectionProps) {
  return (
    <section className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-sm font-semibold text-neutral-700">
          <Coins className="size-4 text-amber-500" />
          Point Balance
        </p>

        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isUsing}
          aria-label="Use points"
          onClick={onToggle}
          disabled={!canUse}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isUsing ? "bg-emerald-500" : "bg-neutral-300"
          }`}
        >
          <span
            className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
              isUsing ? "translate-x-5.5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {balance === null ? (
        <p className="text-xs text-neutral-400">Log in to use your points.</p>
      ) : (
        <p className="text-xs text-neutral-600">
          You have <span className="font-bold text-amber-600">{balance.toLocaleString("id-ID")} points</span>
        </p>
      )}

      {isUsing && pointsUsed > 0 && (
        <p className="text-xs text-emerald-600">
          Using {pointsUsed.toLocaleString("id-ID")} points (−{formatRupiah(pointDiscount)})
        </p>
      )}
      {balance !== null && !canUse && (
        <p className="text-xs text-neutral-400">
          {balance === 0 ? "You don't have any points yet." : "Points can't be used for this order."}
        </p>
      )}
    </section>
  );
}