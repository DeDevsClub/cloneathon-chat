import { z } from "zod";

export const schema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(50, { message: "Name must be at most 50 characters." }),
  bio: z
    .string()
    .max(160, { message: "Bio must be at most 160 characters." })
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email({ message: "Please enter a valid email address." }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters." })
    .max(100, { message: "Password must be at most 100 characters." })
    .optional()
    .or(z.literal("")),
  darkMode: z.boolean().optional(),
  notifications: z.boolean().optional(),
  language: z.string().max(32).optional(),
});
;
