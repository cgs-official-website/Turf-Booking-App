// services/report.service.js
const Report = require("../models/Report");
const Turf = require("../models/Turf");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");

function assertObjectId(id, label = "ID") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label}: "${id}" is not a valid ObjectId`);
  }
}

// ─────────────────────────────────────────────
// CREATE report — VENDOR
// ─────────────────────────────────────────────
const createReport = async ({ vendorId, turfId, category, description }) => {
  assertObjectId(turfId, "turf ID");

  const turf = await Turf.findById(turfId);
  if (!turf) throw new ApiError(404, "Turf not found");

  // Vendor can only report their own turfs
  if (turf.owner.toString() !== vendorId.toString()) {
    throw new ApiError(403, "You can only report your own turfs");
  }

  const report = await Report.create({
    vendor: vendorId,
    turf: turfId,
    category,
    description,
    status: "pending",
  });

  try {
    const User = require("../models/User");
    const Admin = require("../models/Admin");
    const { createNotification } = require("./notification.service");
    
    const vendor = await User.findById(vendorId);
    const vendorName = vendor ? vendor.name : "Unknown Vendor";
    const admin = await Admin.findOne({});
    if (admin) {
      await createNotification({
        userId: admin._id,
        title: "New Vendor Report",
        message: `Vendor "${vendorName}" submitted a report.`,
        type: "vendor_report",
        vendorId,
        reportId: report._id,
      });
    }
  } catch (notifErr) {
    console.error("Failed to create vendor report notification:", notifErr);
  }

  return { message: "Report submitted successfully", report };
};

// ─────────────────────────────────────────────
// GET all reports — ADMIN
// ─────────────────────────────────────────────
const getAllReportsAdmin = async () => {
  return await Report.find({})
    .populate("vendor", "name email phone profileImage")
    .populate("turf", "name location mainImage")
    .select("-__v")
    .sort({ createdAt: -1 });
};

// ─────────────────────────────────────────────
// GET single report by ID — ADMIN
// ─────────────────────────────────────────────
const getReportById = async (reportId) => {
  assertObjectId(reportId, "report ID");

  const report = await Report.findById(reportId)
    .populate("vendor", "name email phone profileImage")
    .populate("turf", "name location mainImage");

  if (!report) throw new ApiError(404, "Report not found");
  return report;
};

// ─────────────────────────────────────────────
// GET vendor's own reports — VENDOR
// ─────────────────────────────────────────────
const getMyReports = async (vendorId) => {
  return await Report.find({ vendor: vendorId })
    .populate("turf", "name location mainImage")
    .sort({ createdAt: -1 });
};

// ─────────────────────────────────────────────
// RESOLVE report — ADMIN
// ─────────────────────────────────────────────
const resolveReport = async (reportId, { resolveNote, status = "solved" }) => {
  assertObjectId(reportId, "report ID");

  const report = await Report.findById(reportId);
  if (!report) throw new ApiError(404, "Report not found");

  if (report.status === "solved") {
    throw new ApiError(400, "Report is already resolved");
  }

  report.resolveNote = resolveNote;
  report.status = status;
  if (status === "solved") report.resolvedAt = new Date();

  await report.save();

  return { message: "Report updated successfully", report };
};

// ─────────────────────────────────────────────
// DELETE report — ADMIN
// ─────────────────────────────────────────────
const deleteReport = async (reportId) => {
  assertObjectId(reportId, "report ID");

  const report = await Report.findById(reportId);
  if (!report) throw new ApiError(404, "Report not found");

  await report.deleteOne();
  return { message: "Report deleted successfully" };
};

module.exports = {
  createReport,
  getAllReportsAdmin,
  getReportById,
  getMyReports,
  resolveReport,
  deleteReport,
};
