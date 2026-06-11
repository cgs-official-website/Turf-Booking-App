// =============================================
//  TURF ROUTES
// =============================================

const express = require("express");
const router = express.Router();

const {
  getAllTurfs,
  searchTurfs,
  getTurfById,
  getAvailableSlots,
  addTurf,
  updateTurf,
  deleteTurf,
} = require("../controllers/turf.controller");

const { protect, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { addTurfSchema, updateTurfSchema } = require("../validators/turf.validator");

// Public routes
router.get("/", getAllTurfs);
router.get("/search", searchTurfs);
router.get("/:id", getTurfById);
router.get("/:id/slots", getAvailableSlots);

// Vendor / Admin only
router.post("/", protect, authorizeRoles("vendor", "admin"), validate(addTurfSchema), addTurf);
router.put("/:id", protect, authorizeRoles("vendor", "admin"), validate(updateTurfSchema), updateTurf);
router.delete("/:id", protect, authorizeRoles("vendor", "admin"), deleteTurf);

module.exports = router;
