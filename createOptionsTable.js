require("dotenv").config();

const pool = require("./config/db");

async function createOptionsTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS options (
        id SERIAL PRIMARY KEY,
        question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        option_text TEXT NOT NULL,
        is_correct BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("✅ Options table created successfully");
  } catch (error) {
    console.error("❌ Error creating options table:", error);
  } finally {
    await pool.end();
  }
}

createOptionsTable();