"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Suggestion = {
  id: string;
  title: string;
  slug: string;
  city: string | null;
};

// Backend boleh mengembalikan array langsung atau { suggestions: [...] }
type SuggestPayload = Suggestion[] | { suggestions: Suggestion[] };

type SearchResult = {
  query: string; // query yang menghasilkan data ini
  items: Suggestion[];
  failed: boolean;
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

const PLACEHOLDER = [
  "Event in Jakarta",
  "Music concert",
  "Tech summit this weekend",
  "charity run in Bandung",
];

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
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const trimmed = query.trim();
  const canSearch = trimmed.length >= MIN_CHARS;
  const showList = open && canSearch;

  // Diturunkan dari state, bukan disimpan terpisah, supaya tidak bisa nyangkut
  const loading = canSearch && result?.query !== trimmed;
  const items = canSearch && result ? result.items : [];
  const failed = !loading && !!result?.failed;

  // Baris "Search for ..." selalu menjadi opsi terakhir
  const searchRowIndex = items.length;

  // Ambil saran dari API (debounce + batalkan request lama)
  useEffect(() => {
    if (trimmed.length < MIN_CHARS) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const payload = await apiFetch<SuggestPayload>(
          `/events/suggest?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal },
        );
        const list = Array.isArray(payload) ? payload : payload.suggestions;
        setResult({ query: trimmed, items: list ?? [], failed: false });
      } catch {
        if (controller.signal.aborted) return; // request usang, abaikan
        setResult({ query: trimmed, items: [], failed: true });
      }
      setActiveIndex(-1);
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmed]);

  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  useEffect(() => {
    if(open) return;
    const id = setInterval(() =>
    setPlaceholderIdx((i) => (i+1) % PLACEHOLDER.length),
  10000,
)
return () => clearInterval(id);
}, [open]);

  function goTo(href: string) {
    setOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur(); // tutup keyboard mobile
    router.push(href);
    onNavigate?.();
  }

  function goToSearch() {
    goTo(trimmed ? `/browse?search=${encodeURIComponent(trimmed)}` : "/browse");
  }

  function selectIndex(i: number) {
    if (i < items.length) goTo(`/events/${items[i].slug}`);
    else goToSearch();
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
    setActiveIndex(-1);
  }

  // Tutup dropdown saat fokus keluar dari komponen (klik di luar / Tab)
  function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return; // sedang mengetik dengan IME

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
        break; // activeIndex -1: biarkan form submit -> goToSearch
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    goToSearch();
  }

  return (
    <div onBlur={handleBlur} className={`relative ${className}`}>
      <form
        action="/browse"
        method="GET"
        role="search"
        onSubmit={handleSubmit}
        className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 focus-within:ring-2 focus-within:ring-amber-400/50"
      >
        <SearchIcon className="size-5 shrink-0 text-gray-500" />
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          placeholder={PLACEHOLDER[placeholderIdx]}
          aria-label="Search events"
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
          className="w-full bg-transparent text-xs text-gray-800 placeholder:text-gray-500 focus:outline-none sm:text-sm"
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
          {failed && (
            <li role="presentation" className="px-4 py-3 text-sm text-red-600">
              Couldn&apos;t load suggestions
            </li>
          )}
          {!loading && !failed && items.length === 0 && (
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
