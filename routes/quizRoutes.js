const express = require("express");

const {
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
} = require("../controllers/quizController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();


// =========================
// ADMIN ROUTES
// =========================

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createQuiz
);

// Overall leaderboard
router.get(
  "/leaderboard/overall",
  authMiddleware,
  getOverallLeaderboard
);

router.get(
  "/leaderboard/category",
  authMiddleware,
  getCategoryLeaderboard
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updateQuiz
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteQuiz
);

router.patch(
  "/:id/publish",
  authMiddleware,
  adminMiddleware,
  publishQuiz
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getQuizzes
);


// =========================
// STUDENT ROUTES
// =========================

// Published quizzes
router.get(
  "/published",
  authMiddleware,
  getPublishedQuizzes
);

// Student's results
router.get(
  "/my-results",
  authMiddleware,
  getMyResults
);

// Review one submitted attempt
router.get(
  "/attempts/:attemptId/review",
  authMiddleware,
  getAttemptReview
);

// Check whether quiz was already attempted
router.get(
  "/:id/attempt",
  authMiddleware,
  checkQuizAttempt
);

// Get questions
router.get(
  "/:id/questions",
  authMiddleware,
  getPublishedQuizQuestions
);

// Submit quiz
router.post(
  "/:id/submit",
  authMiddleware,
  submitQuiz
);

// Get all student quiz results for admin
router.get(
  "/results",
  authMiddleware,
  adminMiddleware,
  getAllResults
);


module.exports = router;