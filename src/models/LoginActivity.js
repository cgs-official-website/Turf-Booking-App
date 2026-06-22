const mongoose = require("mongoose");

const loginActivitySchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    browser: {
      type: String,
      required: true,
    },
    os: {
      type: String,
      required: true,
    },
    loginTime: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  { versionKey: false },
);

module.exports = mongoose.model("LoginActivity", loginActivitySchema);
