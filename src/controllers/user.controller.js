// =============================================
//  USER CONTROLLER — turf-booking-app
//  Routes: GET    /api/users/profile        → get my profile
//          PUT    /api/users/profile        → update my profile
//          PUT    /api/users/change-password→ change password
//          GET    /api/users/              → all users (admin only)
//          GET    /api/users/:id           → single user (admin only)
//          DELETE /api/users/:id           → delete user (admin only)
// =============================================

const userService = require("../services/user.service");

// ─────────────────────────────────────────────
// GET /api/users/profile
// ─────────────────────────────────────────────
const getMyProfile = async (req, res) => {
  try {
    const user = await userService.getUserProfile(req.user.id);

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/users/profile
// ─────────────────────────────────────────────
const updateMyProfile = async (req, res) => {
  try {
    const result = await userService.updateUserProfile(req.user.id, req.body);

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// PUT /api/users/change-password
// ─────────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "oldPassword and newPassword are required" });
    }

    const result = await userService.changePassword(req.user.id, { oldPassword, newPassword });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/users/   (admin only)
// ─────────────────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();

    return res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/users/:id  (admin only)
// ─────────────────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);

    return res.status(200).json({ success: true, user });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/users/:id  (admin only)
// ─────────────────────────────────────────────
const deleteUser = async (req, res) => {
  try {
    const result = await userService.deleteUser(req.params.id);

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(404).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getAllUsers,
  getUserById,
  deleteUser,
};