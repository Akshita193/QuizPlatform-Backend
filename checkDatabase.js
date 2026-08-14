require("dotenv").config();

const pool = require("./config/db");

async function checkDatabase() {
  try {
    const result = await pool.query(`
      SELECT
        table_schema,
        table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);

    console.table(result.rows);
  } catch (error) {
    console.error("Database error:", error);
  } finally {
    await pool.end();
  }
}

checkDatabase();
