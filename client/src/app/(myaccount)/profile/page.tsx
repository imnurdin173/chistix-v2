"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Check, Copy, KeyRound, Pencil } from "lucide-react";
import { redirect } from "next/navigation";

type CopyStatus = "idle" | "copied" | "failed";

export default function ProfilePage() {
  const { user } = useAuth();

//   if (!user) return <p className="text-sm text-neutral-500">Loading...</p>;
  if (!user) redirect("/");

  const rows = [
    { label: "Name", value: user.name},
    { label: "Email", value: user.email },
    { label: "Role", value: user.role },
    // {label: "Referral", value: user.referralCode ?? "-"}
  ];

  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  useEffect(() => {
    return() => {
        if(copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  })
  async function handleCopyReferral() {
    const value = user?.referralCode ?? "-";
    if(!value) return;
    try {
        await navigator.clipboard.writeText(value);
        setCopyStatus("copied");
    } catch {
        setCopyStatus("failed");
    }
    if (copyTimerRef.current) 
        clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopyStatus("idle"), 2000);
  }

  return (
    <div className="flex w-full lg:w-1/2 bg-white rounded-xl mb-15 p-6 shadow-xs">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900">My Profile</h1>
        <dl className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline mb-5">
              <dt className="w-28 shrink-0 text-md text-neutral-600">
                {row.label}
              </dt>
              <span className="text-sm text-neutral-400">:</span>
              <dd className="ml-4 text-md font-semibold text-neutral-900 break-all">
                {row.value}
              </dd>
            </div>
          ))}
          <div className="flex items-baseline mb-5">
            <dt className="w-28 shrink-0 text-md text-neutral-600">
              Referral Code
            </dt>
            <span className="text-sm text-neutral-400">:</span>
            <dd className="ml-4 text-md font-semibold text-neutral-900 break-all">
              <button type="button"
              onClick={handleCopyReferral}
              disabled={!user.referralCode}
              title="Click to copy"
              className="inline-flex items-center gap-1.5 hover:text-[#f58200] disabled:cursor-not-allowed disabled:hover:text-neutral-900">
                {user.referralCode}
                {copyStatus === "copied" ? (
                    <Check className="h-4 w-4 text-red-500" />
                ) : copyStatus === "failed" ? 
                ( <Copy className="h-4 w-4 text-red-500" />
                ) : (
                    <Copy className="h-4 w-4 text-neutral-400" />
                )}
              </button>
            </dd>
          </div>
        </dl>
        <div className="flex gap-3 mt-15">
          <Link
            href="/profile/update"
            className="inline-flex items-center gap-2 rounded-full bg-[#f58200] px-5 py-2.5 text-sm font-bold text-white"
          >
            <Pencil className="h-4 w-4" />
            Edit Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
