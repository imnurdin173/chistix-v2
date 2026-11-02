import z from "zod";

export const getReviewsQuerySchema = z.object({
    page: z.coerce.number().int().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10)
});

export const createReviewSchema = z.object({
    rating: z.number().int().min(1).max(5),
    reviewDesc: z.string().max(500).optional(),
});

export type GetReviewsQuery = z.infer<typeof getReviewsQuerySchema>;
export type CreateReviewBody = z.infer<typeof createReviewSchema>;
