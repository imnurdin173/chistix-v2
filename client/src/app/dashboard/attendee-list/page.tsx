"use client";

import { useAuth } from "@/components/providers/auth-provider";
import CustomerSidebar from "@/components/sidebar/customerSidebar";
import OrganizerSidebar from "@/components/sidebar/organizerSidebar";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

import type { MyEventsResponse } from "@/types/organizer";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  FunnelIcon,
  QrCodeIcon,
  TicketIcon,
  UsersIcon,
} from "lucide-react";
import {
  ArrowDownTrayIcon,
  CheckBadgeIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

interface AttendeeItem {
  id: string;
  ticketCode: string;
  customerName: string;
  email: string;
  eventId: string;
  eventName: string;
  ticketTier: string;
  quantity: number;
  totalPaid: number;
  status: "ATTENDED" | "REGISTERED";
  checkInTime: string | null;
}

export default function AttendeePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!user) router.replace("/error/401");
    else if (user.role !== "ORGANIZER") router.replace("/error/403");
  }, [user, authLoading, router]);

  const [attendees, setAttendees] = useState<AttendeeItem[]>([]);
  const [eventsList, setEventsList] = useState<{ id: string; title: string }[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(true);

  const [selectedEvent, setSelectedEvent] = useState<string>("ALL");
  const [ticketTierFilter, setTicketTierFilter] = useState<string>("ALL");
  const [statusTab, setStatusTab] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  const fetchData = useCallback(async () => {
    try {
      setIsFetching(true);

      const [resEvents, resAttendees] = await Promise.allSettled([
        apiFetch<MyEventsResponse>("/organizers/my-events?page=1&limit=50"),
        apiFetch<AttendeeItem[]>("/organizers/attendees"),
      ]);

      if (resEvents.status === "fulfilled" && resEvents.value?.events) {
        setEventsList(
          resEvents.value.events.map((e) => ({
            id: e.id,
            title: e.title,
          }))
        );
      }

      if (resAttendees.status === "fulfilled" && Array.isArray(resAttendees.value)) {
        setAttendees(resAttendees.value);
      }
    } catch (err) {
      console.error("Failed to fetch attendees data", err);
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === "ORGANIZER") {
      fetchData();
    }
  }, [fetchData, user?.role]);

  const eventScopedAttendees = useMemo(() => {
    if (selectedEvent === "ALL") return attendees;
    return attendees.filter((item) => item.eventId === selectedEvent);
  }, [attendees, selectedEvent]);

  const totalRegistered = eventScopedAttendees.length;
  const totalAttended = eventScopedAttendees.filter((item) => item.status === "ATTENDED").length;
  const notYetArrived = totalRegistered - totalAttended;
  const totalRevenue = eventScopedAttendees.reduce(
    (sum, item) => sum + Number(item.totalPaid || 0),
    0
  );
  const attendancePercentage =
    totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0;

  const filteredAttendees = useMemo(() => {
    return eventScopedAttendees.filter((item) => {
      const matchTier =
        ticketTierFilter === "ALL"
          ? true
          : String(item.ticketTier).toUpperCase() === ticketTierFilter.toUpperCase();

      const matchStatus = statusTab === "ALL" ? true : item.status === statusTab;

      const query = searchQuery.trim().toLowerCase();
      const matchSearch =
        !query ||
        item.customerName.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        item.ticketCode.toLowerCase().includes(query);

      return matchTier && matchStatus && matchSearch;
    });
  }, [eventScopedAttendees, ticketTierFilter, statusTab, searchQuery]);

  const totalItems = filteredAttendees.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginatedAttendees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAttendees.slice(start, start + itemsPerPage);
  }, [filteredAttendees, currentPage, itemsPerPage]);

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatCheckInTime = (timeString?: string | null) => {
    if (!timeString) return null;
    const dateObj = new Date(timeString);
    if (isNaN(dateObj.getTime())) return timeString;

    const timePart = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    })
      .format(dateObj)
      .replace(".", ":");

    const datePart = new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
    }).format(dateObj);

    return `${timePart} WIB (${datePart})`;
  };

  const getTierBadgeStyle = (tier: string) => {
    const normalized = String(tier).toUpperCase();
    if (normalized === "VIP") {
      return "bg-amber-50 text-[#BB4D00] border border-amber-200/80";
    }
    if (normalized === "PRESALE") {
      return "bg-orange-50/70 text-[#EA580C] border border-orange-200/70";
    }
    return "bg-neutral-100 text-neutral-700 border border-neutral-200";
  };

  const handlerExportCSV = () => {
    if (filteredAttendees.length === 0) {
      alert("No attendee data available to export.");
      return;
    }

    const escapeCsvField = (value: unknown) => {
      const str = String(value ?? "-").replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      "Ticket Code",
      "Customer Name",
      "Email",
      "Event Name",
      "Ticket Tier",
      "Qty",
      "Amount Paid (IDR)",
      "Status",
      "Check-In Time",
    ];

    const rows = filteredAttendees.map((item) => {
      const formattedTime = item.checkInTime
        ? new Date(item.checkInTime).toLocaleString("id-ID")
        : "-";

      return [
        escapeCsvField(item.ticketCode),
        escapeCsvField(item.customerName),
        escapeCsvField(item.email),
        escapeCsvField(item.eventName),
        escapeCsvField(item.ticketTier),
        escapeCsvField(item.quantity),
        escapeCsvField(item.totalPaid),
        escapeCsvField(item.status),
        escapeCsvField(formattedTime),
      ];
    });

    const csvString = "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Attendee_List_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "ALL", label: "All Attendees" },
    { id: "ATTENDED", label: "Attended" },
    { id: "REGISTERED", label: "Registered (Not Arrived)" },
  ];

  const ticketTierOptions = [
    { value: "ALL", label: "All Ticket Tiers" },
    { value: "PRESALE", label: "Presale" },
    { value: "REGULAR", label: "Regular" },
    { value: "VIP", label: "VIP" },
  ];

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center text-sm text-neutral-500">
        Verifying dashboard access ...
      </div>
    );
  }

  if (!user || user.role !== "ORGANIZER") {
    return null;
  }

  return (
    <div className="mx-auto flex container max-w-8xl flex-col items-start gap-6 md:flex-row">
      <div className="w-full md:w-64 shrink-0">
        {user.role === "ORGANIZER" ? <OrganizerSidebar /> : <CustomerSidebar />}
      </div>

      <main className="w-full flex-1 bg-white rounded-2xl p-6 md:p-8 shadow-xs border border-neutral-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-neutral-100">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-neutral-900">
              Attendee & Check-In List
            </h1>
            <p className="text-xs md:text-sm text-neutral-500 mt-1">
              Monitor issued e-tickets, customer details, and real-time gate check-in status.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handlerExportCSV}
              className="h-10 flex items-center gap-2 px-4 rounded-xl text-xs md:text-sm font-semibold border border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 transition-all cursor-pointer shadow-2xs"
              title="Download filtered attendees as CSV"
            >
              <ArrowDownTrayIcon className="w-4 h-4 text-neutral-500 stroke-[2]" />
              <span>Export CSV</span>
            </button>

            <Link
              href="/event-scan"
              className="h-10 flex items-center gap-2 px-4 rounded-xl text-xs md:text-sm font-semibold bg-[#EA580C] hover:bg-[#BB4D00] text-white shadow-xs transition-all cursor-pointer"
            >
              <QrCodeIcon className="w-4 h-4 stroke-[2]" />
              <span>Open QR Scanner</span>
            </Link>
          </div>
        </div>

        <div className="bg-[#FAF8F4]/70 border border-neutral-200/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-6 mb-6">
          <div className="flex items-center gap-2 text-xs md:text-sm font-semibold text-neutral-700 pl-1">
            <FunnelIcon className="w-4 h-4 text-[#BB4D00]" />
            <span>Select Active Event:</span>
          </div>

          <div className="relative flex-1 max-w-xl">
            <select
              value={selectedEvent}
              onChange={(e) => {
                setSelectedEvent(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-10 appearance-none bg-white border border-neutral-200 text-neutral-800 text-xs md:text-sm font-semibold pl-4 pr-10 rounded-xl focus:outline-none focus:border-[#BB4D00] cursor-pointer shadow-2xs truncate"
            >
              <option value="ALL">All Events</option>
              {eventsList.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="w-4 h-4 text-neutral-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-6">
          <div className="lg:col-span-7 bg-[#FAF8F4] border border-[#E6DED0] rounded-2xl p-5 md:p-6 flex flex-col justify-between">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-[#BB4D00]">
                  <UsersIcon className="w-4 h-4 stroke-[2.2]" />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    Total Issued Tickets
                  </span>
                </div>
                <div className="flex items-baseline gap-2.5 pt-1">
                  <span className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight">
                    {totalRegistered}
                  </span>
                  <span className="text-xs md:text-sm font-medium text-neutral-500">
                    registered tickets
                  </span>
                </div>
              </div>

              <div className="bg-white border border-neutral-200/80 rounded-xl px-3.5 py-2 text-right">
                <span className="block text-[11px] font-medium text-neutral-400">
                  Verified Ticket Value
                </span>
                <span className="text-sm md:text-base font-bold text-neutral-800">
                  {formatRupiah(totalRevenue)}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#E6DED0]/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-600">Gate Check-In Progress</span>
                <span className="font-bold text-[#BB4D00]">
                  {attendancePercentage}% Checked In ({totalAttended} of {totalRegistered})
                </span>
              </div>
              <div className="w-full h-2.5 bg-neutral-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#EA580C] rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, attendancePercentage))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Attended
                </span>
                <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <CheckBadgeIcon className="w-4 h-4" />
                </span>
              </div>

              <div className="my-3">
                <p className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
                  {totalAttended}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5 font-medium">Scanned at venue gate</p>
              </div>

              <div className="pt-2.5 border-t border-neutral-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-semibold text-emerald-700">Verified entry</span>
              </div>
            </div>

            <div className="bg-white border border-neutral-200 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                  Not Arrived
                </span>
                <span className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-[#BB4D00]">
                  <ClockIcon className="w-4 h-4" />
                </span>
              </div>

              <div className="my-3">
                <p className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
                  {notYetArrived}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5 font-medium">Awaiting gate scan</p>
              </div>

              <div className="pt-2.5 border-t border-neutral-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span className="text-[11px] font-semibold text-neutral-600">
                  Registered status
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => {
              const isActive = statusTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setStatusTab(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`h-10 px-4 rounded-xl text-xs md:text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#FFF5ED] text-[#BB4D00] border border-[#BB4D00]/40 font-semibold shadow-2xs"
                      : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-md justify-end">
            <div className="relative shrink-0">
              <select
                value={ticketTierFilter}
                onChange={(e) => {
                  setTicketTierFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full sm:w-44 h-10 appearance-none bg-white border border-neutral-200 text-neutral-700 text-xs md:text-sm font-semibold pl-3.5 pr-9 rounded-xl focus:outline-none focus:border-[#BB4D00] cursor-pointer shadow-2xs"
              >
                {ticketTierOptions.map((tier) => (
                  <option key={tier.value} value={tier.value}>
                    {tier.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="w-4 h-4 text-neutral-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search name, email, or ticket code..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full h-10 pl-9 pr-4 text-xs md:text-sm text-neutral-900 font-medium border border-neutral-200 rounded-xl bg-white focus:outline-none focus:border-[#BB4D00] placeholder:text-neutral-400 shadow-2xs"
              />
            </div>
          </div>
        </div>

        {isFetching ? (
          <div className="py-16 text-center text-neutral-400 text-sm">
            Loading attendee list from database...
          </div>
        ) : paginatedAttendees.length === 0 ? (
          <div className="border border-dashed border-neutral-200 rounded-2xl py-16 px-4 text-center bg-[#FAF8F4]/40 my-2">
            <TicketIcon className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-neutral-700">
              No attendees found matching your current filter
            </p>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Attendees will automatically appear here once customer transactions are completed and
              tickets are issued.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-neutral-100 rounded-2xl">
            <table className="w-full text-left text-xs md:text-sm">
              <thead>
                <tr className="bg-[#FAF8F4] text-neutral-700 font-semibold border-b border-neutral-200/70">
                  <th className="py-3.5 pl-4 pr-3">Ticket Code</th>
                  <th className="py-3.5 px-3">Customer</th>
                  <th className="py-3.5 px-3">Event & Tier</th>
                  <th className="py-3.5 px-3 text-center">Qty</th>
                  <th className="py-3.5 px-3 text-right">Amount Paid</th>
                  <th className="py-3.5 pl-3 pr-4 text-center">Check-In Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {paginatedAttendees.map((item) => {
                  const formattedTime = formatCheckInTime(item.checkInTime);
                  return (
                    <tr key={item.id} className="hover:bg-[#FAF8F4]/50 transition-colors">
                      <td className="py-4 pl-4 pr-3 align-middle whitespace-nowrap">
                        <span className="font-mono text-xs font-bold text-neutral-800 bg-neutral-100 border border-neutral-200/80 px-2.5 py-1 rounded-lg">
                          {item.ticketCode}
                        </span>
                      </td>

                      <td className="py-4 px-3 align-middle">
                        <p className="font-semibold text-neutral-900">{item.customerName}</p>
                        <p className="text-neutral-400 text-xs mt-0.5">{item.email}</p>
                      </td>

                      <td className="py-4 px-3 align-middle max-w-60">
                        <p className="font-medium text-neutral-800 truncate" title={item.eventName}>
                          {item.eventName}
                        </p>
                        <div className="mt-1">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide ${getTierBadgeStyle(
                              item.ticketTier
                            )}`}
                          >
                            {item.ticketTier}
                          </span>
                        </div>
                      </td>

                      <td className="py-4 px-3 align-middle text-center font-semibold text-neutral-700">
                        x{item.quantity}
                      </td>

                      <td className="py-4 px-3 align-middle font-bold text-right text-neutral-900 whitespace-nowrap">
                        {formatRupiah(item.totalPaid)}
                      </td>

                      <td className="py-4 pl-3 pr-4 align-middle text-center">
                        <div className="flex flex-col items-center justify-center">
                          {item.status === "ATTENDED" ? (
                            <>
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Attended
                              </span>
                              {formattedTime && (
                                <span className="text-[11px] text-neutral-500 mt-1 font-medium whitespace-nowrap">
                                  {formattedTime}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600 border border-neutral-200">
                                Registered
                              </span>
                              <span className="text-[10px] text-neutral-400 mt-1">
                                Not yet scanned
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-6 border-t border-neutral-100 mt-6 text-xs md:text-sm">
            <p className="text-neutral-500">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} entries
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
      </main>
    </div>
  );
}