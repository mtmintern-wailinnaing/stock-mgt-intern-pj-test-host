import { executeQuery } from "@/lib/db";

// weeklystockcheck
export async function getWeeklyStockCheckRepo(monthId) {
  const query = `
    SELECT DISTINCT
      c.*,
      w.id AS stock_id,
      w.used_qty_1st_week,
      w.used_qty_2nd_week,
      w.used_qty_3rd_week,
      w.used_qty_4th_week,
      w.used_qty_5th_week,
      w.checked_week_1,
      w.checked_week_2,
      w.checked_week_3,
      w.checked_week_4,
      w.checked_week_5
    FROM category c
    LEFT JOIN category parent ON c.parent_id = parent.id
   
    LEFT JOIN weekly_stock_check w ON c.id = w.category_id
      AND w.month_id = ?
      AND w.deleted_at IS NULL
 
    LEFT JOIN monthly_stock_data m ON c.id = m.category_id
      AND m.month_id = ?
      AND m.deleted_at IS NULL
 
    LEFT JOIN category child ON c.id = child.parent_id AND child.deleted_at IS NULL
    LEFT JOIN monthly_stock_data m2 ON child.id = m2.category_id
      AND m2.month_id = ?
      AND m2.deleted_at IS NULL
 
    WHERE c.deleted_at IS NULL
      AND (m.id IS NOT NULL OR m2.id IS NOT NULL)
   ORDER BY 
  COALESCE(c.parent_id, c.id), 
  c.parent_id IS NOT NULL, 
  c.name ASC
  `;
 
  return await executeQuery(query, [monthId, monthId, monthId]);
}

export async function upsertWeeklyStockCheckRepo(data) {
  const query = `
    INSERT INTO weekly_stock_check 
      (month_id, category_id, used_qty_1st_week, used_qty_2nd_week, used_qty_3rd_week, used_qty_4th_week, used_qty_5th_week, 
       checked_week_1, checked_week_2, checked_week_3, checked_week_4, checked_week_5,created_by,updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)
    ON DUPLICATE KEY UPDATE
      used_qty_1st_week = VALUES(used_qty_1st_week),
      used_qty_2nd_week = VALUES(used_qty_2nd_week),
      used_qty_3rd_week = VALUES(used_qty_3rd_week),
      used_qty_4th_week = VALUES(used_qty_4th_week),
      used_qty_5th_week = VALUES(used_qty_5th_week),
      checked_week_1 = VALUES(checked_week_1),
      checked_week_2 = VALUES(checked_week_2),
      checked_week_3 = VALUES(checked_week_3),
      checked_week_4 = VALUES(checked_week_4),
      checked_week_5 = VALUES(checked_week_5),
      updated_by=VALUES(updated_by),
      updated_at = NOW()
  `;

  const params = [
    data.month_id,
    data.category_id,
    data.used_qty_1st_week ?? 0,
    data.used_qty_2nd_week ?? 0,
    data.used_qty_3rd_week ?? 0,
    data.used_qty_4th_week ?? 0,
    data.used_qty_5th_week ?? 0,
    data.checked_week_1 ? 1 : 0,
    data.checked_week_2 ? 1 : 0,
    data.checked_week_3 ? 1 : 0,
    data.checked_week_4 ? 1 : 0,
    data.checked_week_5 ? 1 : 0,
    data.currentUserId ?? null,
    data.currentUserId ?? null,
  ];

  return await executeQuery(query, params);
}

// opening + purchase qty
export async function getAvailableStockRepo(monthId,categoryId){
  const query = `SELECT msd.id AS monthly_stock_id, msd.month_id, msd.category_id ,MAX(msd.opening_qty) AS opening_qty,COALESCE(SUM(p.quantity),0) AS total_purchased FROM monthly_stock_data msd LEFT JOIN purchases p ON msd.id = p.monthly_stock_id WHERE msd.month_id = ? AND msd.category_id = ? AND p.deleted_at is NULL GROUP BY msd.id,msd.opening_qty`;
  const result = await executeQuery(query, [monthId,categoryId]);
  return result[0] || {monthly_stock_id:null,opening_qty:0,total_purchased:0}
}

// closing qty
export async function updateClosingQty(monthId,categoryId, closingQty) {
  const query = `UPDATE monthly_stock_data SET closing_qty = ? WHERE month_id = ? and category_id=? and deleted_at is NULL`;
  return await executeQuery(query, [closingQty, monthId,categoryId]);
}