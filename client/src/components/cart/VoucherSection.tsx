import { useState, type FormEvent } from "react";
import { Tag, X } from "lucide-react";

type VoucherSectionProps = {
  appliedCode: string | null;      // code currently applied (from parent)
  onApply: (code: string) => void; // tell parent: "use this code"
  onRemove: () => void;            // tell parent: "remove the code"
};

export default function VoucherSection({ appliedCode, onApply, onRemove }: VoucherSectionProps) {
  // LOCAL STATE: text being typed
  const [code, setCode] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); // stop the browser from reloading the page
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;
    onApply(cleanCode);
  }

  function handleRemove() {
    onRemove();
    setCode("");
  }

  return (
    <section className="space-y-2 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
      <label htmlFor="voucher" className="flex items-center gap-1.5 text-sm font-semibold text-neutral-700">
        <Tag className="size-4 text-amber-600" />
        Voucher Discount
      </label>

      {appliedCode ? (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <div>
            <p className="text-sm font-bold text-amber-700">{appliedCode}</p>
            <p className="text-xs text-amber-600">This code will be validated when you check out.</p>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            aria-label="Remove voucher"
            className="rounded-md p-1 text-amber-700 hover:bg-amber-100"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            id="voucher"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter voucher code"
            className="min-w-0 flex-1 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm uppercase placeholder:normal-case focus:border-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!code.trim()}
            className="shrink-0 rounded-lg bg-amber-500 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-neutral-300"
          >
            Apply
          </button>
        </form>
      )}
    </section>
  );
}