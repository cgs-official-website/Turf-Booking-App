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
// User profile
router.get("/profile", getMyProfile);
router.put("/profile", updateMyProfile);
router.put("/change-password", changePassword);

// Admin routes
router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.delete("/:id", deleteUser);

module.exports = router;