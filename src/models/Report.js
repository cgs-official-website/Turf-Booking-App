// models/Report.js
const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Vendor is required"],
    },
    turf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Turf",
      required: [true, "Turf is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "System bug",
        "Over charged",
        "Request slot Issue",
        "Facility Damage",
        "Other",
      ],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "under-review", "solved"],
      default: "pending",
    },
    resolveNote: {
      type: String,
      default: "",
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: "reports",
  }
);

module.exports = mongoose.model("Report", reportSchema);
