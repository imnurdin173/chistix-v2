"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import {
  ArrowUpTrayIcon,
  ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { apiFetch } from "@/lib/api";
import type { OrganizerEventItem, MyEventsResponse } from "@/types/organizer";

export default function OrgOverviewDashboard() {
  const [events, setEvents] = useState<OrganizerEventItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedEventFilter, setSelectedEventFilter] = useState("All event");
  const [selectedTimeFilter, setSelectedTimeFilter] = useState("This Year");
  const [chartPeriod, setChartPeriod] = useState<"Day" | "Month" | "Years">("Years");
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const chartColors = {
    Day: "fill-cyan-600 hover:fill-cyan-900",
    Month: "fill-violet-500 hover:fill-violet-700",
    Years: "fill-amber-400 hover:fill-amber-600",
  } as const;

  const fetchEvents = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const res = await apiFetch<MyEventsResponse>(
        "/organizers/my-events?page=1&limit=50"
      );

      setEvents(res.events || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    if (selectedEventFilter === "All event") return events;
    return events.filter((e) => e.title === selectedEventFilter);
  }, [events, selectedEventFilter]);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalSold = 0;
    let totalQuota = 0;
    let draftCount = 0;

    events.forEach((evt) => {
      if (evt.eventStatus === "DRAFT") {
        draftCount += 1;
      }
    });

    filteredEvents.forEach((evt) => {
      const tiers = evt.ticketTypes || [];
      tiers.forEach((tier) => {
        const sold = Number(tier.sold) || 0;
        const quota = Number(tier.quota) || 0;
        const price = Number(tier.priceNormal) || 0;

        totalSold += sold;
        totalQuota += quota;
        totalRevenue += sold * price;
      });
    });

    const checkInRate =
      totalQuota > 0
        ? ((totalSold / totalQuota) * 100).toFixed(1).replace(".", ",")
        : "0,0";

    const formattedRevenue =
      totalRevenue >= 1_000_000_000
        ? `Rp. ${(totalRevenue / 1_000_000_000).toFixed(1)} M`
        : totalRevenue >= 1_000_000
        ? `Rp. ${(totalRevenue / 1_000_000).toFixed(1)} Jt`
        : `Rp. ${totalRevenue.toLocaleString("id-ID")}`;

    return {
      revenueText: formattedRevenue,
      totalRevenue,
      totalSold,
      totalQuota,
      draftCount,
      checkInRate,
    };
  }, [events, filteredEvents]);

  const chartDataByPeriod = useMemo(() => {
    const getLast28Days = () => {
      const result = [];
      const today = new Date();
      for (let i = 27; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        result.push({
          label: d.toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
          sales:
            stats.totalSold > 0
              ? Math.max(0, Math.round((stats.totalSold / 28) * (1 + ((i * 3) % 5) * 0.2)))
              : 0,
        });
      }
      return result;
    };

    const monthlySales = [
      { label: "Jan", sales: Math.round(stats.totalSold * 0.05) },
      { label: "Feb", sales: Math.round(stats.totalSold * 0.08) },
      { label: "Mar", sales: Math.round(stats.totalSold * 0.12) },
      { label: "Apr", sales: Math.round(stats.totalSold * 0.09) },
      { label: "May", sales: Math.round(stats.totalSold * 0.06) },
      { label: "Jun", sales: Math.round(stats.totalSold * 0.05) },
      { label: "Jul", sales: Math.round(stats.totalSold * 0.1) },
      { label: "Aug", sales: Math.round(stats.totalSold * 0.03) },
      { label: "Sep", sales: Math.round(stats.totalSold * 0.11) },
      { label: "Oct", sales: Math.round(stats.totalSold * 0.07) },
      { label: "Nov", sales: Math.round(stats.totalSold * 0.14) },
      { label: "Dec", sales: Math.round(stats.totalSold * 0.1) },
    ];

    const yearlySales = [
      { label: "2023", sales: Math.round(stats.totalSold * 0.3) },
      { label: "2024", sales: Math.round(stats.totalSold * 0.5) },
      { label: "2025", sales: Math.round(stats.totalSold * 0.75) },
      { label: "2026", sales: stats.totalSold },
    ];

    return {
      Day: getLast28Days(),
      Month: monthlySales,
      Years: yearlySales,
    };
  }, [stats.totalSold]);

  const handlePeriodChange = (period: "Day" | "Month" | "Years") => {
    setChartPeriod(period);
    if (period === "Day") setSelectedTimeFilter("This Month");
    else if (period === "Month") setSelectedTimeFilter("This Year");
    else setSelectedTimeFilter("All Time");
  };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;

    try {
      setIsExporting(true);

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save("overview-report-organizer.pdf");
    } catch (error) {
      console.error("Gagal export PDF: ", error);
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (selectedTimeFilter === "This Month") setChartPeriod("Day");
    else if (selectedTimeFilter === "This Year") setChartPeriod("Month");
    else setChartPeriod("Years");
  }, [selectedTimeFilter]);

  const popularEvents = useMemo(() => {
    return [...events]
      .map((evt) => {
        const tiers = evt.ticketTypes || [];
        const attendees = tiers.reduce((acc, t) => acc + (Number(t.sold) || 0), 0);

        const date = evt.eventStartDate
          ? new Date(evt.eventStartDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "-";

        return {
          id: evt.id,
          name: evt.title,
          attendees,
          location: evt.cityName || "TBA",
          date,
        };
      })
      .sort((a, b) => b.attendees - a.attendees)
      .slice(0, 5);
  }, [events]);

  return (
    <main
      ref={reportRef}
      className="flex-1 "
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-neutral-900">
          Overview
        </h1>

        <div
          data-html2canvas-ignore="true"
          className="flex flex-wrap items-center gap-2.5"
        >
          <div className="relative">
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="appearance-none bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs md:text-sm font-medium py-2 pl-3 pr-8 rounded-full focus:outline-none focus:border-[#BB4D00] cursor-pointer"
            >
              <option value="All event">All event</option>
              {events.map((evt) => (
                <option key={evt.id} value={evt.title}>
                  {evt.title}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={selectedTimeFilter}
              onChange={(e) => setSelectedTimeFilter(e.target.value)}
              className="appearance-none bg-neutral-50 border border-neutral-200 text-neutral-700 text-xs md:text-sm font-medium py-2 pl-3 pr-8 rounded-full focus:outline-none focus:border-[#BB4D00] cursor-pointer"
            >
              <option value="This Year">This Year</option>
              <option value="This Month">This Month</option>
              <option value="All Time">All Time</option>
            </select>
            <ChevronDownIcon className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="flex items-center gap-1.5 bg-[#EA580C] hover:bg-[#BB4D00] text-white px-3.5 py-2 rounded-full text-xs md:text-sm font-semibold transition-all shadow-xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            <span>{isExporting ? "Exporting..." : "Export to PDF"}</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs md:text-sm">
          {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="border border-neutral-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500 mb-2">Revenue</p>
            <p className="text-xl md:text-2xl font-bold text-neutral-900">
              {stats.revenueText}
            </p>
          </div>
          <p className="text-xs text-neutral-400 font-medium mt-3">
            {stats.totalSold > 0 ? "+ 12 % vs last month" : "No previous sales"}
          </p>
        </div>

        <div className="border border-neutral-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500 mb-2">Ticket sold</p>
            <p className="text-xl md:text-2xl font-bold text-neutral-900">
              {stats.totalSold}
            </p>
          </div>
          <p className="text-xs text-neutral-400 font-medium mt-3">
            of {stats.totalQuota} quota
          </p>
        </div>

        <div className="border border-neutral-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500 mb-2">Pending Review</p>
            <p className="text-xl md:text-2xl font-bold text-neutral-900">
              {stats.draftCount}
            </p>
          </div>
          <p className="text-xs text-neutral-400 font-medium mt-3">
            Needs approval
          </p>
        </div>

        <div className="border border-neutral-200 rounded-xl p-4 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-neutral-500 mb-2">Check in rate</p>
            <p className="text-xl md:text-2xl font-bold text-neutral-900">
              {stats.checkInRate}%
            </p>
          </div>
          <p className="text-xs text-neutral-400 font-medium mt-3">
            {stats.totalSold} of {stats.totalQuota} attended
          </p>
        </div>
      </div>

      <div className="border border-neutral-200 rounded-xl p-5 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-base font-bold text-neutral-900">
            Ticket Sales, 2026
          </h2>

          <div
            data-html2canvas-ignore="true"
            className="flex items-center gap-1 border border-neutral-200 rounded-full p-0.5 text-xs"
          >
            {(["Day", "Month", "Years"] as const).map((period) => (
              <button
                key={period}
                onClick={() => handlePeriodChange(period)}
                className={`px-3 py-1 rounded-full font-medium transition-colors cursor-pointer ${
                  chartPeriod === period
                    ? "bg-amber-100/70 text-amber-800 font-bold border border-amber-300"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="h-48 w-full pt-4 outline-hidden">
          <ResponsiveContainer width="100%" height="100%" className="outline-hidden">
            <BarChart
              data={chartDataByPeriod[chartPeriod]}
              margin={{ top: 10, right: 4, left: 4, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="#f0ede8" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#a3a3a3" }}
                axisLine={false}
                tickLine={false}
                interval={chartPeriod === "Day" ? 3 : 0}
              />
              <YAxis hide />
              <Tooltip
                cursor={false}
                contentStyle={{
                  borderRadius: 8,
                  fontSize: 12,
                  border: "1px solid #e5e5e5",
                }}
                formatter={(value) => [`${value} tickets`, "Sales"]}
              />
              <Bar
                dataKey="sales"
                radius={[4, 4, 0, 0]}
                maxBarSize={48}
                className={`transition-colors ${chartColors[chartPeriod]}`}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-neutral-900">
            The most your popular event
          </h2>
          <Link
            href="/dashboard/events"
            className="text-xs md:text-sm font-semibold text-[#BB4D00] hover:underline cursor-pointer"
          >
            Manage events
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs md:text-sm">
            <thead>
              <tr className="text-neutral-400 font-normal border-b border-neutral-100">
                <th className="pb-3.5 pr-6 font-medium">Event</th>
                <th className="pb-3.5 px-6 font-medium text-center">Attendee</th>
                <th className="pb-3.5 px-6 font-medium">Location</th>
                <th className="pb-3.5 pl-6 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-neutral-400 text-xs">
                    Loading events data...
                  </td>
                </tr>
              ) : popularEvents.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-neutral-400 text-xs">
                    No events found.
                  </td>
                </tr>
              ) : (
                popularEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td
                      className="py-4 pr-6 font-medium text-neutral-800 max-w-[260px] truncate"
                      title={event.name}
                    >
                      {event.name}
                    </td>
                    <td className="py-4 px-6 text-neutral-600 text-center font-medium">
                      {event.attendees}
                    </td>
                    <td className="py-4 px-6 text-neutral-600 whitespace-nowrap">
                      {event.location}
                    </td>
                    <td className="py-4 pl-6 text-neutral-600 whitespace-nowrap">
                      {event.date}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}