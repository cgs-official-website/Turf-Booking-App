// =============================================
//  USER SERVICE — Profile, Password, Admin ops
// =============================================

const bcrypt = require("bcryptjs");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

// ─────────────────────────────────────────────
// GET logged-in user's profile
// ─────────────────────────────────────────────
const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

// ─────────────────────────────────────────────
// UPDATE profile (name, phone)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────
const changePassword = async (userId, { oldPassword, newPassword }) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new ApiError(400, "Old password is incorrect");

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return { message: "Password changed successfully" };
};

// ─────────────────────────────────────────────
// GET all users (admin only)
// ─────────────────────────────────────────────
const getAllUsers = async () => {
  return await User.find().select("-password").sort({ createdAt: -1 });
};

// ─────────────────────────────────────────────
// GET single user by ID (admin only)
// ─────────────────────────────────────────────
const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) throw new ApiError(404, "User not found");
  return user;
};

// ─────────────────────────────────────────────
// DELETE user (admin only)
// ─────────────────────────────────────────────
const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  await user.deleteOne();
  return { message: "User deleted successfully" };
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  changePassword,
  getAllUsers,
  getUserById,
  deleteUser,
};
