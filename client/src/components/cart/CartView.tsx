"use client";

import { useState } from "react";
import CartItemCard from "./CartItemCard";
import VoucherSection from "./VoucherSection";
import PointSection from "./PointSection";
import OrderSummary from "./OrderSummary";
import PaymentSection from "./PaymentSection";
import { POINT_TO_RUPIAH } from "@/lib/constants";
import type { CartTicket } from "@/types/cart";

type CartViewProps = {
  ticket: CartTicket;
  initialQuantity: number;
  pointBalance: number | null; // null = unknown (user not logged in yet)
};

export default function CartView({ ticket, initialQuantity, pointBalance }: CartViewProps) {
  // ----- STATE -----
  const [quantity, setQuantity] = useState(initialQuantity);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [isUsingPoints, setIsUsingPoints] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [checkoutPreview, setCheckoutPreview] = useState<Record<string, unknown> | null>(null); // temporary

  // ----- DERIVED VALUES -----
  const maxQuantity = ticket.remaining;
  const subtotal = ticket.price * quantity;

  // Voucher discount is calculated by the backend at checkout (no preview endpoint yet)
  const voucherDiscount = 0;
  const afterVoucher = subtotal - voucherDiscount;

  const balance = pointBalance ?? 0;
  const maxPointsForThisOrder = Math.floor(afterVoucher / POINT_TO_RUPIAH);
  const canUsePoints = balance > 0 && maxPointsForThisOrder > 0;
  const pointsUsed = isUsingPoints && canUsePoints ? Math.min(balance, maxPointsForThisOrder) : 0;
  const pointDiscount = pointsUsed * POINT_TO_RUPIAH;

  const total = afterVoucher - pointDiscount;

  // ----- EVENT HANDLERS -----
  async function handleCheckout() {
    setIsSubmitting(true);
    setCheckoutError("");
    setCheckoutPreview(null);

    // Shape EXACTLY as the backend expects (createTransactionSchema)
    const payload = {
      ticketTypeId: ticket.ticketTypeId,
      quantity,
      voucherCode: voucherCode ?? undefined,
      pointsUsed: pointsUsed > 0 ? pointsUsed : undefined,
    };

    try {
      // TODO (after login is ready):
      // const data = await apiFetch<{ paymentUrl: string }>("/transactions", {
      //   method: "POST",
      //   body: JSON.stringify(payload),
      //   headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      // });
      // window.location.href = data.paymentUrl; // go to Midtrans page
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setCheckoutPreview({ ...payload, totalOnScreen: total });
    } catch {
      setCheckoutError("Failed to create the transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ----- VIEW -----
  return (
    <>
      <CartItemCard
        eventTitle={ticket.eventTitle}
        organizerName={ticket.organizerName}
        ticketName={ticket.ticketName}
        price={ticket.price}
        quantity={quantity}
        maxQuantity={maxQuantity}
        onQuantityChange={setQuantity}
      />

      <VoucherSection
        appliedCode={voucherCode}
        onApply={setVoucherCode}
        onRemove={() => setVoucherCode(null)}
      />

      <PointSection
        balance={pointBalance}
        isUsing={isUsingPoints}
        canUse={canUsePoints}
        pointsUsed={pointsUsed}
        pointDiscount={pointDiscount}
        onToggle={() => setIsUsingPoints(!isUsingPoints)}
      />

      <OrderSummary
        quantity={quantity}
        subtotal={subtotal}
        voucherDiscount={voucherDiscount}
        pointDiscount={pointDiscount}
        total={total}
      />

      <PaymentSection
        total={total}
        isSubmitting={isSubmitting}
        error={checkoutError}
        onCheckout={handleCheckout}
      />

      {/* TEMPORARY: shows the data that will be sent to the backend */}
      {checkoutPreview && (
        <pre className="overflow-auto rounded-xl bg-neutral-900 p-4 text-[11px] leading-relaxed text-emerald-300">
          {JSON.stringify(checkoutPreview, null, 2)}
        </pre>
      )}
    </>
  );
}