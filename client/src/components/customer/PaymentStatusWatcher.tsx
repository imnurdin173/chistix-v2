"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

const CHECK_EVERY_MS = 5000; // ask the server every 5 seconds

// While the order is unpaid, keep asking the server; refresh the invoice once it changes
export default function PaymentStatusWatcher({
  transactionId,
  deadline,
}: {
  transactionId: string;
  deadline: string;
}) {
  const router = useRouter();

  useEffect(() => {
    let stopped = false;

    async function check() {
      if (stopped) return;
      try {
        const result = await apiFetch<{ status: string }>(`/payments/${transactionId}/sync`, {
          method: "POST",
        });
        if (result.status !== "WAITING_PAYMENT") {
          stopped = true;
          router.refresh(); // show PAID / EXPIRED / CANCELLED
        }
      } catch {
        // network hiccup: try again on the next round
      }
    }

    check(); // right away (e.g. just came back from Midtrans)
    const timer = setInterval(() => {
      // stop one minute after the deadline
      if (Date.now() > new Date(deadline).getTime() + 60_000) {
        clearInterval(timer);
        router.refresh();
        return;
      }
      check();
    }, CHECK_EVERY_MS);

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [transactionId, deadline, router]);

  return <p className="mt-2 text-[11px] text-amber-600">Checking your payment status automatically…</p>;
}
