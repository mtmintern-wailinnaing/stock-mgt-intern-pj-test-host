// repositories/compare-stock.repo.js

import { executeQuery } from "@/lib/db";

class CompareStockRepository {
  async getAvailableYears() {
    try {
      const query = `SELECT DISTINCT year FROM month ORDER BY year ASC`;
      const rows = await executeQuery(query);
      return rows.map((row) => String(row.year));
    } catch (error) {
      console.error("Error fetching available years:", error);
      return [];
    }
  }

  async executeStockComparisonQuery(startYear, startMonth, endYear, endMonth) {
    const query = `
      SELECT
        m.id AS monthly_stock_id,
        mo.year,
        mo.month AS month_num,
        p_c.name AS category_name,        
        c.name AS item_description,    
        IFNULL(w.used_qty_1st_week, 0) AS used_qty_1st_week,
        IFNULL(w.used_qty_2nd_week, 0) AS used_qty_2nd_week,
        IFNULL(w.used_qty_3rd_week, 0) AS used_qty_3rd_week,
        IFNULL(w.used_qty_4th_week, 0) AS used_qty_4th_week,
        IFNULL(w.used_qty_5th_week, 0) AS used_qty_5th_week,
        IFNULL(SUM(p.quantity), 0) AS total_purchase_qty,
        
       
        IFNULL(
          ROUND(
            CASE 
              WHEN SUM(p.quantity) > 0 THEN SUM(p.quantity * p.unit_price) / SUM(p.quantity)
              ELSE 0
            END, 2
          ), 0
        ) AS unit_price

      FROM monthly_stock_data m
      JOIN month mo ON m.month_id = mo.id
      JOIN category c ON m.category_id = c.id
      LEFT JOIN category p_c ON c.parent_id = p_c.id 
      LEFT JOIN weekly_stock_check w ON m.month_id = w.month_id AND m.category_id = w.category_id
      LEFT JOIN purchases p ON m.id = p.monthly_stock_id AND c.id = p.category_id
      WHERE
        STR_TO_DATE(CONCAT(mo.year, '-', mo.month, '-01'), '%Y-%m-%d')
        BETWEEN STR_TO_DATE(CONCAT(?, '-', ?, '-01'), '%Y-%m-%d')
          AND STR_TO_DATE(CONCAT(?, '-', ?, '-01'), '%Y-%m-%d')
      GROUP BY m.id, mo.year, mo.month, c.id, p_c.name 
      ORDER BY mo.year ASC, mo.month ASC, p_c.name ASC, c.name ASC;
    `;

    return await executeQuery(query, [
      startYear,
      startMonth,
      endYear,
      endMonth,
    ]);
  }
}

export const compareStockRepo = new CompareStockRepository();
