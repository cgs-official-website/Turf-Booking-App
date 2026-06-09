// =============================================
//  TURF CONTROLLER
//  GET    /api/turfs/            → all turfs
//  GET    /api/turfs/:id         → single turf
//  GET    /api/turfs/:id/slots   → available slots
//  POST   /api/turfs/            → add turf (vendor/admin)
//  PUT    /api/turfs/:id         → update turf (owner/admin)
//  DELETE /api/turfs/:id         → delete turf (owner/admin)
// =============================================

const turfService = require("../services/turf.service");

const getAllTurfs = async (req, res, next) => {
  try {
    const { location, minPrice, maxPrice, sportType } = req.query;
    const turfs = await turfService.getAllTurfs({ location, minPrice, maxPrice, sportType });
    return res.status(200).json({ success: true, count: turfs.length, turfs });
  } catch (error) {
    next(error);
  }
};

const getTurfById = async (req, res, next) => {
  try {
    const turf = await turfService.getTurfById(req.params.id);
    return res.status(200).json({ success: true, turf });
  } catch (error) {
    next(error);
  }
};

const getAvailableSlots = async (req, res, next) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: "date query param is required (e.g. ?date=2025-12-25)" });
    }
    const slots = await turfService.getAvailableSlots(req.params.id, date);
    return res.status(200).json({ success: true, turfId: req.params.id, date, slots });
  } catch (error) {
    next(error);
  }
};

const addTurf = async (req, res, next) => {
  try {
    const result = await turfService.addTurf({ ...req.body, ownerId: req.user.id });
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const updateTurf = async (req, res, next) => {
  try {
    const result = await turfService.updateTurf(req.params.id, req.user.id, req.user.role, req.body);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const deleteTurf = async (req, res, next) => {
  try {
    const result = await turfService.deleteTurf(req.params.id, req.user.id, req.user.role);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllTurfs, getTurfById, getAvailableSlots, addTurf, updateTurf, deleteTurf };
