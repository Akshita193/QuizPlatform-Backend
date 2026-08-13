const express = require("express");

const {
  createQuiz,
  updateQuiz,
  deleteQuiz,
  publishQuiz,
  getQuizzes,   
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
  "/",
  authMiddleware,
  adminMiddleware,
  getQuizzes
);

module.exports = router;