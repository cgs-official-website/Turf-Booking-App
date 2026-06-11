// =============================================
//  BOOKING ROUTES
// =============================================

const express = require("express");
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getTurfBookings,
  getBookingById,
  confirmBooking,
  rejectBooking,
} = require("../controllers/booking.controller");

const { protect, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { createBookingSchema } = require("../validators/booking.validator");


// All booking routes require login
router.post("/", protect, validate(createBookingSchema), createBooking);
router.get("/my", protect, getMyBookings);
router.get("/turf/:turfId", protect, authorizeRoles("vendor", "admin"), getTurfBookings);
router.get("/:id", protect, getBookingById);
router.put("/:id/confirm", protect, authorizeRoles("vendor", "admin"), confirmBooking);
router.put("/:id/reject", protect, authorizeRoles("vendor", "admin"), rejectBooking);

// Logged-in user's bookings (handled by /my)

module.exports = router;
