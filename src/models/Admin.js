const { required } = require("joi");
const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Admin name is required"],
    },

    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: [true, "email is required"],
    },

    password: {
      type: String,
      required: [true, "password is required"],
    },

    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
    },

    profileImage: {
      data: Buffer,
      contentType: String,
    },

    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Admin", adminSchema);
