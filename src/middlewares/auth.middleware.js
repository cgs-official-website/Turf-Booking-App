// =============================================
//  AUTH MIDDLEWARE — turf-booking-app
//  protect     → checks JWT, sets req.user
//  authorizeRoles → restricts by role (admin, owner, user)
// =============================================

const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";

// ─────────────────────────────────────────────
// protect — use on any route that needs login
// Usage: router.get("/profile", protect, controller)
// ─────────────────────────────────────────────
const protect = async (req, res, next) => {
  try {
    // 1. Get token from Authorization header
    //    Expected format:  Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 3. Check user still exists in DB (handles deleted accounts)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists. Please log in again.",
      });
    }

    // 4. Attach user to request — available as req.user in controllers
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token has expired. Please log in again." });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token. Please log in again." });
    }
    return res.status(500).json({ success: false, message: "Authentication error." });
  }
};

// ─────────────────────────────────────────────
// authorizeRoles — use AFTER protect
// Usage: router.delete("/:id", protect, authorizeRoles("admin"), controller)
//        router.post("/",      protect, authorizeRoles("admin", "owner"), controller)
// ─────────────────────────────────────────────
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Only ${roles.join(" or ")} can perform this action.`,
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };