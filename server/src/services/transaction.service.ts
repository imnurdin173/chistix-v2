import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { PAYMENT_DEADLINE_MINUTES } from "../utils/constants";

const payment_deadline_minutes = PAYMENT_DEADLINE_MINUTES;

interface createTransactionInput {
  userId: string;
  ticketTypeId: string;
  quantity: number;
}

function calculateTotalPrice(t: {
  quantity: number;
  priceAtPurchase: number;
  discountAmount: number;
}) {
  return t.quantity * t.priceAtPurchase - t.discountAmount;
}

export async function createTransaction(input: createTransactionInput) {
  return prisma.$transaction(async (tx) => {
    const ticketType = await tx.ticketType.findFirst({
      where: { id: input.ticketTypeId, deletedAt: null },
      include: { event: true },
    });

    if (!ticketType) {
      throw new AppError("TIcket Type is not fouind", 404);
    }

    if (ticketType.event.deletedAt) {
      throw new AppError(
        "Events is not available anymore to transaction dude",
        404,
      );
    }

    const now = new Date();
    if (now < ticketType.saleStart) {
      throw new AppError("ticket sales not open yet bro, still dreaming ", 409);
    }

    if (ticketType.saleEnd && now > ticketType.saleEnd) {
      throw new AppError("icket sales has been closed ma bro", 409);
    }

    const remaining = ticketType.quota - ticketType.sold;
    if (input.quantity > remaining) {
      throw new AppError(
        `Quota is Beak you know, just ${remaining} remaining ticket `,
        409,
      );
    }

    await tx.ticketType.update({
      where: { id: ticketType.id },
      data: { sold: { increment: input.quantity } },
    });

    const transaction = await tx.transaction.create({
      data: {
        userId: input.userId,
        eventId: ticketType.eventId,
        ticketTypeId: ticketType.id,
        quantity: input.quantity,
        priceAtPurchase: ticketType.priceNormal,
        paymentDeadline: new Date(
          now.getTime() + payment_deadline_minutes * 60 * 1000,
        ),
      },
      include: { event: true, ticketType: true },
    });

    return {
      ...transaction,
      totalPrice:
        transaction.quantity * transaction.priceAtPurchase -
        transaction.discountAmount,
    };
  });
}

export async function listMyTransactions(
  userId: string,
  query: {
    status?: "WAITING_PAYMENT" | "PAID" | "CANCELLED" | "EXPIRED";
    page: number;
    limit: number;
  },
) {
  const where = {
    userId,
    ...(query.status ? { status: query.status } : {}),
  };

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      include: {
        event: true,
        ticketType: true,
        voucher: true,
        tickets: true,
      },
    }),
    prisma.transaction.count({ where }),
  ]);

  return {
    transactions: transactions.map((t) => ({
      ...t,
      totalPrice: calculateTotalPrice(t),
    })),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}

export async function getTransactionDetail(
  userId: string,
  transactionId: string,
) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { event: true, ticketType: true, voucher: true, tickets: true },
  });

  if (!transaction) {
    throw new AppError("Transactions detail not found", 404);
  }

  if (transaction.userId !== userId) {
    throw new AppError("You no no no access to this transaction", 403);
  }
  return { ...transaction, totalPrice: calculateTotalPrice(transaction) };
}

export async function cancelTransaction(userId: string, transactionId: string) {
  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
  });

  
  if (!transaction) {
    throw new AppError("Transaction  not found /cancel", 404);
  }

  if (transaction.userId !== userId) {
    throw new AppError("U don't have access to this transaction /cancel", 403);
  }

  if (transaction.status !== "WAITING_PAYMENT") {
    const alasan: Record<string, string> = {
      PAID: "Cannot cancel order, payment has been received (jalur refund)",
      CANCELLED: "Cannot cancel order, transaction has been cancel before",
      EXPIRED: "Cannot cancel order, Transaction has been Expired",
    };
    throw new AppError(
      alasan[transaction.status] ??
        `Transaction status is ${transaction.status}`,409
    );
  }

  const cancelled = await prisma.$transaction(async (tx) => {
    const updated = await tx.transaction.update({
      where: { id: transactionId },
      data: { status: "CANCELLED" },
    });

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
    return updated;
  });
  return getTransactionDetail(userId, cancelled.id);
}
