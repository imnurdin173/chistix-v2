"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

type LoginFormProps = {
  /** Tujuan setelah login (juga dipakai sebagai tujuan kembali dari Google). Default: beranda */
  callbackURL?: string;
  /** Dipanggil setelah login berhasil. Jika tidak diisi, pengguna dipindah ke callbackURL */
  onSuccess?: () => void;
  /** Dipanggil saat pengguna menekan tautan Lupa password / Daftar (mis. untuk menutup modal) */
  onNavigate?: () => void;
};

type AuthError = { code?: string; message?: string; status?: number };

function errorMessage(error: AuthError) {
  if (error.code === "INVALID_EMAIL_OR_PASSWORD") {
    return "Email atau kata sandi salah.";
  }
  if (error.code === "EMAIL_NOT_VERIFIED") {
    return "Email belum diverifikasi. Periksa email Anda untuk tautan verifikasi.";
  }
  if (error.status === 429) {
    return "Terlalu banyak percobaan. Coba lagi beberapa saat lagi.";
  }
  return error.message || "Gagal login. Silakan coba lagi.";
}

// function GoogleIcon() {
//   return (
//     <svg className="size-5" viewBox="0 0 48 48" aria-hidden="true">
//       <path
//         fill="#EA4335"
//         d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
//       />
//       <path
//         fill="#4285F4"
//         d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
//       />
//       <path
//         fill="#FBBC05"
//         d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
//       />
//       <path
//         fill="#34A853"
//         d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
//       />
//     </svg>
//   );
// }

export default function LoginForm({
  callbackURL = "/",
  onSuccess,
  onNavigate,
}: LoginFormProps) {
  const LOGIN_PATH = "/auth/login";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formMsgError, setFormMsgError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsgError("");

    if (submitting) return;

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "")
      .trim()
      .toLowerCase();
    const password = String(form.get("password") ?? "");

    setFormMsgError("");
    setSubmitting(true);

    try {
      await apiFetch(LOGIN_PATH, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(callbackURL);
        router.refresh();
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setFormMsgError(err.message);
      } else {
        setFormMsgError("There some unexpected Problems.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // async function handleGoogle() {
  //   setFormMsgError("");
  //   setGoogleLoading(true);
  //   try {
  //     // Browser dialihkan ke Google, lalu kembali ke callbackURL
  //     const { error } = await authClient.signIn.social({
  //       provider: "google",
  //       callbackURL,
  //       errorCallbackURL: "/login",
  //     });
  //     if (error) {
  //       formMsgError(errorMessage(error));
  //       setGoogleLoading(false);
  //     }
  //   } catch {
  //     setFormMsgError("Koneksi bermasalah. Periksa internet Anda lalu coba lagi.");
  //     setGoogleLoading(false);
  //   }
  // }

  const busy = submitting || googleLoading;

  return (
    <div className="space-y-4">
      <form onSubmit={handleLogin} className="space-y-4 text-left">
        {formMsgError && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-600"
          >
            {formMsgError}
          </div>
        )}

        <div>
          <label
            htmlFor="login-email"
            className="mb-1 block text-sm font-semibold"
          >
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="yourname@mail.com"
            className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <label htmlFor="login-password" className="text-sm font-semibold">
              Kata Sandi
            </label>
            <Link
              href="/forgot-password"
              onClick={onNavigate}
              className="text-xs font-bold text-amber-700 underline hover:text-amber-800"
            >
              Lupa kata sandi?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Masukkan kata sandi"
              className="w-full rounded-lg border py-2 pl-4 pr-20 outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-pressed={showPassword}
              className="absolute inset-y-0 right-3 text-xs font-semibold text-gray-600 hover:text-amber-700"
            >
              {showPassword ? "Sembunyikan" : "Lihat"}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-amber-500 py-2 font-bold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {submitting ? "Memproses..." : "Login"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span className="h-px flex-1 bg-gray-200" />
        atau
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      {/* <button
        type="button"
        onClick={handleGoogle}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg border py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
      >
        <GoogleIcon />
        {googleLoading ? "Mengalihkan..." : "Masuk dengan Google"}
      </button> */}

      <p className="text-center text-sm">
        Belum punya akun?{" "}
        <Link
          href="/register"
          onClick={onNavigate}
          className="font-semibold text-amber-700 hover:underline"
        >
          Daftar
        </Link>
      </p>
    </div>
  );
}
