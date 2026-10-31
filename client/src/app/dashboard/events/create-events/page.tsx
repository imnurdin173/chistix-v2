"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, HomeIcon, PhotoIcon, TrashIcon } from "@heroicons/react/24/outline";
import { apiFetch } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface RegionOption {
  id: string;
  name: string;
}

function getAuthHeaders(): HeadersInit {
  const token =
    typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function CreateEventsPage() {
  const router = useRouter();

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

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");

  const [coverFiles, setCoverFiles] = useState<File[]>([]);
  const [coverPreviews, setCoverPreviews] = useState<string[]>([]);

  const [videoUrl, setVideoUrl] = useState("");

  const [totalTicket, setTotalTicket] = useState<number>(0);

  const [isVipEnabled, setIsVipEnabled] = useState(true);
  const [vipQuota, setVipQuota] = useState<number>(0);
  const [vipPrice, setVipPrice] = useState<number>(0);
  const [vipAnchorPrice, setVipAnchorPrice] = useState<number>(0);

  const [isRegularEnabled, setIsRegularEnabled] = useState(true);
  const [regularQuota, setRegularQuota] = useState<number>(0);
  const [regularPrice, setRegularPrice] = useState<number>(0);
  const [regularAnchorPrice, setRegularAnchorPrice] = useState<number>(0);

  const [isPresaleEnabled, setIsPresaleEnabled] = useState(false);
  const [presaleQuota, setPresaleQuota] = useState<number>(0);
  const [presalePrice, setPresalePrice] = useState<number>(0);
  const [presaleAnchorPrice, setPresaleAnchorPrice] = useState<number>(0);
  const [presaleStartDate, setPresaleStartDate] = useState("");
  const [presaleEndDate, setPresaleEndDate] = useState("");

  const [agreedToTerms, setAgreedToTerms] = useState(false);
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
    fetch(
      `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`,
    )
      .then((res) => res.json())
      .then((data: RegionOption[]) => setCitiesList(data))
      .catch(() => {});
  }, [provinceId]);

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
      setCoverFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((file) => URL.createObjectURL(file));
      setCoverPreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveCover = (index: number) => {
    setCoverFiles((prev) => prev.filter((_, i) => i !== index));
    setCoverPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async (targetStatus: "DRAFT" | "PUBLISHED") => {
    setErrorMessage(null);

    if (targetStatus === "PUBLISHED" && !agreedToTerms) {
      setErrorMessage("Please agree to the Terms & Conditions before publishing.");
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
      setErrorMessage("Please complete the Location and Venue Address (min. 5 chars).");
      return;
    }

    if (!thumbnailFile && !thumbnailPreview) {
      setErrorMessage("Thumbnail Image is required. Please upload an image file.");
      return;
    }

    if (coverFiles.length === 0 && coverPreviews.length === 0) {
      setErrorMessage("Cover Images are mandatory. Please upload at least 1 cover banner.");
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

      let finalThumbnailUrl = thumbnailPreview;
      if (thumbnailFile) {
        finalThumbnailUrl = await uploadToCloudinary(thumbnailFile, "chistix/thumbnails");
      }

      let finalCoverUrls: string[] = [];
      if (coverFiles.length > 0) {
        const uploads = await Promise.all(
          coverFiles.map((file) => uploadToCloudinary(file, "chistix/covers")),
        );
        finalCoverUrls = uploads;
      } else {
        finalCoverUrls = [finalThumbnailUrl];
      }

      const eventPayload = {
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
        scheduledPublishStart: isPresaleEnabled && presaleStartDate ? new Date(presaleStartDate).toISOString() : undefined,
        scheduledPublishEnd: isPresaleEnabled && presaleEndDate ? new Date(presaleEndDate).toISOString() : undefined,
      };

      const createdEvent = await apiFetch<{ id: string }>("/events", {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(eventPayload),
      });

      const eventId = createdEvent.id;

      if (isVipEnabled && vipQuota > 0) {
        await apiFetch(`/events/${eventId}/ticket-types`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: "VIP",
            priceNormal: Number(vipPrice),
            priceAnchor: vipAnchorPrice > vipPrice ? Number(vipAnchorPrice) : undefined,
            quota: Number(vipQuota),
            saleStart: new Date(startDate).toISOString(),
            saleEnd: new Date(endDate).toISOString(),
          }),
        });
      }

      if (isRegularEnabled && regularQuota > 0) {
        await apiFetch(`/events/${eventId}/ticket-types`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: "Regular",
            priceNormal: Number(regularPrice),
            priceAnchor: regularAnchorPrice > regularPrice ? Number(regularAnchorPrice) : undefined,
            quota: Number(regularQuota),
            saleStart: new Date(startDate).toISOString(),
            saleEnd: new Date(endDate).toISOString(),
          }),
        });
      }

      if (isPresaleEnabled && presaleQuota > 0) {
        await apiFetch(`/events/${eventId}/ticket-types`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            name: "Presale",
            priceNormal: Number(presalePrice),
            priceAnchor: presaleAnchorPrice > presalePrice ? Number(presaleAnchorPrice) : undefined,
            quota: Number(presaleQuota),
            saleStart: new Date(presaleStartDate || startDate).toISOString(),
            saleEnd: new Date(presaleEndDate || endDate).toISOString(),
          }),
        });
      }

      if (targetStatus === "PUBLISHED") {
        await apiFetch(`/organizers/my-events/${eventId}`, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            eventStatus: "PUBLISHED",
          }),
        });
      }

      router.push("/dashboard/events");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save event";
      setErrorMessage(message);
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
          href="/dashboard/events"
          className="hover:text-[#BB4D00] transition-colors font-medium"
        >
          Events
        </Link>
        <ChevronRightIcon className="w-3.5 h-3.5 text-neutral-300" />
        <span className="text-neutral-900 font-semibold">Create Event</span>
      </nav>

      <div className="bg-white rounded-2xl border border-neutral-100 shadow-xs p-6 md:p-8">
        <div className="pb-4 border-b border-neutral-100 mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-neutral-900">
            Create New Event
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Fill in the details below to save your event as draft or publish it directly
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-neutral-700 pt-2">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Jakarta Soundfest 2026"
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
              placeholder="Minimum 30 characters describing the event, performers, and highlights..."
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
              placeholder="e.g. GBK Senayan, Jl. Pintu Satu Senayan"
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
              placeholder="https://maps.google.com/..."
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
                <span className="text-xs font-semibold text-neutral-700">Choose Thumbnail Image</span>
                <span className="text-[11px] text-neutral-400 mt-0.5">JPG, PNG, WEBP (Max 5MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
              </label>
              {thumbnailPreview && (
                <div className="relative w-36 h-24 rounded-lg overflow-hidden border border-neutral-200">
                  <Image
                    src={thumbnailPreview}
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
                <span className="text-xs font-semibold text-neutral-700">Add Cover Images / Banner</span>
                <span className="text-[11px] text-neutral-400 mt-0.5">Select multiple banners</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleCoversChange}
                  className="hidden"
                />
              </label>

              {coverPreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {coverPreviews.map((preview, idx) => (
                    <div
                      key={idx}
                      className="relative h-20 rounded-lg overflow-hidden border border-neutral-200 group"
                    >
                      <Image
                        src={preview}
                        alt={`Cover ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCover(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                        title="Delete cover"
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
                placeholder="e.g. 500"
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
                Please enter the Total Ticket Amount above to unlock and configure ticket tiers.
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
                      placeholder="e.g. 50"
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
                      placeholder="e.g. 500000"
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
                      placeholder="e.g. 750000"
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
                      placeholder="e.g. 150"
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
                      placeholder="e.g. 250000"
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
                      placeholder="e.g. 350000"
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
                        placeholder="e.g. 100"
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
                        placeholder="e.g. 150000"
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
                        placeholder="e.g. 250000"
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
              <span>I agree to the Terms & Conditions and certify that all event information is accurate.</span>
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-neutral-100">
            <Link
              href="/dashboard/events"
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-neutral-600 border border-neutral-200 hover:bg-neutral-50 text-center transition-colors"
            >
              Cancel
            </Link>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave("DRAFT")}
              className="px-5 py-2.5 rounded-full text-sm font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Saving..." : "Save as Draft"}
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSave("PUBLISHED")}
              className="px-6 py-2.5 rounded-full text-sm font-semibold text-white bg-[#EA580C] hover:bg-[#BB4D00] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "Publishing Event..." : "Publish Event"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}