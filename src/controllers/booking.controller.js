const bookingService = require("../services/booking.service");
const ApiResponse = require("../utils/ApiResponse");

const createBooking = async (req, res, next) => {
  try {
    const result = await bookingService.createBooking({
      ...req.body,
      userId: req.user.id,
    });

    return res.status(201).json(
      new ApiResponse(201, "Booking created successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user.id);

    return res.status(200).json(
      new ApiResponse(200, "Bookings fetched successfully", {
        count: bookings.length,
        bookings,
      })
    );
  } catch (error) {
    next(error);
  }
};

const getTurfBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getTurfBookings(req.params.turfId);

    return res.status(200).json(
      new ApiResponse(200, "Turf bookings fetched successfully", {
        count: bookings.length,
        bookings,
      })
    );
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id);

    return res.status(200).json(
      new ApiResponse(200, "Booking fetched successfully", booking)
    );
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const result = await bookingService.cancelBooking(
      req.params.id,
      req.user.id,
      req.user.role
    );

    return res.status(200).json(
      new ApiResponse(200, "Booking cancelled successfully", result)
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getTurfBookings,
  getBookingById,
  cancelBooking,
};