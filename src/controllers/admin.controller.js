const adminService = require("../services/admin.service");
const ApiResponse = require("../utils/ApiResponse");

// Admin Login
const loginAdmin = async (req, res, next) => {
  try {
    const data = await adminService.loginAdmin(req.body);

    res.status(200).json(
      new ApiResponse(200, "Admin login successful", data)
    );
  } catch (error) {
    next(error);
  }
};

// Admin Profile
const getProfile = async (req, res, next) => {
  try {
    res.status(200).json(
      new ApiResponse(
        200,
        "Admin profile fetched successfully",
        req.admin
      )
    );
  } catch (error) {
    next(error);
  }
};

// Dashboard Stats
const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();

    res.status(200).json(
      new ApiResponse(
        200,
        "Dashboard statistics fetched successfully",
        stats
      )
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  getProfile,
  getDashboardStats,
};