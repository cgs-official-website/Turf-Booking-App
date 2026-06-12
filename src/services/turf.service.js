// 
const mongoose = require("mongoose");
const Turf = require("../models/Turf");

const Booking = require("../models/Booking");
const ApiError = require("../utils/ApiError");

// 
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

// 
const searchTurfs = async (query) => {
  const turfs = await Turf.find({
    name: {
      $regex: `^${query}`,
      $options: "i",
    },
  })
    .select("name")
    .limit(10);

  return turfs.map((turf) => turf.name);
};

// 
const getTurfById = async (turfId) => {
  const turf = await Turf.findById(turfId).populate("owner", "name email");
  if (!turf) throw new ApiError(404, "Turf not found");
  return turf;
};

// 
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

// 
const deleteTurf = async (turfId, requesterId, requesterRole) => {
  const turf = await Turf.findById(turfId);
  if (!turf) throw new ApiError(404, "Turf not found");

  if (requesterRole !== "admin" && turf.owner.toString() !== requesterId.toString()) {
    throw new ApiError(403, "Not authorised to delete this turf");
  }

  await turf.deleteOne();
  return { message: "Turf deleted successfully" };
};

// 
const getAvailableSlots = async (turfId, date) => {
  const turf = await Turf.findById(turfId);
  if (!turf) throw new ApiError(404, "Turf not found");

  const queryDate = new Date(date);
  if (isNaN(queryDate.getTime())) {
    throw new ApiError(400, "Invalid date format");
  }

  // Create day range
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

// 
const addReview = async (userId, turfId, rating, comment) => {
  const Review = require("../models/Review");

  // User can review only after confirmed booking
  const confirmedBooking = await Booking.findOne({
    user: userId,
    turf: turfId,
    bookingStatus: "confirmed"
  });

  if (!confirmedBooking) {
    throw new ApiError(403, "You can only review a turf after a confirmed booking");
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
    comment
  });

  // Automatically recalculate averageRating and totalReviews
  const stats = await Review.aggregate([
    { $match: { turf: new mongoose.Types.ObjectId(turfId) } },
    {
      $group: {
        _id: "$turf",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Turf.findByIdAndUpdate(turfId, {
      averageRating: stats[0].averageRating,
      totalReviews: stats[0].totalReviews
    });
  }

  await review.populate("user", "name");
  return review;
};

const getTurfReviews = async (turfId) => {
  const Review = require("../models/Review");
  return await Review.find({ turf: turfId }).populate("user", "name").sort({ createdAt: -1 });
};

const getMyReviews = async (userId) => {
  const Review = require("../models/Review");
  return await Review.find({ user: userId }).populate("turf", "name location").sort({ createdAt: -1 });
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
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Turf.findByIdAndUpdate(turfId, {
      averageRating: stats[0].averageRating,
      totalReviews: stats[0].totalReviews
    });
  } else {
    await Turf.findByIdAndUpdate(turfId, {
      averageRating: 0,
      totalReviews: 0
    });
  }

  return { message: "Review deleted successfully" };
};

module.exports = { addTurf, getAllTurfs, searchTurfs, getTurfById, updateTurf, deleteTurf, getAvailableSlots, addReview, getTurfReviews, getMyReviews, deleteReview };
