require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const turfRoutes = require("./routes/turf.routes");
const bookingRoutes = require("./routes/booking.routes");
const adminRoutes = require("./routes/admin.routes");

const PORT = process.env.PORT || 5000;

app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/turfs", turfRoutes);
app.use("/bookings", bookingRoutes);
app.use("/admin", adminRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});