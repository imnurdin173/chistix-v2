"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { ApiError, apiFetch } from "@/lib/api";

export default function UpdateProfilePage() {
  const { user, refresh } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  const validateName = (): boolean => {
    if (name.trim().length < 2) {
      setFieldErrors({ name: "Name must be at least 2 characters" });
      return false;
    }
    setFieldErrors({});
    return true;
  };

  async function handleUpdateProfile(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setBanner(null);
    if (!validateName()) return;
    setSaving(true);
    try {
      await refresh();
      router.push("/profile");
    } catch (err) {
      if (err instanceof ApiError) {
        const fe: Record<string, string> = {};
        for (const e of err.errors ?? []) {
          const key = e.field ?? e.path;
          if (key) fe[key] = e.message;
        }
        setFieldErrors(fe);
        setBanner(err.message);
      } else {
        setBanner("Unexpected error");
      }
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="flex w-full lg:w-1/2 bg-white rounded-xl mb-15 p-6 shadow-xs">
      <form onSubmit={handleUpdateProfile} className="space-y-6" noValidate>
        <h1 className="text-2xl font-bold text-neutral-900">Update Profile</h1>
        {banner && <p className="text-sm text-red-600">{banner}</p>}
        <div>
          <label className="block text-sm font-semibold text-neutral-700 mb-1">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f58200]"
            placeholder="Your name"
          />
          {fieldErrors.name && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[#f58200] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
