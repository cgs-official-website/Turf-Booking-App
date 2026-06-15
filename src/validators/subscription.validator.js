const Joi = require("joi");

const createPlanSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  description: Joi.string().max(500).optional().allow(""),
  price: Joi.number().min(0).required(),
  durationDays: Joi.number().integer().min(1).required(),
  trialDays: Joi.number().integer().min(0).optional().default(0),
  features: Joi.object({
    maxTurfs: Joi.number().integer().min(1).optional(),
    prioritySupport: Joi.boolean().optional(),
    analyticsAccess: Joi.boolean().optional(),
    bookingDiscountPercent: Joi.number().min(0).max(100).optional(),
  }).optional(),
});

const updatePlanSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  description: Joi.string().max(500).optional().allow(""),
  price: Joi.number().min(0).optional(),
  durationDays: Joi.number().integer().min(1).optional(),
  trialDays: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
  features: Joi.object({
    maxTurfs: Joi.number().integer().min(1).optional(),
    prioritySupport: Joi.boolean().optional(),
    analyticsAccess: Joi.boolean().optional(),
    bookingDiscountPercent: Joi.number().min(0).max(100).optional(),
  }).optional(),
}).min(1);

const subscribeSchema = Joi.object({
  planId: Joi.string().hex().length(24).required(),
});

const changePlanSchema = Joi.object({
  planId: Joi.string().hex().length(24).required(),
});

const cancelSchema = Joi.object({
  reason: Joi.string().max(500).optional().allow(""),
});

const autoRenewSchema = Joi.object({
  enable: Joi.boolean().required(),
});

module.exports = {
  createPlanSchema,
  updatePlanSchema,
  subscribeSchema,
  changePlanSchema,
  cancelSchema,
  autoRenewSchema,
};