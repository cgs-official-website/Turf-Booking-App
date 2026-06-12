//
const mongoose = require("mongoose");
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

//
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

//
const getTurfById = async (turfId) => {
  const turf = await Turf.findById(turfId).populate("owner", "name email");

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

  // Create day range
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

//
const addReview = async (userId, turfId, rating, comment) => {
  const Review = require("../models/Review");

  // User can review only after confirmed booking
  const confirmedBooking = await Booking.findOne({
    user: userId,
    turf: turfId,
    bookingStatus: "confirmed",
  });

  if (!confirmedBooking) {
    throw new ApiError(
      403,
      "You can only review a turf after a confirmed booking",
    );
  }

  // User can review turf only once
  const existingReview = await Review.findOne({ user: userId, turf: turfId });
  if (existingReview) {
    throw new ApiError(400, "You have already reviewed this turf");
  }

  const review = await Review.create({
    user: userId,
    turf: turfId,
    rating,
    comment,
  });

  // Automatically recalculate averageRating and totalReviews
  const stats = await Review.aggregate([
    { $match: { turf: new mongoose.Types.ObjectId(turfId) } },
    {
      $group: {
        _id: "$turf",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Turf.findByIdAndUpdate(turfId, {
      averageRating: stats[0].averageRating,
      totalReviews: stats[0].totalReviews,
    });
  }

  await review.populate("user", "name");
  return review;
};

const getTurfReviews = async (turfId) => {
  const Review = require("../models/Review");
  return await Review.find({ turf: turfId })
    .populate("user", "name")
    .sort({ createdAt: -1 });
};

const getMyReviews = async (userId) => {
  const Review = require("../models/Review");
  return await Review.find({ user: userId })
    .populate("turf", "name location")
    .sort({ createdAt: -1 });
};

const deleteReview = async (userId, reviewId, userRole) => {
  const Review = require("../models/Review");
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, "Review not found");

  if (userRole !== "admin" && review.user.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorised to delete this review");
  }

  const turfId = review.turf;
  await review.deleteOne();

  // Recalculate stats
  const stats = await Review.aggregate([
    { $match: { turf: new mongoose.Types.ObjectId(turfId) } },
    {
      $group: {
        _id: "$turf",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Turf.findByIdAndUpdate(turfId, {
      averageRating: stats[0].averageRating,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await Turf.findByIdAndUpdate(turfId, {
      averageRating: 0,
      totalReviews: 0,
    });
  }

  return { message: "Review deleted successfully" };
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
  addReview,
  getTurfReviews,
  getMyReviews,
  deleteReview,
};
