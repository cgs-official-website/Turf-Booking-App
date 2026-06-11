const Joi = require("joi");

const createBookingSchema = Joi.object({
  turfId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.hex": "turfId must be a valid MongoDB ObjectId",
      "string.length": "turfId must be a valid MongoDB ObjectId",
      "any.required": "turfId is required",
    }),

  startDateTime: Joi.string()
    .isoDate()
    .required()
    .messages({
      "string.isoDate": "startDateTime must be a valid ISO date",
      "any.required": "startDateTime is required",
    }),

  endDateTime: Joi.string()
    .isoDate()
    .required()
    .messages({
      "string.isoDate": "endDateTime must be a valid ISO date",
      "any.required": "endDateTime is required",
    }),
})
.custom((value, helpers) => {
  if (new Date(value.startDateTime) >= new Date(value.endDateTime)) {
    return helpers.error("any.invalid");
  }
  return value;
})
.messages({
  "any.invalid":
    "endDateTime must be strictly later than startDateTime",
});

module.exports = {
  createBookingSchema,
};