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

    // address: {
    //   street: {
    //     type: String,
    //     required: [true, "Street is required"],
    //   },

    //   area: {
    //     type: String,
    //     required: [true, "Area is required"],
    //   },

    //   city: {
    //     type: String,
    //     required: [true, "City is required"],
    //   },

    //   state: {
    //     type: String,
    //     required: [true, "State is required"],
    //   },

    //   pincode: {
    //     type: String,
    //     required: [true, "Pincode is required"],
    //   },
    // },


    sports: [
      {
        type: String,
        enum: ["football", "cricket", "badminton", "multi-sport", "tennis", "basketball", "volleyball", "swimming", "table-tennis"],
      },
    ],

    facilities: [
      {
        type: String,
      },
    ],

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

      weekendEveningPrice: {
        type: Number,
        min: 0,
      },
    },

    description: {
      type: String,
      default: "",
    },

    logo: {
      type: String,
      default: "",
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
    
    verifications: [
      {
        label: String,
        checked: Boolean
      }
    ],

    documents: [
      {
        title: String,
        sub: String,
        status: String,
        icon: String,
        url: String
      }
    ],

    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    rejectionReason: {
      type: String,
      default: "",
    },

    // Verification checklist defaults to false (not verified)
    verificationChecklist: {
      identityVerified: { type: Boolean, default: false },
      locationVerified: { type: Boolean, default: false },
      turfPhotosVerified: { type: Boolean, default: false },
      contactVerified: { type: Boolean, default: false },
      businessVerified: { type: Boolean, default: false },
      documentVerification: {
        aadhar: { type: Boolean, default: false },
        pan: { type: Boolean, default: false },
        gst: { type: Boolean, default: false },
        ebBill: { type: Boolean, default: false },
      },
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    collection: "turfs",
  },
);

module.exports = mongoose.model("Turf", turfSchema);
