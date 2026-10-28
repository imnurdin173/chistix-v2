import z from "zod";
export const createTransactionSchema = z.object({
    ticketTypeId: z.uuid('ticketTypeId must be a valid UUID'),
    quantity:z
    .number()
    .int('quantity must be number int')
    .min(1, 'Minimum buy 1 ticket'),
    voucherCode: z.string().trim().min(1).max(50).optional(),
    couponAmount: z.number().int().nonnegative().optional(),
});

export const listTransactionsQuerySchema = z.object({
    status: z.enum(["WAITING_PAYMENT", "PAID", "CANCELLED", "EXPIRED"])
    .optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10)
});

export const transactionParamsSchema = z.object({
    id: z.uuid("Format id Transaction is not valid"),
});    