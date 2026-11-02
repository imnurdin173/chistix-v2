"use client";

import { Download } from "lucide-react";

// Opens the browser's print dialog. Choose "Save as PDF" to download.
export default function PrintButton({ label = "Download PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-full bg-[#EA580C] px-4 py-2 text-sm font-bold text-white hover:bg-[#BB4D00]"
    >
      <Download className="size-4" />
      {label}
    </button>
  );
}