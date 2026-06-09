const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const turfRoutes = require("./turf.routes");
const bookingRoutes = require("./booking.routes");

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/turfs", turfRoutes);
router.use("/bookings", bookingRoutes);

module.exports = router;