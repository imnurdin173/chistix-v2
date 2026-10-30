"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";

type EventToolbarProps = {
  defaultSearch: string; // kata kunci dari URL saat halaman dibuka
};

export default function EventToolbar({ defaultSearch }: EventToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // STATE: teks yang sedang diketik user
  const [keyword, setKeyword] = useState(defaultSearch);

  // DEBOUNCE: 400ms setelah user berhenti mengetik, ubah URL
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);

      if (keyword.trim()) {
        params.set("search", keyword.trim());
      } else {
        params.delete("search");
      }
      params.delete("page"); // pencarian baru → kembali ke halaman 1

      const query = params.toString();
      // kalau URL-nya sudah sama, tidak usah navigasi
      if (query === window.location.search.replace("?", "")) return;

      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 400);

    // CLEANUP: batalkan timer lama setiap kali user mengetik lagi
    return () => clearTimeout(timer);
  }, [keyword, pathname, router]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* SORT: tampilan dulu, backend belum mendukung */}
      <div className="flex items-center gap-3">
        <label htmlFor="sort" className="text-sm font-semibold text-neutral-900">
          Sort
        </label>
        <select
          id="sort"
          defaultValue=""
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-orange-500 focus:outline-none"
        >
          <option value="" disabled>Select option</option>
          <option value="date_asc">Tanggal terdekat</option>
          <option value="price_asc">Harga termurah</option>
          <option value="price_desc">Harga termahal</option>
        </select>
      </div>

      {/* SEARCH */}
      <div className="relative w-full sm:w-72">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Cari nama event..."
          className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none"
        />
      </div>
    </div>
  );
}