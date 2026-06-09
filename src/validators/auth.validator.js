// =============================================
//  AUTH VALIDATOR — turf-booking-app
//  Validates inputs for: /register, /login
// =============================================

const { body, validationResult } = require("express-validator");

// ─────────────────────────────────────────────
// HELPER — runs after the rules, sends errors if any
// ─────────────────────────────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─────────────────────────────────────────────
// REGISTER RULES
// ─────────────────────────────────────────────
const registerValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Enter a valid email address")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/).withMessage("Password must contain at least one number"),

  body("role")
    .optional()
    .isIn(["user", "owner", "admin"]).withMessage("Role must be user, owner, or admin"),

  validate, // ← always last: checks and sends errors
];

// ─────────────────────────────────────────────
// LOGIN RULES
// ─────────────────────────────────────────────
const loginValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Enter a valid email address"),

  body("password")
    .notEmpty().withMessage("Password is required"),

  validate,
];

module.exports = { 
    registerValidator,
    loginValidator 
};
