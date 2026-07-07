import { AppError } from "@/lib/errors";
import {
  getAvailableStockRepo,
  getWeeklyStockCheckRepo,
  updateClosingQty,
  upsertWeeklyStockCheckRepo,
} from "@/repositories/stockcheck.repo";
import { isMonthEditable } from "@/lib/stock-utils";
import { executeQuery } from "@/lib/db";

export async function getWeeklyStockCheckService(monthId) {
  const monthInfo = await executeQuery(
    "SELECT month, year FROM month WHERE id = ?",
    [monthId],
  );
  if (monthInfo.length === 0) throw new Error("Invalid Month ID");

  const { month: targetMonth, year: targetYear } = monthInfo[0];
  const now = new Date();
  const isEditable = isMonthEditable(
    now.getFullYear(),
    now.getMonth() + 1,
    targetYear,
    targetMonth,
  );

  const flatData = await getWeeklyStockCheckRepo(monthId);
  const map = {};
  const roots = [];

  flatData.forEach((category) => {
    map[category.id] = { ...category, children: [] };
  });

  flatData.forEach((category) => {
    if (category.parent_id && map[category.parent_id]) {
      map[category.parent_id].children.push(map[category.id]);
    } else {
      roots.push(map[category.id]);
    }
  }); 
  return {
    isEditable,
    month: targetMonth,
    year: targetYear,
    data: roots,
  };
}

export async function upsertWeeklyStockCheckService(data) {
  const monthInfo = await executeQuery(
    "SELECT month,year FROM month WHERE id = ?",
    [data.month_id],
  );
 
  if (monthInfo.length === 0) {
    console.error("Month ID not found in DB:", data.month_id);
    throw new Error("Invalid Month ID");
  }
 
  const { month: targetMonth, year: targetYear } = monthInfo[0];
  const now = new Date();
  if (
    !isMonthEditable(
      now.getFullYear(),
      now.getMonth() + 1,
      targetYear,
      targetMonth,
    )
  ) {
    throw new Error("This month's data is read-only!");
  }
 
  const totalUsed =
    Number(data.used_qty_1st_week || 0) +
    Number(data.used_qty_2nd_week || 0) +
    Number(data.used_qty_3rd_week || 0) +
    Number(data.used_qty_4th_week || 0) +
    Number(data.used_qty_5th_week || 0);
 
  const summary = await getAvailableStockRepo(data.month_id, data.category_id);
  const availableStock =
    Number(summary.opening_qty) + Number(summary.total_purchased);
  const closingQty = availableStock - totalUsed;
 
  if (totalUsed > availableStock) {
    throw new AppError(
      `Insufficient Stock! Available Stock: ${availableStock}`,
    );
  }
 
  const result = await upsertWeeklyStockCheckRepo(data); 
  await updateClosingQty(summary.month_id,summary.category_id, closingQty);
 
  const nextMonthInfo = await executeQuery(
    `SELECT id FROM month
     WHERE (year > ? OR (year = ? AND month > ?))
     ORDER BY year ASC, month ASC LIMIT 1`,
    [targetYear, targetYear, targetMonth],
  );
 
  if (nextMonthInfo.length > 0) {
    const nextMonthId = nextMonthInfo[0].id;
    const nextMonthStock = await executeQuery(
      "SELECT opening_qty, closing_qty FROM monthly_stock_data WHERE month_id = ? AND category_id = ? AND deleted_at IS NULL",
      [nextMonthId, data.category_id],
    );

    if (nextMonthStock.length > 0) {
      const nextOpening = Number(nextMonthStock[0].opening_qty || 0);
    const nextClosing = Number(nextMonthStock[0].closing_qty || 0);

    const newNextOpening = closingQty;

      const usage =nextOpening- nextClosing;

      const newNextClosing = newNextOpening - usage;
      await executeQuery(
        "UPDATE monthly_stock_data SET opening_qty = ? , closing_qty=? WHERE month_id = ? and category_id=? and deleted_at is NULL",
        [newNextOpening, newNextClosing, nextMonthId, data.category_id],
      );

    if (newNextClosing < 0) {
    return {
      success: true,
      warning: "Negative stock detected in next month!",
      result: result,
    };
  }
}
  }
  return result;
}


 
