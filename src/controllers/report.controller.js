// controllers/report.controller.js
const reportService = require("../services/report.service");
const ApiResponse   = require("../utils/ApiResponse");

// POST /reports — VENDOR
const createReport = async (req, res, next) => {
  try {
    const result = await reportService.createReport({
      vendorId:    req.user.id,
      turfId:      req.body.turfId,
      category:    req.body.category,
      description: req.body.description,
    });
    return res.status(201).json(new ApiResponse(201, result.message, result.report));
  } catch (err) { next(err); }
};

// GET /reports/admin/all — ADMIN
const getAllReportsAdmin = async (req, res, next) => {
  try {
    const reports = await reportService.getAllReportsAdmin();
    return res.status(200).json(reports);
  } catch (err) { next(err); }
};

// GET /reports/admin/:id — ADMIN
const getReportById = async (req, res, next) => {
  try {
    const report = await reportService.getReportById(req.params.id);
    return res.status(200).json(report);
  } catch (err) { next(err); }
};

// GET /reports/my — VENDOR
const getMyReports = async (req, res, next) => {
  try {
    const reports = await reportService.getMyReports(req.user.id);
    return res.status(200).json(
      new ApiResponse(200, "Reports fetched", { count: reports.length, reports })
    );
  } catch (err) { next(err); }
};

// PATCH /reports/admin/:id/resolve — ADMIN
const resolveReport = async (req, res, next) => {
  try {
    const result = await reportService.resolveReport(req.params.id, {
      resolveNote: req.body.resolveNote,
      status:      req.body.status,
    });
    return res.status(200).json(new ApiResponse(200, result.message, result.report));
  } catch (err) { next(err); }
};

// DELETE /reports/admin/:id — ADMIN
const deleteReport = async (req, res, next) => {
  try {
    const result = await reportService.deleteReport(req.params.id);
    return res.status(200).json(new ApiResponse(200, result.message));
  } catch (err) { next(err); }
};

module.exports = {
  createReport,
  getAllReportsAdmin,
  getReportById,
  getMyReports,
  resolveReport,
  deleteReport,
};
