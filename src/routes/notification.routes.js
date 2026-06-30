const express = require("express");
const router = express.Router();

const {
  getMyNotifications,
  markAsRead,
  deleteAllNotifications,
} = require("../controllers/notification.controller");

const { protect } = require("../middlewares/auth.middleware");

router.get("/", protect, getMyNotifications);
router.delete("/", protect, deleteAllNotifications);
router.patch("/:id/read", protect, markAsRead);

module.exports = router;