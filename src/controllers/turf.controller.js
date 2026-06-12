const turfService = require("../services/turf.service");
const ApiResponse = require("../utils/ApiResponse");

// Get All Turfs
const getAllTurfs = async (req, res, next) => {
  try {
    const { location, minPrice, maxPrice, sportType } = req.query;

    const turfs = await turfService.getAllTurfs({
      location,
      minPrice,
      maxPrice,
      sportType,
    });

    return res.status(200).json(
      new ApiResponse(200, "Turfs fetched successfully", {
        count: turfs.length,
        turfs,
      })
    );
  } catch (error) {
    next(error);
  }
};

// Search Turfs
const searchTurfs = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const suggestions = await turfService.searchTurfs(q);

    return res.status(200).json({
      success: true,
      count: suggestions.length,
      suggestions,
    });
  } catch (error) {
    next(error);
  }
};

// Get Turf By Id
const getTurfById = async (req, res, next) => {
  try {
    const turf = await turfService.getTurfById(req.params.id);

    return res.status(200).json(
      new ApiResponse(200, "Turf fetched successfully", turf)
    );
  } catch (error) {
    next(error);
  }
};

// Get Available Slots
const getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json(
        new ApiResponse(400, "Date query parameter is required")
      );
    }

    const slots = await turfService.getAvailableSlots(req.params.id, date);

    return res.status(200).json(
      new ApiResponse(200, "Slots fetched successfully", {
        turfId: req.params.id,
        date,
        slots,
      })
    );
  } catch (error) {
    next(error);
  }
};

// Add Turf
const addTurf = async (req, res, next) => {
  try {
    const result = await turfService.addTurf({
      ...req.body,
      ownerId: req.user.id,
    });

    return res.status(201).json(
      new ApiResponse(201, "Turf added successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

// Update Turf
const updateTurf = async (req, res, next) => {
  try {
    const result = await turfService.updateTurf(
      req.params.id,
      req.user.id,
      req.user.role,
      req.body
    );

    return res.status(200).json(
      new ApiResponse(200, "Turf updated successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

// Delete Turf
const deleteTurf = async (req, res, next) => {
  try {
    const result = await turfService.deleteTurf(
      req.params.id,
      req.user.id,
      req.user.role
    );

    return res.status(200).json(
      new ApiResponse(200, "Turf deleted successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

// Add Review
const addReview = async (req, res, next) => {
  try {
    const { turfId, rating, comment } = req.body;
    const review = await turfService.addReview(req.user.id, turfId, rating, comment);
    return res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

// Get Turf Reviews
const getTurfReviews = async (req, res, next) => {
  try {
    const reviews = await turfService.getTurfReviews(req.params.turfId);
    return res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

// Get My Reviews
const getMyReviews = async (req, res, next) => {
  try {
    const reviews = await turfService.getMyReviews(req.user.id);
    return res.status(200).json(reviews);
  } catch (error) {
    next(error);
  }
};

// Delete Review
const deleteReview = async (req, res, next) => {
  try {
    const result = await turfService.deleteReview(req.user.id, req.params.id, req.user.role);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTurfs,
  searchTurfs,
  getTurfById,
  getAvailableSlots,
  addTurf,
  updateTurf,
  deleteTurf,
  addReview,
  getTurfReviews,
  getMyReviews,
  deleteReview,
};