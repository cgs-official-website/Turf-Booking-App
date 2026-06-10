const adminService = require("../services/admin.service");

const createAdmin = async (req, res, next) => {
  try {
    const response = await adminService.createAdmin(req.body);
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

const loginAdmin = async (req, res, next) => {
  try {
    const response = await adminService.loginAdmin(req.body);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      admin: req.admin
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAdmin, loginAdmin, getProfile };
