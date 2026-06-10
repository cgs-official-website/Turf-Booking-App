const Turf = require("../models/Turf");
const Booking = require("../models/Booking");
const ApiError = require("../utils/ApiError");

// Add Turf
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
      "A turf with this name already exists at this location"
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
  });

  return {
    message: "Turf added successfully",
    turf,
  };
};

// Get All Turfs
const getAllTurfs = async ({
  location,
  minPrice,
  maxPrice,
  sportType,
} = {}) => {
  const query = { isAvailable: true };

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

  return Turf.find(query)
    .populate("owner", "name email")
    .select("-__v");
};

// Get Turf By Id
const getTurfById = async (turfId) => {
  const turf = await Turf.findById(turfId)
    .populate("owner", "name email")
    .select("-__v");

  if (!turf) {
    throw new ApiError(404, "Turf not found");
  }

  return turf;
};

// Update Turf
const updateTurf = async (
  turfId,
  requesterId,
  requesterRole,
  updateData
) => {
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

  await turf.save();

  return {
    message: "Turf updated successfully",
    turf,
  };
};

// Delete Turf
const deleteTurf = async (
  turfId,
  requesterId,
  requesterRole
) => {
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

// Available Slots
const getAvailableSlots = async (turfId, date) => {
  const turf = await Turf.findById(turfId);

  if (!turf) {
    throw new ApiError(404, "Turf not found");
  }

  const bookedSlots = await Booking.find({
    turf: turfId,
    bookingDate: new Date(date),
    bookingStatus: { $ne: "cancelled" },
  }).select("startTime endTime");

  const allSlots = [];

  for (let hour = 6; hour < 23; hour++) {
    allSlots.push({
      startTime: `${String(hour).padStart(2, "0")}:00`,
      endTime: `${String(hour + 1).padStart(2, "0")}:00`,
    });
  }

  return allSlots.map((slot) => {
    const isBooked = bookedSlots.some(
      (booking) =>
        booking.startTime <= slot.startTime &&
        booking.endTime >= slot.endTime
    );

    return {
      ...slot,
      isAvailable: !isBooked,
    };
  });
};

module.exports = {
  addTurf,
  getAllTurfs,
  getTurfById,
  updateTurf,
  deleteTurf,
  getAvailableSlots,
};