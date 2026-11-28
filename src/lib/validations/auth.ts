import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address.").trim(),
  password: z.string().min(1, "Password is required."),
});

export const registerSchema = z.object({
  email: z.string().email("Please enter a valid email address.").trim(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters.")
    .max(24, "Username must be 24 characters or fewer.")
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers, and underscores allowed.")
    .trim(),
  displayName: z
    .string()
    .min(2, "Display name must be at least 2 characters.")
    .max(40, "Display name must be 40 characters or fewer.")
    .trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[a-zA-Z]/, "Must contain at least one letter.")
    .regex(/[0-9]/, "Must contain at least one number."),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
