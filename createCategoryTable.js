require("dotenv").config();

const pool = require("./config/db");

async function createCategoryTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Categories table created successfully");
  } catch (error) {
    console.error("❌ Error creating categories table:", error);
  } finally {
    await pool.end();
  }
}

createCategoryTable();