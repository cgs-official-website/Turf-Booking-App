require("dotenv").config();

const app = require("./app");
const User = require("./models/User");
const Booking = require("./models/Booking");
const Slot = require("./models/Slot");
const Turf = require("./models/Turf");

const PORT = process.env.PORT || 5000;

// user
app.post("/users", (req, res) => {
  const { name, email, password, phone } = req.body; 
  res.status(201).json({
    message: "User created!",
    user: { 
      name, 
      email, 
      password, 
      phone 
    },
  });
});

// booking
app.post("/booking", (req, res) => {
  const { userId, turfId, bookingDate, startTime, endTime, bookingStatus } = req.body;

  res.status(201).json({
    message: "Booking created successfully",
    booking: {
      userId,
      turfId,
      bookingDate,
      startTime,
      endTime,
      bookingStatus
    },
  });
});


//Turf
app.post("/turf", (req, res) => {
  const {
    name,
    location,
    sportType,
    pricePerHour,
    description
  } = req.body;

  res.status(201).json({
    message: "Turf created successfully",
    turf: {
      name,
      location,
      sportType,
      pricePerHour,
      description
    }
  });
});

//Slot
app.post("/slots", async (req, res) => {
  try {
    const slot = await Slot.create(req.body);

    res.status(201).json({
      message: "Slot created successfully",
      slot,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
