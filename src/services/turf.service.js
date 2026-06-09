// =============================================
//  TURF SERVICE — Add, List, Update, Delete, Slots
// =============================================

const Turf = require("../models/Turf");
const Booking = require("../models/Booking");
const ApiError = require("../utils/ApiError");

// ─────────────────────────────────────────────
// ADD a new turf
// ─────────────────────────────────────────────
const addTurf = async ({ name, location, sportType, pricePerHour, description, amenities, images, ownerId }) => {
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
    images: images || [],
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

  const allowedFields = ["name", "location", "sportType", "pricePerHour", "description", "amenities", "images", "isAvailable"];
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
// Working hours: 06:00 – 23:00 in 1-hour increments
// ─────────────────────────────────────────────
const getAvailableSlots = async (turfId, date) => {
  const turf = await Turf.findById(turfId);
  if (!turf) throw new ApiError(404, "Turf not found");

  const bookedSlots = await Booking.find({
    turf: turfId,
    bookingDate: new Date(date),
    bookingStatus: { $ne: "cancelled" },
  }).select("startTime endTime");

  const allSlots = [];
  for (let hour = 6; hour < 23; hour++) {
    const start = `${String(hour).padStart(2, "0")}:00`;
    const end = `${String(hour + 1).padStart(2, "0")}:00`;
    allSlots.push({ startTime: start, endTime: end });
  }

  const slots = allSlots.map((slot) => {
    const isBooked = bookedSlots.some(
      (b) => b.startTime <= slot.startTime && b.endTime >= slot.endTime
    );
    return { ...slot, isAvailable: !isBooked };
  });

  return slots;
};

module.exports = { addTurf, getAllTurfs, getTurfById, updateTurf, deleteTurf, getAvailableSlots };
