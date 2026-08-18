const pool = require("../config/db");

//create quiz
const createQuiz = async (req, res) => {
  try {
    const {
  title,
  description,
  duration_minutes,
} = req.body;
    // Check required field
    if (!title) {
      return res.status(400).json({
        message: "Quiz title is required",
      });
    }
    if (
  !duration_minutes ||
  Number(duration_minutes) <= 0
) {
  return res.status(400).json({
    message: "Quiz duration must be greater than 0 minutes",
  });
}

    // Create quiz
    const result = await pool.query(
  `INSERT INTO quizzes
    (title, description, duration_minutes, created_by)
   VALUES ($1, $2, $3, $4)
   RETURNING
    id,
    title,
    description,
    duration_minutes,
    created_by,
    is_published,
    created_at,
    updated_at`,
  [
    title,
    description || null,
    Number(duration_minutes),
    req.user.id,
  ]
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
    const {
  title,
  description,
  duration_minutes,
} = req.body;

    if (!title) {
      return res.status(400).json({
        message: "Quiz title is required",
      });
    }

    if (
  !duration_minutes ||
  Number(duration_minutes) <= 0
) {
  return res.status(400).json({
    message: "Quiz duration must be greater than 0 minutes",
  });
}

    const result = await pool.query(
  `UPDATE quizzes
   SET title = $1,
       description = $2,
       duration_minutes = $3,
       updated_at = CURRENT_TIMESTAMP
   WHERE id = $4
   RETURNING
    id,
    title,
    description,
    duration_minutes,
    created_by,
    is_published,
    created_at,
    updated_at`,
  [
    title,
    description || null,
    Number(duration_minutes),
    id,
  ]
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
        duration_minutes,
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
      `SELECT
  id,
  title,
  description,
  duration_minutes
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

// ==========================================
// CHECK IF STUDENT ALREADY ATTEMPTED QUIZ
// ==========================================

const checkQuizAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    const result = await pool.query(
      `SELECT
        id,
        quiz_id,
        student_id,
        score,
        total_questions,
        submitted_at
       FROM quiz_attempts
       WHERE quiz_id = $1
       AND student_id = $2`,
      [id, studentId]
    );

    if (result.rows.length > 0) {
      return res.status(200).json({
        attempted: true,
        attempt: result.rows[0],
      });
    }

    res.status(200).json({
      attempted: false,
      attempt: null,
    });
  } catch (error) {
    console.error("Check quiz attempt error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};


// ==========================================
// SUBMIT QUIZ
// ==========================================

const submitQuiz = async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const studentId = req.user.id;
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        message: "Answers must be an array",
      });
    }

    await client.query("BEGIN");

    // Check if student already submitted this quiz
    const existingAttempt = await client.query(
      `SELECT id
       FROM quiz_attempts
       WHERE quiz_id = $1
       AND student_id = $2`,
      [id, studentId]
    );

    if (existingAttempt.rows.length > 0) {
      await client.query("ROLLBACK");

      return res.status(409).json({
        message: "You have already submitted this quiz.",
      });
    }

    // Get all questions and correct options
    const questionResult = await client.query(
      `SELECT
        q.id AS question_id,
        o.id AS correct_option_id
       FROM questions q
       JOIN options o
         ON q.id = o.question_id
       WHERE q.quiz_id = $1
       AND o.is_correct = true
       ORDER BY q.id`,
      [id]
    );

    const questions = questionResult.rows;

    if (questions.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "This quiz has no questions.",
      });
    }

    let score = 0;

    for (const question of questions) {
      const studentAnswer = answers.find(
        (answer) =>
          Number(answer.question_id) ===
          Number(question.question_id)
      );

      const selectedOptionId = studentAnswer
        ? Number(studentAnswer.selected_option_id)
        : null;

      const isCorrect =
        selectedOptionId !== null &&
        selectedOptionId ===
          Number(question.correct_option_id);

      if (isCorrect) {
        score++;
      }
    }

    const totalQuestions = questions.length;

    const percentage = Math.round(
  (score / totalQuestions) * 100
);

const resultStatus =
  percentage >= 40 ? "Pass" : "Fail";

    // Store attempt
    const attemptResult = await client.query(
  `INSERT INTO quiz_attempts
  (
    quiz_id,
    student_id,
    score,
    total_questions,
    result_status,
    submitted_at
  )
  VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
  RETURNING
    id,
    quiz_id,
    student_id,
    score,
    total_questions,
    result_status,
    submitted_at`,
  [
    id,
    studentId,
    score,
    totalQuestions,
    resultStatus,
  ]
);

    const attempt = attemptResult.rows[0];

    // Store each answer
    for (const question of questions) {
      const studentAnswer = answers.find(
        (answer) =>
          Number(answer.question_id) ===
          Number(question.question_id)
      );

      const selectedOptionId = studentAnswer
        ? Number(studentAnswer.selected_option_id)
        : null;

      const isCorrect =
        selectedOptionId !== null &&
        selectedOptionId ===
          Number(question.correct_option_id);

      await client.query(
        `INSERT INTO quiz_answers
          (
            attempt_id,
            question_id,
            selected_option_id,
            is_correct
          )
         VALUES ($1, $2, $3, $4)`,
        [
          attempt.id,
          question.question_id,
          selectedOptionId,
          isCorrect,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Quiz submitted successfully",
      result: {
        attempt_id: attempt.id,
        quiz_id: attempt.quiz_id,
        score: attempt.score,
        total_questions: attempt.total_questions,
        result_status: attempt.result_status,
        submitted_at: attempt.submitted_at,
      },
    });
  } catch (error) {
  await client.query("ROLLBACK");

  console.error("=================================");
  console.error("SUBMIT QUIZ ERROR");
  console.error("Message:", error.message);
  console.error("Code:", error.code);
  console.error("Detail:", error.detail);
  console.error("Where:", error.where);
  console.error("Stack:", error.stack);
  console.error("=================================");

  res.status(500).json({
    message: error.message,
  });
} finally {
  client.release();
}
};
// ==========================================
// GET STUDENT RESULTS
// ==========================================
// ==========================================
// GET STUDENT RESULTS
// ==========================================
const getMyResults = async (req, res) => {
  try {
    const studentId = req.user.id;

    const result = await pool.query(
      `SELECT
        qa.id AS attempt_id,
        qa.quiz_id,
        q.title,
        q.description,
        qa.score,
        qa.total_questions,

        ROUND(
          (qa.score::decimal / NULLIF(qa.total_questions, 0)) * 100,
          2
        ) AS percentage,

        CASE
          WHEN (qa.score::decimal / NULLIF(qa.total_questions, 0)) * 100 >= 40
          THEN 'PASS'
          ELSE 'FAIL'
        END AS status,

        qa.submitted_at

       FROM quiz_attempts qa

       JOIN quizzes q
         ON q.id = qa.quiz_id

       WHERE qa.student_id = $1

       ORDER BY qa.submitted_at DESC`,
      [studentId]
    );

    console.log(
      "Student results:",
      result.rows
    );

    res.status(200).json({
      results: result.rows,
    });

  } catch (error) {

    console.error(
      "Get my results error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET STUDENT ATTEMPT REVIEW
// ==========================================

const getAttemptReview = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const studentId = req.user.id;

    const result = await pool.query(
      `SELECT
        qa.id AS attempt_id,
        qa.quiz_id,
        quiz.title AS quiz_title,
        qa.score,
        qa.total_questions,
        qa.result_status,
        qa.submitted_at,

        q.id AS question_id,
        q.question_text,
        q.explanation,

        answer.selected_option_id,
        selected_option.option_text AS selected_option_text,

        correct_option.id AS correct_option_id,
        correct_option.option_text AS correct_option_text,

        answer.is_correct

       FROM quiz_attempts qa

       JOIN quizzes quiz
         ON quiz.id = qa.quiz_id

       JOIN quiz_answers answer
         ON answer.attempt_id = qa.id

       JOIN questions q
         ON q.id = answer.question_id

       LEFT JOIN options selected_option
         ON selected_option.id = answer.selected_option_id

       JOIN options correct_option
         ON correct_option.question_id = q.id
        AND correct_option.is_correct = true

       WHERE qa.id = $1
         AND qa.student_id = $2

       ORDER BY q.id ASC`,
      [attemptId, studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Attempt not found",
      });
    }

    const firstRow = result.rows[0];

    const review = result.rows.map((row) => ({
  question_id: row.question_id,
  question_text: row.question_text,

  explanation: row.explanation,

  selected_option_id:
    row.selected_option_id,

  selected_option_text:
    row.selected_option_text,

  correct_option_id:
    row.correct_option_id,

  correct_option_text:
    row.correct_option_text,

  is_correct: row.is_correct,
}));

    res.status(200).json({
      attempt: {
        attempt_id: firstRow.attempt_id,
        quiz_id: firstRow.quiz_id,
        quiz_title: firstRow.quiz_title,
        score: firstRow.score,
        total_questions:
          firstRow.total_questions,
        result_status:
          firstRow.result_status,
        submitted_at:
          firstRow.submitted_at,
      },

      review,
    });

  } catch (error) {
    console.error(
      "Get attempt review error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// GET ALL QUIZ RESULTS FOR ADMIN
// ==========================================

const getAllResults = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        qa.id AS id,
        qa.quiz_id,
        qa.student_id,
        u.name AS student_name,
        u.email AS student_email,
        q.title AS quiz_title,
        qa.score,
        qa.total_questions,
        qa.submitted_at
       FROM quiz_attempts qa
       JOIN users u
         ON u.id = qa.student_id
       JOIN quizzes q
         ON q.id = qa.quiz_id
       ORDER BY qa.submitted_at DESC`
    );

    console.log("Admin results:", result.rows);

    res.status(200).json({
      results: result.rows,
    });

  } catch (error) {
    console.error("Get all results error:", error);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// DAY 12 - OVERALL LEADERBOARD
// ==========================================

const getOverallLeaderboard = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        u.id AS student_id,
        u.name AS student_name,

        COUNT(qa.id)::int AS total_attempts,

        ROUND(
          AVG(
            (qa.score::decimal /
              NULLIF(qa.total_questions, 0)
            ) * 100
          ),
          2
        ) AS average_percentage

      FROM users u

      JOIN quiz_attempts qa
        ON qa.student_id = u.id

      WHERE UPPER(u.role) = 'STUDENT'

      GROUP BY
        u.id,
        u.name

      ORDER BY
        average_percentage DESC,
        total_attempts DESC,
        u.name ASC
    `);

    const leaderboard = result.rows.map(
      (student, index) => ({
        rank: index + 1,

        student_id:
          student.student_id,

        student_name:
          student.student_name,

        total_attempts:
          student.total_attempts,

        average_percentage:
          Number(
            student.average_percentage
          ),
      })
    );

    res.status(200).json({
      leaderboard,
    });

  } catch (error) {
    console.error(
      "Get overall leaderboard error:",
      error
    );

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ==========================================
// DAY 12 - CATEGORY LEADERBOARD
// ==========================================

const getCategoryLeaderboard = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.id AS category_id,
        c.name AS category_name,

        u.id AS student_id,
        u.name AS student_name,

        COUNT(qa_answer.id)::int AS total_answers,

        SUM(
          CASE
            WHEN qa_answer.is_correct = true
            THEN 1
            ELSE 0
          END
        )::int AS correct_answers,

        ROUND(
          (
            SUM(
              CASE
                WHEN qa_answer.is_correct = true
                THEN 1
                ELSE 0
              END
            )::decimal
            /
            NULLIF(
              COUNT(qa_answer.id),
              0
            )
          ) * 100,
          2
        ) AS percentage

      FROM quiz_answers qa_answer

      JOIN quiz_attempts qa
        ON qa.id = qa_answer.attempt_id

      JOIN users u
        ON u.id = qa.student_id

      JOIN questions q
        ON q.id = qa_answer.question_id

      JOIN categories c
        ON c.id = q.category_id

      WHERE
        q.category_id IS NOT NULL
        AND UPPER(u.role) = 'STUDENT'

      GROUP BY
        c.id,
        c.name,
        u.id,
        u.name

      ORDER BY
        c.name ASC,
        percentage DESC,
        correct_answers DESC,
        u.name ASC
    `);

    const categoryGroups = {};

    result.rows.forEach((row) => {
      if (!categoryGroups[row.category_id]) {
        categoryGroups[row.category_id] = {
          category_id: row.category_id,
          category_name: row.category_name,
          leaderboard: [],
        };
      }

      categoryGroups[row.category_id].leaderboard.push({
        student_id: row.student_id,
        student_name: row.student_name,
        total_answers: row.total_answers,
        correct_answers: row.correct_answers,
        percentage: Number(row.percentage),
      });
    });

    const categories = Object.values(
      categoryGroups
    ).map((category) => ({
      ...category,

      leaderboard:
        category.leaderboard.map(
          (student, index) => ({
            rank: index + 1,
            ...student,
          })
        ),
    }));

    res.status(200).json({
      categories,
    });

  } catch (error) {
    console.error(
      "Get category leaderboard error:",
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
  checkQuizAttempt,
  submitQuiz,
  getMyResults,
  getAttemptReview,
  getAllResults,
  getOverallLeaderboard,
  getCategoryLeaderboard,
};