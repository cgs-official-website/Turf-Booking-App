const express = require("express");
const router = express.Router();

const {
  getAllTurfs,
  getAllTurfsAdmin,
  getTurfByIdAdmin,
  searchTurfs,
  getPendingTurfs,
  approveTurf,
  rejectTurf,
  getTurfById,
  getAvailableSlots,
  addTurf,
  updateTurf,
  deleteTurf,
} = require("../controllers/turf.controller");

const { protect, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  addTurfSchema,
  updateTurfSchema,
} = require("../validators/turf.validator");
const upload = require("../middlewares/upload.middleware");

// =============================================
// Public Routes
// =============================================
router.get("/", getAllTurfs);
router.get("/search", searchTurfs);

// =============================================
// Admin — named routes (MUST be before /:id)
// =============================================

// All turfs list (pending + approved + rejected)
router.get("/admin/all", protect, authorizeRoles("admin"), getAllTurfsAdmin);

// Single turf detail — any status (used by admin TurfDetails page)
router.get("/admin/:id", protect, authorizeRoles("admin"), getTurfByIdAdmin);

// Pending list
router.get("/pending", protect, authorizeRoles("admin"), getPendingTurfs);

// Approve / Reject
router.patch("/:id/approve", protect, authorizeRoles("admin"), approveTurf);
router.patch("/:id/reject", protect, authorizeRoles("admin"), rejectTurf);

// =============================================
// Public — Turf detail & slots (approved only)
// =============================================
router.get("/:id", getTurfById);
router.get("/:id/slots", getAvailableSlots);

// =============================================
// Vendor / Admin — create, update, delete
// =============================================
const turfUploadFields = upload.fields([
  { name: "mainImage", maxCount: 1 },
  { name: "secondaryImages", maxCount: 5 },
  { name: "logo", maxCount: 1 },
  { name: "ebBill", maxCount: 1 },
]);

const mapFilesToBody = (req, res, next) => {
  if (req.files) {
    if (req.files.mainImage) req.body.mainImage = req.files.mainImage[0].path;
    if (req.files.logo) req.body.logo = req.files.logo[0].path;
    if (req.files.ebBill) req.body.ebBill = req.files.ebBill[0].path;
    if (req.files.secondaryImages) {
      const uploadedUrls = req.files.secondaryImages.map(f => f.path);
      if (req.body.secondaryImages) {
        req.body.secondaryImages = Array.isArray(req.body.secondaryImages) 
          ? [...req.body.secondaryImages, ...uploadedUrls] 
          : [req.body.secondaryImages, ...uploadedUrls];
      } else {
        req.body.secondaryImages = uploadedUrls;
      }
    }
  }
  next();
};

router.post(
  "/",
  protect,
  authorizeRoles("vendor", "admin"),
  turfUploadFields,
  mapFilesToBody,
  validate(addTurfSchema),
  addTurf,
);
router.put(
  "/:id",
  protect,
  authorizeRoles("vendor", "admin"),
  turfUploadFields,
  mapFilesToBody,
  validate(updateTurfSchema),
  updateTurf,
);
router.delete("/:id", protect, authorizeRoles("vendor", "admin"), deleteTurf);

module.exports = router;
