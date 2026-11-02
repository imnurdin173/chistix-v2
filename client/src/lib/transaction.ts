import { POINT_TO_RUPIAH } from "./constants";
import type { TransactionDetail } from "@/types/transaction";

// The amount actually billed to Midtrans.
// Note: the backend's `totalPrice` on GET endpoints does not subtract points yet,
// so we calculate it here with the same formula the backend uses for Midtrans.
export function getTransactionTotal(
  t: Pick<TransactionDetail, "quantity" | "priceAtPurchase" | "discountAmount" | "pointsUsed">,
): number {
  return t.quantity * t.priceAtPurchase - t.discountAmount - t.pointsUsed * POINT_TO_RUPIAH;
}