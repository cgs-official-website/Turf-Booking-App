const express = require("express");

const {
  loginAdmin,
  getProfile,
  getDashboardStats,
  getAllVendors,
  forgotPassword,
  resetPassword,
  getLoginActivity,
  getVendorBookingStats,
  getAllBookings,
  getVendorRecentBookings,
  suspendVendor,
  updateProfile,
  uploadProfileImage,
  deleteProfileImage,
  getProfileImage,
} = require("../controllers/admin.controller");

const upload = require("../middlewares/upload.middleware");

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

// PUT /api/admin/profile
router.put("/profile", authorizeAdmin, updateProfile);

// PUT /api/admin/profile-image
router.put("/profile-image", authorizeAdmin, upload.single("profileImage"), uploadProfileImage);

// GET /api/admin/profile-image
router.get("/profile-image", authorizeAdmin, getProfileImage);

// DELETE /api/admin/profile-image
router.delete("/profile-image", authorizeAdmin, deleteProfileImage);

// GET /admin/login-activity
router.get("/login-activity", authorizeAdmin, getLoginActivity);

// GET /api/admin/dashboard
router.get("/dashboard", protect, authorizeRoles("admin"), getDashboardStats);

// GET /api/admin/vendors
router.get("/vendors", authorizeAdmin, getAllVendors);

// GET /api/admin/vendors/:vendorId/bookings
router.get("/vendors/:vendorId/bookings", authorizeAdmin, getVendorBookingStats);

// GET /api/admin/vendors/:vendorId/recent-bookings
router.get("/vendors/:vendorId/recent-bookings", authorizeAdmin, getVendorRecentBookings);

// GET /api/admin/bookings
router.get("/bookings", authorizeAdmin, getAllBookings);

// DELETE /admin/vendors/:vendorId
router.delete("/vendors/:vendorId", authorizeAdmin, suspendVendor);

module.exports = router;
