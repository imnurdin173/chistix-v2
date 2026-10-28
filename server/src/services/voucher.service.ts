import { prisma } from "../config/prisma";
import { Prisma } from "@prisma/client";
import { createVoucherInput } from "../validations/voucher.validation";
import { AppError } from "../utils/AppError";

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