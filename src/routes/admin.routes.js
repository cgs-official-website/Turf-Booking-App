const express = require("express");

const {
  loginAdmin,
  getProfile,
  getDashboardStats,
  getAllVendors,
} = require("../controllers/admin.controller");

const validate = require("../middlewares/validation.middleware");
const { loginAdminSchema } = require("../validators/admin.validator");
const { authorizeAdmin } = require("../middlewares/admin.middleware");
const { protect, authorizeRoles } = require("../middlewares/auth.middleware");

const router = express.Router();

// POST /api/admin/login
router.post("/login", validate(loginAdminSchema), loginAdmin);

// GET /api/admin/profile
router.get("/profile", authorizeAdmin, getProfile);

// GET /api/admin/dashboard
router.get("/dashboard", protect, authorizeRoles("admin"), getDashboardStats);

// GET /api/admin/vendors
router.get("/vendors", authorizeAdmin, getAllVendors);

module.exports = router;