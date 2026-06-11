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
// ─────────────────────────────────────────────
const getAvailableSlots = async (turfId, date) => {
  const turf = await Turf.findById(turfId);
  if (!turf) throw new ApiError(404, "Turf not found");

  const queryDate = new Date(date);
  if (isNaN(queryDate.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }

  // Use UTC boundaries for the queried date to prevent timezone offsets
  const startOfDay = new Date(queryDate);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(queryDate);
  endOfDay.setUTCHours(24, 0, 0, 0);

  // Find all bookings that overlap with this day
  const bookedSlots = await Booking.find({
    turf: turfId,
    bookingStatus: { $in: ["pending", "confirmed"] },
    startDateTime: { $lt: endOfDay },
    endDateTime: { $gt: startOfDay },
  }).select("startDateTime endDateTime").sort({ startDateTime: 1 });

  // Generate hourly blocks from startOfDay to endOfDay using UTC
  const rawSegments = [];
  let current = new Date(startOfDay);

  while (current < endOfDay) {
    const nextHour = new Date(current);
    nextHour.setUTCHours(current.getUTCHours() + 1, current.getUTCMinutes(), current.getUTCSeconds(), 0);
    const segmentEnd = nextHour > endOfDay ? endOfDay : nextHour;

    // Check if this segment overlaps with any booking
    const isBooked = bookedSlots.some(
      (b) => b.startDateTime < segmentEnd && b.endDateTime > current
    );

    // Format times using UTC to match startDateTime accurately
    const formatTime = (d) => `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
    
    rawSegments.push({
      startTime: formatTime(current),
      endTime: formatTime(segmentEnd),
      isAvailable: !isBooked,
      startDateTime: current,
      endDateTime: segmentEnd,
    });

    current = segmentEnd;
  }

  return rawSegments;
};

module.exports = { addTurf, getAllTurfs, getTurfById, updateTurf, deleteTurf, getAvailableSlots };
