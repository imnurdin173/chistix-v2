import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

type EventPaginationProps = {
  currentPage: number;
  totalPages: number;
  // isi URL saat ini (search, category, dst.) supaya ikut terbawa
  searchParams: Record<string, string | undefined>;
};

// Membuat link ke halaman tertentu, dengan filter lain tetap ada
function buildHref(page: number, searchParams: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/browse?${query}` : "/browse";
}

// Menentukan nomor yang ditampilkan, contoh: 1 … 4 5 6 … 10
function getPageNumbers(current: number, total: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  for (let p = 1; p <= total; p++) {
    const isEdge = p === 1 || p === total;
    const isNear = Math.abs(p - current) <= 1;
    if (isEdge || isNear) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }
  return pages;
}

export default function EventPagination({ currentPage, totalPages, searchParams }: EventPaginationProps) {
  // Cuma 1 halaman → tidak perlu pagination
  if (totalPages <= 1) return null;

  const baseClass = "flex size-9 items-center justify-center rounded-lg border text-sm font-medium";
  const isFirst = currentPage <= 1;
  const isLast = currentPage >= totalPages;

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-1">
      {/* SEBELUMNYA */}
      {isFirst ? (
        <span className={`${baseClass} cursor-not-allowed border-neutral-200 text-neutral-300`}>
          <ChevronLeft className="size-4" />
        </span>
      ) : (
        <Link
          href={buildHref(currentPage - 1, searchParams)}
          aria-label="Halaman sebelumnya"
          className={`${baseClass} border-neutral-300 text-neutral-700 hover:bg-orange-50`}
        >
          <ChevronLeft className="size-4" />
        </Link>
      )}

      {/* NOMOR HALAMAN */}
      {getPageNumbers(currentPage, totalPages).map((item, index) =>
        item === "..." ? (
          <span key={`dots-${index}`} className="px-2 text-sm text-neutral-400">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={buildHref(item, searchParams)}
            aria-current={item === currentPage ? "page" : undefined}
            className={
              item === currentPage
                ? `${baseClass} border-orange-500 bg-orange-500 text-white`
                : `${baseClass} border-neutral-300 text-neutral-700 hover:bg-orange-50`
            }
          >
            {item}
          </Link>
        ),
      )}

      {/* BERIKUTNYA */}
      {isLast ? (
        <span className={`${baseClass} cursor-not-allowed border-neutral-200 text-neutral-300`}>
          <ChevronRight className="size-4" />
        </span>
      ) : (
        <Link
          href={buildHref(currentPage + 1, searchParams)}
          aria-label="Halaman berikutnya"
          className={`${baseClass} border-neutral-300 text-neutral-700 hover:bg-orange-50`}
        >
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}