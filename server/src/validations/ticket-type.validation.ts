import z from "zod";

const ticketTypeBaseSchema = z.object({
  name: z.string().min(1, "Ticket type must be written").max(50),
  priceNormal: z.number().int().positive().max(200000000),
  priceAnchor: z.number().int().positive().optional(),
  quota: z.number().int().positive(),
  saleStart: z.coerce.date(),
  saleEnd: z.coerce.date().optional(),
});

export const createTicketTypeSchema = ticketTypeBaseSchema
.refine(
    (data) => !data.priceAnchor || data.priceAnchor > data.priceNormal,
    { message: "Anchor Price must be bigger than Normal Price", path:["priceAnchor"]}
).refine(
    (data) => !data.saleEnd || data.saleEnd > data.saleStart,
{ message: "End Data cannot be set before start date", path: ["saleEnd"]}
);

export type createTicketTypeInput = z.infer<typeof createTicketTypeSchema>;

export const ticketTypeParamsSchema = z.object({
    id: z.uuid("Format event-id not valid"),
    ticketTypeId: z.uuid("Format Ticket Type id is not valid")
});

export const updateTicketTypeSchema = ticketTypeBaseSchema.partial().extend({
    priceAnchor: z.int().positive().nullable().optional()
});

export type updateTicketTypeInput = z.infer<typeof updateTicketTypeSchema>;