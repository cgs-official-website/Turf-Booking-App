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

// Authenticated user
router.get("/profile", protect, getMyProfile);
router.put("/profile", protect, updateMyProfile);
router.put("/change-password", protect, changePassword);

const upload = require("../middlewares/upload.middleware");

// Upload Profile Image
router.put(
  "/profile-image",
  protect,
  upload.single("profileImage"),
  require("../controllers/user.controller").uploadProfileImage
);

// Upload KYC Documents (Vendor)
router.put(
  "/kyc-documents",
  protect,
  authorizeRoles("vendor", "admin"),
  upload.fields([
    { name: "aadhar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "gst", maxCount: 1 },
    { name: "ebBill", maxCount: 1 },
  ]),
  require("../controllers/user.controller").uploadKycDocuments
);

// Admin only
router.get("/", protect, authorizeRoles("admin"), getAllUsers);
router.get("/:id", protect, authorizeRoles("admin"), getUserById);
router.delete("/:id", protect, authorizeRoles("admin"), deleteUser);

module.exports = router;
