"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import VoucherStatusBadge from "@/components/dashboard/vouchers/VoucherStatusBadge";
import { apiFetch } from "@/lib/api";
import type { MyEventsResponse } from "@/types/organizer";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

export interface VoucherItem {
  id: string;
  eventId: string;
  eventName: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discount: number;
  validStart: string;
  validEnd: string;
  maxUsage: number;
  usageCount: number;
  status: "ACTIVE" | "SCHEDULED" | "EXPIRED";
}

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("All");

  const [deleteTarget, setDeleteTarget] = useState<VoucherItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const tabs = ["All", "Active", "Scheduled", "Expired"];

  const fetchVouchers = useCallback(async () => {
    try {
      setIsLoading(true);

      const eventsRes = await apiFetch<MyEventsResponse>(
        "/organizers/my-events?page=1&limit=50",
        { headers: getAuthHeaders() },
      );

      const now = new Date();
      const allVouchers: VoucherItem[] = [];

      await Promise.all(
        eventsRes.events.map(async (evt) => {
          try {
            const vList = await apiFetch<any[]>(`/events/${evt.id}/vouchers`, {
              headers: getAuthHeaders(),
            });

            if (Array.isArray(vList)) {
              vList.forEach((v) => {
                const start = new Date(v.validStart);
                const end = new Date(v.validEnd);

                let status: "ACTIVE" | "SCHEDULED" | "EXPIRED" = "ACTIVE";
                if (now < start) status = "SCHEDULED";
                else if (now > end) status = "EXPIRED";

                allVouchers.push({
                  id: v.id,
                  eventId: evt.id,
                  eventName: evt.title,
                  code: v.code,
                  discountType: v.discountType,
                  discount: v.discount,
                  validStart: v.validStart,
                  validEnd: v.validEnd,
                  maxUsage: v.maxUsage || 100,
                  usageCount: v.usageCount || 0,
                  status,
                });
              });
            }
          } catch {
            // Abaikan jika event belum punya voucher
          }
        }),
      );

      setVouchers(allVouchers);
    } catch (err) {
      console.error("Failed to load vouchers:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVouchers();
  }, [fetchVouchers]);

  const handleDeleteVoucher = async () => {
    if (!deleteTarget) return;

    try {
      setIsDeleting(true);
      await apiFetch(
        `/events/${deleteTarget.eventId}/vouchers/${deleteTarget.id}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );
      await fetchVouchers();
      setDeleteTarget(null);
    } catch (err: any) {
      alert("Failed to delete voucher: " + (err.message || "Server error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredVouchers = vouchers.filter((item) => {
    const matchSearch =
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.eventName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus =
      activeTab === "All" ? true : item.status === activeTab.toUpperCase();
    return matchSearch && matchStatus;
  });

  return (
    <main className="w-full bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-neutral-100">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900">
            Vouchers
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage your promotional discounts and event vouchers
          </p>
        </div>
        <Link
          href="/dashboard/vouchers/create-voucher"
          className="flex items-center gap-1.5 bg-[#EA580C] hover:bg-[#BB4D00] text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-xs cursor-pointer"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Create Voucher</span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative w-full sm:max-w-xs">
          <MagnifyingGlassIcon className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search code or event..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-neutral-200 rounded-full bg-neutral-50 focus:outline-none focus:border-[#BB4D00] placeholder:text-neutral-400"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                activeTab === tab
                  ? "bg-[#FFF5ED] text-[#BB4D00] border border-[#BB4D00]/40"
                  : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs md:text-sm">
          <thead>
            <tr className="text-neutral-900 font-semibold border-b border-neutral-100">
              <th className="pb-3.5 px-4">Code</th>
              <th className="pb-3.5 px-4">Event</th>
              <th className="pb-3.5 px-4">Discount</th>
              <th className="pb-3.5 px-4">Valid Period</th>
              <th className="pb-3.5 px-4">Usage</th>
              <th className="pb-3.5 px-4 text-center">Status</th>
              <th className="pb-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-neutral-400 text-sm">
                  Loading vouchers...
                </td>
              </tr>
            ) : filteredVouchers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-neutral-400 text-sm">
                  No vouchers found. Click &ldquo;Create Voucher&rdquo; to add your first promo.
                </td>
              </tr>
            ) : (
              filteredVouchers.map((v) => {
                const startDateStr = new Date(v.validStart).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                });
                const endDateStr = new Date(v.validEnd).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <tr key={v.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="py-4 px-4 font-bold text-neutral-900 tracking-wider">
                      {v.code}
                    </td>
                    <td className="py-4 px-4 text-neutral-600 max-w-48 truncate">
                      {v.eventName}
                    </td>
                    <td className="py-4 px-4 font-semibold text-neutral-900">
                      {v.discountType === "PERCENTAGE"
                        ? `${v.discount}%`
                        : `IDR ${Number(v.discount).toLocaleString("id-ID")}`}
                    </td>
                    <td className="py-4 px-4 text-neutral-500 whitespace-nowrap text-xs">
                      {startDateStr} - {endDateStr}
                    </td>
                    <td className="py-4 px-4 text-neutral-600 font-medium">
                      {v.usageCount} / {v.maxUsage}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <VoucherStatusBadge status={v.status} />
                    </td>
                    <td className="py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/dashboard/vouchers/update-voucher?eventId=${v.eventId}&voucherId=${v.id}`}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-[#BB4D00] hover:bg-[#FFF5ED] transition-colors"
                          title="Edit Voucher"
                        >
                          <PencilSquareIcon className="w-4.5 h-4.5 text-black/80 hover:text-[#BB4D00]" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(v)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Voucher"
                        >
                          <TrashIcon className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop:blur-xs p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-neutral-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
              <TrashIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-neutral-900 text-base">Delete Voucher?</h3>
              <p className="text-xs text-neutral-600 mt-1">
                Are you sure you want to delete voucher code <strong>{deleteTarget.code}</strong>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-full text-xs font-semibold text-neutral-600 border border-neutral-200 hover:bg-neutral-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteVoucher}
                disabled={isDeleting}
                className="flex-1 py-2 rounded-full text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}