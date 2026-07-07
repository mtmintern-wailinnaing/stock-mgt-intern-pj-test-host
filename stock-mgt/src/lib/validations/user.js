import { z } from "zod";

export const userSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "The Name field is required")
      .max(50, "The Name Field must be under 50 character"),
    email: z
      .string()
      .trim()
      .min(1, "The Email Address field is required.")
      .email("The Email Address field format is invalid."),

    password: z
      .string()
      .trim()
      .min(1, "The Password field is required.")
      .min(6, "The Password field must be at least 6 characters"),
    confirm_password: z
      .string()
      .trim()
      .min(1, "The Confirm Password field is required.")
      .min(6, "The Confirm Password field must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export const userEditSchema = z.object({
  name: z
    .string()
    .min(1, "Name field is required!")
    .max(50, "Name must be under 50 characters!")
    .trim(),

  email: z
    .string()
    .min(1, "Email Address is required!")
    .email("Invalid email address!")
    .trim(),
});
