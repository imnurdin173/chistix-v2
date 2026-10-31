"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { User, Mail, Lock, Eye, EyeOff, Ticket } from "lucide-react";

const REGISTER_PATH = "/auth/register";

type FieldErrors = Record<string, string>;

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState("");
  const [referralError, setReferralError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("");
  const [roleError, setRoleError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formMsgError, setFormMsgError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleReferralChange(v: string) {
    setReferral(v.toUpperCase().replace(/\s+/g, ""));
    setReferralError(null);
  }

  function validateReferral(): boolean {
    if (referral === "") return true;
    if (referral.length < 5) {
      setReferralError("Referral min.5 Character");
      return false;
    }
    return true;
  }

  const handleRegister = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormMsgError(null);

    if(role === "") {
        setRoleError("Choose your role");
        return;
    }
    setRoleError(null);

    if (!validateReferral()) return;
    setSubmitting(true);
    try {
      await apiFetch(REGISTER_PATH, {
        method: "POST",
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          ...(referral ? { referralCode: referral } : {}),
        }),
      });
      router.push(`/verify-registration?email=${encodeURIComponent(email)}`);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormMsgError(err.message);
        const map: FieldErrors = {};
        for (const fe of err.errors ?? []) {
          const key = fe.field ?? fe.path ?? "_";
          if (!map[key]) map[key] = fe.message;
        }
        setFieldErrors(map);
      } else {
        setFormMsgError("Unexpected Error");
      }
    } finally {
      setSubmitting(false);
    }
  };

  // mode maintenance dulu
  const [showMaintenance, setShowMaintenance] = useState(false);
  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMaintenance(true);
    setTimeout(() => {
      setShowMaintenance(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Create Your Account</h2>
        <p className="text-xs text-gray-500 mt-1">
          Join to buy tickets or host your own events.
          <br />
          Select your role to create account!
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="name" className="text-xs font-semibold text-gray-700">
            Full Name
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-full outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          {fieldErrors.name && (
            <p className="text-sm text-red-600">{fieldErrors.name}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="text-xs font-semibold text-gray-700"
          >
            Email
          </label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="yourname@mail.com"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-full outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          {fieldErrors.email && (
            <p className="text-sm text-red-600">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="text-xs font-semibold text-neutral-700"
          >
            Password
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-full outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-gray-400"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-sm text-red-600">{fieldErrors.password}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-700">
            Choose Role
          </label>
          <div className="flex bg-gray-100 p-3 rounded-full mb-2">
            <button
              type="button"
              onClick={() => setRole("CUSTOMER")}
              className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
                role === "CUSTOMER"
                  ? "bg-white shadow-sm text-orange-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setRole("ORGANIZER")}
              className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
                role === "ORGANIZER"
                  ? "bg-white shadow-sm text-orange-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Organizer
            </button>
          </div>
          {roleError && (
            <p className="text-sm text-red-600">{roleError}</p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700">
            Referral code{" "}
            <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <div className="relative flex items-center">
            <Ticket className="absolute left-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={referral}
              onChange={(e) => handleReferralChange(e.target.value)}
              placeholder="CHX-7K2P9"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-full outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          {(referralError || fieldErrors.referralCode) && (
            <p className="text-sm text-red-600">
              {referralError ?? fieldErrors.referralCode}
            </p>
          )}
          <p className="text-[10px] text-gray-400 mt-1">
            Join with a code and get a discount coupon
          </p>
        </div>

        {formMsgError && (
          <div className="p-2 text-xs text-red-600 bg-red-50 rounded">
            {formMsgError}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-[#f58200] hover:bg-[#e67300] text-white font-bold py-2.5 rounded-full transition-colors mt-4 text-sm"
        >
          {submitting ? "Loading..." : "Register Account"}
        </button>
      </form>

      <div className="relative flex items-center justify-center my-5">
        <span className="absolute bg-white px-2 text-[10px] text-gray-400">
          or continue with
        </span>
        <div className="w-full h-px bg-gray-200"></div>
      </div>

      {/* tambahain: onClick={handleGoogleLogin} di dalam button klu mau pake google  */}
      <div className="relative w-full">
        {showMaintenance && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1.5 px-3 rounded-md shadow-lg flex items-center whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200">
            This Feature is in Maintenance Mode
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-full bg-white border border-gray-300 rounded-full py-2 hover:bg-gray-50 transition-colors"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-4 h-4 mr-2"
          />
          <span className="text-sm font-bold text-blue-600">
            Login by Google
          </span>
        </button>
      </div>
    </div>
  );
}
