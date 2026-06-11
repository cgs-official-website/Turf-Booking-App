module.exports = {
  eveningStartHour: parseInt(process.env.EVENING_START_HOUR || "18", 10),
  eveningEndHour: parseInt(process.env.EVENING_END_HOUR || "6", 10),
};
