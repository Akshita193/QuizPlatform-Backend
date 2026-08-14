const pool = require("../config/db");

//create quiz
const createQuiz = async (req, res) => {
  try {
    const { title, description } = req.body;

    // Check required field
    if (!title) {
      return res.status(400).json({
        message: "Quiz title is required",
      });
    }

    // Create quiz
    const result = await pool.query(
      `INSERT INTO quizzes (title, description, created_by)
       VALUES ($1, $2, $3)
       RETURNING id, title, description, created_by, is_published, created_at, updated_at`,
      [title, description || null, req.user.id]
    );

    res.status(201).json({
      message: "Quiz created successfully",
      quiz: result.rows[0],
    });
  } catch (error) {
    console.error("Create quiz error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

//update quiz
const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Quiz title is required",
      });
    }

    const result = await pool.query(
      `UPDATE quizzes
       SET title = $1,
           description = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, title, description, created_by, is_published, created_at, updated_at`,
      [title, description || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    res.status(200).json({
      message: "Quiz updated successfully",
      quiz: result.rows[0],
    });
  } catch (error) {
    console.error("Update quiz error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

//Delete Quiz
const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM quizzes
       WHERE id = $1
       RETURNING id, title, description, created_by`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    res.status(200).json({
      message: "Quiz deleted successfully",
      quiz: result.rows[0],
    });
  } catch (error) {
    console.error("Delete quiz error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


//publish Quiz
const publishQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_published } = req.body;

    if (typeof is_published !== "boolean") {
      return res.status(400).json({
        message: "is_published must be true or false",
      });
    }

    const result = await pool.query(
      `UPDATE quizzes
       SET is_published = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, title, description, created_by, is_published, created_at, updated_at`,
      [is_published, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Quiz not found",
      });
    }

    res.status(200).json({
      message: is_published
        ? "Quiz published successfully"
        : "Quiz unpublished successfully",
      quiz: result.rows[0],
    });
  } catch (error) {
    console.error("Publish/unpublish quiz error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const getQuizzes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        title,
        description,
        created_by,
        is_published,
        created_at,
        updated_at
       FROM quizzes
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      quizzes: result.rows,
    });
  } catch (error) {
    console.error("Get quizzes error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get published quizzes for normal users
const getPublishedQuizzes = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        title,
        description,
        created_by,
        is_published,
        created_at,
        updated_at
       FROM quizzes
       WHERE is_published = true
       ORDER BY created_at DESC`
    );

    res.status(200).json({
      quizzes: result.rows,
    });
  } catch (error) {
    console.error("Get published quizzes error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// Get questions for a published quiz for students
const getPublishedQuizQuestions = async (req, res) => {
  try {
    const { id } = req.params;

    // First check that the quiz exists and is published
    const quizResult = await pool.query(
      `SELECT id, title, description
       FROM quizzes
       WHERE id = $1
         AND is_published = true`,
      [id]
    );

    if (quizResult.rows.length === 0) {
      return res.status(404).json({
        message: "Published quiz not found",
      });
    }

    const quiz = quizResult.rows[0];

    // Get questions and options
    const result = await pool.query(
      `SELECT
        q.id AS question_id,
        q.question_text,
        o.id AS option_id,
        o.option_text
       FROM questions q
       LEFT JOIN options o
         ON q.id = o.question_id
       WHERE q.quiz_id = $1
       ORDER BY q.id ASC, o.id ASC`,
      [id]
    );

    const questions = {};

    result.rows.forEach((row) => {
      if (!questions[row.question_id]) {
        questions[row.question_id] = {
          id: row.question_id,
          question_text: row.question_text,
          options: [],
        };
      }

      if (row.option_id) {
        questions[row.question_id].options.push({
          id: row.option_id,
          option_text: row.option_text,
        });
      }
    });

    res.status(200).json({
      quiz,
      questions: Object.values(questions),
    });
  } catch (error) {
    console.error(
      "Get published quiz questions error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  getQuizzes,
  getPublishedQuizzes,
  getPublishedQuizQuestions,
};