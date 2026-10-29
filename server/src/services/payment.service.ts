import crypto from "crypto";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import { POINT_TO_RUPIAH } from "../utils/constants";

interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
}

async function closeAndRestore(
  transaction: {
    id: string;
    ticketTypeId: string;
    quantity: number;
    voucherId: string | null;
  },
  status: "CANCELLED" | "EXPIRED",
) {
  await prisma.$transaction(async (tx) => {
    const gate = await tx.transaction.updateMany({
      where: { id: transaction.id, status: "WAITING_PAYMENT" },
      data: { status },
    });
    if (gate.count === 0) return; // pintu sudah ditutup pihak lain — webhook diam saja, bukan error

    await tx.ticketType.update({
      where: { id: transaction.ticketTypeId },
      data: { sold: { decrement: transaction.quantity } },
    });
    if (transaction.voucherId) {
      await tx.voucher.update({
        where: { id: transaction.voucherId },
        data: { usedCount: { decrement: 1 } },
      });
    }
  });
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
    throw new AppError("Order not found", 404);
  }

  const expectedTotal =
    transaction.quantity * transaction.priceAtPurchase -
    transaction.discountAmount -
    transaction.pointsUsed * POINT_TO_RUPIAH;

  if (Number(payload.gross_amount) !== expectedTotal) {
    throw new AppError("Amount does not match this order", 400);
  }

  if (transaction.status === "PAID") {
    return { message: "Has Paid before, sok kaya lu " };
  }

  switch (payload.transaction_status) {
    case "settlement":
    case "capture": {
      const paid = await prisma.transaction.updateMany({
        where: { id: transaction.id, status: "WAITING_PAYMENT" },
        data: { status: "PAID", paidAt: new Date() },
      });
      if (paid.count === 0) {
        return { message: "Has Paid before" };
      }
      return {
        message: "Payment has been Confirmed,",
        status: "PAID", // updateMany balikin count, bukan row — makanya literal
      };
      // const updated = await prisma.transaction.update({
      //   where: { id: transaction.id },
      //   data: { status: "PAID", paidAt: new Date() },
      // });
      // return {
      //   message: "Payment has been Confirmed, selamat yee",
      //   status: updated.status,
      // };
    }
    case "deny":
    case "cancel":
      await closeAndRestore(transaction, "CANCELLED");
      return { message: "Payment rejected, kacian harus debug" };
    case "expire":
      await closeAndRestore(transaction, "EXPIRED");
      return { message: "Payment Expired, udah busuk" };
    // case "deny":
    // case "cancel":
    //   await prisma.transaction.updateMany({
    //     where: { id: transaction.id, status: "WAITING_PAYMENT" },
    //     data: { status: "CANCELLED" },
    //   });
    //   return { message: "Payment rejected, kacian harus debug" };
    // case "expire":
    //   await prisma.transaction.updateMany({
    //     where: { id: transaction.id, status: "WAITING_PAYMENT" },
    //     data: { status: "EXPIRED" },
    //   });
    //   return { message: "Payment Expired, udah busuk" };
    // default:
    //   return { message: "Payment still Pending, Sabar wak" };
  }
}
