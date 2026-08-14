const express = require("express");

const {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  getQuizzes,   
  getPublishedQuizzes,
  getPublishedQuizQuestions,
} = require("../controllers/quizController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createQuiz
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
  "/published",
  authMiddleware,
  getPublishedQuizzes
);

router.get(
  "/:id/questions",
  authMiddleware,
  getPublishedQuizQuestions
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getQuizzes
);

module.exports = router;