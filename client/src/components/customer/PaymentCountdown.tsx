"use client";

import { useEffect, useState } from "react";

function formatLeft(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

export default function PaymentCountdown({ deadline }: { deadline: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const left = Math.max(0, new Date(deadline).getTime() - now);

  return (
    <span suppressHydrationWarning className="font-mono font-bold text-red-500">
      {left === 0 ? "Expired" : formatLeft(left)}
    </span>
  );
}