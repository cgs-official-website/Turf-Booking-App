// 
const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use("/turfs", require("./turf.routes"));
router.use("/bookings", require("./booking.routes"));

// Vendor Dashboard specific route
const { getVendorDashboard } = require("../controllers/user.controller");
const { protect, authorizeRoles } = require("../middlewares/auth.middleware");
router.get("/vendor/dashboard", protect, authorizeRoles("vendor"), getVendorDashboard);

// Review routes
const { addReview, getTurfReviews, getMyReviews, deleteReview } = require("../controllers/turf.controller");
const validate = require("../middlewares/validation.middleware");
const { addReviewSchema } = require("../validators/review.validator");
router.post("/reviews", protect, validate(addReviewSchema), addReview);
router.get("/reviews/my", protect, getMyReviews);
router.get("/reviews/turf/:turfId", getTurfReviews);
router.delete("/reviews/:id", protect, deleteReview);

module.exports = router;
