"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// Nilai "value" harus sama persis dengan enum EventCategory di backend (Prisma)
const CATEGORIES = [
  { value: "MUSIC", label: "Music" },
  { value: "SEMINAR", label: "Seminar" },
  { value: "TALKSHOW", label: "Talkshow" },
  { value: "ARTS_THEATRE", label: "Arts & Theatre" },
  { value: "SPORTS", label: "Sports" },
  { value: "COMMUNITY", label: "Community" },
  { value: "EXHIBITION", label: "Exhibition" },
  { value: "OTHER", label: "Other" },
];

// Sementara ditulis manual; nanti bisa diambil dari API wilayah
const LOCATIONS = ["DKI Jakarta", "Jawa Barat", "Jawa Tengah", "DI Yogyakarta", "Jawa Timur", "Bali"];

type FilterValues = {
  category: string;
  location: string;
  minPrice: string;
  maxPrice: string;
};

type EventFilterSidebarProps = {
  defaultValues: FilterValues; // nilai awal dari URL
};

export default function EventFilterSidebar({ defaultValues }: EventFilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  // STATE: satu per input
  const [category, setCategory] = useState(defaultValues.category);
  const [location, setLocation] = useState(defaultValues.location);
  const [minPrice, setMinPrice] = useState(defaultValues.minPrice);
  const [maxPrice, setMaxPrice] = useState(defaultValues.maxPrice);
  const [error, setError] = useState("");

  // Memasukkan nilai filter ke URL
  function applyFilters(values: FilterValues) {
    const params = new URLSearchParams(window.location.search); // search tetap dipertahankan

    for (const [key, value] of Object.entries(values)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.delete("page"); // filter baru → kembali ke halaman 1

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleSave() {
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      setError("Harga minimum tidak boleh lebih besar dari harga maksimum.");
      return; // berhenti, filter tidak diterapkan
    }
    setError("");
    applyFilters({ category, location, minPrice, maxPrice });
  }

  function handleReset() {
    setCategory("");
    setLocation("");
    setMinPrice("");
    setMaxPrice("");
    setError("");
    // kirim nilai kosong langsung (bukan baca state, karena state belum berubah di sini)
    applyFilters({ category: "", location: "", minPrice: "", maxPrice: "" });
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700 focus:border-orange-500 focus:outline-none";

  return (
    <div className="space-y-5">
      {/* CATEGORY */}
      <div className="space-y-2">
        <label htmlFor="category" className="block text-sm font-semibold text-neutral-900">
          Category
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* LOCATION */}
      <div className="space-y-2">
        <label htmlFor="location" className="block text-sm font-semibold text-neutral-900">
          Location
        </label>
        <select
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className={inputClass}
        >
          <option value="">All Locations</option>
          {LOCATIONS.map((loc) => (
            <option key={loc} value={loc}>
              {loc}
            </option>
          ))}
        </select>
      </div>

      {/* PRICE RANGE */}
      <div className="space-y-2">
        <p className="text-sm font-semibold text-neutral-900">Price Range</p>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Minimum Price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
          className={inputClass}
        />
        <input
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="Maximum Price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
          className={inputClass}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {/* TOMBOL */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleReset}
          className="rounded-lg border border-orange-500 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="rounded-lg bg-orange-500 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          Save
        </button>
      </div>
    </div>
  );
}