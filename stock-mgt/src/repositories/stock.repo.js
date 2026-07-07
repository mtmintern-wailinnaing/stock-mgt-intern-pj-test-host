import { executeQuery } from "@/lib/db";

export async function getMonthsRepo() {
  return await executeQuery(
    "SELECT * FROM month ORDER BY year DESC, month DESC",
  );
}

export async function getMonthByPeriodRepo(month, year) {
  const rows = await executeQuery(
    "SELECT * FROM month WHERE month = ? AND year = ? LIMIT 1",
    [month, year],
  );

  return rows[0] || null;
}

export async function createMonthRepo({ month, year }) {
  const result = await executeQuery(
    "INSERT INTO month (month, year) VALUES (?, ?)",
    [month, year],
  );

  return result.insertId;
}

export async function getActiveStockFromMonthRepo(monthId) {
  const query = `
    SELECT category_id, closing_qty, created_by 
    FROM monthly_stock_data 
    WHERE month_id = ? AND deleted_at IS NULL;
  `;
  return await executeQuery(query, [Number(monthId)]);
}

export async function batchInsertNewMonthStockRepo(records) {
  if (!records || records.length === 0) return true;

  const placeholders = records.map(() => "(?, ?, ?, ?, ?)").join(", ");
  const query = `
    INSERT INTO monthly_stock_data (month_id, category_id, opening_qty, closing_qty, created_by)
    VALUES ${placeholders};
  `;

  const queryParams = [];
  records.forEach((rec) => {
    queryParams.push(
      Number(rec.newMonthId),
      Number(rec.category_id),
      Number(rec.closing_qty),
      0,
      Number(rec.created_by),
    );
  });

  return await executeQuery(query, queryParams);
}

/**
 * @param {number|string} monthId
 */
export async function getRawStockReportRepo(monthId) {
  const parsedMonthId = Number(monthId);

  const query = `
    WITH RankedPurchases AS (
      SELECT 
        p.monthly_stock_id,
        p.category_id,
        p.quantity,
        p.discount_price,
        ROW_NUMBER() OVER (PARTITION BY p.monthly_stock_id, p.category_id ORDER BY p.purchase_date ASC, p.id ASC) AS row_num
      FROM purchases p
      INNER JOIN monthly_stock_data m_stock ON p.monthly_stock_id = m_stock.id
      WHERE p.deleted_at IS NULL AND m_stock.month_id = ?
    )
    SELECT 
      m.id AS monthly_stock_id, 
      m.month_id,
      m.category_id,
      m.opening_qty,
      m.closing_qty,
      c.name AS item_name,     
      c.minimum_threshold,
      c.parent_id,
      p_cat.name AS parent_category_name, 
      
      COALESCE(MAX(CASE WHEN rp.row_num = 1 THEN rp.quantity END), 0) AS purchase_qty_1st,
      COALESCE(MAX(CASE WHEN rp.row_num = 2 THEN rp.quantity END), 0) AS purchase_qty_2nd,
      COALESCE(MAX(CASE WHEN rp.row_num = 3 THEN rp.quantity END), 0) AS purchase_qty_3rd,
      COALESCE(SUM(rp.discount_price), 0) AS total_discount_price,
      
      COALESCE(w.used_qty_1st_week, 0) AS used_qty_1st_week,
      COALESCE(w.used_qty_2nd_week, 0) AS used_qty_2nd_week,
      COALESCE(w.used_qty_3rd_week, 0) AS used_qty_3rd_week,
      COALESCE(w.used_qty_4th_week, 0) AS used_qty_4th_week,
      COALESCE(w.used_qty_5th_week, 0) AS used_qty_5th_week,
      
      w.checked_week_1 AS checked_week_1,
      w.checked_week_2 AS checked_week_2,
      w.checked_week_3 AS checked_week_3,
      w.checked_week_4 AS checked_week_4,
      w.checked_week_5 AS checked_week_5

      
    FROM monthly_stock_data m
    LEFT JOIN category c ON m.category_id = c.id AND c.deleted_at IS NULL
    LEFT JOIN category p_cat ON c.parent_id = p_cat.id AND p_cat.deleted_at IS NULL
    LEFT JOIN weekly_stock_check w ON m.month_id = w.month_id 
      AND m.category_id = w.category_id 
      AND w.deleted_at IS NULL
    LEFT JOIN RankedPurchases rp ON m.id = rp.monthly_stock_id AND m.category_id = rp.category_id
    WHERE m.month_id = ? AND m.deleted_at IS NULL
    GROUP BY m.id, c.id, p_cat.id
    ORDER BY COALESCE(c.parent_id, c.id), c.parent_id IS NOT NULL, c.name ASC;
  `;

  return await executeQuery(query, [parsedMonthId, parsedMonthId]);
}

export async function deleteItem(targetId) {
  const query = `UPDATE monthly_stock_data msd
      INNER JOIN month m ON msd.month_id = m.id
      LEFT JOIN weekly_stock_check wsc
      ON wsc.month_id = msd.month_id
      AND wsc.category_id = msd.category_id
      AND wsc.deleted_at IS NULL
      LEFT JOIN purchases p
      ON YEAR(p.purchase_date) = m.year
      AND MONTH(p.purchase_date) = m.month
      AND p.category_id = msd.category_id
      AND p.deleted_at IS NULL
      SET msd.deleted_at = CURRENT_TIMESTAMP,
          wsc.deleted_at = CURRENT_TIMESTAMP,
          p.deleted_at = CURRENT_TIMESTAMP
      WHERE msd.id = ? 
      AND msd.deleted_at IS NULL`;

  return await executeQuery(query, [targetId]);
}
