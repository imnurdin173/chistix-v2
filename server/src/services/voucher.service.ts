import { prisma } from "../config/prisma";
import { Prisma } from "@prisma/client";
import { createVoucherInput, updatingVoucherInput } from "../validations/voucher.validation";
import { AppError } from "../utils/AppError";
import { updateEventInput } from "../validations/event.validation";

export async function createEventVoucher(
  eventId: string,
  data: createVoucherInput,
  organizerId: string,
) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });

  if (!event) {
    throw new AppError("Event is not found", 404);
  }

  if (event.organizerId !== organizerId) {
    throw new AppError("You are not the owner of this event", 403);
  }

  if (data.discountType === "PERCENTAGE" && data.discount > 100) {
    throw new AppError("Percentage discount cannot exceed 100", 400);
  }

  if (data.validEnd <= data.validStart) {
    throw new AppError("validEnd must be after validStart", 400);
  }

  const existing = await prisma.voucher.findFirst({
    where: { code: data.code },
  });

  if (existing) {
    throw new AppError("Voucher code is already taken", 409);
  }

  return prisma.voucher.create({
    data: {
      eventId: event.id,
      code: data.code,
      discountType: data.discountType,
      discount: data.discount,
      validStart: data.validStart,
      validEnd: data.validEnd,
      maxUsage: data.maxUsage,
    },
  });
}

export const listEventVouchers = async (
  eventId: string,
  organizerId: string,
) => {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });
  if (!event) throw new AppError("Event not Fount", 404);

  if (event.organizerId !== organizerId) {
    throw new AppError(
      "You do not have persmission to access this event ma bro",
      403,
    );
  }

  return prisma.voucher.findMany({
    where: { eventId, deletedAt: null },
    orderBy: { createdAt: "desc" },
  });
};

export const updateEventVoucher = async (
  eventId: string,
  voucherId: string,
  data: updatingVoucherInput,
  organizerId: string,
) => {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });
  if (!event) throw new AppError("Event not found", 404);
  if (event.organizerId !== organizerId) {
    throw new AppError("You don ot have permission to modify this event", 403);
  }

  const voucher = await prisma.voucher.findFirst({
    where: { id: voucherId, eventId, deletedAt: null },
  });
  if (!voucher) throw new AppError("Voucher not found", 404);

  if (data.code && data.code !== voucher.code) {
    const taken = await prisma.voucher.findFirst({
      where: { code: data.code, id: { not: voucherId } },
    });
    if (taken) throw new AppError("VOucher code already exists", 409);
  }

  const effectiveType = data.discountType ?? voucher.discountType;
  const effectiveDiscount = data.discount ?? voucher.discount;
  if (effectiveType === "PERCENTAGE" && effectiveDiscount > 100) {
    throw new AppError("Percentage discount cannot exceed 100", 400);
  }

  const effectiveStart = data.validStart ?? voucher.validStart;
  const effectiveEnd = data.validEnd ?? voucher.validEnd;
  if (effectiveEnd <= effectiveStart) {
    throw new AppError("Valid end must be after valid start", 400);
  }

  if (data.maxUsage !== undefined && data.maxUsage < voucher.usedCount) {
    throw new AppError(
      `max usage cannot be lower than already used count (${voucher.usedCount})`,
      400,
    );
  }
  return prisma.voucher.update({ where: { id: voucherId }, data });
};

export const deleteEventVoucher = async (
  eventId: string,
  voucherId: string,
  organizerId: string,
) => {
  const event = await prisma.event.findFirst({
    where: { id: eventId, deletedAt: null },
  });
  if (!event) throw new AppError("Event not found", 404);
  if (event.organizerId !== organizerId) {
    throw new AppError(
      "You do not have permission to modify or delete this event",
    );
  }

  const voucher = await prisma.voucher.findFirst({
    where: { id: voucherId, eventId, deletedAt: null },
  });
  if (!voucher) throw new AppError("VOucher not found", 404);

  await prisma.voucher.update({
    where: { id: voucherId },
    data: { deletedAt: new Date() },
  });
  return { message: "voucher deleted succesfully" };
};
