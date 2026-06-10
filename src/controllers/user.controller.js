// =============================================
//  USER CONTROLLER
//  GET    /api/users/profile
//  PUT    /api/users/profile
//  PUT    /api/users/change-password
//  GET    /api/users/            (admin)
//  GET    /api/users/:id         (admin)
//  DELETE /api/users/:id         (admin)
// =============================================

const userService = require("../services/user.service");

const getMyProfile = async (req, res, next) => {
  try {
    const user = await userService.getUserProfile(req.user.id);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const result = await userService.updateUserProfile(req.user.id, req.body);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const result = await userService.changePassword(req.user.id, { oldPassword, newPassword });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    return res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    return res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.id);
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyProfile, updateMyProfile, changePassword, getAllUsers, getUserById, deleteUser };

