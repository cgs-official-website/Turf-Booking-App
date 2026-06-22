const express = require("express");

const {
  loginAdmin,
  getProfile,
  getDashboardStats,
  getAllVendors,
  forgotPassword,
  resetPassword,
  getLoginActivity,
} = require("../controllers/admin.controller");

const validate = require("../middlewares/validation.middleware");
const {
  loginAdminSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validators/admin.validator");
const { authorizeAdmin } = require("../middlewares/admin.middleware");
const { protect, authorizeRoles } = require("../middlewares/auth.middleware");

const router = express.Router();

// POST /api/admin/login
router.post("/login", validate(loginAdminSchema), loginAdmin);

// POST /admin/forgot-password
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  forgotPassword,
);

// POST /admin/reset-password
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPassword,
);

// GET /api/admin/profile
router.get("/profile", authorizeAdmin, getProfile);

// GET /admin/login-activity
router.get("/login-activity", authorizeAdmin, getLoginActivity);

// GET /api/admin/dashboard
router.get("/dashboard", protect, authorizeRoles("admin"), getDashboardStats);

// GET /api/admin/vendors
router.get("/vendors", authorizeAdmin, getAllVendors);

module.exports = router;
