const pool = require("../config/db");

// Create Question with Options
const createQuestion = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
  quiz_id,
  category_id,
  question_text,
  explanation,
  options,
} = req.body;

    // Validation
    if (!quiz_id || !question_text || !options) {
      return res.status(400).json({
        message:
          "quiz_id, question_text and options are required",
      });
    }

    // At least 2 options
    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        message: "At least 2 options are required",
      });
    }

    // Check exactly one correct answer
    const correctOptions = options.filter(
      (option) => option.is_correct === true
    );

    if (correctOptions.length !== 1) {
      return res.status(400).json({
        message: "Exactly one option must be correct",
      });
    }

    await client.query("BEGIN");

    // Create question
    const questionResult = await client.query(
      `INSERT INTO questions
  (
    quiz_id,
    category_id,
    question_text,
    explanation
  )
 VALUES ($1, $2, $3, $4)
 RETURNING
    id,
    quiz_id,
    category_id,
    question_text,
    explanation,
    created_at,
    updated_at`,
[
  quiz_id,
  category_id || null,
  question_text,
  explanation || null,
]
    );

    const question = questionResult.rows[0];

    // Create options
    const createdOptions = [];

    for (const option of options) {
      const optionResult = await client.query(
        `INSERT INTO options
          (question_id, option_text, is_correct)
         VALUES ($1, $2, $3)
         RETURNING id, question_id, option_text,
                   is_correct, created_at, updated_at`,
        [
          question.id,
          option.option_text,
          option.is_correct,
        ]
      );

      createdOptions.push(optionResult.rows[0]);
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Question created successfully",
      question,
      options: createdOptions,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create question error:", error);

    res.status(500).json({
      message: "Server error",
    });
  } finally {
    client.release();
  }
};

// Get Questions with Options
const getQuestions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        q.id AS question_id,
        q.quiz_id,
        q.category_id,
        q.question_text,
        q.explanation,
        q.created_at,
        q.updated_at,
        o.id AS option_id,
        o.option_text,
        o.is_correct
      FROM questions q
      LEFT JOIN options o
        ON q.id = o.question_id
      ORDER BY q.created_at DESC, o.id ASC
    `);

    const questions = {};

    result.rows.forEach((row) => {
      if (!questions[row.question_id]) {
        questions[row.question_id] = {
          id: row.question_id,
          quiz_id: row.quiz_id,
          category_id: row.category_id,
          question_text: row.question_text,
          explanation: row.explanation,
          created_at: row.created_at,
          updated_at: row.updated_at,
          options: [],
        };
      }

      if (row.option_id) {
        questions[row.question_id].options.push({
          id: row.option_id,
          option_text: row.option_text,
          is_correct: row.is_correct,
        });
      }
    });

    res.status(200).json({
      questions: Object.values(questions),
    });
  } catch (error) {
    console.error("Get questions error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Update Question with Options
const updateQuestion = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const {
  category_id,
  question_text,
  explanation,
  options,
} = req.body;

    if (!question_text || !options) {
      return res.status(400).json({
        message: "question_text and options are required",
      });
    }

    if (!Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        message: "At least 2 options are required",
      });
    }

    const correctOptions = options.filter(
      (option) => option.is_correct === true
    );

    if (correctOptions.length !== 1) {
      return res.status(400).json({
        message: "Exactly one option must be correct",
      });
    }

    await client.query("BEGIN");

    // Check if question exists
    const questionCheck = await client.query(
      `SELECT id FROM questions WHERE id = $1`,
      [id]
    );

    if (questionCheck.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Question not found",
      });
    }

    // Update question
    const questionResult = await client.query(
      `UPDATE questions
 SET category_id = $1,
     question_text = $2,
     explanation = $3,
     updated_at = CURRENT_TIMESTAMP
 WHERE id = $4
 RETURNING
    id,
    quiz_id,
    category_id,
    question_text,
    explanation,
    created_at,
    updated_at`,
[
  category_id || null,
  question_text,
  explanation || null,
  id,
]
    );

    // Delete old options
    await client.query(
      `DELETE FROM options
       WHERE question_id = $1`,
      [id]
    );

    // Add updated options
    const updatedOptions = [];

    for (const option of options) {
      const optionResult = await client.query(
        `INSERT INTO options
          (question_id, option_text, is_correct)
         VALUES ($1, $2, $3)
         RETURNING id, question_id, option_text,
                   is_correct, created_at, updated_at`,
        [
          id,
          option.option_text,
          option.is_correct,
        ]
      );

      updatedOptions.push(optionResult.rows[0]);
    }

    await client.query("COMMIT");

    res.status(200).json({
      message: "Question updated successfully",
      question: questionResult.rows[0],
      options: updatedOptions,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Update question error:", error);

    res.status(500).json({
      message: "Server error",
    });
  } finally {
    client.release();
  }
};

// Delete Question
const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM questions
       WHERE id = $1
       RETURNING id, quiz_id, category_id, question_text`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Question not found",
      });
    }

    res.status(200).json({
      message: "Question deleted successfully",
      question: result.rows[0],
    });
  } catch (error) {
    console.error("Delete question error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
};