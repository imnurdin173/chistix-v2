"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function TopBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      id="navchild"
      className={`overflow-hidden bg-amber-200 transition-all duration-300 ${
        isScrolled ? "max-h-0 py-0 opacity-0" : "max-h-10 py-1 opacity-100"
      }`}
    >
      <ul className="container mx-auto flex max-w-8xl items-center justify-center gap-5 px-4 text-sm text-amber-800 sm:px-6 md:justify-end">
        <li>
          <Link href="#">Affiliates</Link>
        </li>
        <li>
          <Link href="#">Promo</Link>
        </li>
        <li>
          <Link href="#">IDR | ENG</Link>
        </li>
      </ul>
    </div>
  );
}
