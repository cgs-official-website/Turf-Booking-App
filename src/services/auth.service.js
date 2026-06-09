// =============================================
//  AUTH SERVICE — Register, Login
// =============================================

const bcrypt = require("bcryptjs");

const ApiError = require("../utils/ApiError");
const { generateToken } = require("../utils/jwt");

const jwt = require("jsonwebtoken");
const User = require("../models/User"); // your Mongoose/Sequelize model

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
const JWT_EXPIRES_IN = "7d";


// ─────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────
const registerUser = async ({ name, email, password, phone, role = "user" }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    role,
  });

  const token = generateToken(user);

  return {
    message: "Registration successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
};

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(user);

  return {
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  };
};

module.exports = { registerUser, loginUser };
