// =============================================
//  AUTH SERVICE — turf-booking-app
//  Handles: Register, Login, JWT token logic
// =============================================

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model"); // your Mongoose/Sequelize model

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_EXPIRES_IN = "7d";

// ─────────────────────────────────────────────
// REGISTER a new user
// ─────────────────────────────────────────────
const registerUser = async ({ name, email, password, role = "user" }) => {
  // 1. Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("Email already registered");
  }

  // 2. Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 3. Save user to DB
  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    role, // "user" | "admin" | "owner"
  });

  // 4. Generate JWT token
  const token = generateToken(newUser);

  return {
    message: "Registration successful",
    token,
    user: {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    },
  };
};

// ─────────────────────────────────────────────
// LOGIN existing user
// ─────────────────────────────────────────────
const loginUser = async ({ email, password }) => {
  // 1. Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // 2. Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // 3. Generate JWT token
  const token = generateToken(user);

  return {
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
};

// ─────────────────────────────────────────────
// VERIFY token (used inside middleware too)
// ─────────────────────────────────────────────
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    throw new Error("Invalid or expired token");
  }
};

// ─────────────────────────────────────────────
// HELPER — Generate JWT
// ─────────────────────────────────────────────
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
};