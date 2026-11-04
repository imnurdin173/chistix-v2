"use client";

import { useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";

const CHANGE_PASSWORD_PATH = "/profile/change-password";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const fe: Record<string, string> = {};
    if (!currentPassword) fe.currentPassword = "Current password is required";
    if (newPassword.length < 6)
      fe.newPassword = "New password must be at least 6 characters";
    if (newPassword !== confirmNewPassword)
      fe.confirmNewPassword = "Confirmation does not match";
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  async function handleChangePassword(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setBanner(null);
    setSuccess(false);
    if (!validate()) return;
    setSaving(true);
    try {
      // confirm TIDAK dikirim ke server — itu urusan UI saja
      await apiFetch(CHANGE_PASSWORD_PATH, {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccess(true); // TAMPILAN: pesan sukses statis
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
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
    <div className="flex w-full lg:w-1/2 bg-white border rounded-xl mb-15 p-6 shadow-xs">
      <form onSubmit={handleChangePassword} className="space-y-6" noValidate>
        <h1 className="text-2xl font-bold text-neutral-900">Change Password</h1>
        {success && (
          <p className="text-sm text-green-600">
            Password changed successfully!
          </p>
        )}
        {banner && <p className="text-sm text-red-600">{banner}</p>}

        {[
          {
            id: "currentPassword",
            label: "Current Password",
            value: currentPassword,
            set: setCurrentPassword,
            error: fieldErrors.currentPassword,
          },
          {
            id: "newPassword",
            label: "New Password",
            value: newPassword,
            set: setNewPassword,
            error: fieldErrors.newPassword,
          },
          {
            id: "confirmNewPassword",
            label: "Confirm New Password",
            value: confirmNewPassword,
            set: setConfirmNewPassword,
            error: fieldErrors.confirmNewPassword,
          },
        ].map((f) => (
          <div key={f.id}>
            <label
              htmlFor={f.id}
              className="block text-sm font-semibold text-neutral-700 mb-1"
            >
              {f.label}
            </label>
            <input
              id={f.id}
              type="password"
              value={f.value}
              onChange={(e) => f.set(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#f58200]"
            />
            {f.error && <p className="mt-1 text-sm text-red-600">{f.error}</p>}
          </div>
        ))}

        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-[#f58200] px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
        >
          {saving ? "Saving..." : "Change Password"}
        </button>
      </form>
    </div>
  );
}
