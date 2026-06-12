// =============================================
//  TURF SERVICE — Add, List, Update, Delete, Slots
// =============================================

const Turf = require("../models/Turf");
const Booking = require("../models/Booking");
const ApiError = require("../utils/ApiError");

// ─────────────────────────────────────────────
// ADD a new turf
// ─────────────────────────────────────────────
const addTurf = async ({
  name,
  location,
  sportType,
  pricePerHour,
  description,
  amenities,
  mainImage,
  secondaryImages,
  ownerId,
}) => {
  const existing = await Turf.findOne({ name, location });

  if (existing) {
    throw new ApiError(
      400,
      "A turf with this name already exists at this location",
    );
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
    approvalStatus: "pending",
  });

  return {
    message: "Turf created successfully and waiting for admin approval",
    turf,
  };
};

// ─────────────────────────────────────────────
// GET all approved turfs
// ─────────────────────────────────────────────
const getAllTurfs = async ({
  location,
  minPrice,
  maxPrice,
  sportType,
} = {}) => {
  const query = {
    isAvailable: true,
    approvalStatus: "approved",
  };

  if (location) {
    query.location = {
      $regex: location,
      $options: "i",
    };
  }

  if (sportType) {
    query.sportType = sportType;
  }

  if (minPrice || maxPrice) {
    query["pricePerHour.basePrice"] = {};

    if (minPrice) {
      query["pricePerHour.basePrice"].$gte = Number(minPrice);
    }

    if (maxPrice) {
      query["pricePerHour.basePrice"].$lte = Number(maxPrice);
    }
  }

  return await Turf.find(query)
    .populate("owner", "name email")
    .select("-__v")
    .sort({ createdAt: -1 });
};

// ─────────────────────────────────────────────
// SEARCH turfs by name
// ─────────────────────────────────────────────
const searchTurfs = async (query) => {
  const turfs = await Turf.find({
    approvalStatus: "approved",
    isAvailable: true,
    name: {
      $regex: query,
      $options: "i",
    },
  })
    .select("_id name")
    .limit(10);

  return turfs.map((turf) => ({
    id: turf._id,
    name: turf.name,
  }));
};
// ─────────────────────────────────────────────
// GET pending turfs (Admin)
// ─────────────────────────────────────────────
const getPendingTurfs = async () => {
  return await Turf.find({
    approvalStatus: "pending",
  })
    .populate("owner", "name email")
    .select("-__v")
    .sort({ createdAt: -1 });
};

// ─────────────────────────────────────────────
// APPROVE turf
// ─────────────────────────────────────────────
const approveTurf = async (turfId) => {
  const turf = await Turf.findById(turfId);

  if (!turf) {
    throw new ApiError(404, "Turf not found");
  }

  if (turf.approvalStatus === "approved") {
    throw new ApiError(400, "Turf is already approved");
  }

  turf.approvalStatus = "approved";

  await turf.save();

  return {
    message: "Turf approved successfully",
    turf,
  };
};

// ─────────────────────────────────────────────
// REJECT turf
// ─────────────────────────────────────────────
const rejectTurf = async (turfId) => {
  const turf = await Turf.findById(turfId);

  if (!turf) {
    throw new ApiError(404, "Turf not found");
  }

  if (turf.approvalStatus === "rejected") {
    throw new ApiError(400, "Turf is already rejected");
  }

  turf.approvalStatus = "rejected";

  await turf.save();

  return {
    message: "Turf rejected successfully",
    turf,
  };
};

// ─────────────────────────────────────────────
// GET single turf by ID
// ─────────────────────────────────────────────
const getTurfById = async (turfId) => {
  const turf = await Turf.findById(turfId).populate(
    "owner",
    "name email"
  );

  if (!turf) {
    throw new ApiError(404, "Turf not found");
  }

  if (turf.approvalStatus !== "approved") {
    throw new ApiError(404, "Turf not found");
  }

  return turf;
};

// ─────────────────────────────────────────────
// UPDATE turf
// ─────────────────────────────────────────────
const updateTurf = async (turfId, requesterId, requesterRole, updateData) => {
  const turf = await Turf.findById(turfId);

  if (!turf) {
    throw new ApiError(404, "Turf not found");
  }

  if (
    requesterRole !== "admin" &&
    turf.owner.toString() !== requesterId.toString()
  ) {
    throw new ApiError(403, "Not authorised to update this turf");
  }

  const allowedFields = [
    "name",
    "location",
    "sportType",
    "pricePerHour",
    "description",
    "amenities",
    "mainImage",
    "secondaryImages",
    "isAvailable",
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      turf[field] = updateData[field];
    }
  });

  // Re-approval required after update
  if (requesterRole === "vendor") {
    turf.approvalStatus = "pending";
  }

  await turf.save();

  return {
    message: "Turf updated successfully",
    turf,
  };
};

// ─────────────────────────────────────────────
// DELETE turf
// ─────────────────────────────────────────────
const deleteTurf = async (turfId, requesterId, requesterRole) => {
  const turf = await Turf.findById(turfId);

  if (!turf) {
    throw new ApiError(404, "Turf not found");
  }

  if (
    requesterRole !== "admin" &&
    turf.owner.toString() !== requesterId.toString()
  ) {
    throw new ApiError(403, "Not authorised to delete this turf");
  }

  await turf.deleteOne();

  return {
    message: "Turf deleted successfully",
  };
};

// ─────────────────────────────────────────────
// GET available slots
// ─────────────────────────────────────────────
const getAvailableSlots = async (turfId, date) => {
  const turf = await Turf.findById(turfId);

  if (!turf) {
    throw new ApiError(404, "Turf not found");
  }

  const queryDate = new Date(date);

  if (isNaN(queryDate.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }

  const startOfDay = new Date(queryDate);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(queryDate);
  endOfDay.setUTCHours(24, 0, 0, 0);

  const bookedSlots = await Booking.find({
    turf: turfId,
    bookingStatus: {
      $in: ["pending", "confirmed"],
    },
    startDateTime: {
      $lt: endOfDay,
    },
    endDateTime: {
      $gt: startOfDay,
    },
  })
    .select("startDateTime endDateTime")
    .sort({ startDateTime: 1 });

  const rawSegments = [];
  let current = new Date(startOfDay);

  while (current < endOfDay) {
    const nextHour = new Date(current);
    nextHour.setUTCHours(nextHour.getUTCHours() + 1);

    const isBooked = bookedSlots.some(
      (b) => b.startDateTime < nextHour && b.endDateTime > current,
    );

    rawSegments.push({
      startTime: current.toISOString(),
      endTime: nextHour.toISOString(),
      isAvailable: !isBooked,
    });

    current = nextHour;
  }

  return rawSegments;
};

module.exports = {
  addTurf,
  getAllTurfs,
  searchTurfs,
  getPendingTurfs,
  approveTurf,
  rejectTurf,
  getTurfById,
  updateTurf,
  deleteTurf,
  getAvailableSlots,
};
