const express = require("express");
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getAllBookingsAdmin,
  getTurfBookings,
  getBookingById,
  confirmBooking,
  rejectBooking,
} = require("../controllers/booking.controller");

const { protect, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { createBookingSchema } = require("../validators/booking.validator");

// ─────────────────────────────────────────────
// IMPORTANT: named/static routes BEFORE /:id
// ─────────────────────────────────────────────

// User — create booking
router.post("/", protect, validate(createBookingSchema), createBooking);

// User / Vendor — own bookings
router.get("/my", protect, getMyBookings);

// ADMIN — all bookings (must be before /:id)
router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  getAllBookingsAdmin
);

// Vendor / Admin — bookings for a specific turf
router.get(
  "/turf/:turfId",
  protect,
  authorizeRoles("vendor", "admin"),
  getTurfBookings
);

// Any authenticated user — single booking by id
router.get("/:id", protect, getBookingById);

// Vendor / Admin — confirm or reject a booking
router.put("/:id/confirm", protect, authorizeRoles("vendor", "admin"), confirmBooking);
router.put("/:id/reject",  protect, authorizeRoles("vendor", "admin"), rejectBooking);

module.exports = router;