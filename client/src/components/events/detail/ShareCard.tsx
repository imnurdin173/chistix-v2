"use client";

import { MessageCircle } from "lucide-react";

type Platform = "x" | "facebook" | "whatsapp";

export default function ShareCard({ title }: { title: string }) {
  function share(platform: Platform) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(title);
    const links: Record<Platform, string> = {
      x: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
    };
    window.open(links[platform], "_blank", "noopener,noreferrer");
  }

  const buttonClass = "flex size-10 items-center justify-center rounded-full text-orange-500 hover:bg-orange-50";

  return (
    <section className="flex items-center justify-around rounded-2xl border border-neutral-200 bg-white p-3 shadow-sm">
      <button type="button" aria-label="Share to X" onClick={() => share("x")} className={buttonClass}>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h4l12 16h-4z" />
          <path d="M4 20l6.8-7.3M13.2 10.7 20 4" />
        </svg>
      </button>
      <button type="button" aria-label="Share to Facebook" onClick={() => share("facebook")} className={buttonClass}>
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
        </svg>
      </button>
      <button type="button" aria-label="Share to WhatsApp" onClick={() => share("whatsapp")} className={buttonClass}>
        <MessageCircle className="size-5" />
      </button>
    </section>
  );
}