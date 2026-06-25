const cron = require("node-cron");
const { Subscription } = require("../models/Subscription");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Notification = require("../models/notification");
const { createNotification } = require("../services/notification.service");

const checkSubscriptions = async () => {
  try {
    const now = new Date();
    
    // Find all active/trial subscriptions
    const activeSubscriptions = await Subscription.find({
      status: { $in: ["active", "trial"] },
    }).populate("vendor");

    const admin = await Admin.findOne({});
    const adminId = admin ? admin._id : null;

    for (const sub of activeSubscriptions) {
      if (!sub.vendor) continue;
      
      const vendorId = sub.vendor._id;
      const vendorName = sub.vendor.name || "Unknown Vendor";

      const msRemaining = sub.endDate.getTime() - now.getTime();
      const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

      // 1. Subscription Expiring Soon (exactly 5 days remaining)
      if (daysRemaining === 5) {
        // Vendor Alert
        const vendorNotified = await Notification.findOne({
          user: vendorId,
          type: "subscription_expiring",
          createdAt: { $gte: sub.startDate }
        });

        if (!vendorNotified) {
          await createNotification({
            userId: vendorId,
            title: "Subscription Expiring Soon",
            message: "Your subscription expires in 5 days.",
            type: "subscription_expiring",
          });
        }

        // Admin Alert
        if (adminId) {
          const adminNotified = await Notification.findOne({
            user: adminId,
            type: "subscription_expiring",
            vendorId: vendorId,
            createdAt: { $gte: sub.startDate }
          });

          if (!adminNotified) {
            await createNotification({
              userId: adminId,
              title: "Subscription Expiring Soon",
              message: `Vendor "${vendorName}" subscription expires in 5 days.`,
              type: "subscription_expiring",
              vendorId,
            });
          }
        }
      }
      
      // 2. Subscription Expired (expiry date passed)
      if (sub.endDate < now) {
        sub.status = "expired";
        await sub.save();

        // Vendor Alert
        const vendorNotified = await Notification.findOne({
          user: vendorId,
          type: "subscription_expired",
          createdAt: { $gte: sub.startDate }
        });

        if (!vendorNotified) {
          await createNotification({
            userId: vendorId,
            title: "Subscription Expired",
            message: "Your subscription has expired.",
            type: "subscription_expired",
          });
        }

        // Admin Alert
        if (adminId) {
          const adminNotified = await Notification.findOne({
            user: adminId,
            type: "subscription_expired",
            vendorId: vendorId,
            createdAt: { $gte: sub.startDate }
          });

          if (!adminNotified) {
            await createNotification({
              userId: adminId,
              title: "Subscription Expired",
              message: `Vendor "${vendorName}" subscription has expired.`,
              type: "subscription_expired",
              vendorId,
            });
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in subscription check cron job:", error);
  }
};

const startSubscriptionCron = () => {
  // Run daily at midnight
  cron.schedule("0 0 * * *", checkSubscriptions);
  console.log("Subscription check cron job scheduled successfully.");
  
  // Run immediately on start to check current statuses
  checkSubscriptions();
};

module.exports = {
  startSubscriptionCron,
  checkSubscriptions,
};
