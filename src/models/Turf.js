const mongoose = require("mongoose");

const turfSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Turf name is required"],
      trim: true,
    },

    location: {
      type: String,
      required: [true, "Location is required"],
    },

    sportType: {
      type: String,
      enum: ["football", "cricket", "badminton", "multi-sport"],
      required: [true, "Sport type is required"],
    },

    pricePerHour: {
      type: Number,
      required: [true, "Price per hour is required"],
      min: 0,
    },

    description: {
      type: String,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner is required"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Turf", turfSchema);