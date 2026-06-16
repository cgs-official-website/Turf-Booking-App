const {
  getMyNotifications: getNotifs,
  markAsRead: markNotifAsRead,
} = require("../services/notification.service");

const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await getNotifs(req.user._id);
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
    const notification = await markNotifAsRead(req.params.id, req.user._id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }
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