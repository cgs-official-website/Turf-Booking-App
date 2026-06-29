const mongoose = require("mongoose");
const adminService = require("../services/admin.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { UAParser } = require("ua-parser-js");

const Admin = require("../models/Admin");
const LoginActivity = require("../models/LoginActivity");
const { sendPasswordResetEmail } = require("../services/emailService");

// Admin Login
// Admin Login
const loginAdmin = async (req, res, next) => {
  try {
    const data = await adminService.loginAdmin(req.body);

    const userAgent = req.headers["user-agent"] || "";

    console.log("USER AGENT:", userAgent);

    const parser = new UAParser();
    parser.setUA(userAgent);

    const uaResult = parser.getResult();

    console.log(
      "UA RESULT:",
      JSON.stringify(uaResult, null, 2)
    );

    const forwardedFor = req.headers["x-forwarded-for"];

    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0].trim()
      : req.ip || req.socket.remoteAddress || "Unknown";

    try {
      await LoginActivity.create({
        adminId: data.admin.id,
        email: data.admin.email,
        ipAddress,

        browser:
          uaResult.browser?.name ||
          "Unknown",

        os:
          uaResult.os?.name ||
          "Unknown",

        loginTime: new Date(),
      });

      console.log(
        "Login activity saved successfully"
      );
    } catch (activityError) {
      console.error(
        "Failed to record admin login activity:",
        activityError
      );
    }

    res.status(200).json(
      new ApiResponse(
        200,
        "Admin login successful",
        data
      )
    );
  } catch (error) {
    next(error);
  }
};
// Admin Profile
const getProfileImage = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }
    if (!admin.profileImage || !admin.profileImage.data) {
      return res.status(404).json(new ApiResponse(404, "Profile image not found", null));
    }
    res.set('Content-Type', admin.profileImage.contentType);
    return res.send(admin.profileImage.data);
  } catch (error) {
    next(error);
  }
};

// Admin profile data
const getProfile = async (req, res, next) => {
  try {
    const adminData = req.admin.toObject();
    adminData.profileImage = adminData.profileImage && adminData.profileImage.data ? "/api/admin/profile-image" : "";
    res.status(200).json(
      new ApiResponse(
        200,
        "Admin profile fetched successfully",
        adminData
      )
    );
  } catch (error) {
    next(error);
  }
};

// Dashboard Stats
const getDashboardStats = async (req, res, next) => {
  try {
    const period = req.query.period || "month";
    const plan = req.query.plan;
    const stats = await adminService.getDashboardStats(period, plan);

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

const getAllVendors = async (req, res, next) => {
  try {
    const vendors = await adminService.getAllVendors();

    res.status(200).json(
      new ApiResponse(
        200,
        "Vendor list fetched successfully",
        vendors
      )
    );
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    admin.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    admin.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await admin.save({ validateBeforeSave: false });

    const frontendUrl =
      process.env.ADMIN_FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/admin/reset-password?token=${resetToken}`;

    // TODO:
    // Enable SMTP email sending after team lead provides SMTP credentials.
    // await sendPasswordResetEmail({ email: admin.email, resetUrl });

    return res.status(200).json({
      success: true,
      message: "Reset link generated successfully",
      resetLink: resetUrl,
    });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const admin = await Admin.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!admin) {
      throw new ApiError(400, "Invalid or expired reset token");
    }

    admin.password = await bcrypt.hash(password, 10);
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    next(error);
  }
};

const getLoginActivity = async (req, res, next) => {
  try {
    const activities = await LoginActivity.find({ adminId: req.admin._id })
      .sort({ loginTime: -1 })
      .limit(10)
      .select("browser os loginTime -_id")
      .lean();

    res.status(200).json(activities);
  } catch (error) {
    next(error);
  }
};

const getVendorBookingStats = async (req, res, next) => {
  try {
    const stats = await adminService.getVendorBookingStats(req.params.vendorId);
    res.status(200).json(
      new ApiResponse(
        200,
        "Vendor booking stats fetched successfully",
        stats
      )
    );
  } catch (error) {
    next(error);
  }
};

const getAllBookings = async (req, res, next) => {
  try {
    const { vendorId } = req.query;
    const bookings = await adminService.getAllBookings(vendorId);
    res.status(200).json(
      new ApiResponse(
        200,
        "Bookings fetched successfully",
        bookings
      )
    );
  } catch (error) {
    next(error);
  }
};

const getVendorRecentBookings = async (req, res, next) => {
  try {
    const bookings = await adminService.getVendorRecentBookings(req.params.vendorId);
    res.status(200).json(
      new ApiResponse(
        200,
        "Vendor recent bookings fetched successfully",
        bookings
      )
    );
  } catch (error) {
    next(error);
  }
};

const suspendVendor = async (req, res, next) => {
  try {
    const { vendorId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      throw new ApiError(400, "Invalid Vendor ID format");
    }

    await adminService.suspendVendor(vendorId);

    res.status(200).json({
      success: true,
      message: "Vendor suspended successfully"
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) {
      throw new ApiError(400, "Name is required");
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }

    admin.name = name;
    await admin.save();

    res.status(200).json(
      new ApiResponse(
        200,
        "Admin profile updated successfully",
        admin
      )
    );
  } catch (error) {
    next(error);
  }
};

const fs = require("fs");
const path = require("path");

const uploadProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new ApiError(400, "Please upload an image");
    }

    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }

    // Store new profile image directly in DB as Buffer
    admin.profileImage = {
      data: req.file.buffer,
      contentType: req.file.mimetype,
    };
    await admin.save();

    const adminData = admin.toObject();
    adminData.profileImage = "/api/admin/profile-image";

    res.status(200).json(
      new ApiResponse(200, "Profile image updated successfully", adminData)
    );
  } catch (error) {
    next(error);
  }
};

const deleteProfileImage = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) {
      throw new ApiError(404, "Admin not found");
    }

    if (admin.profileImage) {
      admin.profileImage = undefined;
      await admin.save();
    }

    res.status(200).json(
      new ApiResponse(200, "Profile image deleted successfully", admin)
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  loginAdmin,
  getProfile,
  getDashboardStats,
  getAllVendors,
  forgotPassword,
  resetPassword,
  getLoginActivity,
  getVendorBookingStats,
  getAllBookings,
  getVendorRecentBookings,
  suspendVendor,
  updateProfile,
  uploadProfileImage,
  deleteProfileImage,
  getProfileImage,
};
