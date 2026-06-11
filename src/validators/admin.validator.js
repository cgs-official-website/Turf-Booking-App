const Joi = require("joi");

// const createAdminSchema = Joi.object({
//   name: Joi.string().min(3).max(50).required(),
//   email: Joi.string().email().required(),
//   password: Joi.string().min(6).required(),
// });

const loginAdminSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

module.exports = {
  // createAdminSchema,
  loginAdminSchema,
};
