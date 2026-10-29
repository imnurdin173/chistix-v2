import z from "zod";

export const registerSchema = z.object({
    name: z.string().min(2, "Name is Minimum 2 Character").max(100),
    email: z.email("Email Address is not valid"),
    password: z.string().min(6, "Password Minimum 6 Character"),
    role: z.enum(["CUSTOMER", "ORGANIZER"]).default("CUSTOMER"),
    referralCode: z.string().trim().min(1).max(20).optional(),
});

export const loginSchema = z.object({
    email: z.email("Email Adress is not valid"),
    password: z.string().min(1, "Password is Empty ")
})



export const googleLoginSchema = z.object({
    credential: z.string().min(10, "Credential GOogle wajib diisi")
})

export const forgotPasswordSchema = z.object({
  email: z.email("Invalid email format"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"), 
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type googleLoginInput = z.infer<typeof googleLoginSchema>;

export const resendSchema = z.object({
    email: z.email()
});

