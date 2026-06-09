const express = require("express");
const router = express.Router();

const {
  createBooking,
  getMyBookings,
  getTurfBookings,
  getBookingById,
  cancelBooking,
} = require("../controllers/booking.controller");

// Create booking
router.post("/", createBooking);

// Logged-in user's bookings
router.get("/my-bookings", getMyBookings);

// Turf bookings
router.get("/turf/:turfId", getTurfBookings);

// Single booking
router.get("/:id", getBookingById);

// Cancel booking
router.delete("/:id", cancelBooking);

module.exports = router;