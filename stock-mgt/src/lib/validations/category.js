import { z } from "zod";
export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100),
  parentId: z.coerce.number().int().optional(),
  minimumThreshold: z.number({
      invalid_type_error: "Threshold must be a valid number",
    })
    .min(0, "Threshold cannot be negative")
    .optional(),
  remark: z.string().max(500, "Remark cannot exceed 500 characters").optional(),
});