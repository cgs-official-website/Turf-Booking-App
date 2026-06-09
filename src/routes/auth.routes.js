// =============================================
//  AUTH ROUTES
//  POST /api/auth/register
//  POST /api/auth/login
// =============================================

const express = require("express");
const router = express.Router();

const { register, login } = require("../controllers/auth.controller");
const validate = require("../middlewares/validation.middleware");
const { registerSchema, loginSchema } = require("../validators/auth.validator");

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);

module.exports = router;
