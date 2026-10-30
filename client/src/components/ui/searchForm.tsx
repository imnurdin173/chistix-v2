"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Suggestion = {
  id: string;
  title: string;
  slug: string;
  city: string | null;
};

type SearchFormProps = {
  className?: string;
  /** true = hasil tampil di alur normal (dipakai di menu mobile yang overflow-hidden) */
  inlineResults?: boolean;
  /** dipanggil setelah pengguna berpindah halaman (mis. untuk menutup menu mobile) */
  onNavigate?: () => void;
};

const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;

function SearchIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Menebalkan bagian teks yang cocok dengan kata yang diketik */
function Highlight({ text, query }: { text: string; query: string }) {
  // split dengan capture group: indeks ganjil = bagian yang cocok
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, "i"));
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-bold text-gray-900">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export function SearchForm({
  className = "",
  inlineResults = false,
  onNavigate,
}: SearchFormProps) {
  const router = useRouter();
  const listId = useId();
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = query.trim();
  const canSearch = trimmed.length >= MIN_CHARS;
  const showList = open && canSearch;
  // Baris "Search for ..." selalu menjadi opsi terakhir
  const searchRowIndex = items.length;

  // Ambil saran dari API (debounce + batalkan request lama)
  useEffect(() => {
    if (trimmed.length < MIN_CHARS) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/events/suggest?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("Request failed");
        const data: { suggestions: Suggestion[] } = await res.json();
        setItems(data.suggestions);
        setActiveIndex(-1);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setItems([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  // Tutup dropdown saat klik di luar komponen
  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  function goTo(href: string) {
    setOpen(false);
    router.push(href);
    onNavigate?.();
  }

  function goToSearch() {
    if (!trimmed) return;
    goTo(`/events?q=${encodeURIComponent(trimmed)}`);
  }

  function selectIndex(i: number) {
    if (i < items.length) goTo(`/events/${items[i].slug}`);
    else goToSearch();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    setOpen(true);
    setActiveIndex(-1);
    setLoading(value.trim().length >= MIN_CHARS);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showList) {
      if (e.key === "ArrowDown" && canSearch) setOpen(true);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => (i >= searchRowIndex ? 0 : i + 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => (i <= 0 ? searchRowIndex : i - 1));
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
      case "Enter":
        if (activeIndex >= 0) {
          e.preventDefault();
          selectIndex(activeIndex);
        }
        break;
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    goToSearch();
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <form
        action="/browse"
        method="GET"
        role="search"
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 focus-within:ring-2 focus-within:ring-amber-400/50"
      >
        <SearchIcon className="size-5 shrink-0 text-gray-500" />
        <input
          type="search"
          name="q"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          placeholder="Event in Jakarta"
          aria-label="Cari event"
          autoComplete="off"
          role="combobox"
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && activeIndex >= 0
              ? `${listId}-opt-${activeIndex}`
              : undefined
          }
          className="w-full bg-transparent text-xs sm:text-sm text-gray-800 placeholder:text-gray-500 focus:outline-none"
        />
      </form>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          className={`overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg ${
            inlineResults
              ? "mt-2"
              : "absolute right-0 top-full z-50 mt-2 w-72 min-w-full"
          }`}
        >
          {loading && items.length === 0 && (
            <li role="presentation" className="px-4 py-3 text-sm text-gray-500">
              Searching…
            </li>
          )}
          {!loading && items.length === 0 && (
            <li role="presentation" className="px-4 py-3 text-sm text-gray-500">
              No events found
            </li>
          )}

          {items.map((item, i) => (
            <li
              key={item.id}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={activeIndex === i}
              // mencegah input kehilangan fokus sebelum klik terdaftar
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectIndex(i)}
              onMouseEnter={() => setActiveIndex(i)}
              className={`cursor-pointer px-4 py-2.5 ${
                activeIndex === i ? "bg-amber-100" : ""
              }`}
            >
              <div className="truncate text-sm text-gray-700">
                <Highlight text={item.title} query={trimmed} />
              </div>
              {item.city && (
                <div className="truncate text-xs text-gray-500">
                  {item.city}
                </div>
              )}
            </li>
          ))}

          <li
            id={`${listId}-opt-${searchRowIndex}`}
            role="option"
            aria-selected={activeIndex === searchRowIndex}
            onMouseDown={(e) => e.preventDefault()}
            onClick={goToSearch}
            onMouseEnter={() => setActiveIndex(searchRowIndex)}
            className={`flex cursor-pointer items-center gap-2 border-t border-gray-100 px-4 py-2.5 text-sm font-semibold text-amber-700 ${
              activeIndex === searchRowIndex ? "bg-amber-100" : ""
            }`}
          >
            <SearchIcon className="size-4 shrink-0" />
            <span className="truncate">Search for “{trimmed}”</span>
          </li>
        </ul>
      )}
    </div>
  );
}
