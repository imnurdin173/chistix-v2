"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { formatThousands, toDigits } from "@/lib/format";

// value HARUS sama dengan enum EventCategory di backend (schema.prisma)
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
  minPrice: string; // selalu angka murni, contoh "40000"
  maxPrice: string;
};

type EventFilterSidebarProps = {
  defaultValues: FilterValues;
};

const baseInputClass =
  "w-full rounded-lg border border-neutral-300 bg-white py-2 text-sm text-neutral-700 focus:border-orange-500 focus:outline-none";
const selectClass = `${baseInputClass} px-3`;
const priceInputClass = `${baseInputClass} pl-10 pr-3`;

export default function EventFilterSidebar({ defaultValues }: EventFilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [category, setCategory] = useState(defaultValues.category);
  const [location, setLocation] = useState(defaultValues.location);
  const [minPrice, setMinPrice] = useState(defaultValues.minPrice);
  const [maxPrice, setMaxPrice] = useState(defaultValues.maxPrice);
  const [error, setError] = useState("");

  function applyFilters(values: FilterValues) {
    const params = new URLSearchParams(window.location.search);

    for (const [key, value] of Object.entries(values)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  function handleSave() {
    if (minPrice && maxPrice && Number(minPrice) > Number(maxPrice)) {
      setError("Minimum price cannot be greater than maximum price.");
      return;
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
    applyFilters({ category: "", location: "", minPrice: "", maxPrice: "" });
  }

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
          className={selectClass}
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
          className={selectClass}
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

        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
            Rp
          </span>
          <input
            type="text"
            inputMode="numeric"
            aria-label="Minimum price"
            placeholder="Minimum Price"
            value={formatThousands(minPrice)}
            onChange={(e) => setMinPrice(toDigits(e.target.value))}
            className={priceInputClass}
          />
        </div>

        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">
            Rp
          </span>
          <input
            type="text"
            inputMode="numeric"
            aria-label="Maximum price"
            placeholder="Maximum Price"
            value={formatThousands(maxPrice)}
            onChange={(e) => setMaxPrice(toDigits(e.target.value))}
            className={priceInputClass}
          />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>

      {/* BUTTONS */}
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