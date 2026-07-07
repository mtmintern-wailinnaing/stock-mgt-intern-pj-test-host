import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "The Email Address field is required.")
    .email("The Email Address field format is invalid."),

  password: z.string().trim().min(1, "The Password field is required."),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(1, "New password is required")
      .regex(/^\S+$/, "Password cannot contain spaces"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
  })
  .refine((data) => data.currentPassword.length >= 6, {
    message: "Current Password must be at least 6 characters",
    path: ["currentPassword"],
  })
  .refine((data) => data.newPassword.length >= 6, {
    message: "NewPassword must be at least 6 characters",
    path: ["newPassword"],
  })
  .refine((data) => /^\S+$/.test(data.newPassword), {
    message: "Password cannot contain spaces",
    path: ["newPassword"],
  })
  .refine((data) => data.confirmPassword.length >= 6, {
    message: "ConfirmPassword must be at least 6 characters",
    path: ["confirmPassword"],
  })

  .refine((data) => data.currentPassword.trim() !== "", {
    message: "Password must not contain spaces",
    path: ["currentPassword"],
  })
  .refine((data) => data.newPassword.trim() !== "", {
    message: "Password must not contain spaces",
    path: ["newPassword"],
  })
  .refine((data) => data.confirmPassword.trim() !== "", {
    message: "Password must not contain spaces",
    path: ["confirmPassword"],
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "The Password Confirmation and Password must match",
    path: ["confirmPassword"],
  })

  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password cannot be the same as the current password.",
    path: ["newPassword"],
  });
