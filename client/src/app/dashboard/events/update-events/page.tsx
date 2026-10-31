"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRightIcon, HomeIcon, PhotoIcon, TrashIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { EventTicketType } from "@/types/event";

interface RegionOption {
  id: string;
  name: string;
}

interface EventDetailResponse {
  id: string;
  title: string;
  category: string;
  description: string;
  eventStartDate: string;
  eventEndDate: string;
  provinceId: string;
  provinceName: string;
  cityId: string;
  cityName: string;
  venueAddress: string;
  venueMapsUrl: string | null;
  thumbnailImage: string;
  coverImages: string[];
  videoUrl: string | null;
  scheduledPublishStart: string | null;
  scheduledPublishEnd: string | null;
  ticketTypes: EventTicketType[];
}

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function formatDatetimeLocal(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function UpdateEventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const eventId = searchParams.get("id");

  const [isLoadingDetail, setIsLoadingDetail] = useState(true);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("MUSIC");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [provinceId, setProvinceId] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [cityId, setCityId] = useState("");
  const [cityName, setCityName] = useState("");
  const [provincesList, setProvincesList] = useState<RegionOption[]>([]);
  const [citiesList, setCitiesList] = useState<RegionOption[]>([]);

  const [venueAddress, setVenueAddress] = useState("");
  const [venueMapsUrl, setVenueMapsUrl] = useState("");

  const [existingThumbnail, setExistingThumbnail] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");

  const [existingCovers, setExistingCovers] = useState<string[]>([]);
  const [newCoverFiles, setNewCoverFiles] = useState<File[]>([]);
  const [newCoverPreviews, setNewCoverPreviews] = useState<string[]>([]);

  const [videoUrl, setVideoUrl] = useState("");

  const [totalTicket, setTotalTicket] = useState<number>(0);

  const [vipTicketId, setVipTicketId] = useState<string | null>(null);
  const [isVipEnabled, setIsVipEnabled] = useState(false);
  const [vipQuota, setVipQuota] = useState<number>(0);
  const [vipPrice, setVipPrice] = useState<number>(0);
  const [vipAnchorPrice, setVipAnchorPrice] = useState<number>(0);

  const [regularTicketId, setRegularTicketId] = useState<string | null>(null);
  const [isRegularEnabled, setIsRegularEnabled] = useState(false);
  const [regularQuota, setRegularQuota] = useState<number>(0);
  const [regularPrice, setRegularPrice] = useState<number>(0);
  const [regularAnchorPrice, setRegularAnchorPrice] = useState<number>(0);

  const [presaleTicketId, setPresaleTicketId] = useState<string | null>(null);
  const [isPresaleEnabled, setIsPresaleEnabled] = useState(false);
  const [presaleQuota, setPresaleQuota] = useState<number>(0);
  const [presalePrice, setPresalePrice] = useState<number>(0);
  const [presaleAnchorPrice, setPresaleAnchorPrice] = useState<number>(0);
  const [presaleStartDate, setPresaleStartDate] = useState("");
  const [presaleEndDate, setPresaleEndDate] = useState("");

  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isTierLocked = totalTicket <= 0;

  const activeVipQuota = !isTierLocked && isVipEnabled ? vipQuota : 0;
  const activeRegularQuota = !isTierLocked && isRegularEnabled ? regularQuota : 0;
  const activePresaleQuota = !isTierLocked && isPresaleEnabled ? presaleQuota : 0;

  const allocatedQuota = activeVipQuota + activeRegularQuota + activePresaleQuota;
  const remainingQuota = totalTicket - allocatedQuota;

  useEffect(() => {
    fetch("https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json")
      .then((res) => res.json())
      .then((data: RegionOption[]) => setProvincesList(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!provinceId) {
      setCitiesList([]);
      return;
    }
    fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`)
      .then((res) => res.json())
      .then((data: RegionOption[]) => setCitiesList(data))
      .catch(() => {});
  }, [provinceId]);

  const loadEventDetail = useCallback(async () => {
    if (!eventId) {
      setErrorMessage("Event ID not found in URL query.");
      setIsLoadingDetail(false);
      return;
    }

    try {
      setIsLoadingDetail(true);
      const evt = await apiFetch<EventDetailResponse>(`/events/${eventId}`);

      setTitle(evt.title || "");
      setCategory(evt.category || "MUSIC");
      setDescription(evt.description || "");
      setStartDate(formatDatetimeLocal(evt.eventStartDate));
      setEndDate(formatDatetimeLocal(evt.eventEndDate));

      setProvinceId(evt.provinceId || "");
      setProvinceName(evt.provinceName || "");
      setCityId(evt.cityId || "");
      setCityName(evt.cityName || "");

      setVenueAddress(evt.venueAddress || "");
      setVenueMapsUrl(evt.venueMapsUrl || "");

      setExistingThumbnail(evt.thumbnailImage || "");
      setExistingCovers(evt.coverImages || []);
      setVideoUrl(evt.videoUrl || "");

      const tiers = evt.ticketTypes || [];
      const sumQuota = tiers.reduce((sum, t) => sum + (t.quota || 0), 0);
      setTotalTicket(sumQuota);

      const vip = tiers.find((t) => t.name.toUpperCase() === "VIP");
      if (vip) {
        setVipTicketId(vip.id);
        setIsVipEnabled(true);
        setVipQuota(vip.quota || 0);
        setVipPrice(vip.priceNormal || 0);
        setVipAnchorPrice(vip.priceAnchor || 0);
      }

      const regular = tiers.find((t) => t.name.toUpperCase() === "REGULAR");
      if (regular) {
        setRegularTicketId(regular.id);
        setIsRegularEnabled(true);
        setRegularQuota(regular.quota || 0);
        setRegularPrice(regular.priceNormal || 0);
        setRegularAnchorPrice(regular.priceAnchor || 0);
      }

      const presale = tiers.find((t) => t.name.toUpperCase() === "PRESALE");
      if (presale) {
        setPresaleTicketId(presale.id);
        setIsPresaleEnabled(true);
        setPresaleQuota(presale.quota || 0);
        setPresalePrice(presale.priceNormal || 0);
        setPresaleAnchorPrice(presale.priceAnchor || 0);
        setPresaleStartDate(formatDatetimeLocal(presale.saleStart));
        setPresaleEndDate(formatDatetimeLocal(presale.saleEnd));
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load event details";
      setErrorMessage(message);
    } finally {
      setIsLoadingDetail(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadEventDetail();
  }, [loadEventDetail]);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  const handleCoversChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setNewCoverFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setNewCoverPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveExistingCover = (index: number) => {
    setExistingCovers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewCover = (index: number) => {
    setNewCoverFiles((prev) => prev.filter((_, i) => i !== index));
    setNewCoverPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!agreedToTerms) {
      setErrorMessage("Please agree to the Terms & Conditions before updating.");
      return;
    }

    if (!title || title.trim().length < 3) {
      setErrorMessage("Title must be at least 3 characters.");
      return;
    }

    if (!description || description.trim().length < 30) {
      setErrorMessage("Description must be at least 30 characters long.");
      return;
    }

    if (!startDate || !endDate) {
      setErrorMessage("Please set both Start Date and End Date.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setErrorMessage("End Date cannot be earlier than Start Date.");
      return;
    }

    if (!provinceId || !cityId || !venueAddress || venueAddress.trim().length < 5) {
      setErrorMessage("Please complete Location and Venue Address (min. 5 chars).");
      return;
    }

    const totalCoversCount = existingCovers.length + newCoverFiles.length;
    if (totalCoversCount === 0) {
      setErrorMessage("Cover Images are mandatory. Please provide at least 1 cover banner.");
      return;
    }

    if (totalTicket <= 0) {
      setErrorMessage("Total ticket amount must be greater than 0.");
      return;
    }

    if (remainingQuota !== 0) {
      setErrorMessage(
        `Ticket quota allocation mismatch! Remaining: ${remainingQuota} tickets. Total active tickets must equal ${totalTicket}.`,
      );
      return;
    }

    try {
      setIsSubmitting(true);

      let finalThumbnailUrl = existingThumbnail;
      if (thumbnailFile) {
        finalThumbnailUrl = await uploadToCloudinary(thumbnailFile, "chistix/thumbnails");
      }

      let uploadedNewCovers: string[] = [];
      if (newCoverFiles.length > 0) {
        uploadedNewCovers = await Promise.all(
          newCoverFiles.map((file) => uploadToCloudinary(file, "chistix/covers")),
        );
      }
      const finalCoverUrls = [...existingCovers, ...uploadedNewCovers];

      const updatePayload = {
        title,
        category,
        description,
        eventStartDate: new Date(startDate).toISOString(),
        eventEndDate: new Date(endDate).toISOString(),
        provinceId,
        provinceName,
        cityId,
        cityName,
        venueAddress,
        venueMapsUrl: venueMapsUrl.trim() || undefined,
        thumbnailImage: finalThumbnailUrl,
        coverImages: finalCoverUrls,
        videoUrl: videoUrl.trim() || undefined,
      };

      await apiFetch(`/organizers/my-events/${eventId}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(updatePayload),
      });

      if (isVipEnabled && vipQuota > 0) {
        const vipBody = {
          name: "VIP",
          priceNormal: Number(vipPrice),
          priceAnchor: vipAnchorPrice > vipPrice ? Number(vipAnchorPrice) : undefined,
          quota: Number(vipQuota),
          saleStart: new Date(startDate).toISOString(),
          saleEnd: new Date(endDate).toISOString(),
        };

        if (vipTicketId) {
          await apiFetch(`/events/${eventId}/ticket-types/${vipTicketId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(vipBody),
          }).catch(() => {});
        } else {
          await apiFetch(`/events/${eventId}/ticket-types`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(vipBody),
          }).catch(() => {});
        }
      }

      if (isRegularEnabled && regularQuota > 0) {
        const regBody = {
          name: "Regular",
          priceNormal: Number(regularPrice),
          priceAnchor: regularAnchorPrice > regularPrice ? Number(regularAnchorPrice) : undefined,
          quota: Number(regularQuota),
          saleStart: new Date(startDate).toISOString(),
          saleEnd: new Date(endDate).toISOString(),
        };

        if (regularTicketId) {
          await apiFetch(`/events/${eventId}/ticket-types/${regularTicketId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(regBody),
          }).catch(() => {});
        } else {
          await apiFetch(`/events/${eventId}/ticket-types`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(regBody),
          }).catch(() => {});
        }
      }

      if (isPresaleEnabled && presaleQuota > 0) {
        const presaleBody = {
          name: "Presale",
          priceNormal: Number(presalePrice),
          priceAnchor: presaleAnchorPrice > presalePrice ? Number(presaleAnchorPrice) : undefined,
          quota: Number(presaleQuota),
          saleStart: new Date(presaleStartDate || startDate).toISOString(),
          saleEnd: new Date(presaleEndDate || endDate).toISOString(),
        };

        if (presaleTicketId) {
          await apiFetch(`/events/${eventId}/ticket-types/${presaleTicketId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(presaleBody),
          }).catch(() => {});
        } else {
          await apiFetch(`/events/${eventId}/ticket-types`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(presaleBody),
          }).catch(() => {});
        }
      }

      router.push("/dashboard/events");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update event";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingDetail) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center text-sm text-neutral-400">
        Loading event details...
      </div>
    );
  }

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
          href="/dashboard/events"
          className="hover:text-[#BB4D00] transition-colors font-medium"
        >
          Events
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-900 font-semibold">Edit Event</span>
      </nav>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs p-6 md:p-8">
        <div className="pb-4 border-b border-neutral-100 mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900">
            Edit Event
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Update your event details, banners, and ticket allocations
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
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
            >
              <option value="MUSIC">Music</option>
              <option value="SEMINAR">Seminar</option>
              <option value="TALKSHOW">Talkshow</option>
              <option value="ARTS_THEATRE">Arts & Theatre</option>
              <option value="SPORTS">Sports</option>
              <option value="COMMUNITY">Community</option>
              <option value="EXHIBITION">Exhibition</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Schedule <span className="text-red-500">*</span>
            </label>
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-neutral-400 block mb-1">
                  Start Date & Time <span className="text-red-500">*</span>
                </span>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                  required
                />
              </div>
              <div>
                <span className="text-xs text-neutral-400 block mb-1">
                  End Date & Time <span className="text-red-500">*</span>
                </span>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Province <span className="text-red-500">*</span>
            </label>
            <select
              value={provinceId}
              onChange={(e) => {
                const selectedId = e.target.value;
                const found = provincesList.find((p) => p.id === selectedId);
                setProvinceId(selectedId);
                setProvinceName(found?.name || "");
                setCityId("");
                setCityName("");
              }}
              className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 cursor-pointer"
              required
            >
              <option value="">Select Province</option>
              {provincesList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              City / Regency <span className="text-red-500">*</span>
            </label>
            <select
              value={cityId}
              onChange={(e) => {
                const selectedId = e.target.value;
                const found = citiesList.find((c) => c.id === selectedId);
                setCityId(selectedId);
                setCityName(found?.name || "");
              }}
              disabled={!provinceId}
              className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 disabled:opacity-50 cursor-pointer"
              required
            >
              <option value="">Select City / Regency</option>
              {citiesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Venue Address <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Google Maps URL <span className="text-xs text-neutral-400 font-normal">(Optional)</span>
            </label>
            <input
              type="url"
              value={venueMapsUrl}
              onChange={(e) => setVenueMapsUrl(e.target.value)}
              className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Thumbnail Image <span className="text-red-500">*</span>
            </label>
            <div className="sm:col-span-2 space-y-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 hover:border-[#BB4D00] rounded-xl p-4 cursor-pointer bg-neutral-50/50 transition-colors">
                <PhotoIcon className="w-8 h-8 text-neutral-400 mb-1" />
                <span className="text-xs font-semibold text-neutral-700">Change Thumbnail Image</span>
                <span className="text-[11px] text-neutral-400 mt-0.5">Upload only if you want to replace</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
              </label>

              {(thumbnailPreview || existingThumbnail) && (
                <div className="relative w-36 h-24 rounded-lg overflow-hidden border border-neutral-200">
                  <Image
                    src={thumbnailPreview || existingThumbnail}
                    alt="Thumbnail preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Cover Images <span className="text-red-500">*</span>
              <span className="block text-xs font-normal text-neutral-400">At least 1 cover banner</span>
            </label>
            <div className="sm:col-span-2 space-y-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 hover:border-[#BB4D00] rounded-xl p-4 cursor-pointer bg-neutral-50/50 transition-colors">
                <PhotoIcon className="w-8 h-8 text-neutral-400 mb-1" />
                <span className="text-xs font-semibold text-neutral-700">Add More Cover Banners</span>
                <span className="text-[11px] text-neutral-400 mt-0.5">Select additional banners</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleCoversChange}
                  className="hidden"
                />
              </label>

              {(existingCovers.length > 0 || newCoverPreviews.length > 0) && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {existingCovers.map((url, idx) => (
                    <div
                      key={`existing-${idx}`}
                      className="relative h-20 rounded-lg overflow-hidden border border-neutral-200 group"
                    >
                      <Image
                        src={url}
                        alt={`Existing Cover ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingCover(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                        title="Delete cover"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {newCoverPreviews.map((preview, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="relative h-20 rounded-lg overflow-hidden border border-amber-300 group"
                    >
                      <Image
                        src={preview}
                        alt={`New Cover ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewCover(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                        title="Delete new cover"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Video URL <span className="text-xs text-neutral-400 font-normal">(Optional)</span>
            </label>
            <input
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="sm:col-span-2 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50"
            />
          </div>

          <div className="border-t border-neutral-100 pt-4" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-center">
            <label className="text-sm font-medium text-neutral-700">
              Total Ticket Amount <span className="text-red-500">*</span>
            </label>
            <div className="sm:col-span-2 flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={totalTicket || ""}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setTotalTicket(val);
                }}
                className="w-36 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 font-bold"
                required
              />
              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                  totalTicket === 0
                    ? "bg-neutral-100 text-neutral-500"
                    : remainingQuota === 0
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : remainingQuota < 0
                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                }`}
              >
                {totalTicket === 0
                  ? "Enter total ticket amount first"
                  : remainingQuota === 0
                    ? "Quota fully allocated!"
                    : remainingQuota < 0
                      ? `Exceeded by ${Math.abs(remainingQuota)} tickets!`
                      : `Remaining quota: ${remainingQuota} tickets`}
              </span>
            </div>
          </div>

          <div className={`space-y-4 pt-2 transition-opacity ${isTierLocked ? "opacity-50 pointer-events-none" : ""}`}>
            {isTierLocked && (
              <p className="text-xs text-amber-600 font-medium">
                Please enter the Total Ticket Amount above to configure ticket tiers.
              </p>
            )}

            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-neutral-800">VIP Ticket</span>
                  <p className="text-xs text-neutral-400">Enable if this event offers VIP tier</p>
                </div>
                <button
                  type="button"
                  disabled={isTierLocked}
                  onClick={() => setIsVipEnabled(!isVipEnabled)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    isVipEnabled ? "bg-[#EA580C]" : "bg-neutral-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isVipEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {isVipEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-200">
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Quota</label>
                    <input
                      type="number"
                      min={1}
                      value={vipQuota || ""}
                      onChange={(e) => setVipQuota(Number(e.target.value))}
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white"
                      required={isVipEnabled}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Normal Price (IDR)</label>
                    <input
                      type="number"
                      min={0}
                      value={vipPrice || ""}
                      onChange={(e) => setVipPrice(Number(e.target.value))}
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white"
                      required={isVipEnabled}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Original Price (Anchor, Optional)</label>
                    <input
                      type="number"
                      min={0}
                      value={vipAnchorPrice || ""}
                      onChange={(e) => setVipAnchorPrice(Number(e.target.value))}
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-neutral-800">Regular Ticket</span>
                  <p className="text-xs text-neutral-400">Enable if this event offers Regular tier</p>
                </div>
                <button
                  type="button"
                  disabled={isTierLocked}
                  onClick={() => setIsRegularEnabled(!isRegularEnabled)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    isRegularEnabled ? "bg-[#EA580C]" : "bg-neutral-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isRegularEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {isRegularEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-200">
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Quota</label>
                    <input
                      type="number"
                      min={1}
                      value={regularQuota || ""}
                      onChange={(e) => setRegularQuota(Number(e.target.value))}
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white"
                      required={isRegularEnabled}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Normal Price (IDR)</label>
                    <input
                      type="number"
                      min={0}
                      value={regularPrice || ""}
                      onChange={(e) => setRegularPrice(Number(e.target.value))}
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white"
                      required={isRegularEnabled}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-500 block mb-1">Original Price (Anchor, Optional)</label>
                    <input
                      type="number"
                      min={0}
                      value={regularAnchorPrice || ""}
                      onChange={(e) => setRegularAnchorPrice(Number(e.target.value))}
                      className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-neutral-800">Presale Ticket</span>
                  <p className="text-xs text-neutral-400">Enable if this event offers early bird / presale pricing</p>
                </div>
                <button
                  type="button"
                  disabled={isTierLocked}
                  onClick={() => setIsPresaleEnabled(!isPresaleEnabled)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    isPresaleEnabled ? "bg-[#EA580C]" : "bg-neutral-300"
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      isPresaleEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {isPresaleEnabled && (
                <div className="space-y-3 pt-3 border-t border-neutral-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Quota</label>
                      <input
                        type="number"
                        min={1}
                        value={presaleQuota || ""}
                        onChange={(e) => setPresaleQuota(Number(e.target.value))}
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white"
                        required={isPresaleEnabled}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Presale Price (IDR)</label>
                      <input
                        type="number"
                        min={0}
                        value={presalePrice || ""}
                        onChange={(e) => setPresalePrice(Number(e.target.value))}
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white"
                        required={isPresaleEnabled}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Original Price (Anchor, Optional)</label>
                      <input
                        type="number"
                        min={0}
                        value={presaleAnchorPrice || ""}
                        onChange={(e) => setPresaleAnchorPrice(Number(e.target.value))}
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Presale Start Date</label>
                      <input
                        type="datetime-local"
                        value={presaleStartDate}
                        onChange={(e) => setPresaleStartDate(e.target.value)}
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-xs bg-white"
                        required={isPresaleEnabled}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-500 block mb-1">Presale End Date</label>
                      <input
                        type="datetime-local"
                        value={presaleEndDate}
                        onChange={(e) => setPresaleEndDate(e.target.value)}
                        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-xs bg-white"
                        required={isPresaleEnabled}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-600">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 text-[#EA580C] rounded border-neutral-300 focus:ring-[#BB4D00]"
              />
              <span>I confirm that all updated event information is accurate.</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
            <Link
              href="/dashboard/events"
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-neutral-600 border border-neutral-200 hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#BB4D00] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Saving Changes..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UpdateEventsPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center text-sm text-neutral-400">
          Loading page...
        </div>
      }
    >
      <UpdateEventsContent />
    </Suspense>
  );
}