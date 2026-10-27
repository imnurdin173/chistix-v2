import z from "zod";
export const createTransactionSchema = z.object({
    ticketTypeId: z.uuid('ticketTypeId must be a valid UUID'),
    quantity:z
    .number()
    .int('quantity must be number int')
    .min(1, 'Minimum buy 1 ticket')
});