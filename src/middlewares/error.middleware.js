// =============================================
//  ERROR MIDDLEWARE — turf-booking-app
//  notFound    → catches unknown routes (404)
//  errorHandler → catches all thrown errors globally
//
//  In app.js, add AFTER all routes:
//    app.use(notFound);
//    app.use(errorHandler);
// =============================================

// ─────────────────────────────────────────────
// 404 — Route not found
// Catches any request that didn't match a route
// ─────────────────────────────────────────────
const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error); // passes to errorHandler below
};

// ─────────────────────────────────────────────
// GLOBAL ERROR HANDLER
// Catches errors from: controllers, services, middleware
// Any next(error) or throw inside async code lands here
// ─────────────────────────────────────────────
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // ── Mongoose: Invalid ObjectId  (e.g. /api/turfs/not-a-valid-id)
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 400;
    message = `Invalid ID format: ${err.value}`;
  }

  // ── Mongoose: Duplicate key  (e.g. registering same email twice)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists. Please use a different value.`;
  }

  // ── Mongoose: Validation error  (schema-level required/enum/etc)
  if (err.name === "ValidationError") {
    statusCode = 422;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
  }

  // ── JWT errors (backup — auth middleware usually catches these first)
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token has expired. Please log in again.";
  }

  // ── Log full error in development only
  if (process.env.NODE_ENV === "development") {
    console.error(`[ERROR] ${req.method} ${req.originalUrl} →`, err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    // Show stack trace only in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };