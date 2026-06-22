const express = require("express");
const router = express.Router();

const {
  getAllTurfs,
  getAllTurfsAdmin,
  getTurfByIdAdmin,
  searchTurfs,
  getPendingTurfs,
  approveTurf,
  rejectTurf,
  getTurfById,
  getAvailableSlots,
  addTurf,
  updateTurf,
  deleteTurf,
} = require("../controllers/turf.controller");

const { protect, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  addTurfSchema,
  updateTurfSchema,
} = require("../validators/turf.validator");

// =============================================
// Public Routes
// =============================================
router.get("/", getAllTurfs);
router.get("/search", searchTurfs);

// =============================================
// Admin — named routes (MUST be before /:id)
// =============================================

// All turfs list (pending + approved + rejected)
router.get("/admin/all", protect, authorizeRoles("admin"), getAllTurfsAdmin);

// Single turf detail — any status (used by admin TurfDetails page)
router.get("/admin/:id", protect, authorizeRoles("admin"), getTurfByIdAdmin);

// Pending list
router.get("/pending", protect, authorizeRoles("admin"), getPendingTurfs);

// Approve / Reject
router.patch("/:id/approve", protect, authorizeRoles("admin"), approveTurf);
router.patch("/:id/reject", protect, authorizeRoles("admin"), rejectTurf);

// =============================================
// Public — Turf detail & slots (approved only)
// =============================================
router.get("/:id", getTurfById);
router.get("/:id/slots", getAvailableSlots);

// =============================================
// Vendor / Admin — create, update, delete
// =============================================
router.post(
  "/",
  protect,
  authorizeRoles("vendor", "admin"),
  validate(addTurfSchema),
  addTurf,
);
router.put(
  "/:id",
  protect,
  authorizeRoles("vendor", "admin"),
  validate(updateTurfSchema),
  updateTurf,
);
router.delete("/:id", protect, authorizeRoles("vendor", "admin"), deleteTurf);

module.exports = router;
