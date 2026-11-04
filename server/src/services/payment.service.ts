// import crypto from "crypto";
// import { prisma } from "../config/prisma";
// import { AppError } from "../utils/AppError";
// import { env } from "../config/env";
// import { POINT_TO_RUPIAH } from "../utils/constants";

// interface MidtransNotification {
//   order_id: string;
//   status_code: string;
//   gross_amount: string;
//   signature_key: string;
//   transaction_status: string;
//   fraud_status?: string;
// }

// async function closeAndRestore(
//   transaction: {
//     id: string;
//     ticketTypeId: string;
//     quantity: number;
//     voucherId: string | null;
//   },
//   status: "CANCELLED" | "EXPIRED",
// ) {
//   await prisma.$transaction(async (tx) => {
//     const gate = await tx.transaction.updateMany({
//       where: { id: transaction.id, status: "WAITING_PAYMENT" },
//       data: { status },
//     });
//     if (gate.count === 0) return; // pintu sudah ditutup pihak lain — webhook diam saja, bukan error

//     await tx.ticketType.update({
//       where: { id: transaction.ticketTypeId },
//       data: { sold: { decrement: transaction.quantity } },
//     });
//     if (transaction.voucherId) {
//       await tx.voucher.update({
//         where: { id: transaction.voucherId },
//         data: { usedCount: { decrement: 1 } },
//       });
//     }
//   });
// }

// export async function handlePaymentNotification(payload: MidtransNotification) {
//   const expected = crypto
//     .createHash("sha512")
//     .update(
//       payload.order_id +
//         payload.status_code +
//         payload.gross_amount +
//         env.midtransServerKey,
//     )
//     .digest("hex");

//   if (expected !== payload.signature_key) {
//     throw new AppError(
//       "Signature Not Valid - impostor - not real midtrans",
//       403,
//     );
//   }

//   const transaction = await prisma.transaction.findUnique({
//     where: { id: payload.order_id },
//   });

//   if (!transaction) {
//     throw new AppError("Order not found", 404);
//   }

//   const expectedTotal =
//     transaction.quantity * transaction.priceAtPurchase -
//     transaction.discountAmount -
//     transaction.pointsUsed * POINT_TO_RUPIAH;

//   if (Number(payload.gross_amount) !== expectedTotal) {
//     throw new AppError("Amount does not match this order", 400);
//   }

//   if (transaction.status === "PAID") {
//     return { message: "Has Paid before, sok kaya lu " };
//   }

//   switch (payload.transaction_status) {
//     case "settlement":
//     case "capture": {
//       const paid = await prisma.transaction.updateMany({
//         where: { id: transaction.id, status: "WAITING_PAYMENT" },
//         data: { status: "PAID", paidAt: new Date() },
//       });
//       if (paid.count === 0) {
//         return { message: "Has Paid before" };
//       }
//       return {
//         message: "Payment has been Confirmed,",
//         status: "PAID", // updateMany balikin count, bukan row — makanya literal
//       };
//       // const updated = await prisma.transaction.update({
//       //   where: { id: transaction.id },
//       //   data: { status: "PAID", paidAt: new Date() },
//       // });
//       // return {
//       //   message: "Payment has been Confirmed, selamat yee",
//       //   status: updated.status,
//       // };
//     }
//     case "deny":
//     case "cancel":
//       await closeAndRestore(transaction, "CANCELLED");
//       return { message: "Payment rejected, kacian harus debug" };
//     case "expire":
//       await closeAndRestore(transaction, "EXPIRED");
//       return { message: "Payment Expired, udah busuk" };
//     // case "deny":
//     // case "cancel":
//     //   await prisma.transaction.updateMany({
//     //     where: { id: transaction.id, status: "WAITING_PAYMENT" },
//     //     data: { status: "CANCELLED" },
//     //   });
//     //   return { message: "Payment rejected, kacian harus debug" };
//     // case "expire":
//     //   await prisma.transaction.updateMany({
//     //     where: { id: transaction.id, status: "WAITING_PAYMENT" },
//     //     data: { status: "EXPIRED" },
//     //   });
//     //   return { message: "Payment Expired, udah busuk" };
//     // default:
//     //   return { message: "Payment still Pending, Sabar wak" };
//   }
// }

import crypto from "crypto";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import { POINT_TO_RUPIAH } from "../utils/constants";
import { getMidtransStatus } from "../utils/midtrans";

// Body that Midtrans sends to POST /api/payments/notification
interface MidtransNotification {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
}

type WebhookTransaction = {
  id: string;
  userId: string;
  ticketTypeId: string;
  quantity: number;
  voucherId: string | null;
  pointsUsed: number;
};

// Unique ticket code, e.g. "CHX-1A2B3C4D"
function generateTicketCode() {
  return `CHX-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;
}

// Mark as PAID and issue one ticket per quantity, in ONE database transaction
async function markPaidAndIssueTickets(transaction: WebhookTransaction) {
  return prisma.$transaction(async (tx) => {
    // Gate: only a WAITING_PAYMENT order can become PAID (prevents double processing)
    const gate = await tx.transaction.updateMany({
      where: { id: transaction.id, status: "WAITING_PAYMENT" },
      data: { status: "PAID", paidAt: new Date() },
    });
    if (gate.count === 0) return false;

    await tx.tickets.createMany({
      data: Array.from({ length: transaction.quantity }, () => ({
        transactionId: transaction.id,
        ticketCode: generateTicketCode(),
      })),
    });
    return true;
  });
}

// Close an unpaid order and give back seats, voucher and points
async function closeAndRestore(transaction: WebhookTransaction, status: "CANCELLED" | "EXPIRED") {
  await prisma.$transaction(async (tx) => {
    const gate = await tx.transaction.updateMany({
      where: { id: transaction.id, status: "WAITING_PAYMENT" },
      data: { status },
    });
    if (gate.count === 0) return; // already closed by someone else

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

    if (transaction.pointsUsed > 0) {
      await tx.user.update({
        where: { id: transaction.userId },
        data: { points: { increment: transaction.pointsUsed } },
      });
    }
  });
}

export async function handlePaymentNotification(payload: MidtransNotification) {
  // 1. Is this really from Midtrans?
  const expected = crypto
    .createHash("sha512")
    .update(payload.order_id + payload.status_code + payload.gross_amount + env.midtransServerKey)
    .digest("hex");

  if (expected !== payload.signature_key) {
    throw new AppError("Invalid signature", 403);
  }

  // 2. Find our transaction (order_id = transaction id)
  const transaction = await prisma.transaction.findUnique({
    where: { id: payload.order_id },
  });
  if (!transaction) {
    throw new AppError("Order not found", 404);
  }

  // 3. Does the amount match?
  const expectedTotal =
    transaction.quantity * transaction.priceAtPurchase -
    transaction.discountAmount -
    transaction.pointsUsed * POINT_TO_RUPIAH;

  if (Number(payload.gross_amount) !== expectedTotal) {
    throw new AppError("Amount does not match this order", 400);
  }

  // 4. Update the status
  switch (payload.transaction_status) {
    case "settlement":
    case "capture": {
      // Card payments flagged for review are not paid yet
      if (payload.fraud_status && payload.fraud_status !== "accept") {
        return { message: "Payment is under review" };
      }
      const paid = await markPaidAndIssueTickets(transaction);
      return paid
        ? { message: "Payment confirmed and tickets issued", status: "PAID" }
        : { message: "Notification already processed" };
    }
    case "deny":
    case "cancel":
      await closeAndRestore(transaction, "CANCELLED");
      return { message: "Payment cancelled", status: "CANCELLED" };
    case "expire":
      await closeAndRestore(transaction, "EXPIRED");
      return { message: "Payment expired", status: "EXPIRED" };
    case "pending":
      return { message: "Waiting for payment", status: "WAITING_PAYMENT" };
    default:
      return { message: `Status "${payload.transaction_status}" ignored` };
  }
}

// Check the payment with Midtrans directly, then reuse the webhook logic.
// Lets the invoice update itself even when the webhook cannot reach the server (localhost).
export async function syncPaymentStatus(userId: string, transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { userId: true, status: true },
  });
  if (!transaction) {
    throw new AppError("Transaction not found", 404);
  }
  if (transaction.userId !== userId) {
    throw new AppError("You do not have access to this transaction", 403);
  }
  if (transaction.status !== "WAITING_PAYMENT") {
    return { status: transaction.status };
  }

  const midtrans = await getMidtransStatus(transactionId);

  // 404 = customer has not chosen a payment method yet
  if (midtrans.status_code === "404") {
    return { status: "WAITING_PAYMENT" };
  }

  // Same checks as the webhook: signature, amount, then update + issue tickets
  await handlePaymentNotification(midtrans);

  const updated = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { status: true },
  });
  return { status: updated?.status ?? "WAITING_PAYMENT" };
}
