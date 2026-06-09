// =============================================
//  BOOKING VALIDATOR — turf-booking-app
//  Validates inputs for: /create booking
// =============================================

const { body, param, validationResult } = require("express-validator");

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
// TIME FORMAT HELPER — checks "HH:MM" (00:00 to 23:59)
// ─────────────────────────────────────────────
const isValidTime = (value) => {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(value);
};

// ─────────────────────────────────────────────
// CREATE BOOKING RULES
// ─────────────────────────────────────────────
const createBookingValidator = [
  body("turfId")
    .notEmpty().withMessage("turfId is required")
    .isMongoId().withMessage("turfId must be a valid ID"),

  body("date")
    .notEmpty().withMessage("date is required")
    .isDate({ format: "YYYY-MM-DD" }).withMessage("date must be in YYYY-MM-DD format")
    .custom((value) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDate = new Date(value);
      if (bookingDate < today) {
        throw new Error("Booking date cannot be in the past");
      }
      return true;
    }),

  body("startTime")
    .notEmpty().withMessage("startTime is required")
    .custom((value) => {
      if (!isValidTime(value)) throw new Error("startTime must be in HH:MM format (e.g. 09:00)");
      return true;
    }),

  body("endTime")
    .notEmpty().withMessage("endTime is required")
    .custom((value) => {
      if (!isValidTime(value)) throw new Error("endTime must be in HH:MM format (e.g. 11:00)");
      return true;
    })
    .custom((endTime, { req }) => {
      const start = req.body.startTime;
      if (start && endTime <= start) {
        throw new Error("endTime must be after startTime");
      }
      // Minimum 1 hour booking
      if (start) {
        const [sh, sm] = start.split(":").map(Number);
        const [eh, em] = endTime.split(":").map(Number);
        const durationMins = (eh * 60 + em) - (sh * 60 + sm);
        if (durationMins < 60) {
          throw new Error("Minimum booking duration is 1 hour");
        }
      }
      return true;
    }),

  validate,
];

// ─────────────────────────────────────────────
// BOOKING ID PARAM RULE  (for /:id routes)
// ─────────────────────────────────────────────
const bookingIdValidator = [
  param("id")
    .isMongoId().withMessage("Invalid booking ID"),

  validate,
];

module.exports = { createBookingValidator, bookingIdValidator };