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

module.exports = {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  getQuizzes,
};