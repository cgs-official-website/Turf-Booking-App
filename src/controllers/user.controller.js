const userService = require("../services/user.service");
const ApiResponse = require("../utils/ApiResponse");

const getMyProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.user.id);

    return res.status(200).json(
      new ApiResponse(200, "Profile fetched successfully", user)
    );
  } catch (error) {
    next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const result = await userService.updateUserProfile(
      req.user.id,
      req.body
    );

    return res.status(200).json(
      new ApiResponse(200, "Profile updated successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const result = await userService.changePassword(req.user.id, {
      oldPassword,
      newPassword,
    });

    return res.status(200).json(
      new ApiResponse(200, "Password changed successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();

    return res.status(200).json(
      new ApiResponse(200, "Users fetched successfully", {
        count: users.length,
        users,
      })
    );
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);

    return res.status(200).json(
      new ApiResponse(200, "User fetched successfully", user)
    );
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.id);

    return res.status(200).json(
      new ApiResponse(200, "User deleted successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

const getVendorDashboard = async (req, res, next) => {
  try {
    const stats = await userService.getVendorDashboardStats(req.user.id);
    return res.status(200).json(stats); // API response directly format without wrapping as per requirement
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  changePassword,
  getAllUsers,
  getUserById,
  deleteUser,
  getVendorDashboard,
};