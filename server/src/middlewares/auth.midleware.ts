import z from "zod";

export const registerSchema = z.object({
    name: z.string().min(2, "Name is Minimum 2 Character").max(100),
    email: z.email("Email Address is not valid"),
    password: z.string().min(6, "Password Minimum 6 Character"),
    role: z.enum(["CUSTOMER", "ORGANIZER"]).default("CUSTOMER"),
});

export const loginSchema = z.object({
    email: z.email("Email Adress is not valid"),
    password: z.string().min(1, "Password is Empty ")
})

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const googleLoginSchema = z.object({
    credential: z.string().min(10, "Credential GOogle wajib diisi")
})

export type googleLoginInput = z.infer<typeof googleLoginSchema>;