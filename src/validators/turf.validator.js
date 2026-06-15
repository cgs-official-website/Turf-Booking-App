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
      .required()
      .messages({
        "any.only": "Invalid sport type",
        "any.required": "Sport type is required",
      }),

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