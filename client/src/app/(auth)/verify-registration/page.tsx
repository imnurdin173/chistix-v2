"use client";

import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { MailCheck, XCircle } from "lucide-react";
import { Suspense, useEffect, useState, useRef } from "react";
import { ApiError, apiFetch } from "@/lib/api";

// Konstanta & tipe: sah di level module (bukan hook)
const VERIFY_PATH = "/auth/verify-email";
const RESEND_PATH = "/auth/resend-verification";
type VerifyStatus = "loading" | "success" | "failed";

// Komponen ISI — semua hooks hidup di sini, di dalam komponen
function VerifyRegistrationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [status, setStatus] = useState<VerifyStatus | null>(
    token ? "loading" : null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const requestedTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!token || requestedTokenRef.current ===token) return;
    requestedTokenRef.current = token;

    let cancelled = false;
    (async () => {
      try {
        await apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`);
        if (!cancelled) setStatus("success");
      } catch (err) {
        if (cancelled) return;
        setStatus("failed");
        setMessage(
          err instanceof ApiError ? err.message : "Unexpected error",
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    setMessage(null);
    try {
      await apiFetch(RESEND_PATH, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResent(true); 
    } catch (err) {
      setMessage(
        err instanceof ApiError
          ? err.message
          : "Gagal mengirim ulang, coba lagi",
      );
    } finally {
      setResending(false);
    }
  }

  // ---------- MODE TOKEN (hasil verifikasi) ----------
  if (token) {
    return (
      <div className="w-full max-w-sm bg-white text-center space-y-4">
          {status === "loading" && (
            <p className="text-sm text-gray-500">
              Memverifikasi email kamu...
            </p>
          )}

          {status === "success" && (
            <>
              <MailCheck className="w-10 h-10 mx-auto text-green-600" />
              <h2 className="text-xl font-bold text-neutral-900 mb-2">
                Your Account Has Been Verified!
              </h2>
              <p className="text-sm text-gray-600">Akunmu siap dipakai.</p>
              <button
                onClick={() => router.push("/login")}
                className="w-full rounded-full bg-[#f58200] py-2.5 text-sm font-bold text-white"
              >
                Login
              </button>
            </>
          )}

          {status === "failed" && (
            <div>
              <XCircle className="w-10 h-10 mx-auto text-red-500" />
              <h2 className="text-xl font-bold text-neutral-900 mb-2">
                Verification Failed
              </h2>
              {message && (
                <p className="text-sm text-gray-600">{message}</p>
              )}
              <button
                onClick={() => router.push("/register")}
                className="w-full rounded-full border border-[#f58200] py-2.5 mt-8 text-sm font-bold text-[#f58200]"
              >
                Back to Register
              </button>
            </div>
          )}
        </div>
    );
  }

  // ---------- MODE EMAIL (pos "cek email kamu") ----------
  return (
      <div className="w-full max-w-sm rounded-2xl text-center space-y-4">
        <h2 className="text-xl font-bold text-neutral-900 mb-2">
          Account Has Been Created!
        </h2>

        {/* satu paragraf = satu <p> berisi teks saja */}
        <p className="text-sm text-neutral-500 leading-relaxed">
          Your account successfully created. We&apos;ve sent you a
          verification link to{" "}
          <span className="font-semibold text-gray-900">
            {email || "your email"}
          </span>
          .
        </p>

        {resent ? (
          <p className="rounded bg-green-50 px-3 py-2 text-xs text-green-700">
            New verification link has been sent.
          </p>
        ) : (
          <button
            onClick={handleResend}
            disabled={resending || !email}
            className="w-full rounded-full bg-[#f58200] py-2.5 text-sm font-bold text-white disabled:opacity-50"
          >
            {resending ? "Resending..." : "Resend Verification Link"}
          </button>
        )}

        {message && (
          <p className="text-sm text-red-600">{message}</p>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <Link
            href="/"
            className="text-sm text-amber-600 hover:underline font-bold"
          >
            Go Back to Homepage
          </Link>
        </div>
      </div>
  );
}

// Default export = pembungkus Suspense SAJA — fallback satu node polos
export default function VerifyRegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex justify-center items-center">
          Loading...
        </div>
      }
    >
      <VerifyRegistrationContent />
    </Suspense>
  );
}