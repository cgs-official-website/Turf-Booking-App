const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "TURF_APPROVED",
        "TURF_REJECTED",
        "BOOKING_APPROVED",
        "BOOKING_REJECTED",
        "turf_deleted",
        "subscription_expiring",
        "subscription_expired",
        "subscription_upgraded",
        "subscription_downgraded",
        "autopay_cancelled",
        "vendor_report",
        "booking_received",
      ],
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    turfId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Turf",
      required: false,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: false,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Notification ||
  mongoose.model("Notification", notificationSchema);