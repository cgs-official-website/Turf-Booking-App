  const Joi = require("joi");

  const addTurfSchema = Joi.object({
    name: Joi.string().trim().required().messages({
      "any.required": "Turf name is required",
    }),

    location: Joi.string().trim().required().messages({
      "any.required": "Location is required",
    }),

    sportType: Joi.string()
      .valid("football", "cricket", "badminton", "multi-sport")
      .optional()
      .messages({
        "any.only": "Invalid sport type",
      }),

    sports: Joi.array().items(Joi.string().valid("football", "cricket", "badminton", "multi-sport", "tennis", "basketball", "volleyball", "swimming", "table-tennis")).default([]).messages({
      "any.only": "Invalid sport type in array",
    }),

    facilities: Joi.array().items(Joi.string()).default([]),

    pricePerHour: Joi.object({
      basePrice: Joi.number().min(0).required(),
      eveningPrice: Joi.number().min(0).optional(),
      weekendPrice: Joi.number().min(0).optional(),
      weekendEveningPrice: Joi.number().min(0).optional(),
    }).required(),

    description: Joi.string().allow("").optional(),

    amenities: Joi.array().items(Joi.string()).default([]),

    mainImage: Joi.string().uri().required().messages({
      "string.uri": "Main image must be a valid URL",
      "any.required": "Main image is required",
    }),

    secondaryImages: Joi.array()
      .items(Joi.string().uri())
      .max(4)
      .default([])
      .messages({
        "array.max": "Maximum 4 secondary images are allowed",
      }),
  });

  const updateTurfSchema = Joi.object({
    name: Joi.string().trim(),

    location: Joi.string().trim(),

    sportType: Joi.string().valid(
      "football",
      "cricket",
      "badminton",
      "multi-sport"
    ),

    sports: Joi.array().items(Joi.string().valid("football", "cricket", "badminton", "multi-sport", "tennis", "basketball", "volleyball", "swimming", "table-tennis")),

    facilities: Joi.array().items(Joi.string()),

    pricePerHour: Joi.object({
      basePrice: Joi.number().min(0),
      eveningPrice: Joi.number().min(0),
      weekendPrice: Joi.number().min(0),
      weekendEveningPrice: Joi.number().min(0),
    }),

    description: Joi.string().allow(""),

    amenities: Joi.array().items(Joi.string()),

    mainImage: Joi.string().uri(),

    secondaryImages: Joi.array()
      .items(Joi.string().uri())
      .max(4),

    isAvailable: Joi.boolean(),
  });

  module.exports = {
    addTurfSchema,
    updateTurfSchema, 
  };