"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronRightIcon,
  HomeIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { apiFetch, ApiError } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";

interface RegionOption {
  id: string;
  name: string;
}

type TierKey = "VIP" | "Regular" | "Presale";
type SaveStatus = "DRAFT" | "PUBLISHED";

interface TierForm {
  enabled: boolean;
  quota: string; // digits only, "" = empty (string so that "0" can be typed)
  price: string;
  anchorPrice: string;
}

interface ImageItem {
  id: string;
  file: File;
  preview: string;
}

// Accept both { id } and { event: { id } } from POST /events
interface CreatedEvent {
  id?: string;
  event?: { id: string };
}

const REGION_API = "https://www.emsifa.com/api-wilayah-indonesia/api";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const TIER_ORDER: TierKey[] = ["VIP", "Regular", "Presale"];

const INPUT_CLS =
  "w-full border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const digitsOnly = (v: string) => v.replace(/\D/g, "").slice(0, 12);
const toNum = (v: string) => (v === "" ? 0 : Number(v));
const toISO = (localValue: string) => new Date(localValue).toISOString();
const isValidDate = (v: string) =>
  v !== "" && !Number.isNaN(new Date(v).getTime());

function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function validateImage(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return `"${file.name}" is not a JPG, PNG, or WEBP image.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `"${file.name}" is larger than 5MB.`;
  }
  return null;
}

function describeError(err: unknown): string {
  if (err instanceof ApiError) {
    const details = err.errors
      ?.map((e) => `${e.field ?? e.path ?? "field"}: ${e.message}`)
      .join("; ");
    return details ? `${err.message} (${details})` : err.message;
  }
  return err instanceof Error ? err.message : "Failed to save event";
}

/* -------------------------------------------------------------------------- */
/*  Small reusable pieces                                                     */
/* -------------------------------------------------------------------------- */

function FormRow({
  label,
  htmlFor,
  required,
  optional,
  hint,
  center,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  optional?: boolean;
  hint?: string;
  center?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 ${
        center ? "items-center" : "items-start"
      }`}
    >
      <label
        htmlFor={htmlFor}
        className={`text-sm font-medium text-neutral-700 ${center ? "" : "pt-2"}`}
      >
        {label} {required && <span className="text-red-500">*</span>}
        {optional && (
          <span className="text-xs text-neutral-400 font-normal">
            (Optional)
          </span>
        )}
        {hint && (
          <span className="block text-xs font-normal text-neutral-400">
            {hint}
          </span>
        )}
      </label>
      {/* min-w-0 lets grid cells shrink so wide inputs never overlap each other */}
      <div className="sm:col-span-2 min-w-0">{children}</div>
    </div>
  );
}

/**
 * datetime-local that opens its calendar from ANY click on the field.
 * Chrome/Edge desktop normally open it only from the tiny calendar icon.
 */
function DateTimeField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  required,
  variant = "page",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  required?: boolean;
  variant?: "page" | "card";
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const el = ref.current;
    if (!el) return;
    // A click on the native calendar icon (right edge) is already handled by the browser
    const rect = el.getBoundingClientRect();
    if (rect.right - e.clientX < 40) return;
    try {
      el.showPicker();
    } catch {
      // Unsupported browser / blocked context: native behaviour stays as is
    }
  };

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-xs text-neutral-400 block mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        ref={ref}
        id={id}
        type="datetime-local"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        onClick={handleClick}
        className={`block w-full min-w-0 border border-neutral-200 px-3 py-2 text-xs cursor-pointer focus:outline-none focus:border-[#BB4D00] ${
          variant === "card"
            ? "rounded-lg bg-white"
            : "rounded-xl bg-neutral-50"
        }`}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-xs text-neutral-500 block mb-1">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(digitsOnly(e.target.value))}
        className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm bg-white"
      />
    </div>
  );
}

function TierCard({
  title,
  hint,
  tier,
  onChange,
  locked,
  priceLabel,
  placeholders,
  children,
}: {
  title: string;
  hint: string;
  tier: TierForm;
  onChange: (patch: Partial<TierForm>) => void;
  locked: boolean;
  priceLabel: string;
  placeholders: { quota: string; price: string; anchor: string };
  children?: React.ReactNode;
}) {
  return (
    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-bold text-neutral-800">{title}</span>
          <p className="text-xs text-neutral-400">{hint}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={tier.enabled}
          aria-label={`Enable ${title}`}
          disabled={locked}
          onClick={() => onChange({ enabled: !tier.enabled })}
          className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
            tier.enabled ? "bg-[#EA580C]" : "bg-neutral-300"
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
              tier.enabled ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {tier.enabled && (
        <div className="space-y-3 pt-3 border-t border-neutral-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <NumberField
              label="Quota"
              placeholder={placeholders.quota}
              value={tier.quota}
              onChange={(quota) => onChange({ quota })}
            />
            <NumberField
              label={priceLabel}
              placeholder={placeholders.price}
              value={tier.price}
              onChange={(price) => onChange({ price })}
            />
            <NumberField
              label="Original Price (Anchor, Optional)"
              placeholder={placeholders.anchor}
              value={tier.anchorPrice}
              onChange={(anchorPrice) => onChange({ anchorPrice })}
            />
          </div>
          {children}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function CreateEventsPage() {
  const router = useRouter();
  const uid = useId();
  const fid = (name: string) => `${uid}-${name}`;

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [provinceId, setProvinceId] = useState("");
  const [provinceName, setProvinceName] = useState("");
  const [cityId, setCityId] = useState("");
  const [cityName, setCityName] = useState("");
  const [provincesList, setProvincesList] = useState<RegionOption[]>([]);
  const [citiesList, setCitiesList] = useState<RegionOption[]>([]);
  const [regionError, setRegionError] = useState<string | null>(null);

  const [venueAddress, setVenueAddress] = useState("");
  const [venueMapsUrl, setVenueMapsUrl] = useState("");

  const [thumbnail, setThumbnail] = useState<ImageItem | null>(null);
  const [covers, setCovers] = useState<ImageItem[]>([]);
  const [videoUrl, setVideoUrl] = useState("");

  const [totalTicket, setTotalTicket] = useState("");
  const [tiers, setTiers] = useState<Record<TierKey, TierForm>>({
    VIP: { enabled: true, quota: "", price: "", anchorPrice: "" },
    Regular: { enabled: true, quota: "", price: "", anchorPrice: "" },
    Presale: { enabled: false, quota: "", price: "", anchorPrice: "" },
  });
  const [presaleStartDate, setPresaleStartDate] = useState("");
  const [presaleEndDate, setPresaleEndDate] = useState("");

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const errorRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);
  const nextImageId = useRef(0);
  const previewUrlsRef = useRef<Set<string>>(new Set());
  // Survive a failed save so a retry never duplicates uploads / event / tiers
  const uploadCacheRef = useRef(new Map<File, string>());
  const createdEventIdRef = useRef<string | null>(null);
  const createdTiersRef = useRef<Set<TierKey>>(new Set());

  /* ----------------------------- derived values ---------------------------- */

  const total = toNum(totalTicket);
  const isTierLocked = total <= 0;
  const allocatedQuota = TIER_ORDER.reduce(
    (sum, key) => sum + (tiers[key].enabled ? toNum(tiers[key].quota) : 0),
    0,
  );
  const remainingQuota = total - allocatedQuota;
  const cities = provinceId ? citiesList : [];

  const patchTier = (key: TierKey, patch: Partial<TierForm>) =>
    setTiers((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setDescription("");
    setStartDate("");
    setEndDate("");
    setProvinceId("");
    setProvinceName("");
    setCityId("");
    setCityName("");
    setVenueAddress("");
    setVenueMapsUrl("");
    setThumbnail(null);
    setCovers([]);
    setVideoUrl("");
    setTotalTicket("");
    setTiers({
      VIP: { enabled: true, quota: "", price: "", anchorPrice: "" },
      Regular: { enabled: true, quota: "", price: "", anchorPrice: "" },
      Presale: { enabled: false, quota: "", price: "", anchorPrice: "" },
    });
    setPresaleStartDate("");
    setPresaleEndDate("");
    // Reset Checkbox & Error
    setAgreedToTerms(false);
    setErrorMessage(null);
  };

  /* --------------------------------- effects -------------------------------- */

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${REGION_API}/provinces.json`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      })
      .then((data: RegionOption[]) => {
        setProvincesList(data);
        setRegionError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setRegionError("Failed to load provinces. Please reload the page.");
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!provinceId) return;
    const controller = new AbortController();
    fetch(`${REGION_API}/regencies/${provinceId}.json`, {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      })
      .then((data: RegionOption[]) => {
        setCitiesList(data);
        setRegionError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setRegionError(
          "Failed to load cities. Please choose the province again.",
        );
      });
    // Aborting avoids an older province response overwriting a newer one
    return () => controller.abort();
  }, [provinceId]);

  // Release blob: preview URLs when leaving the page
  useEffect(() => {
    const urls = previewUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, []);

  // The error banner is at the top but the buttons are at the bottom: bring it into view
  useEffect(() => {
    if (errorMessage) {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [errorMessage]);

  /* ------------------------------ image handling ---------------------------- */

  const makeImageItem = (file: File): ImageItem => {
    const preview = URL.createObjectURL(file);
    previewUrlsRef.current.add(preview);
    return { id: `img-${nextImageId.current++}`, file, preview };
  };

  const revokePreview = (preview: string) => {
    URL.revokeObjectURL(preview);
    previewUrlsRef.current.delete(preview);
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // lets the same file be chosen again
    if (!file) return;

    const problem = validateImage(file);
    if (problem) {
      setErrorMessage(problem);
      return;
    }
    setErrorMessage(null);
    if (thumbnail) revokePreview(thumbnail.preview);
    setThumbnail(makeImageItem(file));
  };

  const handleCoversChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // lets the same file be chosen again (e.g. after deleting it)
    if (files.length === 0) return;

    const accepted: File[] = [];
    for (const file of files) {
      const problem = validateImage(file);
      if (problem) {
        setErrorMessage(problem);
      } else {
        accepted.push(file);
      }
    }
    if (accepted.length === 0) return;
    if (accepted.length === files.length) setErrorMessage(null);
    setCovers((prev) => [...prev, ...accepted.map(makeImageItem)]);
  };

  const handleRemoveCover = (id: string) => {
    const target = covers.find((c) => c.id === id);
    if (target) revokePreview(target.preview);
    setCovers((prev) => prev.filter((c) => c.id !== id));
  };

  /* -------------------------------- validation ------------------------------ */

  const validate = (status: SaveStatus): string | null => {
    if (status === "PUBLISHED" && !agreedToTerms) {
      return "Please agree to the Terms & Conditions before publishing.";
    }
    if (title.trim().length < 3) return "Title must be at least 3 characters.";
    if (description.trim().length < 30) {
      return "Description must be at least 30 characters long.";
    }
    if (!startDate || !endDate)
      return "Please set both Start Date and End Date.";
    if (!isValidDate(startDate) || !isValidDate(endDate)) {
      return "Start Date or End Date is not a valid date.";
    }
    if (new Date(endDate) < new Date(startDate)) {
      return "End Date cannot be earlier than Start Date.";
    }
    if (!provinceId || !cityId || venueAddress.trim().length < 5) {
      return "Please complete the Location and Venue Address (min. 5 chars).";
    }
    if (venueMapsUrl.trim() && !isHttpUrl(venueMapsUrl.trim())) {
      return "Google Maps URL must start with http:// or https://.";
    }
    if (videoUrl.trim() && !isHttpUrl(videoUrl.trim())) {
      return "Video URL must start with http:// or https://.";
    }
    if (!thumbnail) {
      return "Thumbnail Image is required. Please upload an image file.";
    }
    if (covers.length === 0) {
      return "Cover Images are mandatory. Please upload at least 1 cover banner.";
    }
    if (total <= 0) return "Total ticket amount must be greater than 0.";

    for (const key of TIER_ORDER) {
      const t = tiers[key];
      if (!t.enabled) continue;
      if (toNum(t.quota) < 1) {
        return `${key}: quota must be at least 1 (or turn this tier off).`;
      }
      if (t.price === "") {
        return `${key}: please enter a price (use 0 for a free ticket).`;
      }
      if (t.anchorPrice !== "" && toNum(t.anchorPrice) <= toNum(t.price)) {
        return `${key}: the original (anchor) price must be higher than the normal price.`;
      }
    }

    if (tiers.Presale.enabled) {
      if (!isValidDate(presaleStartDate) || !isValidDate(presaleEndDate)) {
        return "Presale: please set a valid start and end date.";
      }
      if (new Date(presaleEndDate) <= new Date(presaleStartDate)) {
        return "Presale End Date must be later than Presale Start Date.";
      }
      if (new Date(presaleEndDate) > new Date(endDate)) {
        return "Presale cannot end after the event ends.";
      }
    }

    if (remainingQuota !== 0) {
      return `Ticket quota allocation mismatch! Remaining: ${remainingQuota} tickets. Total active tickets must equal ${total}.`;
    }
    return null;
  };

  /* ---------------------------------- save ---------------------------------- */

  const handleSave = async (status: SaveStatus) => {
    if (submittingRef.current) return;
    setErrorMessage(null);

    const problem = validate(status);
    if (problem) {
      setErrorMessage(problem);
      return;
    }
    if (!thumbnail) return; // already guaranteed by validate(); narrows the type

    submittingRef.current = true;
    setIsSubmitting(true);

    try {
      const uploadOnce = async (file: File, folder: string) => {
        const cached = uploadCacheRef.current.get(file);
        if (cached) return cached;
        const url = await uploadToCloudinary(file, folder);
        uploadCacheRef.current.set(file, url);
        return url;
      };

      // 1. Create the event once (a retry reuses the id instead of making a duplicate)
      let eventId = createdEventIdRef.current;
      if (!eventId) {
        const thumbnailImage = await uploadOnce(
          thumbnail.file,
          "chistix/thumbnails",
        );
        const coverImages = await Promise.all(
          covers.map((c) => uploadOnce(c.file, "chistix/covers")),
        );

        const created = await apiFetch<CreatedEvent>("/events", {
          method: "POST",
          body: JSON.stringify({
            title: title.trim(),
            category,
            description: description.trim(),
            eventStartDate: toISO(startDate),
            eventEndDate: toISO(endDate),
            provinceId,
            provinceName,
            cityId,
            cityName,
            venueAddress: venueAddress.trim(),
            venueMapsUrl: venueMapsUrl.trim() || undefined,
            thumbnailImage,
            coverImages,
            videoUrl: videoUrl.trim() || undefined,
            scheduledPublishStart: tiers.Presale.enabled
              ? toISO(presaleStartDate)
              : undefined,
            scheduledPublishEnd: tiers.Presale.enabled
              ? toISO(presaleEndDate)
              : undefined,
          }),
        });

        const newId = created?.id ?? created?.event?.id;
        if (!newId)
          throw new Error("The server did not return the new event ID.");
        createdEventIdRef.current = newId;
        eventId = newId;
      }

      // 2. Ticket tiers, one by one; tiers that already succeeded are skipped on retry
      for (const key of TIER_ORDER) {
        const t = tiers[key];
        const quota = toNum(t.quota);
        if (!t.enabled || quota <= 0 || createdTiersRef.current.has(key))
          continue;

        const price = toNum(t.price);
        const anchor = toNum(t.anchorPrice);
        const isPresale = key === "Presale";

        await apiFetch(`/events/${eventId}/ticket-types`, {
          method: "POST",
          body: JSON.stringify({
            name: key,
            priceNormal: price,
            priceAnchor: anchor > price ? anchor : undefined,
            quota,
            // NOTE: VIP/Regular go on sale at event start (original behaviour).
            // Confirm with the backend whether sales should open earlier.
            saleStart: toISO(isPresale ? presaleStartDate : startDate),
            saleEnd: toISO(isPresale ? presaleEndDate : endDate),
          }),
        });
        createdTiersRef.current.add(key);
      }

      // 3. Publish
      if (status === "PUBLISHED") {
        await apiFetch(`/organizers/my-events/${eventId}`, {
          method: "PUT",
          body: JSON.stringify({ eventStatus: "PUBLISHED" }),
        });
      }
      resetForm();
      router.push("/dashboard/events");
      router.refresh();
    } catch (err) {
      const base = describeError(err);
      setErrorMessage(
        createdEventIdRef.current
          ? `${base} — your event was already created as a draft. Press the button again to retry the remaining steps (changes to the fields above are not re-sent).`
          : base,
      );
    } finally {
      submittingRef.current = false;
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
            Fill in the details below to save your event as draft or publish it
            directly
          </p>
        </div>

        {errorMessage && (
          <div
            ref={errorRef}
            role="alert"
            className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {/* Validation is custom (handleSave), so native validation is switched off */}
        <form
          noValidate
          onSubmit={(e) => e.preventDefault()}
          className="space-y-6"
        >
          <FormRow label="Event Title" htmlFor={fid("title")} required>
            <input
              id={fid("title")}
              type="text"
              placeholder="e.g. Jakarta Soundfest 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={INPUT_CLS}
            />
          </FormRow>

          <FormRow label="Category" htmlFor={fid("category")} required>
            <select
              id={fid("category")}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`${INPUT_CLS} cursor-pointer`}
            >
              <option value="MUSIC">Music</option>
              <option value="SEMINAR">Seminar</option>
              <option value="TALKSHOW">Talkshow</option>
              <option value="ARTS_THEATRE">Arts &amp; Theatre</option>
              <option value="SPORTS">Sports</option>
              <option value="COMMUNITY">Community</option>
              <option value="EXHIBITION">Exhibition</option>
              <option value="OTHER">Other</option>
            </select>
          </FormRow>

          <FormRow label="Schedule" required>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <DateTimeField
                id={fid("start")}
                label="Start Date & Time"
                value={startDate}
                onChange={setStartDate}
                required
              />
              <DateTimeField
                id={fid("end")}
                label="End Date & Time"
                value={endDate}
                onChange={setEndDate}
                min={startDate || undefined}
                required
              />
            </div>
          </FormRow>

          <FormRow label="Description" htmlFor={fid("description")} required>
            <textarea
              id={fid("description")}
              rows={4}
              placeholder="Minimum 30 characters describing the event, performers, and highlights..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${INPUT_CLS} resize-none`}
            />
          </FormRow>

          <FormRow label="Province" htmlFor={fid("province")} required>
            <select
              id={fid("province")}
              value={provinceId}
              onChange={(e) => {
                const selectedId = e.target.value;
                const found = provincesList.find((p) => p.id === selectedId);
                setProvinceId(selectedId);
                setProvinceName(found?.name || "");
                setCityId("");
                setCityName("");
                setCitiesList([]);
              }}
              className={`${INPUT_CLS} cursor-pointer`}
            >
              <option value="">Select Province</option>
              {provincesList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {regionError && (
              <p className="mt-1 text-xs text-red-600">{regionError}</p>
            )}
          </FormRow>

          <FormRow label="City / Regency" htmlFor={fid("city")} required>
            <select
              id={fid("city")}
              value={cityId}
              onChange={(e) => {
                const selectedId = e.target.value;
                const found = cities.find((c) => c.id === selectedId);
                setCityId(selectedId);
                setCityName(found?.name || "");
              }}
              disabled={!provinceId}
              className={`${INPUT_CLS} disabled:opacity-50 cursor-pointer`}
            >
              <option value="">Select City / Regency</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FormRow>

          <FormRow label="Venue Address" htmlFor={fid("venue")} required>
            <input
              id={fid("venue")}
              type="text"
              placeholder="e.g. GBK Senayan, Jl. Pintu Satu Senayan"
              value={venueAddress}
              onChange={(e) => setVenueAddress(e.target.value)}
              className={INPUT_CLS}
            />
          </FormRow>

          <FormRow label="Google Maps URL" htmlFor={fid("maps")} optional>
            <input
              id={fid("maps")}
              type="url"
              placeholder="https://maps.google.com/..."
              value={venueMapsUrl}
              onChange={(e) => setVenueMapsUrl(e.target.value)}
              className={INPUT_CLS}
            />
          </FormRow>

          <FormRow label="Thumbnail Image" required>
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 hover:border-[#BB4D00] rounded-xl p-4 cursor-pointer bg-neutral-50/50 transition-colors">
                <PhotoIcon className="w-8 h-8 text-neutral-400 mb-1" />
                <span className="text-xs font-semibold text-neutral-700">
                  Choose Thumbnail Image
                </span>
                <span className="text-[11px] text-neutral-400 mt-0.5">
                  JPG, PNG, WEBP (Max 5MB)
                </span>
                <input
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(",")}
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
              </label>
              {thumbnail && (
                <div className="relative w-36 h-24 rounded-lg overflow-hidden border border-neutral-200">
                  <Image
                    src={thumbnail.preview}
                    alt="Thumbnail preview"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
            </div>
          </FormRow>

          <FormRow label="Cover Images" hint="At least 1 cover banner" required>
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-neutral-200 hover:border-[#BB4D00] rounded-xl p-4 cursor-pointer bg-neutral-50/50 transition-colors">
                <PhotoIcon className="w-8 h-8 text-neutral-400 mb-1" />
                <span className="text-xs font-semibold text-neutral-700">
                  Add Cover Images / Banner
                </span>
                <span className="text-[11px] text-neutral-400 mt-0.5">
                  Select multiple banners (JPG, PNG, WEBP, max 5MB each)
                </span>
                <input
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(",")}
                  multiple
                  onChange={handleCoversChange}
                  className="hidden"
                />
              </label>

              {covers.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {covers.map((cover, idx) => (
                    <div
                      key={cover.id}
                      className="relative h-20 rounded-lg overflow-hidden border border-neutral-200 group"
                    >
                      <Image
                        src={cover.preview}
                        alt={`Cover ${idx + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCover(cover.id)}
                        className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full hover:bg-red-600 transition-colors cursor-pointer"
                        title="Delete cover"
                        aria-label={`Delete cover ${idx + 1}`}
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormRow>

          <FormRow label="Video URL" htmlFor={fid("video")} optional>
            <input
              id={fid("video")}
              type="url"
              placeholder="https://youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className={INPUT_CLS}
            />
          </FormRow>

          <div className="border-t border-neutral-100 pt-4" />

          <FormRow
            label="Total Ticket Amount"
            htmlFor={fid("total")}
            required
            center
          >
            <div className="flex items-center gap-3">
              <input
                id={fid("total")}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="e.g. 500"
                value={totalTicket}
                onChange={(e) => setTotalTicket(digitsOnly(e.target.value))}
                className="w-36 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#BB4D00] bg-neutral-50 font-bold"
              />
              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                  total === 0
                    ? "bg-neutral-100 text-neutral-500"
                    : remainingQuota === 0
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                      : remainingQuota < 0
                        ? "bg-rose-100 text-rose-700 border border-rose-200"
                        : "bg-amber-100 text-amber-700 border border-amber-200"
                }`}
              >
                {total === 0
                  ? "Enter total ticket amount first"
                  : remainingQuota === 0
                    ? "Quota fully allocated!"
                    : remainingQuota < 0
                      ? `Exceeded by ${Math.abs(remainingQuota)} tickets!`
                      : `Remaining quota: ${remainingQuota} tickets`}
              </span>
            </div>
          </FormRow>

          {/* inert = not clickable AND not reachable with the keyboard while locked */}
          <div
            inert={isTierLocked}
            className={`space-y-4 pt-2 transition-opacity ${
              isTierLocked ? "opacity-50" : ""
            }`}
          >
            {isTierLocked && (
              <p className="text-xs text-amber-600 font-medium">
                Please enter the Total Ticket Amount above to unlock and
                configure ticket tiers.
              </p>
            )}

            <TierCard
              title="VIP Ticket"
              hint="Enable if this event offers VIP tier"
              tier={tiers.VIP}
              onChange={(patch) => patchTier("VIP", patch)}
              locked={isTierLocked}
              priceLabel="Normal Price (IDR)"
              placeholders={{
                quota: "e.g. 50",
                price: "e.g. 500000",
                anchor: "e.g. 750000",
              }}
            />

            <TierCard
              title="Regular Ticket"
              hint="Enable if this event offers Regular tier"
              tier={tiers.Regular}
              onChange={(patch) => patchTier("Regular", patch)}
              locked={isTierLocked}
              priceLabel="Normal Price (IDR)"
              placeholders={{
                quota: "e.g. 150",
                price: "e.g. 250000",
                anchor: "e.g. 350000",
              }}
            />

            <TierCard
              title="Presale Ticket"
              hint="Enable if this event offers early bird / presale pricing"
              tier={tiers.Presale}
              onChange={(patch) => patchTier("Presale", patch)}
              locked={isTierLocked}
              priceLabel="Presale Price (IDR)"
              placeholders={{
                quota: "e.g. 100",
                price: "e.g. 150000",
                anchor: "e.g. 250000",
              }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DateTimeField
                  id={fid("presale-start")}
                  label="Presale Start Date"
                  variant="card"
                  value={presaleStartDate}
                  onChange={setPresaleStartDate}
                  max={presaleEndDate || endDate || undefined}
                />
                <DateTimeField
                  id={fid("presale-end")}
                  label="Presale End Date"
                  variant="card"
                  value={presaleEndDate}
                  onChange={setPresaleEndDate}
                  min={presaleStartDate || undefined}
                  max={endDate || undefined}
                />
              </div>
            </TierCard>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-600">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-4 h-4 text-[#EA580C] rounded border-neutral-300 focus:ring-[#BB4D00]"
              />
              <span>
                I agree to the Terms &amp; Conditions and certify that all event
                information is accurate.
              </span>
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
