const Booking = require("../models/Booking");
const Turf = require("../models/Turf");
const ApiError = require("../utils/ApiError");
const Notification = require("../models/notification");
const pricingConfig = require("../config/pricing");

// ─────────────────────────────────────────────
// CREATE booking
// ─────────────────────────────────────────────
const createBooking = async ({ userId, turfId, startDateTime, endDateTime }) => {
  const turf = await Turf.findById(turfId);
  if (!turf)             throw new ApiError(404, "Turf not found");
  if (!turf.isAvailable) throw new ApiError(400, "This turf is currently unavailable");
  if (turf.approvalStatus !== "approved") throw new ApiError(403, "This turf is not approved for booking");

  const ensureUTC = (dateStr) => {
    if (
      typeof dateStr === "string" &&
      !dateStr.endsWith("Z") &&
      !dateStr.includes("+") &&
      !dateStr.match(/-\d\d:\d\d$/)
    ) {
      return new Date(dateStr + "Z");
    }
    return new Date(dateStr);
  };

  const start = ensureUTC(startDateTime);
  const end   = ensureUTC(endDateTime);

  if (end <= start) throw new ApiError(400, "endDateTime must be after startDateTime");

  const conflict = await Booking.findOne({
    turf: turfId,
    bookingStatus: { $in: ["pending", "confirmed"] },
    startDateTime: { $lt: end },
    endDateTime:   { $gt: start },
  });
  if (conflict) throw new ApiError(409, "This slot is already booked. Please choose another time.");

  let totalAmount = 0;
  let durationHours = 0;
  let current = new Date(start);

  while (current < end) {
    const nextHour = new Date(current);
    nextHour.setUTCHours(current.getUTCHours() + 1, current.getUTCMinutes(), current.getUTCSeconds(), 0);
    const segmentEnd = nextHour > end ? end : nextHour;
    const segmentDurationHours = (segmentEnd - current) / (1000 * 60 * 60);

    const dayOfWeek = current.getUTCDay();
    const hour      = current.getUTCHours();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isEvening = hour >= pricingConfig.eveningStartHour || hour < pricingConfig.eveningEndHour;

    let pricePerHour = turf.pricePerHour.basePrice;
    if (isWeekend && isEvening && turf.pricePerHour.weekendEveningPrice != null)
      pricePerHour = turf.pricePerHour.weekendEveningPrice;
    else if (isWeekend && turf.pricePerHour.weekendPrice != null)
      pricePerHour = turf.pricePerHour.weekendPrice;
    else if (isEvening && turf.pricePerHour.eveningPrice != null)
      pricePerHour = turf.pricePerHour.eveningPrice;

    totalAmount   += pricePerHour * segmentDurationHours;
    durationHours += segmentDurationHours;
    current = segmentEnd;
  }

  const booking = await Booking.create({
    user: userId, turf: turfId,
    startDateTime: start, endDateTime: end,
    totalAmount,
    bookingStatus: "pending",
    paymentStatus: "pending",
  });

  return {
    message: "Booking request submitted successfully",
    booking: {
      bookingId:     booking._id,
      turfId:        booking.turf,
      userId:        booking.user,
      startDateTime: booking.startDateTime,
      endDateTime:   booking.endDateTime,
      durationHours,
      totalAmount,
      bookingStatus: booking.bookingStatus,
    },
  };
};

// ─────────────────────────────────────────────
// GET all bookings — ADMIN
// ─────────────────────────────────────────────
const getAllBookingsAdmin = async () => {
  return await Booking.find({})
    .populate("turf", "name location mainImage")
    .populate("user", "name email phone")
    .select("-__v")
    .sort({ createdAt: -1 });
};

// ─────────────────────────────────────────────
// GET user's own bookings
// ─────────────────────────────────────────────
const getUserBookings = async (userId) => {
  return await Booking.find({ user: userId })
    .populate("turf", "name location sportType pricePerHour mainImage")
    .sort({ startDateTime: -1 });
};

// ─────────────────────────────────────────────
// GET bookings for a specific turf
// ─────────────────────────────────────────────
const getTurfBookings = async (turfId) => {
  const turf = await Turf.findById(turfId);
  if (!turf) throw new ApiError(404, "Turf not found");

  return await Booking.find({ turf: turfId })
    .populate("user", "name email phone")
    .sort({ startDateTime: 1 });
};

// ─────────────────────────────────────────────
// GET single booking by ID
// ─────────────────────────────────────────────
const getBookingById = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate("user", "name email phone")
    .populate("turf", "name location sportType pricePerHour mainImage");

  if (!booking) throw new ApiError(404, "Booking not found");
  return booking;
};

// ─────────────────────────────────────────────
// CONFIRM booking
// ─────────────────────────────────────────────
const confirmBooking = async (bookingId, vendorId, userRole) => {
  const booking = await Booking.findById(bookingId).populate("turf");
  if (!booking) throw new ApiError(404, "Booking not found");

  if (userRole !== "admin" && booking.turf.owner.toString() !== vendorId.toString()) {
    throw new ApiError(403, "Not authorised to confirm this booking");
  }

  if (booking.bookingStatus !== "pending") {
    throw new ApiError(400, "Only pending bookings can be confirmed");
  }

  const conflict = await Booking.findOne({
    turf:          booking.turf._id,
    bookingStatus: "confirmed",
    _id:           { $ne: booking._id },
    startDateTime: { $lt: booking.endDateTime },
    endDateTime:   { $gt: booking.startDateTime },
  });
  if (conflict) throw new ApiError(400, "Another booking has already been confirmed for this slot");

  booking.bookingStatus = "confirmed";
  await booking.save();

  await Notification.create({
    user:    booking.user,
    title:   "Booking Approved",
    message: "Your booking has been approved by vendor",
    type:    "BOOKING_APPROVED",
  });

  return { message: "Booking confirmed successfully", booking };
};

// ─────────────────────────────────────────────
// REJECT booking
// ─────────────────────────────────────────────
const rejectBooking = async (bookingId, vendorId, userRole) => {
  const booking = await Booking.findById(bookingId).populate("turf");
  if (!booking) throw new ApiError(404, "Booking not found");

  if (userRole !== "admin" && booking.turf.owner.toString() !== vendorId.toString()) {
    throw new ApiError(403, "Not authorised to reject this booking");
  }

  if (booking.bookingStatus !== "pending") {
    throw new ApiError(400, "Only pending bookings can be rejected");
  }

  booking.bookingStatus = "rejected";
  await booking.save();

  await Notification.create({
    user:    booking.user,
    title:   "Booking Rejected",
    message: "Your booking has been rejected by vendor",
    type:    "BOOKING_REJECTED",
  });

  return { message: "Booking rejected successfully", booking };
};

// ─────────────────────────────────────────────
// EXPIRE stale pending bookings (cron job)
// ─────────────────────────────────────────────
const expireBookings = async () => {
  const now            = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  const result = await Booking.updateMany(
    { bookingStatus: "pending", startDateTime: { $lte: oneHourFromNow } },
    { $set: { bookingStatus: "expired" } },
  );

  if (result.modifiedCount > 0) {
    console.log(`Expired ${result.modifiedCount} pending bookings.`);
  }
};

module.exports = {
  createBooking,
  getAllBookingsAdmin,
  getUserBookings,
  getTurfBookings,
  getBookingById,
  confirmBooking,
  rejectBooking,
  expireBookings,
};