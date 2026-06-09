// =============================================
//  TURF VALIDATORS — Joi schemas
// =============================================

const Joi = require("joi");

const addTurfSchema = Joi.object({
  name: Joi.string().trim().required(),
  location: Joi.string().trim().required(),
  sportType: Joi.string().valid("football", "cricket", "badminton", "multi-sport").required(),
  pricePerHour: Joi.number().min(0).required(),
  description: Joi.string().optional().allow(""),
  amenities: Joi.array().items(Joi.string()).default([]),
  images: Joi.array().items(Joi.string().uri()).default([]),
});

const updateTurfSchema = Joi.object({
  name: Joi.string().trim().optional(),
  location: Joi.string().trim().optional(),
  sportType: Joi.string().valid("football", "cricket", "badminton", "multi-sport").optional(),
  pricePerHour: Joi.number().min(0).optional(),
  description: Joi.string().optional().allow(""),
  amenities: Joi.array().items(Joi.string()).optional(),
  images: Joi.array().items(Joi.string().uri()).optional(),
  isAvailable: Joi.boolean().optional(),
});

module.exports = { addTurfSchema, updateTurfSchema };
