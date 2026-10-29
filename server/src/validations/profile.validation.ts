import z from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(50).optional(),
  avatar: z.url().optional(),
});

export const changePasswordSchema = z.object({
    // oldPassword: z.string().min(1, "Old password is required"),
    oldPassword: z.string().min(6, "Password Minimum 6 Character"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword !== data.oldPassword, {
    message: "New password must be different from old password",
    path: ["newPassword"],
  });

  export type updateProfileInput = z.infer<typeof updateProfileSchema>;
  export type changePasswordInput = z.infer<typeof changePasswordSchema>;