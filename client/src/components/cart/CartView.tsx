"use client";

import { useState } from "react";
import CartItemCard from "./CartItemCard";
import VoucherSection from "./VoucherSection";
import PointSection from "./PointSection";
import OrderSummary from "./OrderSummary";
import PaymentSection from "./PaymentSection";
import { apiFetch, ApiError } from "@/lib/api";
import { useAuthModal } from "@/components/providers/auth-modal-provider";
import { POINT_TO_RUPIAH } from "@/lib/constants";
import type { CartTicket } from "@/types/cart";

type CartViewProps = {
  ticket: CartTicket;
  initialQuantity: number;
  pointBalance: number | null; 
};

type CreatedTransaction = {
  id: string;
  totalPrice: number;
  paymentUrl: string;
};


function toFriendlyMessage(error: ApiError): string {
  switch (error.status) {
    case 404:
      return "The voucher code or ticket could not be found.";
    case 409:
      return "This ticket is no longer available in that quantity. Please refresh the page and try again.";
    case 502:
      return "The payment service is not responding. Please try again in a moment.";
    default:
      return error.message || "Failed to create the transaction. Please try again.";
  }
}

export default function CartView({ ticket, initialQuantity, pointBalance }: CartViewProps) {
  const { openLogin } = useAuthModal();

  // ----- STATE -----
  const [quantity, setQuantity] = useState(initialQuantity);
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [isUsingPoints, setIsUsingPoints] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

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

    // Shape EXACTLY as the backend expects (createTransactionSchema)
    const payload = {
      ticketTypeId: ticket.ticketTypeId,
      quantity,
      voucherCode: voucherCode ?? undefined,
      pointsUsed: pointsUsed > 0 ? pointsUsed : undefined,
    };

    try {
      const transaction = await apiFetch<CreatedTransaction>("/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!transaction.paymentUrl) {
        throw new Error("Payment link is missing.");
      }

      // Leave Chistix and go to the Midtrans payment page.
      // isSubmitting stays true so the button cannot be clicked twice while leaving.
      window.location.href = transaction.paymentUrl;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        setCheckoutError("Please log in to continue your purchase.");
        openLogin();
      } else if (error instanceof ApiError) {
        setCheckoutError(toFriendlyMessage(error));
      } else {
        setCheckoutError("Failed to create the transaction. Please try again.");
      }
      setIsSubmitting(false); // only re-enable the button when something went wrong
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
    </>
  );
}