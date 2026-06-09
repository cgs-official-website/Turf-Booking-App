// =============================================
//  BOOKING CONTROLLER — turf-booking-app
//  Routes: POST   /api/bookings/           → create booking
//          GET    /api/bookings/my          → my bookings (logged-in user)
//          GET    /api/bookings/:id         → single booking
//          GET    /api/bookings/turf/:turfId → all bookings for a turf (owner/admin)
//          PATCH  /api/bookings/:id/cancel  → cancel booking
// =============================================

const bookingService = require("../services/booking.service");

// ─────────────────────────────────────────────
// POST /api/bookings/
// ─────────────────────────────────────────────
const createBooking = async (req, res) => {
  try {
    const { turfId, date, startTime, endTime } = req.body;
    const userId = req.user.id; // comes from auth middleware

    if (!turfId || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: "turfId, date, startTime and endTime are required" });
    }

    const result = await bookingService.createBooking({ userId, turfId, date, startTime, endTime });

    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/bookings/my
// ─────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await bookingService.getUserBookings(userId);

    return res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/bookings/turf/:turfId
// ─────────────────────────────────────────────
const getTurfBookings = async (req, res) => {
  try {
    const { turfId } = req.params;
    const bookings = await bookingService.getTurfBookings(turfId);

    return res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/bookings/:id
// ─────────────────────────────────────────────
const getBookingById = async (req, res) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);

    return res.status(200).json({ success: true, booking });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/bookings/:id/cancel
// ─────────────────────────────────────────────
const cancelBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await bookingService.cancelBooking(req.params.id, userId);

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getTurfBookings,
  getBookingById,
  cancelBooking,
};