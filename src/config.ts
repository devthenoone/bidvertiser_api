import * as mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

// Create MySQL connection pool
const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "bidvertiser1",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  waitForConnections: true,
  connectionLimit: 100,
  queueLimit: 0,
});

// Check database connection
const checkDbConnection = async () => {
  try {
    const connection = await db.getConnection();
    console.log("Database connected successfully!");
    connection.release();
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1);
  }
};
checkDbConnection();

export default db;
