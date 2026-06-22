const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");

// Load env vars
dotenv.config();

// Import routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const turfRoutes = require("./routes/turf.routes");
const bookingRoutes = require("./routes/booking.routes");
 const routes = require("./routes");
const adminRoutes = require("./routes/admin.routes");
const notificationRoutes = require("./routes/notification.routes");
const subscriptionRoutes = require("./routes/subscription.routes"); // ← ADD THIS
const reportRoutes = require("./routes/report.routes");


const app = express();

// Middleware
app.use(helmet());`
app.use(cors());`
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/", routes);
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/turfs", turfRoutes);
app.use("/bookings", bookingRoutes);
app.use("/admin", adminRoutes);
app.use("/subscriptions", subscriptionRoutes); // ← ADD THIS
app.use("/notifications", notificationRoutes);
app.use("/reports", reportRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "OK", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/turf_booking")
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});