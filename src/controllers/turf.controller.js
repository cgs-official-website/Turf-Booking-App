const turfService = require("../services/turf.service");

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

    res.status(200).json({
      success: true,
      message: "Turfs fetched successfully",
      count: turfs.length,
      data: turfs,
    });
  } catch (error) {
    next(error);
  }
};

// Get Turf By Id
const getTurfById = async (req, res, next) => {
  try {
    const turf = await turfService.getTurfById(req.params.id);

    res.status(200).json({
      success: true,
      message: "Turf fetched successfully",
      data: turf,
    });
  } catch (error) {
    next(error);
  }
};

// Get Available Slots
const getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: "date query parameter is required",
      });
    }

    const slots = await turfService.getAvailableSlots(req.params.id, date);

    res.status(200).json({
      success: true,
      message: "Slots fetched successfully",
      turfId: req.params.id,
      date,
      data: slots,
    });
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

    res.status(201).json({
      success: true,
      ...result,
    });
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
      req.body,
    );

    res.status(200).json({
      success: true,
      ...result,
    });
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
      req.user.role,
    );

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllTurfs,
  getTurfById,
  getAvailableSlots,
  addTurf,
  updateTurf,
  deleteTurf,
};
