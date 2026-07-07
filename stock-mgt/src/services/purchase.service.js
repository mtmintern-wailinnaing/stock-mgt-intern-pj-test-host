import {
  getPurchaseByIdRepo,
  getAllPurchasesRepo,
} from "@/repositories/purchase.repo";
import { AppError } from "@/lib/errors";

export async function getAllPurchasesService() {
  try {
    const purchases = await getAllPurchasesRepo();
    const formattedPurchases = purchases.map((p) => ({
      id: String(p.id),
      monthly_stock_id: p.monthly_stock_id ? String(p.monthly_stock_id) : null,
      category_id: Number(p.category_id),
      categoryName: p.categoryName || "Unknown Category",
      purchase_date:
        p.purchase_date instanceof Date
          ? p.purchase_date.toISOString().split("T")[0]
          : String(p.purchase_date),
      quantity: Number(p.quantity),
      purchase_price: Number(p.purchase_price),
      discount_price: Number(p.discount_price),
      quantity_per_unit: Number(p.quantity_per_unit),
      unit_price: Number(p.unit_price),
      discount_amount: Number(p.discount_amount),
    }));

    return {
      success: true,
      data: formattedPurchases,
      message: "Purchases retrieved successfully",
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: "FETCH_ERROR",
        message: "Failed to retrieve purchases",
        details: error.message,
      },
    };
  }
}

export async function getPurchaseByIdService(id) {
  try {
    const purchase = await getPurchaseByIdRepo(id);
    if (!purchase) {
      throw new AppError(
        "Purchase record not found",
        404,
        "PURCHASE_NOT_FOUND",
      );
    }

    return {
      success: true,
      data: {
        id: String(purchase.id),
        monthly_stock_id: purchase.monthly_stock_id
          ? String(purchase.monthly_stock_id)
          : null,
        category_id: Number(purchase.category_id),
        purchase_date:
          purchase.purchase_date instanceof Date
            ? purchase.purchase_date.toISOString().split("T")[0]
            : String(purchase.purchase_date),
        quantity: Number(purchase.quantity),
        purchase_price: Number(purchase.purchase_price),
        discount_price: Number(purchase.discount_price),
        quantity_per_unit: Number(purchase.quantity_per_unit),
        unit_price: Number(purchase.unit_price),
        discount_amount: Number(purchase.discount_amount),
      },
      message: "Purchase record retrieved successfully",
    };
  } catch (error) {
    if (error instanceof AppError) {
      return {
        success: false,
        error: { code: error.code, message: error.message },
      };
    }
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to retrieve purchase record",
        details: error.message,
      },
    };
  }
}