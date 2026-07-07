import { z } from "zod";

export const weeklyCheckFormSchema = z.object({
  month_id: z.coerce.number(),
  category_id: z.coerce.number(),

  used_qty_1st_week: z.coerce.number().int("Quantity must be integer number").min(0).default(0),
  used_qty_2nd_week: z.coerce.number().int("Quantity must be integer number").min(0).default(0),
  used_qty_3rd_week: z.coerce.number().int("Quantity must be integer number").min(0).default(0),
  used_qty_4th_week: z.coerce.number().int("Quantity must be integer number").min(0).default(0),
  used_qty_5th_week: z.coerce.number().int("Quantity must be integer number").min(0).default(0),

  checked_week_1: z.preprocess((val) => val === 1 || val === "1" || val === true, z.boolean().default(false)),
  checked_week_2: z.preprocess((val) => val === 1 || val === "1" || val === true, z.boolean().default(false)),
  checked_week_3: z.preprocess((val) => val === 1 || val === "1" || val === true, z.boolean().default(false)),
  checked_week_4: z.preprocess((val) => val === 1 || val === "1" || val === true, z.boolean().default(false)),
  checked_week_5: z.preprocess((val) => val === 1 || val === "1" || val === true, z.boolean().default(false)),
});
