// =============================================
//  DIGILOCKER ROUTES
// =============================================

const express = require("express");
const router = express.Router();

const { initiate, callback } = require("../controllers/digilocker.controller");
const { protect } = require("../middlewares/auth.middleware");

// Initiate DigiLocker OAuth Flow
router.get("/initiate", protect, initiate);

// Handle callback from DigiLocker
router.get("/callback", callback);

module.exports = router;
