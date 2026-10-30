"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";

const LOGIN_PATH = "/auth/login";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formMsgError, setFormMsgError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsgError("");

    try {
      await apiFetch(LOGIN_PATH, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push("/");
      router.refresh();
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

  return (
    <div className="flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Welcome</h2>
        <p className="text-sm text-gray-500">
          Please login to find events & manage your tickets
        </p>
      </div>
      {formMsgError && (
        <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
          {formMsgError}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="yourname@mail.com"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">
                Password
              </label>
            </div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <div className="text-right w-full">
              <Link
                href="/forgot-password"
                className="text-xs text-neutral-700 hover:text-amber-800 hover:underline font-medium"
              >
                Forgot Password?
              </Link>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#f58200] hover:bg-[#e67300] text-white font-bold py-2.5 rounded-full transition-colors mt-2"
        >
          {submitting ? "Loading..." : "Login"}
        </button>
      </form>
    </div>
  );
}
