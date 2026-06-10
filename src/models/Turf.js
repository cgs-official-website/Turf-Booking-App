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
      //   enum: ["football", "cricket", "badminton", "multi-sport"],
      required: [true, "Sport type is required"],
    },

    pricePerHour: {
      basePrice: {
        type: Number,
        required: [true, "Base price is required"],
        min: 0,
      },

      eveningPrice: {
        type: Number,
        min: 0,
      },

      weekendPrice: {
        type: Number,
        min: 0,
      },
    },

    description: {
      type: String,
      default: "" ,
    },

    mainImage: {
      type: String,
      required: true,
    },

    secondaryImages: [
      {
        type: String,
      },
    ],

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
    collation: "turfs",
  },
);

module.exports = mongoose.model("Turf", turfSchema);
