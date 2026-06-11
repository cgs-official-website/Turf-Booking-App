// =============================================
//  BOOKING CONTROLLER
//  POST  /api/bookings/               → create booking
//  GET   /api/bookings/my             → my bookings
//  GET   /api/bookings/turf/:turfId   → turf bookings (vendor/admin)
//  GET   /api/bookings/:id            → single booking
//  PATCH /api/bookings/:id/cancel     → cancel booking
// =============================================

const bookingService = require("../services/booking.service");

const createBooking = async (req, res, next) => {
  try {
    const result = await bookingService.createBooking({ ...req.body, userId: req.user.id });
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user.id);
    return res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

const getTurfBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getTurfBookings(req.params.turfId);
    return res.status(200).json({ success: true, count: bookings.length, bookings });
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);
    return res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

const confirmBooking = async (req, res, next) => {
  try {
    const result = await bookingService.confirmBooking(req.params.id, req.user.id, req.user.role);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const rejectBooking = async (req, res, next) => {
  try {
    const result = await bookingService.rejectBooking(req.params.id, req.user.id, req.user.role);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = { createBooking, getMyBookings, getTurfBookings, getBookingById, confirmBooking, rejectBooking };
