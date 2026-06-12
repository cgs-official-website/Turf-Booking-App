const express = require("express");

const {
  loginAdmin,
  getProfile,
  getDashboardStats,
  getAllVendors,
} = require("../controllers/admin.controller");

const validate = require("../middlewares/validation.middleware");

const {
  loginAdminSchema,
} = require("../validators/admin.validator");

const {
  authorizeAdmin,
} = require("../middlewares/admin.middleware");

const {
  protect,
  authorizeRoles,
} = require("../middlewares/auth.middleware");

const router = express.Router();

router.post(
  "/login",
  validate(loginAdminSchema),
  loginAdmin
);

router.get(
  "/profile",
  authorizeAdmin,
  getProfile
);

router.get(
  "/dashboard",
  protect,
  authorizeRoles("admin"),
  getDashboardStats
);

router.get(
  "/vendors",
  protect,
  authorizeRoles("admin"),
  getAllVendors
);

module.exports = router;