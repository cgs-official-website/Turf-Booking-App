// =============================================
//  BOOKING SERVICE — turf-booking-app
//  Handles: Create booking, Cancel, Get bookings
// =============================================

const Booking = require("../models/booking.model");
const Turf = require("../models/turf.model");

// ─────────────────────────────────────────────
// CREATE a new booking
// ─────────────────────────────────────────────
const createBooking = async ({ userId, turfId, date, startTime, endTime }) => {
  // 1. Check if turf exists
  const turf = await Turf.findById(turfId);
  if (!turf) {
    throw new Error("Turf not found");
  }

  // 2. Check for slot conflicts — same turf, same date, overlapping time
  const conflict = await Booking.findOne({
    turf: turfId,
    date,
    status: { $ne: "cancelled" },
    $or: [
      // New booking starts inside an existing booking
      { startTime: { $lte: startTime }, endTime: { $gt: startTime } },
      // New booking ends inside an existing booking
      { startTime: { $lt: endTime }, endTime: { $gte: endTime } },
      // New booking completely covers an existing booking
      { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
    ],
  });

  if (conflict) {
    throw new Error("This slot is already booked. Please choose another time.");
  }

  // 3. Calculate total price
  // Duration in hours × price per hour
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const durationHours = (endH * 60 + endM - (startH * 60 + startM)) / 60;
  const totalPrice = durationHours * turf.pricePerHour;

  // 4. Create booking
  const booking = await Booking.create({
    user: userId,
    turf: turfId,
    date,
    startTime,
    endTime,
    totalPrice,
    status: "confirmed",
  });

  return {
    message: "Booking confirmed!",
    booking,
  };
};

// ─────────────────────────────────────────────
// GET all bookings for a specific user
// ─────────────────────────────────────────────
const getUserBookings = async (userId) => {
  const bookings = await Booking.find({ user: userId })
    .populate("turf", "name location pricePerHour") // get turf details
    .sort({ date: -1 }); // latest first

  return bookings;
};

// ─────────────────────────────────────────────
// GET all bookings for a specific turf (admin/owner)
// ─────────────────────────────────────────────
const getTurfBookings = async (turfId) => {
  const bookings = await Booking.find({ turf: turfId })
    .populate("user", "name email") // get user details
    .sort({ date: 1 });

  return bookings;
};

// ─────────────────────────────────────────────
// GET single booking by ID
// ─────────────────────────────────────────────
const getBookingById = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate("user", "name email")
    .populate("turf", "name location pricePerHour");

  if (!booking) {
    throw new Error("Booking not found");
  }

  return booking;
};

// ─────────────────────────────────────────────
// CANCEL a booking
// ─────────────────────────────────────────────
const cancelBooking = async (bookingId, userId) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Only the booking owner can cancel
  if (booking.user.toString() !== userId.toString()) {
    throw new Error("Not authorized to cancel this booking");
  }

  if (booking.status === "cancelled") {
    throw new Error("Booking is already cancelled");
  }

  booking.status = "cancelled";
  await booking.save();

  return { message: "Booking cancelled successfully", booking };
};

module.exports = {
  createBooking,
  getUserBookings,
  getTurfBookings,
  getBookingById,
  cancelBooking,
};