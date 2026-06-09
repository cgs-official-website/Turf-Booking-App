// =============================================
//  TURF VALIDATOR — turf-booking-app
//  Validates inputs for: /add turf, /update turf
// =============================================

const { body, param, query, validationResult } = require("express-validator");

// ─────────────────────────────────────────────
// HELPER — runs after rules, sends errors if any
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
// ADD TURF RULES
// ─────────────────────────────────────────────
const addTurfValidator = [
  body("name")
    .trim()
    .notEmpty().withMessage("Turf name is required")
    .isLength({ min: 3, max: 100 }).withMessage("Name must be between 3 and 100 characters"),

  body("location")
    .trim()
    .notEmpty().withMessage("Location is required")
    .isLength({ min: 3, max: 200 }).withMessage("Location must be between 3 and 200 characters"),

  body("pricePerHour")
    .notEmpty().withMessage("pricePerHour is required")
    .isFloat({ min: 1 }).withMessage("pricePerHour must be a positive number"),

  body("amenities")
    .optional()
    .isArray().withMessage("amenities must be an array")
    .custom((arr) => {
      if (arr.some((item) => typeof item !== "string")) {
        throw new Error("Each amenity must be a string");
      }
      return true;
    }),

  body("images")
    .optional()
    .isArray().withMessage("images must be an array")
    .custom((arr) => {
      const urlRegex = /^https?:\/\/.+/;
      if (arr.some((img) => !urlRegex.test(img))) {
        throw new Error("Each image must be a valid URL starting with http or https");
      }
      return true;
    }),

  validate,
];

// ─────────────────────────────────────────────
// UPDATE TURF RULES  (all fields optional)
// ─────────────────────────────────────────────
const updateTurfValidator = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 }).withMessage("Name must be between 3 and 100 characters"),

  body("location")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage("Location must be between 3 and 200 characters"),

  body("pricePerHour")
    .optional()
    .isFloat({ min: 1 }).withMessage("pricePerHour must be a positive number"),

  body("amenities")
    .optional()
    .isArray().withMessage("amenities must be an array"),

  body("images")
    .optional()
    .isArray().withMessage("images must be an array")
    .custom((arr) => {
      const urlRegex = /^https?:\/\/.+/;
      if (arr.some((img) => !urlRegex.test(img))) {
        throw new Error("Each image must be a valid URL");
      }
      return true;
    }),

  body("isAvailable")
    .optional()
    .isBoolean().withMessage("isAvailable must be true or false"),

  validate,
];

// ─────────────────────────────────────────────
// TURF ID PARAM RULE  (for /:id routes)
// ─────────────────────────────────────────────
const turfIdValidator = [
  param("id")
    .isMongoId().withMessage("Invalid turf ID"),

  validate,
];

// ─────────────────────────────────────────────
// AVAILABLE SLOTS QUERY RULE  (?date=YYYY-MM-DD)
// ─────────────────────────────────────────────
const availableSlotsValidator = [
  query("date")
    .notEmpty().withMessage("date query param is required")
    .isDate({ format: "YYYY-MM-DD" }).withMessage("date must be in YYYY-MM-DD format"),

  validate,
];

module.exports = {
  addTurfValidator,
  updateTurfValidator,
  turfIdValidator,
  availableSlotsValidator,
};