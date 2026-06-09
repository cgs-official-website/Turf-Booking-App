// =============================================
//  ROUTE INDEX — mounts all route modules
// =============================================

const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth.routes"));
router.use("/users", require("./user.routes"));
router.use("/turfs", require("./turf.routes"));
router.use("/bookings", require("./booking.routes"));

module.exports = router;
