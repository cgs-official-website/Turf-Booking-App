const Joi = require("joi");

const createBookingSchema = Joi.object({
  turfId: Joi.string().hex().length(24).required().messages({
    "string.hex": "turfId must be a valid MongoDB ObjectId",
    "string.length": "turfId must be a valid MongoDB ObjectId",
  }),

  bookingDate: Joi.date().iso().required(),

  startTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      "string.pattern.base": "startTime must be in HH:MM format (e.g. 09:00)",
    }),

  endTime: Joi.string()
    .pattern(/^([01]\d|2[0-3]):[0-5]\d$/)
    .required()
    .messages({
      "string.pattern.base": "endTime must be in HH:MM format (e.g. 10:00)",
    }),
})
  .custom((value, helpers) => {
    if (value.startTime >= value.endTime) {
      return helpers.error("any.invalid");
    }
    return value;
  })
  .messages({
    "any.invalid": "endTime must be later than startTime",
  });

module.exports = {
  createBookingSchema,
};
