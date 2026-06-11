const adminService = require("../services/admin.service");
const ApiResponse = require("../utils/ApiResponse");

// const createAdmin = async (req, res, next) => {
//   try {
//     const admin = await adminService.createAdmin(req.body);

//     res.status(201).json(
//       new ApiResponse(201, "Admin created successfully", admin)
//     );
//   } catch (error) {
//     next(error);
//   }
// };

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

const getProfile = async (req, res, next) => {
  try {
    res.status(200).json(
      new ApiResponse(200, "Admin profile fetched successfully", req.admin)
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  // createAdmin,
  loginAdmin,
  getProfile,
};