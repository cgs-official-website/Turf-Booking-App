const { verifyToken } = require("../utils/jwt");
const ApiError = require("../utils/ApiError");
const Admin = require("../models/Admin");

const authorizeAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "Access denied. No token provided."));
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (decoded.role !== "admin") {
      return next(new ApiError(403, "Access denied. Admin role required."));
    }

    const admin = await Admin.findById(decoded.id).select("-password");
    if (!admin) {
      return next(new ApiError(401, "Admin no longer exists. Please log in again."));
    }

    req.admin = admin;
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

module.exports = { authorizeAdmin };
