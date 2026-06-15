require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const routes = require("./routes");
const adminRoutes = require("./routes/admin.routes");
const notificationRoutes = require("./routes/notification.routes");



const PORT = process.env.PORT || 5000;

app.use("/", routes);
app.use("/admin", adminRoutes);
app.use("/notifications", notificationRoutes);

const cron = require("node-cron");
const bookingService = require("./services/booking.service");

connectDB();

// Initialize cron job to expire bookings every 5 minutes
cron.schedule("*/5 * * * *", () => {
  bookingService.expireBookings().catch(console.error);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});