// =============================================
//  AUTH MIDDLEWARE
//  protect       → validates JWT, sets req.user
//  authorizeRoles → role-based access control
// =============================================

const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");
const ApiError = require("../utils/ApiError");

// ─────────────────────────────────────────────
// protect — attach req.user from valid JWT
// ─────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "Access denied. No token provided."));
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return next(new ApiError(401, "User no longer exists. Please log in again."));
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return next(new ApiError(401, "Token has expired. Please log in again."));
    }
    if (error.name === "JsonWebTokenError") {
      return next(new ApiError(401, "Invalid token. Please log in again."));
    }
    next(new ApiError(500, "Authentication error."));
  }
};

// ─────────────────────────────────────────────
// authorizeRoles — use AFTER protect
// Usage: authorizeRoles("admin", "vendor")
// ─────────────────────────────────────────────
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, `Access denied. Only ${roles.join(" or ")} can perform this action.`)
      );
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };
