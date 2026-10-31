"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import LoginForm from "./login-form";

type LoginModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Memakai elemen <dialog> bawaan browser. Keuntungannya, tanpa kode tambahan:
 *  - Esc menutup modal
 *  - fokus keyboard terkunci di dalam modal (Tab tidak "bocor" ke halaman)
 *  - halaman di belakang tidak bisa diklik
 *  - tampil di lapisan paling atas (tidak bentrok dengan z-index navbar)
 */
export default function LoginModal({ open, onClose }: LoginModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pressStartedOnBackdrop = useRef(false);
  const pathname = usePathname();

  // Sinkronkan state `open` dengan <dialog>
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // Kunci scroll halaman selama modal terbuka
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="login-modal-title"
      // Terjadi saat Esc ditekan atau dialog.close() dipanggil
      onClose={onClose}
      // Klik di area gelap (backdrop) menutup modal.
      // Dicatat dari mousedown agar menyeret teks dari dalam form ke luar tidak menutup modal.
      onMouseDown={(e) => {
        pressStartedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && pressStartedOnBackdrop.current) {
          onClose();
        }
      }}
      // m-auto wajib: reset bawaan Tailwind menghapus margin dialog sehingga tidak ke tengah
      className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-md bg-white p-0 shadow-xl backdrop:bg-black/30 backdrop:backdrop-blur-xs"
    >
      {/* Form hanya dirender saat terbuka, jadi isinya selalu bersih saat dibuka lagi */}
      {open && (
        <div className="relative p-6">
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="absolute right-3 top-3 inline-flex size-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          >
            <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>

          <div className="mb-5 text-center">
            <h2 id="login-modal-title" className="text-xl font-bold">
              Welcome
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Please login to find events and manage your tickets
            </p>
          </div>

          <LoginForm
            // Setelah login Google, kembali ke halaman tempat modal dibuka
            callbackURL={pathname}
            onSuccess={onClose}
            onNavigate={onClose}
          />
        </div>
      )}
    </dialog>
  );
}