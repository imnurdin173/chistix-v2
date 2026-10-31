"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, HomeIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "@/lib/api";
import type { MyEventsResponse } from "@/types/organizer";

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function CreateVoucherPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [eventId, setEventId] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">("PERCENTAGE");
  const [discount, setDiscount] = useState<number | "">("");
  const [validStart, setValidStart] = useState("");
  const [validEnd, setValidEnd] = useState("");
  const [maxUsage, setMaxUsage] = useState<number>(100);

  const [eventsList, setEventsList] = useState<{ id: string; title: string; endDate: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailableEvents = async () => {
      try {
        const res = await apiFetch<MyEventsResponse>(
          "/organizers/my-events?page=1&limit=50",
          { headers: getAuthHeaders() },
        );
        const filtered = res.events
          .filter((evt) => (evt.eventStatus || "").toUpperCase() !== "ENDED")
          .map((evt) => ({
            id: evt.id,
            title: evt.title,
            endDate: evt.eventEndDate,
          }));
        setEventsList(filtered);
        if (filtered.length > 0) {
          setEventId(filtered[0].id);
        }
      } catch (err) {
        console.error("Failed to load events for voucher:", err);
      }
    };

    fetchAvailableEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!eventId) {
      setErrorMessage("Please select an event for this voucher.");
      return;
    }

    if (!code || code.trim().length < 3) {
      setErrorMessage("Voucher code must be at least 3 characters.");
      return;
    }

    if (!discount || Number(discount) <= 0) {
      setErrorMessage("Discount value must be greater than 0.");
      return;
    }

    if (discountType === "PERCENTAGE" && Number(discount) > 100) {
      setErrorMessage("Percentage discount cannot exceed 100%.");
      return;
    }

    if (!validStart || !validEnd) {
      setErrorMessage("Please define both valid start and end dates.");
      return;
    }

    if (new Date(validEnd) <= new Date(validStart)) {
      setErrorMessage("Valid End date must be after Valid Start date.");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        code: code.trim().toUpperCase(),
        discountType,
        discount: Number(discount),
        validStart: new Date(validStart).toISOString(),
        validEnd: new Date(validEnd).toISOString(),
        maxUsage: Number(maxUsage) || 100,
      };

      await apiFetch(`/events/${eventId}/vouchers`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      router.push("/dashboard/vouchers");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create voucher");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <nav className="flex items-center gap-1.5 text-xs md:text-sm text-neutral-500">
        <Link
          href="/dashboard"
          className="flex items-center gap-1 hover:text-[#BB4D00] transition-colors font-medium"
        >
          <HomeIcon className="w-3.5 h-3.5" />
          <span>Dashboard</span>
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-300" />
        <Link
          href="/dashboard/vouchers"
          className="hover:text-[#BB4D00] transition-colors font-medium"
        >
          Vouchers
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-900 font-semibold">Create Voucher</span>
      </nav>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs p-6 md:p-8">
        <div className="pb-4 border-b border-neutral-100 mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900">
            Create Promo Voucher
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Set up promotional codes and special discounts for your events
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Select Event <span className="text-red-500">*</span>
            </label>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
              required
            >
              {eventsList.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.title}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Voucher Code <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. FESTIVAL50"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold tracking-wider uppercase focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Discount Type <span className="text-red-500">*</span>
            </label>
            <div className="sm:col-span-2 flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="discountType"
                  value="PERCENTAGE"
                  checked={discountType === "PERCENTAGE"}
                  onChange={() => setDiscountType("PERCENTAGE")}
                  className="text-[#EA580C]"
                />
                <span>Percentage (%)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="discountType"
                  value="FIXED"
                  checked={discountType === "FIXED"}
                  onChange={() => setDiscountType("FIXED")}
                  className="text-[#EA580C]"
                />
                <span>Fixed Amount (IDR)</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Discount Value <span className="text-red-500">*</span>
            </label>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={discountType === "PERCENTAGE" ? 100 : undefined}
                placeholder={discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 50000"}
                value={discount}
                onChange={(e) => setDiscount(e.target.value === "" ? "" : Number(e.target.value))}
                className="w-48 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
                required
              />
              <span className="text-xs text-neutral-400">
                {discountType === "PERCENTAGE" ? "% off total order" : "IDR flat discount"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Valid Period <span className="text-red-500">*</span>
            </label>
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-neutral-400 block mb-1">Valid Start</span>
                <input
                  type="datetime-local"
                  value={validStart}
                  onChange={(e) => setValidStart(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                  required
                />
              </div>
              <div>
                <span className="text-xs text-neutral-400 block mb-1">Valid End</span>
                <input
                  type="datetime-local"
                  value={validEnd}
                  onChange={(e) => setValidEnd(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Max Usage Quota <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min={1}
              value={maxUsage}
              onChange={(e) => setMaxUsage(Number(e.target.value))}
              className="w-36 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <Link
              href="/dashboard/vouchers"
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-neutral-600 border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#BB4D00] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Creating..." : "Save Voucher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}