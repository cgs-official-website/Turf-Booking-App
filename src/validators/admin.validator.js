const bcrypt = require("bcryptjs");
const ApiError = require("../utils/ApiError");
const { generateToken } = require("../utils/jwt");

const Admin = require("../models/Admin");
const User = require("../models/User");
const Turf = require("../models/Turf");
const Booking = require("../models/Booking");

// Admin Login
const loginAdmin = async ({ email, password }) => {
  const admin = await Admin.findOne({ email });

  if (!admin) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(admin);

  return {
    success: true,
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    },
  };
};

// Dashboard Stats
const getDashboardStats = async () => {
  const totalVendors = await User.countDocuments({
    role: "vendor",
  });

  const totalTurfs = await Turf.countDocuments();

  const revenueResult = await Booking.aggregate([
    {
      $match: {
        bookingStatus: "confirmed",
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: "$totalAmount",
        },
      },
    },
  ]);

  const totalRevenue =
    revenueResult.length > 0
      ? revenueResult[0].totalRevenue
      : 0;

  const activeSubscriptions = 0; // update later when subscription model exists

  return {
    totalVendors,
    totalTurfs,
    totalRevenue,
    activeSubscriptions,
  };
};

module.exports = {
  loginAdmin,
  getDashboardStats,
};