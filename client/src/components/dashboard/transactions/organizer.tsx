"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  XMarkIcon,
  ReceiptPercentIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import type { MyEventsResponse } from "@/types/organizer";

interface OrganizerTransactionItem {
  id: string;
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
  };
  eventId: string;
  event: {
    id: string;
    title: string;
    category: string;
    thumbnailImage: string;
  };
  ticketTypeId: string;
  ticketType: {
    id: string;
    name: string;
    priceNormal: number;
  };
  status: "WAITING_PAYMENT" | "PAID" | "CANCELLED" | "EXPIRED";
  quantity: number;
  priceAtPurchase: number;
  couponAmount: number;
  pointsUsed: number;
  discountAmount: number;
  totalPrice: number;
  paymentDeadline: string;
  paidAt: string | null;
  voucher: {
    id: string;
    code: string;
  } | null;
  createdAt: string;
}

interface TransactionsResponse {
  transactions: OrganizerTransactionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function OrganizerTransactionsD() {
  const [transactions, setTransactions] = useState<OrganizerTransactionItem[]>([]);
  const [eventsList, setEventsList] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalItems, setTotalItems] = useState<number>(0);
  const limitPerPage = 10;

  const [selectedTrx, setSelectedTrx] = useState<OrganizerTransactionItem | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await apiFetch<MyEventsResponse>("/organizers/my-events?page=1&limit=50");
      if (res && res.events) {
        setEventsList(res.events.map((e) => ({ id: e.id, title: e.title })));
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: String(currentPage),
        limit: String(limitPerPage),
      });

      if (activeTab !== "ALL") {
        queryParams.append("status", activeTab);
      }
      if (selectedEvent !== "ALL") {
        queryParams.append("eventId", selectedEvent);
      }

      const res = await apiFetch<TransactionsResponse>(
        `/organizers/transactions?${queryParams.toString()}`
      );

      if (res && res.transactions) {
        setTransactions(res.transactions);
        setTotalPages(res.pagination.totalPages || 1);
        setTotalItems(res.pagination.total || 0);
      }
    } catch (err) {
      console.error(err);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeTab, selectedEvent]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    if (!searchQuery.trim()) return transactions;
    const q = searchQuery.toLowerCase();
    return transactions.filter(
      (t) =>
        t.id.toLowerCase().includes(q) ||
        t.user.name.toLowerCase().includes(q) ||
        t.user.email.toLowerCase().includes(q) ||
        t.event.title.toLowerCase().includes(q)
    );
  }, [transactions, searchQuery]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            Paid
          </span>
        );
      case "WAITING_PAYMENT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <ClockIcon className="w-3.5 h-3.5" />
            Pending
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircleIcon className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
            <ClockIcon className="w-3.5 h-3.5" />
            Expired
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
            {status}
          </span>
        );
    }
  };

  const statusTabs = [
    { label: "All", value: "ALL" },
    { label: "Paid", value: "PAID" },
    { label: "Pending", value: "WAITING_PAYMENT" },
    { label: "Cancelled", value: "CANCELLED" },
    { label: "Expired", value: "EXPIRED" },
  ];

  return (
    <main className="flex-1 w-full ">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900">
            Transactions Management
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Monitor and track all ticket sales and order payments across your events
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-[#FFF5ED] border border-[#BB4D00]/20 text-[#BB4D00] text-xs font-semibold">
            Total Orders: {totalItems}
          </div>
        </div>
      </div>

      <div className="border-b border-neutral-200 mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-px">
          {statusTabs.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => {
                  setActiveTab(tab.value);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2.5 text-xs md:text-sm font-semibold transition-all whitespace-nowrap border-b-2 cursor-pointer ${
                  isActive
                    ? "border-[#BB4D00] text-[#BB4D00]"
                    : "border-transparent text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Invoice ID, customer name or email..."
            className="w-full bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs md:text-sm rounded-xl py-2 pl-10 pr-4 focus:outline-none focus:border-[#BB4D00]"
          />
        </div>

        <div className="relative">
          <select
            value={selectedEvent}
            onChange={(e) => {
              setSelectedEvent(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto appearance-none bg-neutral-50 border border-neutral-200 text-neutral-800 text-xs md:text-sm font-semibold py-2 pl-4 pr-9 rounded-xl focus:outline-none focus:border-[#BB4D00] cursor-pointer"
          >
            <option value="ALL">All Events</option>
            {eventsList.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.title}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-neutral-400 text-sm">
          Loading transactions data...
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="border border-dashed border-neutral-200 rounded-2xl py-16 px-4 text-center bg-[#FAF8F4]/40 my-2">
          <ReceiptPercentIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-neutral-700">
            No transactions found
          </p>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            Transactions will appear here once attendees purchase tickets for your published events.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-100 rounded-2xl shadow-2xs">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-[#FAF8F4] text-neutral-500 font-semibold border-b border-neutral-100">
              <tr>
                <th className="py-3.5 px-4">Invoice / ID</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Event & Tier</th>
                <th className="py-3.5 px-4 text-center">Qty</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800">
              {filteredTransactions.map((trx) => (
                <tr key={trx.id} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="py-4 px-4 font-mono font-medium text-xs text-neutral-500">
                    #{trx.id.slice(0, 8)}...
                  </td>

                  <td className="py-4 px-4">
                    <p className="font-semibold text-neutral-900">{trx.user.name}</p>
                    <p className="text-xs text-neutral-400">{trx.user.email}</p>
                  </td>

                  <td className="py-4 px-4 max-w-xs">
                    <p className="font-semibold text-neutral-900 truncate">
                      {trx.event.title}
                    </p>
                    <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-100 text-neutral-600">
                      {trx.ticketType.name}
                    </span>
                  </td>

                  <td className="py-4 px-4 text-center font-semibold">
                    {trx.quantity}
                  </td>

                  <td className="py-4 px-4 font-bold text-[#BB4D00]">
                    {formatRupiah(trx.totalPrice)}
                  </td>

                  <td className="py-4 px-4 text-center">
                    {getStatusBadge(trx.status)}
                  </td>

                  <td className="py-4 px-4 text-xs text-neutral-500 whitespace-nowrap">
                    {formatDate(trx.createdAt)}
                  </td>

                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedTrx(trx)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-700 hover:bg-[#FFF5ED] hover:text-[#BB4D00] hover:border-[#BB4D00]/40 transition-all cursor-pointer"
                    >
                      <EyeIcon className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-neutral-100 mt-6 text-xs md:text-sm">
          <p className="text-neutral-500">
            Showing {(currentPage - 1) * limitPerPage + 1} to{" "}
            {Math.min(currentPage * limitPerPage, totalItems)} of {totalItems} transactions
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span>Prev</span>
            </button>
            <span className="px-3 py-1.5 font-semibold text-neutral-800">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-medium"
            >
              <span>Next</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {selectedTrx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-neutral-100 space-y-5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Transaction Details
                </h3>
                <p className="font-mono text-xs text-neutral-400 mt-0.5">
                  ID: {selectedTrx.id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTrx(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs md:text-sm">
              <div className="flex items-center justify-between p-3.5 bg-neutral-50 rounded-xl border border-neutral-100">
                <span className="text-neutral-500 font-medium">Status</span>
                {getStatusBadge(selectedTrx.status)}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Customer Information
                </h4>
                <div className="p-3 bg-white border border-neutral-100 rounded-xl space-y-1">
                  <p className="font-semibold text-neutral-900">{selectedTrx.user.name}</p>
                  <p className="text-xs text-neutral-500">{selectedTrx.user.email}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Ticket & Event
                </h4>
                <div className="p-3 bg-white border border-neutral-100 rounded-xl space-y-1">
                  <p className="font-semibold text-neutral-900">{selectedTrx.event.title}</p>
                  <p className="text-xs text-neutral-500">
                    Tier: {selectedTrx.ticketType.name} &bull; Qty: {selectedTrx.quantity} tiket
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Payment Summary
                </h4>
                <div className="p-3 bg-neutral-50 border border-neutral-100 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between text-neutral-600">
                    <span>Base Price ({selectedTrx.quantity}x)</span>
                    <span>{formatRupiah(selectedTrx.quantity * selectedTrx.priceAtPurchase)}</span>
                  </div>

                  {selectedTrx.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Voucher Discount</span>
                      <span>-{formatRupiah(selectedTrx.discountAmount)}</span>
                    </div>
                  )}

                  {selectedTrx.couponAmount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Referral Coupon</span>
                      <span>-{formatRupiah(selectedTrx.couponAmount)}</span>
                    </div>
                  )}

                  {selectedTrx.pointsUsed > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Points Used ({selectedTrx.pointsUsed} pts)</span>
                      <span>-{formatRupiah(selectedTrx.pointsUsed)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2 border-t border-neutral-200 font-bold text-sm text-neutral-900">
                    <span>Total Paid</span>
                    <span className="text-[#BB4D00]">{formatRupiah(selectedTrx.totalPrice)}</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-neutral-400 space-y-0.5">
                <p>Created: {formatDate(selectedTrx.createdAt)}</p>
                {selectedTrx.paidAt && <p>Paid at: {formatDate(selectedTrx.paidAt)}</p>}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedTrx(null)}
                className="w-full py-2.5 rounded-xl bg-neutral-100 text-neutral-700 font-semibold text-xs md:text-sm hover:bg-neutral-200 transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}