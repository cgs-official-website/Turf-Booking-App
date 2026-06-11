// =============================================
//  TURF SERVICE — Add, List, Update, Delete, Slots
// =============================================

const Turf = require("../models/Turf");

const Booking = require("../models/Booking");
const ApiError = require("../utils/ApiError");

// ─────────────────────────────────────────────
// ADD a new turf
// ─────────────────────────────────────────────
const addTurf = async ({ name, location, sportType, pricePerHour, description, amenities, mainImage, secondaryImages, ownerId }) => {
  const existing = await Turf.findOne({ name, location });
  if (existing) {
    throw new ApiError(400, "A turf with this name already exists at this location");
  }

  const turf = await Turf.create({
    name,
    location,
    sportType,
    pricePerHour,
    description,
    amenities: amenities || [],
    mainImage,
    secondaryImages: secondaryImages || [],
    owner: ownerId,
    isAvailable: true,
  });

  return { message: "Turf added successfully", turf };
};

// ─────────────────────────────────────────────
// GET all available turfs (with optional filters)
// Supports: ?location=chennai&minPrice=500&maxPrice=2000&sportType=football
// ─────────────────────────────────────────────
const getAllTurfs = async ({ location, minPrice, maxPrice, sportType } = {}) => {
  const query = { isAvailable: true };

  if (location) {
    query.location = { $regex: location, $options: "i" };
  }

  if (sportType) {
    query.sportType = sportType;
  }

  if (minPrice || maxPrice) {
    query.pricePerHour = {};
    if (minPrice) query.pricePerHour.$gte = Number(minPrice);
    if (maxPrice) query.pricePerHour.$lte = Number(maxPrice);
  }

  return await Turf.find(query).populate("owner", "name email").select("-__v");
};

// ─────────────────────────────────────────────
// GET single turf by ID
// ─────────────────────────────────────────────
const getTurfById = async (turfId) => {
  const turf = await Turf.findById(turfId).populate("owner", "name email");
  if (!turf) throw new ApiError(404, "Turf not found");
  return turf;
};

// ─────────────────────────────────────────────
// UPDATE turf (owner or admin only)
// ─────────────────────────────────────────────
const updateTurf = async (turfId, requesterId, requesterRole, updateData) => {
  const turf = await Turf.findById(turfId);
  if (!turf) throw new ApiError(404, "Turf not found");

  // Admins can update any turf; vendors can only update their own
  if (requesterRole !== "admin" && turf.owner.toString() !== requesterId.toString()) {
    throw new ApiError(403, "Not authorised to update this turf");
  }

  const allowedFields = ["name", "location", "sportType", "pricePerHour", "description", "amenities", "mainImage", "secondaryImages", "isAvailable"];
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      turf[field] = updateData[field];
    }
  });

  await turf.save();
  return { message: "Turf updated successfully", turf };
};

// ─────────────────────────────────────────────
// DELETE turf (owner or admin only)
// ─────────────────────────────────────────────
const deleteTurf = async (turfId, requesterId, requesterRole) => {
  const turf = await Turf.findById(turfId);
  if (!turf) throw new ApiError(404, "Turf not found");

  if (requesterRole !== "admin" && turf.owner.toString() !== requesterId.toString()) {
    throw new ApiError(403, "Not authorised to delete this turf");
  }

  await turf.deleteOne();
  return { message: "Turf deleted successfully" };
};

// ─────────────────────────────────────────────
// GET available slots for a turf on a given date
// Hybrid Model: 1-hour base slots, dynamically split and merged
// ─────────────────────────────────────────────
const getAvailableSlots = async (turfId, date) => {
  const turf = await Turf.findById(turfId);
  if (!turf) throw new ApiError(404, "Turf not found");

  const bookedSlots = await Booking.find({
    turf: turfId,
    bookingDate: new Date(date),
    bookingStatus: { $ne: "rejected" },
  }).select("startTime endTime").sort({ startTime: 1 });

  // 1. Merge overlapping/consecutive bookings
  const mergedBookings = [];
  let currentBooking = null;
  for (const b of bookedSlots) {
    if (!currentBooking) {
      currentBooking = { startTime: b.startTime, endTime: b.endTime };
    } else if (currentBooking.endTime >= b.startTime) {
      if (currentBooking.endTime < b.endTime) {
        currentBooking.endTime = b.endTime;
      }
    } else {
      mergedBookings.push(currentBooking);
      currentBooking = { startTime: b.startTime, endTime: b.endTime };
    }
  }
  if (currentBooking) {
    mergedBookings.push(currentBooking);
  }

  // 2. Collect unique time boundaries (hourly + bookings)
  const timePoints = new Set();
  for (let h = 1; h <= 24; h++) {
    timePoints.add(`${String(h).padStart(2, "0")}:00`);
  }
  for (const b of mergedBookings) {
    timePoints.add(b.startTime);
    timePoints.add(b.endTime);
  }
  
  const sortedPoints = Array.from(timePoints).sort();
  const validPoints = sortedPoints.filter(p => p >= "01:00" && p <= "2:00");

  // 3. Generate raw segments
  const rawSegments = [];
  for (let i = 0; i < validPoints.length - 1; i++) {
    const start = validPoints[i];
    const end = validPoints[i + 1];

    const isBooked = mergedBookings.some(
      (b) => b.startTime <= start && b.endTime >= end
    );

    rawSegments.push({ startTime: start, endTime: end, isAvailable: !isBooked });
  }

  return rawSegments;
};

module.exports = { addTurf, getAllTurfs, getTurfById, updateTurf, deleteTurf, getAvailableSlots };
