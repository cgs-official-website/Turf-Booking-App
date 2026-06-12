const Joi = require("joi");

const addReviewSchema = Joi.object({
  turfId: Joi.string().hex().length(24).required().messages({
    "string.base": "turfId should be a type of text",
    "string.empty": "turfId cannot be an empty field",
    "any.required": "turfId is a required field",
  }),
  rating: Joi.number().min(1).max(5).required().messages({
    "number.base": "rating should be a number",
    "number.min": "rating should have a minimum length of {#limit}",
    "number.max": "rating should have a maximum length of {#limit}",
    "any.required": "rating is a required field",
  }),
  comment: Joi.string().allow("").optional(),
});

module.exports = {
  addReviewSchema,
};
