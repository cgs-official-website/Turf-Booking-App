const express = require("express");
const adminController = require("../controllers/admin.controller");
const validate = require("../middlewares/validation.middleware");
const {
  createAdminSchema,
  loginAdminSchema,
} = require("../validators/admin.validator");
const { authorizeAdmin } = require("../middlewares/admin.middleware");

const router = express.Router();

// router.post("/create", validate(createAdminSchema), adminController.createAdmin); // Disabled for security
router.post("/login", validate(loginAdminSchema), adminController.loginAdmin);
router.get("/profile", authorizeAdmin, adminController.getProfile);

router.get("/dashboard", protect, authorizeRoles("admin"), getDashboardStats);

module.exports = router;
