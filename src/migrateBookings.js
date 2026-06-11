require("dotenv").config();
const mongoose = require("mongoose");
const Booking = require("./models/Booking");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/turf-booking";

const migrate = async () => {
  try {
    console.log("Connecting to DB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected.");

    const bookings = await Booking.find({});
    console.log(`Found ${bookings.length} bookings to evaluate.`);

    let count = 0;
    for (const b of bookings) {
      if (b.get("bookingDate") && b.get("startTime") && b.get("endTime")) {
        const bd = new Date(b.get("bookingDate"));
        
        const [startH, startM] = b.get("startTime").split(":").map(Number);
        const [endH, endM] = b.get("endTime").split(":").map(Number);

        const startDate = new Date(bd);
        startDate.setHours(startH, startM, 0, 0);

        const endDate = new Date(bd);
        endDate.setHours(endH, endM, 0, 0);
        
        // If end time is past midnight (00:00), rollover to next day
        if (endDate <= startDate) {
          endDate.setDate(endDate.getDate() + 1);
        }

        b.set("startDateTime", startDate);
        b.set("endDateTime", endDate);

        // We use $unset to remove the old schema fields safely
        b.set("bookingDate", undefined);
        b.set("startTime", undefined);
        b.set("endTime", undefined);

        await b.save({ validateBeforeSave: false }); // Skip validation just in case
        count++;
      }
    }

    console.log(`Successfully migrated ${count} bookings.`);
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
};

migrate();
