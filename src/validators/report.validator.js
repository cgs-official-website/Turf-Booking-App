// validators/report.validator.js
const Joi = require("joi");

const CATEGORIES = [
  "Subscription",
  "Slot update",
  "Slot booking",
  "Other",
];

// POST /reports — vendor creates a report
const createReportSchema = Joi.object({
  turfId: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .required()
    .messages({
      "string.pattern.base": "turfId must be a valid ObjectId",
      "any.required": "turfId is required",
    }),
  category: Joi.string()
    .valid(...CATEGORIES)
    .required()
    .messages({
      "any.only": `category must be one of: ${CATEGORIES.join(", ")}`,
      "any.required": "category is required",
    }),
  description: Joi.string().min(10).max(2000).required().messages({
    "string.min": "description must be at least 10 characters",
    "any.required": "description is required",
  }),
});

// PATCH /reports/:id/resolve — admin resolves a report
const resolveReportSchema = Joi.object({
  resolveNote: Joi.string().min(1).max(1000).required().messages({
    "any.required": "resolveNote is required",
    "string.min": "resolveNote cannot be empty",
  }),
  status: Joi.string()
    .valid("under-review", "solved")
    .default("solved")
    .messages({
      "any.only": 'status must be "under-review" or "solved"',
    }),
});

module.exports = { createReportSchema, resolveReportSchema };
