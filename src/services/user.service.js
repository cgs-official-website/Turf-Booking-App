// 
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Turf = require("../models/Turf");
const Booking = require("../models/Booking");

const ApiError = require("../utils/ApiError");


// 
const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

// 
const updateUserProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const allowedFields = ["name", "phone"];
  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) {
      user[field] = updateData[field];
    }
  });

  await user.save();

  return {
    message: "Profile updated successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
};

// 
const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new ApiError(400, "Old password is incorrect");

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return { message: "Password changed successfully" };
};

// 
const getAllUsers = async () => {
  return await User.find().select("-password").sort({ createdAt: -1 });
};

// 
const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

// 
const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  await user.deleteOne();
  return { message: "User deleted successfully" };
};

// 
const getVendorDashboardStats = async (vendorId) => {
  const turfs = await Turf.find({ owner: vendorId });
  const turfIds = turfs.map((t) => t._id);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const stats = await Booking.aggregate([
    {
      $match: {
        turf: { $in: turfIds }
      }
    },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        pendingBookings: {
          $sum: { $cond: [{ $eq: ["$bookingStatus", "pending"] }, 1, 0] }
        },
        confirmedBookings: {
          $sum: { $cond: [{ $eq: ["$bookingStatus", "confirmed"] }, 1, 0] }
        },
        rejectedBookings: {
          $sum: { $cond: [{ $in: ["$bookingStatus", ["rejected", "expired"]] }, 1, 0] }
        },
        todayBookings: {
          $sum: { $cond: [{ $gte: ["$createdAt", startOfToday] }, 1, 0] }
        },
        monthlyBookings: {
          $sum: { $cond: [{ $gte: ["$createdAt", startOfMonth] }, 1, 0] }
        },
        totalRevenue: {
          $sum: { $cond: [{ $eq: ["$bookingStatus", "confirmed"] }, "$totalAmount", 0] }
        },
        monthlyRevenue: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$bookingStatus", "confirmed"] },
                  { $gte: ["$createdAt", startOfMonth] }
                ]
              },
              "$totalAmount",
              0
            ]
          }
        }
      }
    }
  ]);

  const defaultStats = {
    totalTurfs: turfIds.length,
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    rejectedBookings: 0,
    todayBookings: 0,
    monthlyBookings: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  };

  if (stats.length > 0) {
    const { _id, ...rest } = stats[0];
    return {
      totalTurfs: turfIds.length,
      ...rest
    };
  }

  return defaultStats;
};

const uploadProfileImage = async (userId, imageUrl) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  user.profileImage = imageUrl;
  await user.save();

  return { profileImage: user.profileImage };
};

const uploadKycDocuments = async (userId, files) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (!user.kycDocuments) {
    user.kycDocuments = {};
  }

  // Update URL for each provided document, preserving existing verification status
  if (files.aadhar && files.aadhar[0]) {
    user.kycDocuments.aadhar = { ...user.kycDocuments.aadhar, url: files.aadhar[0].path };
  }
  if (files.pan && files.pan[0]) {
    user.kycDocuments.pan = { ...user.kycDocuments.pan, url: files.pan[0].path };
  }
  if (files.gst && files.gst[0]) {
    user.kycDocuments.gst = { ...user.kycDocuments.gst, url: files.gst[0].path };
  }
  if (files.ebBill && files.ebBill[0]) {
    user.kycDocuments.ebBill = { ...user.kycDocuments.ebBill, url: files.ebBill[0].path };
  }

  await user.save();

  return { kycDocuments: user.kycDocuments };
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAllUsers,
  getUserById,
  deleteUser,
  getVendorDashboardStats,
  uploadProfileImage,
  uploadKycDocuments,
};
