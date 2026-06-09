// =============================================
//  VALIDATION MIDDLEWARE — turf-booking-app
//  A single reusable function that reads express-validator
//  results and sends a clean 422 response if anything failed.
//
//  Usage in validators:
//    const { handleValidationErrors } = require("../middlewares/validation.middleware");
//
//    const registerValidator = [
//      body("email").isEmail()...,
//      body("password").isLength({ min: 6 })...,
//      handleValidationErrors,   ← add as last item
//    ];
// =============================================

const { validationResult } = require("express-validator");

// ─────────────────────────────────────────────
// handleValidationErrors
// Drop this as the LAST item in any validator array.
// If there are errors → sends 422 and stops the request.
// If no errors       → calls next() and continues to controller.
// ─────────────────────────────────────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Format: [{ field: "email", message: "Enter a valid email" }, ...]
    const formatted = errors.array().map((err) => ({
      field: err.path,       // which field failed (e.g. "email")
      value: err.value,      // what the user sent (helps with debugging)
      message: err.msg,      // the rule's error message
    }));

    return res.status(422).json({
      success: false,
      message: "Validation failed. Please check the errors below.",
      errors: formatted,
    });
  }

  next(); // all good → move to controller
};

// ─────────────────────────────────────────────
// sanitizeBody
// Optional: strips unknown fields from req.body
// so only allowed fields reach the service/controller.
//
// Usage: router.post("/register", sanitizeBody(["name","email","password"]), register)
// ─────────────────────────────────────────────
const sanitizeBody = (allowedFields) => {
  return (req, res, next) => {
    const sanitized = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        sanitized[field] = req.body[field];
      }
    });
    req.body = sanitized;
    next();
  };
};

module.exports = { handleValidationErrors, sanitizeBody };