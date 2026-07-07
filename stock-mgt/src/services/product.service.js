import { AppError } from "@/lib/errors";
import { authorizeRequest } from "@/lib/utils/auth";
import { productRepository } from "@/repositories/product.repo";

export class ProductService {
  constructor(request) {
    this.currentUser = authorizeRequest(request);
  }
  async getStockLedgerContext({ msdId, categoryId }) {
    if (!categoryId) {
      throw new AppError(
        "Category ID is strictly required.",
        400,
        "validation",
      );
    }

    if (!msdId) {
      throw new AppError("Msd ID is strictly required.", 400, "validation");
    }

    let stockRecord = null;
    const parsedMsdId = msdId ? Number(msdId) : 0;

    if (parsedMsdId > 0 && !isNaN(parsedMsdId)) {
      stockRecord = await productRepository.findMonthlyStockById(parsedMsdId);
    }

    if (!stockRecord) {
      const categoryData = await productRepository.findCategoryById(categoryId);

      if (!categoryData) {
        throw new AppError("Target category does not exist.", 404, "not_found");
      }

      stockRecord = {
        id: null,
        category_id: categoryData.category_id,
        parent_id: categoryData.parent_id,
        category_name: categoryData.category_name,
        opening_qty: 0,
        closing_qty: 0,
        ledger_month: new Date().getMonth() + 1,
        ledger_year: new Date().getFullYear(),
      };
    }
    let purchases = [];
    if (stockRecord.id) {
      purchases = await productRepository.findPurchasesByStockId(
        stockRecord.id,
      );
    } else {
      purchases =
        await productRepository.findPurchasesByCategoryIdWithoutStock(
          categoryId,
        );
    }

    return {
      ...stockRecord,
      raw_purchases: purchases,
    };
  }
  async processStockBatch(payload) {
    if (payload.is_edit_mode) {
      return await this.handleEditMode(payload);
    } else {
      return await this.handleCreateMode(payload);
    }
  }

  async handleCreateMode(payload) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // changing as string for comparison
    const currentMonthStr = String(currentMonth).padStart(2, "0");
    const currentYearMonth = `${currentYear}-${currentMonthStr}`;

    const { monthly_stock_data, purchases } = payload;
    const categoryId = monthly_stock_data.category_id;

    if (!purchases || purchases.length === 0) {
      throw new AppError("At least one purchase item is required.", 409);
    }
    for (const purchase of purchases) {
      if (!purchase.purchase_date) {
        throw new AppError("Purchase Date is missing");
      }
      // Extract the "YYYY-MM" part from "YYYY-MM-DD"
      const purchaseYearMonth = purchase.purchase_date.substring(0, 7);
      if (purchaseYearMonth !== currentYearMonth) {
        throw new AppError(
          `You can only create the product for the current month (${currentYearMonth}). Invalid purchase date found: ${purchase.purchase_date}`,
          409,
          "purchase_date",
        );
      }
    }
    const existingStock =
      await productRepository.getCurrentMonthStockByCategory(
        categoryId,
        currentYear,
        currentMonth,
      );
    if (existingStock) {
      throw new AppError(
        "This product already exists for this month.",
        409,
        "category_id",
      );
    }

    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    const finalOpeningQty = await productRepository.getPreviousMonthClosing(
      categoryId,
      prevYear,
      prevMonth,
    );

    const processedPurchases = this.getDiscountAndUnitPrice(purchases); // overriding discount_price and unit_price in backend
    const totalPurchased = processedPurchases.reduce(
      (sum, p) => sum + p.quantity,
      0,
    );

    const totalUsed = await productRepository.getTotalUsedForMonth(
      categoryId,
      currentYear,
      currentMonth,
    );

    const calculatedClosingQty =
      Number(finalOpeningQty || 0) + totalPurchased - totalUsed;

    const stockDataToSave = {
      category_id: categoryId,
      year: currentYear,
      month: currentMonth,
      opening_qty: finalOpeningQty,
      closing_qty: calculatedClosingQty,
    };

    return await productRepository.saveStockAndPurchasesTransaction({
      stockData: stockDataToSave,
      purchases: processedPurchases,
      currentUser: this.currentUser?.userId,
      isEditMode: false,
    });
  }

  async handleEditMode(payload) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const { monthly_stock_data, purchases } = payload;

    const targetStock = await productRepository.getStockWithMonthDetailsById(
      monthly_stock_data.id,
    );
    if (!targetStock) {
      throw new AppError("The Product does not found.", 409);
    }

    this.canPerformEditOperation(targetStock.year, targetStock.month);
    const isTargetPreviousMonth =
      targetStock.year !== currentYear || targetStock.month !== currentMonth;

    const processedPurchases = this.getDiscountAndUnitPrice(purchases);
    const totalPurchased = processedPurchases.reduce(
      (sum, p) => sum + p.quantity,
      0,
    );

    const totalUsed = await productRepository.getTotalUsedForMonth(
      targetStock.category_id,
      targetStock.year,
      targetStock.month,
    );

    const newClosingQty =
      Number(targetStock.opening_qty || 0) + totalPurchased - totalUsed;

    if (newClosingQty < 0) {
      throw new AppError(
        `Total used quantity cannot exceed opening stock plus purchases.`,
        409,
      );
    }
    const stockDataToSave = {
      id: monthly_stock_data.id,
      category_id: targetStock.category_id,
      year: targetStock.year,
      month: targetStock.month,
      opening_qty: targetStock.opening_qty,
      closing_qty: newClosingQty,
    };
    const result = await productRepository.saveStockAndPurchasesTransaction({
      stockData: stockDataToSave,
      purchases: processedPurchases,
      currentUser: this.currentUser?.userId,
      isEditMode: true,
    });

    if (isTargetPreviousMonth) {
      await this.cascadeOpeningQtyToCurrentMonth(
        targetStock.category_id,
        currentYear,
        currentMonth,
        newClosingQty,
      );
    }

    return result;
  }

  async cascadeOpeningQtyToCurrentMonth(
    categoryId,
    currentYear,
    currentMonth,
    newOpeningQty,
  ) {
    const currentStock = await productRepository.getCurrentMonthStockByCategory(
      categoryId,
      currentYear,
      currentMonth,
    );

    if (currentStock) {
      const currentPurchases = await productRepository.getPurchasesByStockId(
        currentStock.id,
      );
      const totalPurchasedCurrentMonth = currentPurchases.reduce(
        (sum, p) => sum + p.quantity,
        0,
      );

      const totalUsedCurrentMonth =
        await productRepository.getTotalUsedForMonth(
          categoryId,
          currentYear,
          currentMonth,
        );

      const newCurrentClosing =
        newOpeningQty + totalPurchasedCurrentMonth - totalUsedCurrentMonth;

      await productRepository.updateStockBalances(
        currentStock.id,
        newOpeningQty,
        newCurrentClosing,
        this.currentUser?.userId,
      );
    }
  }

  canPerformEditOperation(targetYear, targetMonth) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const allowedPrevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const allowedPrevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const isCurrentMonth =
      targetYear === currentYear && targetMonth === currentMonth;
    const isPreviousMonth =
      targetYear === allowedPrevYear && targetMonth === allowedPrevMonth;

    if (!isCurrentMonth && !isPreviousMonth) {
      throw new AppError(
        "You can only update the previous month and current month",
        409,
        "purchase_date",
      );
    } else {
      return true;
    }
  }
  getDiscountAndUnitPrice(purchases) {
    return purchases.map((p) => {
      const totalItems = p.quantity * p.quantity_per_unit;
      const netPrice = p.purchase_price - p.discount_amount;
      const unitPrice =
        totalItems > 0 ? parseFloat((netPrice / totalItems).toFixed(2)) : 0;
      return {
        ...p,
        discount_price: netPrice,
        unit_price: unitPrice,
      };
    });
  }
}
