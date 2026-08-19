const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const studentMiddleware = require("../middleware/studentMiddleware");

const {
  registerUser,
  loginUser,
  resetPassword,
  createAdmin,
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

router.get(
  "/student-only",
  authMiddleware,
  studentMiddleware,
  (req, res) => {
    res.status(200).json({
      message: "Welcome Student!",
      user: req.user,
    });
  }
);

router.get(
  "/admin-only",
  authMiddleware,
  adminMiddleware,
  (req, res) => {
    res.status(200).json({
      message: "Welcome Admin!",
      user: req.user,
    });
  }
);

router.post("/logout", authMiddleware, (req, res) => {
  res.status(200).json({
    message: "Logout successful",
  });
});

router.post(
  "/reset-password",
  resetPassword
);

router.post(
  "/create-admin",
  authMiddleware,
  adminMiddleware,
  createAdmin
);