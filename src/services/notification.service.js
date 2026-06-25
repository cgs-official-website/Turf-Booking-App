const Notification = require("../models/notification");

const createNotification = async (data) => {
  const { userId, title, message, type, vendorId, turfId, reportId } = data;
  return await Notification.create({
    user: userId,
    title,
    message,
    type,
    vendorId,
    turfId,
    reportId,
  });
};

const getMyNotifications = async (userId) => {
  return await Notification.find({ user: userId }).sort({ createdAt: -1 });
};

const markAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
};

module.exports = {
  createNotification,
  getMyNotifications,
  markAsRead,
};