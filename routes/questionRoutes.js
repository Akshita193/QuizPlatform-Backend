const express = require("express");

const {
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
} = require("../controllers/questionController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createQuestion
);

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getQuestions
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  updateQuestion
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteQuestion
);

module.exports = router;