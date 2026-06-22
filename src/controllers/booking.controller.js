const bookingService = require("../services/booking.service");
const ApiResponse    = require("../utils/ApiResponse");

// ─────────────────────────────────────────────
// POST /bookings — USER
// ─────────────────────────────────────────────
const createBooking = async (req, res, next) => {
  try {
    const result = await bookingService.createBooking({
      ...req.body,
      userId: req.user.id,
    });
    return res.status(201).json(new ApiResponse(201, "Booking created successfully", result));
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /bookings/admin/all — ADMIN
// ─────────────────────────────────────────────
const getAllBookingsAdmin = async (req, res, next) => {
  try {
    const bookings = await bookingService.getAllBookingsAdmin();
    return res.status(200).json(bookings);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /bookings/my — USER | VENDOR
// ─────────────────────────────────────────────
const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user.id);
    return res.status(200).json(
      new ApiResponse(200, "Bookings fetched successfully", {
        count: bookings.length,
        bookings,
      }),
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /bookings/turf/:turfId — VENDOR | ADMIN
// ─────────────────────────────────────────────
const getTurfBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getTurfBookings(req.params.turfId);
    return res.status(200).json(
      new ApiResponse(200, "Turf bookings fetched successfully", {
        count: bookings.length,
        bookings,
      }),
    );
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// GET /bookings/:id — ANY AUTHENTICATED
// ─────────────────────────────────────────────
const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    return res.status(200).json(new ApiResponse(200, "Booking fetched successfully", booking));
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PUT /bookings/:id/confirm — VENDOR | ADMIN
// FIX: removed dead code (cancelBooking call) that was after the return
// ─────────────────────────────────────────────
const confirmBooking = async (req, res, next) => {
  try {
    const result = await bookingService.confirmBooking(
      req.params.id,
      req.user.id,
      req.user.role,
    );
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────
// PUT /bookings/:id/reject — VENDOR | ADMIN
// ─────────────────────────────────────────────
const rejectBooking = async (req, res, next) => {
  try {
    const result = await bookingService.rejectBooking(
      req.params.id,
      req.user.id,
      req.user.role,
    );
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBooking,
  getAllBookingsAdmin,
  getMyBookings,
  getTurfBookings,
  getBookingById,
  confirmBooking,
  rejectBooking,
};