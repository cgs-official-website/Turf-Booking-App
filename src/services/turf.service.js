// =============================================
//  TURF SERVICE — turf-booking-app
//  Handles: Add, Update, Delete, List turfs
// =============================================

const Turf = require("../models/turf.model");

// ─────────────────────────────────────────────
// ADD a new turf (admin/owner only)
// ─────────────────────────────────────────────
const addTurf = async ({ name, location, pricePerHour, amenities, images, ownerId }) => {
  // Check if turf with same name + location already exists
  const existing = await Turf.findOne({ name, location });
  if (existing) {
    throw new Error("A turf with this name already exists at this location");
  }

  const turf = await Turf.create({
    name,
    location,
    pricePerHour,
    amenities: amenities || [],  // e.g. ["floodlights", "parking", "drinking water"]
    images: images || [],
    owner: ownerId,
    isAvailable: true,
  });

  return { message: "Turf added successfully", turf };
};

// ─────────────────────────────────────────────
// GET all turfs (with optional filters)
// ─────────────────────────────────────────────
const getAllTurfs = async ({ location, minPrice, maxPrice } = {}) => {
  const query = { isAvailable: true };

  // Filter by location (partial match, case-insensitive)
  if (location) {
    query.location = { $regex: location, $options: "i" };
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    query.pricePerHour = {};
    if (minPrice) query.pricePerHour.$gte = Number(minPrice);
    if (maxPrice) query.pricePerHour.$lte = Number(maxPrice);
  }

  const turfs = await Turf.find(query).select("-__v");
  return turfs;
};

// ─────────────────────────────────────────────
// GET single turf by ID
// ─────────────────────────────────────────────
const getTurfById = async (turfId) => {
  const turf = await Turf.findById(turfId);

  if (!turf) {
    throw new Error("Turf not found");
  }

  return turf;
};

// ─────────────────────────────────────────────
// UPDATE turf details (admin/owner only)
// ─────────────────────────────────────────────
const updateTurf = async (turfId, ownerId, updateData) => {
  const turf = await Turf.findById(turfId);

  if (!turf) {
    throw new Error("Turf not found");
  }

  // Only the owner of the turf can update it
  if (turf.owner.toString() !== ownerId.toString()) {
    throw new Error("Not authorized to update this turf");
  }

  // Allowed fields to update
  const allowedFields = ["name", "location", "pricePerHour", "amenities", "images", "isAvailable"];
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      turf[field] = updateData[field];
    }
  });

  await turf.save();

  return { message: "Turf updated successfully", turf };
};

// ─────────────────────────────────────────────
// DELETE a turf (admin/owner only)
// ─────────────────────────────────────────────
const deleteTurf = async (turfId, ownerId) => {
  const turf = await Turf.findById(turfId);

  if (!turf) {
    throw new Error("Turf not found");
  }

  if (turf.owner.toString() !== ownerId.toString()) {
    throw new Error("Not authorized to delete this turf");
  }

  await turf.deleteOne();

  return { message: "Turf deleted successfully" };
};

// ─────────────────────────────────────────────
// CHECK available slots for a turf on a date
// ─────────────────────────────────────────────
const getAvailableSlots = async (turfId, date) => {
  const Booking = require("../models/booking.model");

  // Get all confirmed bookings for this turf on this date
  const bookedSlots = await Booking.find({
    turf: turfId,
    date,
    status: "confirmed",
  }).select("startTime endTime");

  // Define working hours: 6 AM to 11 PM, in 1-hour slots
  const allSlots = [];
  for (let hour = 6; hour < 23; hour++) {
    const start = `${String(hour).padStart(2, "0")}:00`;
    const end = `${String(hour + 1).padStart(2, "0")}:00`;
    allSlots.push({ startTime: start, endTime: end });
  }

  // Mark each slot as available or booked
  const slots = allSlots.map((slot) => {
    const isBooked = bookedSlots.some((booking) => {
      return booking.startTime <= slot.startTime && booking.endTime >= slot.endTime;
    });
    return { ...slot, isAvailable: !isBooked };
  });

  return slots;
};

module.exports = {
  addTurf,
  getAllTurfs,
  getTurfById,
  updateTurf,
  deleteTurf,
  getAvailableSlots,
};