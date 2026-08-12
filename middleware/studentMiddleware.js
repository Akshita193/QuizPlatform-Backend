const studentMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  if (req.user.role !== "STUDENT") {
    return res.status(403).json({
      message: "Student access required",
    });
  }

  next();
};

module.exports = studentMiddleware;