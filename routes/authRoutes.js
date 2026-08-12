const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  registerUser,
  loginUser,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);

module.exports = router;

router.get(
  "/profile",
  authMiddleware,
  (req, res) => {
    res.status(200).json({
      message: "Protected route accessed",
      user: req.user,
    });
  }
);