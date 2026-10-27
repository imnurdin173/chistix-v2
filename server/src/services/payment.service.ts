import crypto from "crypto";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";

interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
}

export async function handlePaymentNotification(payload: MidtransNotification) {
  const expected = crypto
    .createHash("sha512")
    .update(
      payload.order_id +
        payload.status_code +
        payload.gross_amount +
        env.midtransServerKey,
    )
    .digest("hex");

  if (expected !== payload.signature_key) {
    throw new AppError(
      "Signature Not Valid - impostor - not real midtrans",
      403,
    );
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: payload.order_id },
  });

  if (!transaction) {
    throw new AppError("Order not know", 404);
  }

  if (transaction.status === "PAID") {
    return { message: "Has Paid before, sok kaya lu " };
  }

  switch (payload.transaction_status) {
    case "settlement":
    case "capture": {
      const updated = await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "PAID", paidAt: new Date() },
      });
      return {
        message: "Payment has been Confirmed, selamat yee",
        status: updated.status,
      };
    }
    case "deny":
    case "cancel":
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "CANCELLED" },
      });
      return { message: "Payment rejected, kacian harus debug" };
    case "expire":
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: "EXPIRED" },
      });
      return { message: "Payment Expired, udah busuk" };
    default:
      return { message: "Payment still Pending, Sabar wak" };
  }
}
