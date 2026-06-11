// =============================================
//  BOOKING SERVICE — Create, Cancel, Fetch
// =============================================

const Booking = require("../models/Booking");
const Turf = require("../models/Turf");
const ApiError = require("../utils/ApiError");

const pricingConfig = require("../config/pricing");

// ─────────────────────────────────────────────
// CREATE a new booking
// ─────────────────────────────────────────────
const createBooking = async ({
  userId,
  turfId,
  startDateTime,
  endDateTime,
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
  const ensureUTC = (dateStr) => {
    if (typeof dateStr === 'string' && !dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.match(/-\d\d:\d\d$/)) {
      return new Date(dateStr + 'Z');
    }
    return new Date(dateStr);
  };

  const start = ensureUTC(startDateTime);
  const end = ensureUTC(endDateTime);

  if (end <= start) {
    throw new ApiError(400, "endDateTime must be after startDateTime");
  }

  // 3. Conflict check
  const conflict = await Booking.findOne({
    turf: turfId,
    bookingStatus: { $in: ["pending", "confirmed"] },
    startDateTime: { $lt: end },
    endDateTime: { $gt: start },
  });

  if (conflict) {
    throw new ApiError(
      409,
      "This slot is already booked. Please choose another time."
    );
  }

  // 4. Calculate pricing hour-by-hour
  let totalAmount = 0;
  let durationHours = 0;

  let current = new Date(start);
  while (current < end) {
    const nextHour = new Date(current);
    nextHour.setUTCHours(current.getUTCHours() + 1, current.getUTCMinutes(), current.getUTCSeconds(), 0);
    const segmentEnd = nextHour > end ? end : nextHour;

    const segmentDurationHours = (segmentEnd - current) / (1000 * 60 * 60);

    const dayOfWeek = current.getUTCDay();
    const hour = current.getUTCHours();

    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isEvening = hour >= pricingConfig.eveningStartHour || hour < pricingConfig.eveningEndHour;

    let pricePerHour = turf.pricePerHour.basePrice;

    if (isWeekend && isEvening && turf.pricePerHour.weekendEveningPrice !== undefined) {
      pricePerHour = turf.pricePerHour.weekendEveningPrice;
    } else if (isWeekend && turf.pricePerHour.weekendPrice !== undefined) {
      pricePerHour = turf.pricePerHour.weekendPrice;
    } else if (isEvening && turf.pricePerHour.eveningPrice !== undefined) {
      pricePerHour = turf.pricePerHour.eveningPrice;
    }

    console.log(`[Pricing Block] Start: ${current.toISOString()} | End: ${segmentEnd.toISOString()} | Weekend?: ${isWeekend} | Evening?: ${isEvening} | Applied Price: ${pricePerHour}`);

    totalAmount += pricePerHour * segmentDurationHours;
    durationHours += segmentDurationHours;

    current = segmentEnd;
  }

  // 5. Create booking
  const booking = await Booking.create({
    user: userId,
    turf: turfId,
    startDateTime: start,
    endDateTime: end,
    totalAmount,
    bookingStatus: "pending",
    paymentStatus: "pending",
  });

  return {
    message: "Booking request submitted successfully",
    booking: {
      bookingId: booking._id,
      turfId: booking.turf,
      userId: booking.user,
      startDateTime: booking.startDateTime,
      endDateTime: booking.endDateTime,
      durationHours,
      totalAmount,
      bookingStatus: booking.bookingStatus,
    },
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
      startDateTime: -1,
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
      startDateTime: 1,
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
// CONFIRM booking
// ─────────────────────────────────────────────
const confirmBooking = async (
  bookingId,
  vendorId,
  userRole
) => {
  const booking = await Booking.findById(
    bookingId
  ).populate("turf");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (
    userRole !== "admin" &&
    booking.turf.owner.toString() !== vendorId.toString()
  ) {
    throw new ApiError(
      403,
      "Not authorised to confirm this booking"
    );
  }

  if (booking.bookingStatus !== "pending") {
    throw new ApiError(
      400,
      "Only pending bookings can be confirmed"
    );
  }

  booking.bookingStatus = "confirmed";

  await booking.save();

  return {
    message: "Booking confirmed successfully",
    booking,
  };
};

// ─────────────────────────────────────────────
// REJECT booking
// ─────────────────────────────────────────────
const rejectBooking = async (
  bookingId,
  vendorId,
  userRole
) => {
  const booking = await Booking.findById(
    bookingId
  ).populate("turf");

  if (!booking) {
    throw new ApiError(404, "Booking not found");
  }

  if (
    userRole !== "admin" &&
    booking.turf.owner.toString() !== vendorId.toString()
  ) {
    throw new ApiError(
      403,
      "Not authorised to reject this booking"
    );
  }

  if (booking.bookingStatus !== "pending") {
    throw new ApiError(
      400,
      "Only pending bookings can be rejected"
    );
  }

  booking.bookingStatus = "rejected";

  await booking.save();

  return {
    message: "Booking rejected successfully",
    booking,
  };
};

module.exports = {
  createBooking,
  getUserBookings,
  getTurfBookings,
  getBookingById,
  confirmBooking,
  rejectBooking,
};

