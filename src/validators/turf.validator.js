  const Joi = require("joi");

  const addTurfSchema = Joi.object({
    name: Joi.string().trim().required().messages({
      "any.required": "Turf name is required",
    }),

    location: Joi.string().trim().required().messages({
      "any.required": "Location is required",
    }),



    // Case‑insensitive sport validation – accepts any capitalisation
    sports: Joi.array().items(Joi.string().lowercase().valid("football","cricket","badminton","multi-sport","tennis","basketball","volleyball","swimming","table-tennis").insensitive()).default([]).messages({
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

    aadhar: Joi.string().optional(),
    pan: Joi.string().optional(),
    gst: Joi.string().optional(),
    ebBill: Joi.string().optional(),
    
    documents: Joi.array().items(Joi.object({
      title: Joi.string(),
      sub: Joi.string().allow(""),
      status: Joi.string(),
      icon: Joi.string()
    })).optional()
  });

  const updateTurfSchema = Joi.object({
    name: Joi.string().trim(),

    location: Joi.string().trim(),



    // Case‑insensitive sport validation for updates
    sports: Joi.array().items(Joi.string().lowercase().valid("football", "cricket", "badminton", "multi-sport", "tennis", "basketball", "volleyball", "swimming", "table-tennis").insensitive()),

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

    verifications: Joi.array().items(Joi.object({
      label: Joi.string(),
      checked: Joi.boolean()
    })),

    documents: Joi.array().items(Joi.object({
      title: Joi.string(),
      sub: Joi.string().allow(""),
      status: Joi.string(),
      icon: Joi.string()
    }))
  });

  module.exports = {
    addTurfSchema,
    updateTurfSchema, 
  };