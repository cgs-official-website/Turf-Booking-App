// =============================================
//  AUTH VALIDATORS — Joi schemas
// =============================================

const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().min(5).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
    "string.pattern.base": "Phone must be a valid 10-digit number",
  }),
  role: Joi.string().valid("user", "vendor", "admin").default("user"),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = { registerSchema, loginSchema };
