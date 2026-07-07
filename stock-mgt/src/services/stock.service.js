import {
  getMonthsRepo,
  createMonthRepo,
  getMonthByPeriodRepo,
  getRawStockReportRepo,
  getActiveStockFromMonthRepo,
  batchInsertNewMonthStockRepo,
  deleteItem,
} from "@/repositories/stock.repo";
import { AppError } from "@/lib/errors";

export async function getAllMonths() {
  try {
    const months = await getMonthsRepo();
    return months;
  } catch (error) {
    throw new AppError(
      error.message || "Failed to retrieve month records",
      500,
    );
  }
}

/**
 * @param {Object} data - Contains { month, year }
 */
export async function createMonth(data) {
  const { month, year, createdBy } = data;

  if (!month || !year) {
    throw new AppError("Month and Year are required fields.", 400);
  }

  const parsedMonth = Number(month);
  if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    throw new AppError(
      "Invalid month value. Must be between 1 and 12.",
      400,
      "month",
    );
  }

  const existingMonth = await getMonthByPeriodRepo(parsedMonth, year);
  if (existingMonth) {
    throw new AppError("This month and year already exists.", 400, "month");
  }

  try {
    const resultId = await createMonthRepo({ month: parsedMonth, year });

    let prevMonth = parsedMonth - 1;
    let prevYear = Number(year);

    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear = prevYear - 1;
    }

    const previousMonthRecord = await getMonthByPeriodRepo(prevMonth, prevYear);

    if (previousMonthRecord && previousMonthRecord.id) {
      const previousStocks = await getActiveStockFromMonthRepo(
        previousMonthRecord.id,
      );

      if (previousStocks && previousStocks.length > 0) {
        const carryOverRecords = previousStocks.map((stock) => ({
          newMonthId: resultId,
          category_id: stock.category_id,
          closing_qty: stock.closing_qty,
          created_by: createdBy || stock.created_by,
        }));

        await batchInsertNewMonthStockRepo(carryOverRecords);
      }
    }

    return {
      id: resultId,
      message:
        "Month created and previous stock balance carried over successfully.",
    };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new AppError("This month and year already exists.", 400, "month");
    }
    throw new AppError(
      error.message || "Failed to create a new month record.",
      500,
    );
  }
}

export async function getStockReportByMonth(monthId) {
  if (!monthId) {
    throw new AppError("Month ID is required.", 400);
  }

  try {
    const rawRows = await getRawStockReportRepo(monthId);
    const calculatedItems = rawRows.map((row) => {
      const purchaseQty1st = Number(row.purchase_qty_1st || 0);
      const purchaseQty2nd = Number(row.purchase_qty_2nd || 0);
      const purchaseQty3rd = Number(row.purchase_qty_3rd || 0);
      const totalPrice = Number(row.total_discount_price || 0);

      const openingQty = Number(row.opening_qty || 0);
      const totalPurchase = purchaseQty1st + purchaseQty2nd + purchaseQty3rd;

      const used1 = Number(row.used_qty_1st_week || 0);
      const used2 = Number(row.used_qty_2nd_week || 0);
      const used3 = Number(row.used_qty_3rd_week || 0);
      const used4 = Number(row.used_qty_4th_week || 0);
      const used5 = Number(row.used_qty_5th_week || 0);

      const checked_week_1 = Number(row.checked_week_1 || 0);
      const checked_week_2 = Number(row.checked_week_2 || 0);
      const checked_week_3 = Number(row.checked_week_3 || 0);
      const checked_week_4 = Number(row.checked_week_4 || 0);
      const checked_week_5 = Number(row.checked_week_5 || 0);
      const totalUsed = used1 + used2 + used3 + used4 + used5;
     const closingQty = Number(row.closing_qty || 0);
    //const closingQty = openingQty + totalPurchase - totalUsed;

      return {
        id: row.monthly_stock_id,
        monthlyStockId: row.monthly_stock_id,
        categoryId: row.category_id,
        itemName: row.item_name,
        parentId: row.parent_id,
        parentName: row.parent_category_name || null,
        price: totalPrice,
        openingQty: openingQty,
        purchaseQty1st,
        purchaseQty2nd,
        purchaseQty3rd,
        totalPurchase,
        usedQty1stWeek: used1,
        usedQty2ndWeek: used2,
        usedQty3rdWeek: used3,
        usedQty4thWeek: used4,
        usedQty5thWeek: used5,
        checked_week_1,
        checked_week_2,
        checked_week_3,
        checked_week_4,
        checked_week_5,
        totalUsed,
        closingQty,
        minimumThreshold: row.minimum_threshold,
      };
    });

    return calculatedItems;
  } catch (error) {
    throw new AppError(
      error.message || "Failed to process stock report data.",
      500,
    );
  }
}

export async function deleteStock(categoryId) {
  const success = await deleteItem(categoryId);
  if (!success) {
    throw new Error("No Record to delete");
  }

  return { message: "Record Deleted" };
}

export const monthService = {
  getAllMonths,
  createMonth,
  getStockReportByMonth,
  deleteStock,
};
