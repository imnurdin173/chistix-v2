import { z } from "zod";

export const createVoucherSchema = z.object({
  code: z.string().trim().min(3).max(50),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discount: z.number().int().positive(),
  validStart: z.coerce.date(),
  validEnd: z.coerce.date(),
  maxUsage: z.number().int().positive().default(100),
});

export const updateVoucherSchema = createVoucherSchema.partial();
export const voucherParamsSchema = z.object({
  id: z.uuid(),
  voucherId: z.uuid(),
});

export type createVoucherInput = z.infer<typeof createVoucherSchema>;
export type updatingVoucherInput = z.infer<typeof updateVoucherSchema>;
