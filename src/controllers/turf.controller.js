// =============================================
//  TURF CONTROLLER — turf-booking-app
//  Routes: GET    /api/turfs/               → list all turfs
//          GET    /api/turfs/:id            → single turf
//          GET    /api/turfs/:id/slots      → available slots for a date
//          POST   /api/turfs/               → add turf (owner/admin)
//          PUT    /api/turfs/:id            → update turf (owner/admin)
//          DELETE /api/turfs/:id            → delete turf (owner/admin)
// =============================================

const turfService = require("../services/turf.service");

// ─────────────────────────────────────────────
// GET /api/turfs/
// ─────────────────────────────────────────────
const getAllTurfs = async (req, res) => {
  try {
    // Optional query filters: ?location=chennai&minPrice=500&maxPrice=2000
    const { location, minPrice, maxPrice } = req.query;
    const turfs = await turfService.getAllTurfs({ location, minPrice, maxPrice });

    return res.status(200).json({ success: true, count: turfs.length, turfs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/turfs/:id
// ─────────────────────────────────────────────
const getTurfById = async (req, res) => {
  try {
    const turf = await turfService.getTurfById(req.params.id);

    return res.status(200).json({ success: true, turf });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/turfs/:id/slots?date=2024-12-25
// ─────────────────────────────────────────────
const getAvailableSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: "date query param is required (e.g. ?date=2024-12-25)" });
    }

    const slots = await turfService.getAvailableSlots(id, date);

    return res.status(200).json({ success: true, turfId: id, date, slots });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/turfs/   (owner/admin only)
// ─────────────────────────────────────────────
const addTurf = async (req, res) => {
  try {
    const { name, location, pricePerHour, amenities, images } = req.body;
    const ownerId = req.user.id; // from auth middleware

    if (!name || !location || !pricePerHour) {
      return res.status(400).json({ success: false, message: "name, location and pricePerHour are required" });
    }

    const result = await turfService.addTurf({ name, location, pricePerHour, amenities, images, ownerId });

    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/turfs/:id  (owner/admin only)
// ─────────────────────────────────────────────
const updateTurf = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const result = await turfService.updateTurf(req.params.id, ownerId, req.body);

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/turfs/:id  (owner/admin only)
// ─────────────────────────────────────────────
const deleteTurf = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const result = await turfService.deleteTurf(req.params.id, ownerId);

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
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