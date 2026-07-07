import { executeQuery } from "@/lib/db";

export async function getPurchaseByIdRepo(id) {
  const rows = await executeQuery(
    "SELECT * FROM purchases WHERE id = ? AND deleted_at IS NULL",
    [id],
  );
  return rows[0] || null;
}

export async function getAllPurchasesRepo() {
  const rows = await executeQuery(
    `SELECT p.*, c.name as categoryName 
     FROM purchases p
     JOIN category c ON p.category_id = c.id
     WHERE p.deleted_at IS NULL
     ORDER BY p.purchase_date DESC`,
  );
  return rows;
}

export async function getPurchasesByCategoryIdRepo(categoryId) {
  const rows = await executeQuery(
    "SELECT * FROM purchases WHERE category_id = ? AND deleted_at IS NULL ORDER BY purchase_date DESC",
    [categoryId],
  );
  return rows;
}

export async function getPurchasesByMonthlyStockIdRepo(monthlyStockId) {
  const rows = await executeQuery(
    "SELECT * FROM purchases WHERE monthly_stock_id = ? AND deleted_at IS NULL",
    [monthlyStockId],
  );
  return rows;
}