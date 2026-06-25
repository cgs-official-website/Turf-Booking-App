const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters long"],
      maxlength: [20, "Name must be less than 20 characters long"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters long"],
    },

    phone: {
      type: String,
      required: [true, "Phone number is required"],
      match: [
        /^[6-9]\d{9}$/,
        "Phone number must be 10 digits and start with 6, 7, 8, or 9",
      ],
    },

    role: {
      type: String,
      enum: ["user", "vendor"],
      default: "user",
    },


  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
