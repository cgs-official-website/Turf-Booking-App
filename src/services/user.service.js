// =============================================
//  USER SERVICE — turf-booking-app
//  Handles: Get profile, Update profile, Admin user management
// =============================================

const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

// ─────────────────────────────────────────────
// GET logged-in user's profile
// ─────────────────────────────────────────────
const getUserProfile = async (userId) => {
  const user = await User.findById(userId).select("-password"); // never send password

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// ─────────────────────────────────────────────
// UPDATE profile (name, phone, etc.)
// ─────────────────────────────────────────────
const updateUserProfile = async (userId, updateData) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Allowed fields to update (don't let user change role/email freely)
  const allowedFields = ["name", "phone", "profilePicture"];
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

  if (!user) {
    throw new Error("User not found");
  }

  // Verify old password
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    throw new Error("Old password is incorrect");
  }

  // Hash new password
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  return { message: "Password changed successfully" };
};

// ─────────────────────────────────────────────
// GET all users (admin only)
// ─────────────────────────────────────────────
const getAllUsers = async () => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  return users;
};

// ─────────────────────────────────────────────
// GET single user by ID (admin only)
// ─────────────────────────────────────────────
const getUserById = async (userId) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

// ─────────────────────────────────────────────
// DELETE a user (admin only)
// ─────────────────────────────────────────────
const deleteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

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