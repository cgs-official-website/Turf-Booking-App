const express = require("express");
const router = express.Router();

const {
  addTurf,
  getAllTurfs,
  getTurfById,
  updateTurf,
  deleteTurf,
  getAvailableSlots,
} = require("../controllers/turf.controller");

// Create turf
router.post("/", addTurf);

// Get all turfs
router.get("/", getAllTurfs);

// Get available slots
router.get("/:id/slots", getAvailableSlots);

// Get turf by ID
router.get("/:id", getTurfById);

// Update turf
router.put("/:id", updateTurf);

// Delete turf
router.delete("/:id", deleteTurf);

module.exports = router;