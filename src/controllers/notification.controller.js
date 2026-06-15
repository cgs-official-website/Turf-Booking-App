const notificationService = require("../services/notification.service");

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications =
      await notificationService.getMyNotifications(
        req.user.id
      );

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const notification =
      await notificationService.markAsRead(
        req.params.id,
        req.user.id
      );

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyNotifications,
  markAsRead,
};