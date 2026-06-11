const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().min(3).max(20).required().messages({
    "string.min": "Name must be at least 3 characters",
    "string.max": "Name must not exceed 20 characters",
    "any.required": "Name is required",
  }),

  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),

  password: Joi.string()
    .pattern(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    )
    .required()
    .messages({
      "string.pattern.base":
        "Password must be at least 8 characters and contain uppercase, lowercase, number, and special character",
      "any.required": "Password is required",
    }),

  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Phone number must be 10 digits and start with 6, 7, 8, or 9",
      "any.required": "Phone number is required",
    }),

  role: Joi.string().valid("user", "vendor").default("user"),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),

  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

module.exports = {
  registerSchema,
  loginSchema,
};