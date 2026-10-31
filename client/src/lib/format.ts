// 200000 → "Rp200.000"
export function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

// Keep digits only: "Rp 40.000" / "40.000" / "40abc000" → "40000"
export function toDigits(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 12);
  return digits === "" ? "" : String(Number(digits));
}

// Display with thousand separators: "40000" → "40.000"
export function formatThousands(digits: string): string {
  return digits === "" ? "" : Number(digits).toLocaleString("id-ID");
}