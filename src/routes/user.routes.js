// =============================================
//  USER ROUTES
//  All routes require authentication
// =============================================

const express = require("express");
const router = express.Router();

const {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getAllUsers,
  getUserById,
  deleteUser,
} = require("../controllers/user.controller");


const { protect, authorizeRoles } = require("../middlewares/auth.middleware");

// User profile
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.put("/change-password", changePassword);


// Authenticated user
router.get("/profile", protect, getMyProfile);
router.put("/profile", protect, updateMyProfile);
router.put("/change-password", protect, changePassword);

// Admin only
router.get("/", protect, authorizeRoles("admin"), getAllUsers);
router.get("/:id", protect, authorizeRoles("admin"), getUserById);
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);

module.exports = router;
