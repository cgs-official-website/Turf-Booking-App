const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    turf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Turf",
      required: [true, "Turf is required"],
    },

    startDateTime: {
      type: Date,
      required: [true, "Start datetime is required"],
    },

    endDateTime: {
      type: Date,
      required: [true, "End datetime is required"],
    },

    totalAmount: {
      type: Number,
      required: [true, "Total amount is required"],
    },

    bookingStatus: {
      type: String,
      enum: ["pending", "confirmed", "rejected", "expired"],
      default: "pending",
    },


    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Booking", bookingSchema);
