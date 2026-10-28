import z from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(50).optional(),
  avatar: z.url().optional(),
});

export type updateProfileInput = z.infer<typeof updateProfileSchema>;