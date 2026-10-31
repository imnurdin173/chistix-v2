"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch, ApiError } from "@/lib/api";

const COOLDOWN_SECONDS = 60;
const FORGOT_PATH = "/auth/forgot-password";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Resend cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  async function sendResetLink() {
    if (loading) return;
    setLoading(true);
    setErrorMessage("");

    try {
      await apiFetch(FORGOT_PATH, {
        method: "POST",
        body: JSON.stringify({ email: email.trim() }),
      });
      setSent(true);
      setCooldown(COOLDOWN_SECONDS);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(
          err.status === 429
            ? "Too many requests. Please try again in a few minutes."
            : err.message || "Failed to send the link. Please try again.",
        );
      } else {
        // Network error, timeout, etc.
        setErrorMessage(
          "A technical problem occurred. Please check your internet connection.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void sendResetLink();
  }

  return (
    <div className="flex flex-col">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-bold text-gray-900">Forgot Password</h2>
        {!sent && (
          <p className="text-sm text-gray-500">
            Enter your email address and we&apos;ll send you a link to reset
            your password
          </p>
        )}
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600"
        >
          {errorMessage}
        </div>
      )}

      {sent ? (
        <div className="space-y-4">
          <div
            role="status"
            className="rounded-lg bg-green-50 p-4 text-left text-green-700"
          >
            If <strong>{email}</strong> is registered, we&apos;ve sent a
            password reset link to it. Please check your inbox or spam folder.
            The link is valid for 1 hour only.
          </div>

          <button
            type="button"
            onClick={() => void sendResetLink()}
            disabled={cooldown > 0 || loading}
            className="text-sm font-semibold text-amber-700 underline disabled:cursor-not-allowed disabled:text-gray-400 disabled:no-underline"
          >
            {loading
              ? "Sending..."
              : cooldown > 0
                ? `Resend link in ${cooldown}s`
                : "Resend reset link"}
          </button>

          <div>
            <button
              type="button"
              onClick={() => {
                setSent(false);
                setErrorMessage("");
              }}
              className="text-sm text-gray-600 underline"
            >
              Use another email
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              disabled={loading}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-lg border px-4 py-2 outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-500 py-2 font-bold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send "}
          </button>

          <p className="text-center text-sm">
            <Link href="/login" className="text-gray-600 underline">
              Back to login
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}