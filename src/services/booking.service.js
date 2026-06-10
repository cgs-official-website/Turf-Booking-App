// =============================================
//  BOOKING SERVICE — Create, Cancel, Fetch
// =============================================

const Booking = require("../models/Booking");
const Turf = require("../models/Turf");
const ApiError = require("../utils/ApiError");

// ─────────────────────────────────────────────
// CREATE a new booking
// ─────────────────────────────────────────────
const createBooking = async ({
  userId,
  turfId,
  bookingDate,
  startTime,
  endTime,
}) => {
  // 1. Check turf exists and is available
  const turf = await Turf.findById(turfId);

  if (!turf) {
    throw new ApiError(404, "Turf not found");
  }

  if (!turf.isAvailable) {
    throw new ApiError(400, "This turf is currently unavailable");
  }

  // 2. Validate start < end
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (endMinutes <= startMinutes) {
    throw new ApiError(400, "endTime must be after startTime");
  }

  // 3. Conflict check
  const conflict = await Booking.findOne({
    turf: turfId,
    bookingDate: new Date(bookingDate),
    bookingStatus: { $ne: "cancelled" },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });

  if (conflict) {
    throw new ApiError(
      409,
      "This slot is already booked. Please choose another time."
    );
  }

  // 4. Calculate pricing
  const bookingDay = new Date(bookingDate).getDay();

  let pricePerHour = turf.pricePerHour.basePrice;

  // Weekend Price
  if (
    (bookingDay === 0 || bookingDay === 6) &&
    turf.pricePerHour.weekendPrice
  ) {
    pricePerHour = turf.pricePerHour.weekendPrice;
  }

  // Evening Price
  else if (
    startH >= 18 &&
    turf.pricePerHour.eveningPrice
  ) {
    pricePerHour = turf.pricePerHour.eveningPrice;
  }

  const durationHours =
    (endMinutes - startMinutes) / 60;

  const totalAmount =
    durationHours * pricePerHour;

  // 5. Create booking
  const booking = await Booking.create({
    user: userId,
    turf: turfId,
    bookingDate: new Date(bookingDate),
    startTime,
    endTime,
    totalAmount,
    bookingStatus: "confirmed",
    paymentStatus: "pending",
  });

  await booking.populate(
    "turf",
    "name location sportType pricePerHour"
  );

  return {
    message: "Booking confirmed successfully",
    booking,
  };
};

// ─────────────────────────────────────────────
// GET all bookings for logged-in user
// ─────────────────────────────────────────────
const getUserBookings = async (userId) => {
  return await Booking.find({
    user: userId,
  })
    .populate(
      "turf",
      "name location sportType pricePerHour mainImage"
    )
    .sort({
      bookingDate: -1,
    });
};

// ─────────────────────────────────────────────
// GET all bookings for a turf
// ─────────────────────────────────────────────
const getTurfBookings = async (turfId) => {
  const turf = await Turf.findById(turfId);

  if (!turf) {
    throw new ApiError(404, "Turf not found");
  }

  return await Booking.find({
    turf: turfId,
  })
    .populate(
      "user",
      "name email phone"
    )
    .sort({
      bookingDate: 1,
    });
};

// ─────────────────────────────────────────────
// GET single booking by ID
// ─────────────────────────────────────────────
const getBookingById = async (bookingId) => {
  const booking = await Booking.findById(
    bookingId
  )
    .populate(
      "user",
      "name email phone"
    )
    .populate(
      "turf",
      "name location sportType pricePerHour mainImage"
    );

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  return booking;
};

// ─────────────────────────────────────────────
// CANCEL booking
// ─────────────────────────────────────────────
const cancelBooking = async (
  bookingId,
  userId,
  userRole
) => {
  const booking = await Booking.findById(
    bookingId
  );

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (
    userRole !== "admin" &&
    booking.user.toString() !== userId.toString()
  ) {
    throw new ApiError(
      403,
      "Not authorised to cancel this booking"
    );
  }

  if (
    booking.bookingStatus === "cancelled"
  ) {
    throw new ApiError(
      400,
      "Booking is already cancelled"
    );
  }

  booking.bookingStatus = "cancelled";

  await booking.save();

  return {
    message: "Booking cancelled successfully",
    booking,
  };
};

module.exports = {
  createBooking,
  getUserBookings,
  getTurfBookings,
  getBookingById,
  cancelBooking,
};

