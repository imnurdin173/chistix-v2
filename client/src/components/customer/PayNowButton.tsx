"use client";

import { useEffect, useState } from "react";

// Where the Midtrans link is kept in this browser, one entry per transaction
export function paymentUrlKey(transactionId: string) {
  return `chistix-payment-${transactionId}`;
}

// Only open real Midtrans pages
function isMidtransUrl(url: string) {
  return url.startsWith("https://app.sandbox.midtrans.com/") || url.startsWith("https://app.midtrans.com/");
}

type PayNowButtonProps = {
  transactionId: string;
  // Link saved by the backend (works on any device). Empty until the backend stores it.
  serverPaymentUrl?: string | null;
};

export default function PayNowButton({ transactionId, serverPaymentUrl }: PayNowButtonProps) {
  const [browserPaymentUrl, setBrowserPaymentUrl] = useState<string | null>(null);

  useEffect(() => {
    if (serverPaymentUrl) return; // backend link is enough
    try {
      const saved = localStorage.getItem(paymentUrlKey(transactionId));
      if (saved && isMidtransUrl(saved)) setBrowserPaymentUrl(saved);
    } catch {
      // storage blocked (private mode, etc.): just hide the button
    }
  }, [transactionId, serverPaymentUrl]);

  // 1st choice: link from the backend (any device). 2nd choice: link saved in this browser.
  const paymentUrl =
    serverPaymentUrl && isMidtransUrl(serverPaymentUrl) ? serverPaymentUrl : browserPaymentUrl;

  if (!paymentUrl) return null;

  return (
    <a
      href={paymentUrl}
      className="block w-full rounded-full bg-[#EA580C] py-3 text-center text-sm font-bold text-white hover:bg-[#BB4D00]"
    >
      Pay Now
    </a>
  );
}
