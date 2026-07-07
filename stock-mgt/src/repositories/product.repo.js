import { executeQuery, pool } from "@/lib/db";
import { AppError } from "@/lib/errors";
 
export const productRepository = {
  async findMonthlyStockById(msdId) {
    const query = `
      SELECT
        msd.id,
        msd.category_id,
        c.parent_id,
        c.name AS category_name,
        msd.opening_qty,
        msd.closing_qty,
        m.month AS ledger_month,
        m.year AS ledger_year
      FROM monthly_stock_data msd
      INNER JOIN category c ON msd.category_id = c.id
      INNER JOIN month m ON msd.month_id = m.id
      WHERE msd.id = ? AND msd.deleted_at IS NULL
      LIMIT 1
    `;
    const [rows] = await pool.execute(query, [msdId]);
    return rows[0] || null;
  },
 
  async findCategoryById(categoryId) {
    const query = `
      SELECT id AS category_id, parent_id, name AS category_name
      FROM category
      WHERE id = ? AND deleted_at IS NULL
    `;
    const [rows] = await pool.execute(query, [categoryId]);
    return rows[0] || null;
  },
 
  async findPurchasesByStockId(stockId) {
    const query = `
      SELECT id, monthly_stock_id, category_id, purchase_date, quantity, purchase_price,
             discount_price, quantity_per_unit, unit_price, discount_amount
      FROM purchases
      WHERE monthly_stock_id = ? AND deleted_at IS NULL
      ORDER BY purchase_date DESC, id ASC
    `;
    const [rows] = await pool.execute(query, [stockId]);
    return rows || [];
  },
 
  async findPurchasesByCategoryIdWithoutStock(categoryId) {
    const query = `
      SELECT id, monthly_stock_id, category_id, purchase_date, quantity, purchase_price,
             discount_price, quantity_per_unit, unit_price, discount_amount
      FROM purchases
      WHERE category_id = ? AND monthly_stock_id IS NULL AND deleted_at IS NULL
      ORDER BY purchase_date DESC, id ASC
    `;
    const [rows] = await pool.execute(query, [categoryId]);
    return rows || [];
  },
 
  async getTotalUsedForMonth(categoryId, year, month) {
    try {
      const query = `
        SELECT
          (COALESCE(wsc.used_qty_1st_week, 0) +
           COALESCE(wsc.used_qty_2nd_week, 0) +
           COALESCE(wsc.used_qty_3rd_week, 0) +
           COALESCE(wsc.used_qty_4th_week, 0) +
           COALESCE(wsc.used_qty_5th_week, 0)) as total_used
        FROM weekly_stock_check wsc
        INNER JOIN month m ON wsc.month_id = m.id
        WHERE wsc.category_id = ? AND wsc.deleted_at is NULL AND m.year = ? AND m.month = ?
        LIMIT 1
      `;
      const [rows] = await pool.execute(query, [categoryId, year, month]);
 
      return rows.length > 0 ? Number(rows[0].total_used || 0) : 0;
    } catch (error) {
      console.error(error);
      throw new AppError(
        "Failed to calculate monthly stock usage totals.",
        500,
        "db",
      );
    }
  },
  // get previous month closingQty
  async getPreviousMonthClosing(categoryId, prevYear, prevMonth) {
    try {
      const query = `
        SELECT msd.closing_qty
        FROM monthly_stock_data msd
        INNER JOIN month m ON msd.month_id = m.id
        WHERE msd.category_id = ? AND msd.deleted_at is NULL AND m.year = ? AND m.month = ?
        LIMIT 1
      `;
      const [rows] = await pool.execute(query, [
        categoryId,
        prevYear,
        prevMonth,
      ]);
      return rows.length > 0 ? rows[0].closing_qty : 0;
    } catch (error) {
      console.error(error);
      throw new AppError(
        "Failed to fetch previous month stock data.",
        500,
        "db",
      );
    }
  },
 
  // getting current stock by category
  async getCurrentMonthStockByCategory(categoryId, year, month) {
    try {
      const query = `
        SELECT msd.id, msd.opening_qty
        FROM monthly_stock_data msd
        INNER JOIN month m ON msd.month_id = m.id
        WHERE msd.category_id = ? AND m.year = ? AND m.month = ? AND deleted_at is NULL
        LIMIT 1
      `;
      const [rows] = await pool.execute(query, [categoryId, year, month]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(error);
      throw new AppError("Failed to verify active stock records.", 500, "db");
    }
  },
 
  async getCurrentMonthStockById(id) {
    if (!id) return null;
    try {
      const query = `SELECT opening_qty FROM monthly_stock_data WHERE id = ? LIMIT 1 and deleted_at is NULL`;
      const [rows] = await pool.execute(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      throw new AppError(
        "Failed to fetch current month stock data.",
        500,
        "db",
      );
    }
  },
 
  async getStockWithMonthDetailsById(id) {
    try {
      const query = `
        SELECT msd.id, msd.category_id, msd.opening_qty, m.year, m.month
        FROM monthly_stock_data msd
        INNER JOIN month m ON msd.month_id = m.id
        WHERE msd.id = ? and msd.deleted_at is NULL LIMIT 1
      `;
      const rows = await executeQuery(query, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error(error);
      throw new AppError(
        "Failed to fetch target stock detail history.",
        500,
        "db",
      );
    }
  },
 
  // get purchases by stockId
  async getPurchasesByStockId(stockId) {
    try {
      const query = `SELECT quantity FROM purchases WHERE monthly_stock_id = ?`;
      const [rows] = await pool.execute(query, [stockId]);
      return rows;
    } catch (error) {
      console.error(error);
      throw new AppError(
        "Failed to retrieve associated stock purchases.",
        500,
        "db",
      );
    }
  },
 
  // update stockBalnace
  async updateStockBalances(id, openingQty, closingQty, currentUser) {
    try {
      const query = `UPDATE monthly_stock_data SET opening_qty = ?, closing_qty = ?, updated_at = NOW(),updated_by=? WHERE id = ?`;
      await pool.execute(query, [openingQty, closingQty, currentUser, id]);
    } catch (error) {
      console.error(error);
      throw new AppError(
        "Failed to update cascaded stock tracking figures.",
        500,
        "db",
      );
    }
  },
 
  // save with transition
  async saveStockAndPurchasesTransaction({
    stockData,
    purchases,
    currentUser,
    isEditMode,
  }) {
    let connection;
    try {
      connection = await pool.getConnection();
      await connection.beginTransaction();
 
      let stockId = stockData.id;
 
      if (isEditMode) {
        if (!stockId) {
          throw new AppError(
            "Missing target stock record ID for update operations.",
            400,
            "db",
          );
        }
 
        //  Update montly_stock_data
        const updateStockQuery = `
          UPDATE monthly_stock_data
          SET opening_qty = ?, closing_qty = ?, updated_at = NOW(), updated_by=?
          WHERE id = ?
        `;
        await connection.execute(updateStockQuery, [
          stockData.opening_qty || 0,
          stockData.closing_qty || 0,
          currentUser,
          stockId,
        ]);
 
        // 2. get deleted purchase in edit mode
        const activeInputIds = purchases
          .map((p) => p.id)
          .filter((id) => id && !String(id).startsWith("new-"));
 
        if (activeInputIds.length > 0) {
          // If the user kept some items, delete anything NOT in that list
          const placeholders = activeInputIds.map(() => "?").join(",");
          const deleteRemovedQuery = `
            UPDATE purchases
            SET deleted_at = NOW() AND updated_by=?
            WHERE monthly_stock_id = ? AND id NOT IN (${placeholders})
          `;
          await connection.execute(deleteRemovedQuery, [
            currentUser,
            stockId,
            ...activeInputIds,
          ]);
        } else {
          await connection.execute(
            `UPDATE purchases SET deleted_at = NOW() WHERE monthly_stock_id = ? and updated_by=?`,
            [stockId, currentUser],
          );
        }
      } else {
        const findMonthQuery = `SELECT id FROM month WHERE month = ? AND year = ? LIMIT 1`;
        const [monthRows] = await connection.execute(findMonthQuery, [
          stockData.month,
          stockData.year,
        ]);
 
        let monthId;
        if (monthRows.length > 0) {
          monthId = monthRows[0].id;
        } else {
          const insertMonthQuery = `INSERT INTO month (month, year) VALUES (?, ?)`;
          const [monthResult] = await connection.execute(insertMonthQuery, [
            stockData.month,
            stockData.year,
          ]);
          monthId = monthResult.insertId;
        }
 
        const insertStockQuery = `
          INSERT INTO monthly_stock_data (month_id, category_id, opening_qty, closing_qty, created_by)
          VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await connection.execute(insertStockQuery, [
          monthId,
          stockData.category_id,
          stockData.opening_qty || 0,
          stockData.closing_qty || 0,
          currentUser,
        ]);
        stockId = result.insertId;
      }
 
      // insert new  purchases
      const insertPurchaseQuery = `
        INSERT INTO purchases (monthly_stock_id, category_id, purchase_date, quantity, purchase_price, discount_amount, discount_price, quantity_per_unit, unit_price,created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?)
      `;
      // update old purchases
      const updatePurchaseQuery = `
        UPDATE purchases
        SET purchase_date = ?, quantity = ?, purchase_price = ?, discount_amount = ?, discount_price = ?, quantity_per_unit = ?, unit_price = ?, updated_at = NOW(),updated_by=?
        WHERE id = ? AND monthly_stock_id = ?
      `;
 
      for (const p of purchases) {
        const isNewItem = !p.id || String(p.id).startsWith("new-");
 
        if (isNewItem) {
          await connection.execute(insertPurchaseQuery, [
            stockId,
            stockData.category_id,
            p.purchase_date,
            p.quantity,
            p.purchase_price || 0.0,
            p.discount_amount || 0.0,
            p.discount_price || 0.0,
            p.quantity_per_unit || 1,
            p.unit_price,
            currentUser,
          ]);
        } else {
          // update
          await connection.execute(updatePurchaseQuery, [
            p.purchase_date,
            p.quantity,
            p.purchase_price || 0.0,
            p.discount_amount || 0.0,
            p.discount_price || 0.0,
            p.quantity_per_unit || 1,
            p.unit_price,
            currentUser,
            p.id,
            stockId,
          ]);
        }
      }
 
      await connection.commit();
      return { stockId };
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("Transaction Error context execution trace:", error);
      throw new AppError(
        error.message || "Transaction failed operation.",
        500,
        "db",
      );
    } finally {
      if (connection) connection.release();
    }
  },
};
 
 