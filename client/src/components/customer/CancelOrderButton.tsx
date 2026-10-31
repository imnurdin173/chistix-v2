"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmDialog from "@/components/ui/confirmDialog";
import { apiFetch, ApiError } from "@/lib/api";

type CancelOrderButtonProps = {
  transactionId: string;
  eventTitle: string;
};

export default function CancelOrderButton({ transactionId, eventTitle }: CancelOrderButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function openDialog() {
    setError("");
    setIsOpen(true);
  }

  async function handleConfirm() {
    setIsLoading(true);
    setError("");
    try {
      await apiFetch(`/transactions/${transactionId}/cancel`, { method: "POST" });
      setIsOpen(false);
      router.refresh(); // re-run the server page so the list shows the new status
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("This order can no longer be cancelled. It may already be paid, expired, or cancelled.");
      } else if (err instanceof ApiError && err.status === 401) {
        setError("Your session has ended. Please log in again.");
      } else {
        setError("Failed to cancel the order. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={openDialog} className="text-xs font-semibold text-red-600 hover:underline">
        Cancel Order
      </button>

      <ConfirmDialog
        open={isOpen}
        title="Cancel this order?"
        message={`Your order for "${eventTitle}" will be cancelled and the reserved tickets will be released. This cannot be undone.`}
        confirmLabel="Yes, cancel order"
        cancelLabel="Keep order"
        loading={isLoading}
        error={error}
        onConfirm={handleConfirm}
        onCancel={() => setIsOpen(false)}
      />
    </>
  );
}