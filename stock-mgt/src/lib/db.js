import mysql from "mysql2/promise";
import { AppError } from "./errors";
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "4000", 10),
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
  // This matches the ssl={"rejectUnauthorized":true} shown in your image URI
  ssl: {
    rejectUnauthorized: true,
  },
  // sessionVariables: {
  //   sql_mode:
  //     "STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION",
  // },
});

// Helper function to execute queries
export async function executeQuery(query, params = []) {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.execute(
      `SET SESSION sql_mode=(SELECT REPLACE(@@sql_mode,'ONLY_FULL_GROUP_BY',''))`,
    );
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.info(error);
    throw new AppError("Database server connection failed.", 500, "db");
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
