import { z } from "zod";

const dynamicNumericSchema = (requiredMsg, zeroMsg) => {
  return z
    .any()
    .transform((val) =>
      val === "" || val === null || val === undefined ? "" : Number(val),
    )
    .superRefine((val, ctx) => {
      if (val === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: requiredMsg,
        });
      } else if (val <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: zeroMsg,
        });
      }
    })
    .pipe(z.coerce.number());
};

export const purchaseItemBackendSchema = z
  .object({
    id: z.any().nullable(),
    purchase_date: z.string(),
    quantity: dynamicNumericSchema(
      "The purchase quantity field is required",
      "The purchase quantity field must be greater than 0",
    ),
    purchase_price: dynamicNumericSchema(
      "The purchase pirce field is required",
      "The purchase pirce field must be greater than 0",
    ),
    discount_amount: z.coerce
      .number()
      .min(0, "The discount amount must not be negative value")
      .default(0),
    unit_price: z.coerce
      .number()
      .min(0, "The unit price must not be negative value")
      .default(0),

    quantity_per_unit: dynamicNumericSchema(
      "The quantity per unit field is required",
      "The quantity per unit field must be greater than 0",
    ),
  })
  .superRefine((data, ctx) => {
    if (data.quantity > 0 && data.purchase_price <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Price is required when purchase quantity is provided",
        path: ["purchase_price"],
      });
    }
  });

export const saveStockBatchSchema = z
  .object({
    is_edit_mode: z.boolean(),
    monthly_stock_data: z.object({
      id: z.number().nullable(),
      category_id: z.number().min(1, "Sub Category selection is required."),
    }),
    purchases: z.array(purchaseItemBackendSchema).min(1).max(3),
  })
  .superRefine((data, ctx) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    if (!data.purchases) return;

    data.purchases.forEach((purchase, index) => {
      if (!purchase.purchase_date) return;

      const d = new Date(purchase.purchase_date);
      const recordYear = d.getFullYear();
      const recordMonth = d.getMonth() + 1;

      const isCurrentMonth =
        recordYear === currentYear && recordMonth === currentMonth;
      const isPreviousMonth =
        recordYear === prevYear && recordMonth === prevMonth;

      if (data.is_edit_mode) {
        if (!isCurrentMonth && !isPreviousMonth) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "The Purchase Date must be within previous month and current month",
            path: ["purchases", index, "purchase_date"],
          });
        }
      } else {
        if (!isCurrentMonth) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "The purchase date must be within current month",
            path: ["purchases", index, "purchase_date"],
          });
        }
      }
    });
  });
