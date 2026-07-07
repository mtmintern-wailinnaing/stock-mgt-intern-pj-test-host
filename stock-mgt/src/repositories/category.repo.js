import { executeQuery } from "@/lib/db";

export async function getCategoryByIdRepo(id) {
  const rows = await executeQuery(
    "SELECT * FROM category WHERE id = ? AND deleted_at IS NULL",
    [id],
  );
  return rows[0] || null;
}

export async function getCategoryByNameRepo(name) {
  const rows = await executeQuery(
    "SELECT * FROM category WHERE name = ? AND deleted_at IS NULL",
    [name],
  );
  return rows[0] || null;
}

export async function createCategoryRepo(data) {
  const result = await executeQuery(
    `INSERT INTO category (name, parent_id, minimum_threshold, remark) 
     VALUES (?, ?, ?, ?)`,
    [
      data.name,
      data.parent_id || null,
      data.minimum_threshold ?? 0,
      data.remark || null,
    ],
  );
  return result;
}

export async function getAllCategoriesRepo() {
  const rows = await executeQuery(
    "SELECT * FROM category WHERE deleted_at IS NULL ORDER BY created_at DESC",
  );
  return rows;
}

export async function updateCategoryRepo(id, data) {
  const { name, minimum_threshold, remark } = data;

  const result = await executeQuery(
    `UPDATE category 
     SET 
       name = ?,
       minimum_threshold = ?,
       remark = ?,
       updated_at = NOW()
     WHERE id = ? AND deleted_at IS NULL`,
    [name, minimum_threshold, remark, id],
  );
  return result;
}

export async function deleteCategoryRepo(id) {
  const result = await executeQuery(
    `UPDATE category 
     SET deleted_at = NOW() 
     WHERE id = ? AND deleted_at IS NULL`,
    [id],
  );

  return result;
}

export async function getSubcategoriesRepo(parentId) {
  const rows = await executeQuery(
    "SELECT * FROM category WHERE parent_id = ? AND deleted_at IS NULL",
    [parentId],
  );

  return rows;
}

export async function checkActiveStockRepo(categoryId) {
  const rows = await executeQuery(
    "SELECT 1 FROM monthly_stock_data WHERE category_id = ? AND deleted_at IS NULL LIMIT 1",
    [categoryId],
  );
  return rows.length > 0;
}

export async function checkPurchasesRepo(categoryId) {
  const rows = await executeQuery(
    "SELECT 1 FROM purchases WHERE category_id = ? AND deleted_at IS NULL LIMIT 1",
    [categoryId],
  );
  return rows.length > 0;
}
