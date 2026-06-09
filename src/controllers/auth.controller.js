// =============================================
//  AUTH CONTROLLER — turf-booking-app
//  Routes: POST /api/auth/register
//          POST /api/auth/login
// =============================================

const authService = require("../services/auth.service");

// ─────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email and password are required" });
    }

    const result = await authService.registerUser({ name, email, password, role });

    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const result = await authService.loginUser({ email, password });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(401).json({ success: false, message: error.message });
  }
};

module.exports = { register, login };