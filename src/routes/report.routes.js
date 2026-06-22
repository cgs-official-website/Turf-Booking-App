// routes/report.routes.js
const express = require("express");
const router  = express.Router();

const {
  createReport,
  getAllReportsAdmin,
  getReportById,
  getMyReports,
  resolveReport,
  deleteReport,
} = require("../controllers/report.controller");

const { protect, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { createReportSchema, resolveReportSchema } = require("../validators/report.validator");

// ── IMPORTANT: named routes before /:id ────────────────────────────────────

// GET /reports/admin/all  — ADMIN: all reports
router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  getAllReportsAdmin
);

// GET /reports/my  — VENDOR: own reports
router.get("/my", protect, authorizeRoles("vendor"), getMyReports);

// GET /reports/admin/:id  — ADMIN: single report detail
router.get(
  "/admin/:id",
  protect,
  authorizeRoles("admin"),
  getReportById
);

// PATCH /reports/admin/:id/resolve  — ADMIN: resolve / update status
router.patch(
  "/admin/:id/resolve",
  protect,
  authorizeRoles("admin"),
  validate(resolveReportSchema),
  resolveReport
);

// DELETE /reports/admin/:id  — ADMIN: delete report
router.delete(
  "/admin/:id",
  protect,
  authorizeRoles("admin"),
  deleteReport
);

// POST /reports  — VENDOR: create report
router.post(
  "/",
  protect,
  authorizeRoles("vendor"),
  validate(createReportSchema),
  createReport
);

module.exports = router;

// ─────────────────────────────────────────────
// Register in your main app.js / server.js:
//   const reportRoutes = require("./routes/report.routes");
//   app.use("/reports", reportRoutes);
// ─────────────────────────────────────────────
