// const { Plan, Subscription } = require("../models/Subscription");
// const User = require("../models/User");
// const ApiError = require("../utils/ApiError");

// // ─────────────────────────────────────────────
// // PLAN MANAGEMENT (Admin)
// // ─────────────────────────────────────────────

// const createPlan = async ({ name, description, price, durationDays, features, trialDays }) => {
//   const existing = await Plan.findOne({ name, isActive: true });
//   if (existing) {
//     throw new ApiError(400, "A plan with this name already exists");
//   }

//   const plan = await Plan.create({
//     name,
//     description,
//     price,
//     durationDays,
//     features,
//     trialDays: trialDays || 0,
//     isActive: true,
//   });

//   return { message: "Plan created successfully", plan };
// };

// const getAllPlans = async (includeInactive = false) => {
//   const query = includeInactive ? {} : { isActive: true };
//   return await Plan.find(query).sort({ price: 1 });
// };

// const getPlanById = async (planId) => {
//   const plan = await Plan.findById(planId);
//   if (!plan) throw new ApiError(404, "Plan not found");
//   return plan;
// };

// const updatePlan = async (planId, updateData) => {
//   const plan = await Plan.findById(planId);
//   if (!plan) throw new ApiError(404, "Plan not found");

//   const allowed = ["name", "description", "price", "durationDays", "features", "trialDays", "isActive"];
//   allowed.forEach((field) => {
//     if (updateData[field] !== undefined) plan[field] = updateData[field];
//   });

//   await plan.save();
//   return { message: "Plan updated successfully", plan };
// };

// const deletePlan = async (planId) => {
//   const plan = await Plan.findById(planId);
//   if (!plan) throw new ApiError(404, "Plan not found");

//   // Soft-delete: deactivate instead of hard delete
//   plan.isActive = false;
//   await plan.save();
//   return { message: "Plan deactivated successfully" };
// };

// // ─────────────────────────────────────────────
// // SUBSCRIPTION MANAGEMENT (Vendor)
// // ─────────────────────────────────────────────

// const getActiveSubscription = async (vendorId) => {
//   return await Subscription.findOne({
//     vendor: vendorId,
//     status: { $in: ["active", "trial"] },
//   })
//     .populate("plan")
//     .populate("previousPlan", "name price");
// };

// const getVendorSubscriptions = async (vendorId) => {
//   return await Subscription.find({ vendor: vendorId })
//     .populate("plan")
//     .populate("previousPlan", "name price")
//     .sort({ createdAt: -1 });
// };

// const subscribe = async (vendorId, planId) => {
//   const vendor = await User.findById(vendorId);
//   if (!vendor || vendor.role !== "vendor") {
//     throw new ApiError(403, "Only vendors can subscribe to plans");
//   }

//   const plan = await Plan.findById(planId);
//   if (!plan || !plan.isActive) throw new ApiError(404, "Plan not found or inactive");

//   // Check for existing active subscription
//   const existing = await getActiveSubscription(vendorId);
//   if (existing) {
//     throw new ApiError(400, "You already have an active subscription. Use upgrade/downgrade to change plans.");
//   }

//   const now = new Date();
//   let startDate = now;
//   let endDate;
//   let status;
//   let trialEndDate = null;
//   let isTrial = false;

//   // If plan has trial days, start trial
//   if (plan.trialDays > 0) {
//     trialEndDate = new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000);
//     endDate = new Date(trialEndDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
//     status = "trial";
//     isTrial = true;
//   } else {
//     endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
//     status = "active";
//   }

//   const subscription = await Subscription.create({
//     vendor: vendorId,
//     plan: planId,
//     status,
//     startDate,
//     endDate,
//     trialEndDate,
//     isTrial,
//     paymentStatus: plan.trialDays > 0 ? "pending" : "paid",
//     amountPaid: plan.trialDays > 0 ? 0 : plan.price,
//   });

//   await subscription.populate("plan");

//   return {
//     message: isTrial
//       ? `Trial started. You have ${plan.trialDays} days free, then the plan activates.`
//       : "Subscription activated successfully",
//     subscription,
//   };
// };

// const renewSubscription = async (vendorId) => {
//   const current = await getActiveSubscription(vendorId);
//   if (!current) throw new ApiError(404, "No active subscription found to renew");

//   const plan = await Plan.findById(current.plan._id || current.plan);
//   if (!plan || !plan.isActive) throw new ApiError(400, "Subscription plan is no longer available");

//   // Extend end date from current end date (so there's no gap)
//   const newEndDate = new Date(
//     Math.max(current.endDate.getTime(), Date.now()) + plan.durationDays * 24 * 60 * 60 * 1000
//   );

//   current.endDate = newEndDate;
//   current.status = "active";
//   current.paymentStatus = "paid";
//   current.amountPaid += plan.price;
//   current.isTrial = false;
//   current.trialEndDate = null;

//   await current.save();
//   await current.populate("plan");

//   return {
//     message: "Subscription renewed successfully",
//     subscription: current,
//     newEndDate,
//   };
// };

// const upgradeDowngradePlan = async (vendorId, newPlanId) => {
//   const current = await getActiveSubscription(vendorId);
//   if (!current) throw new ApiError(404, "No active subscription found");

//   const currentPlan = await Plan.findById(current.plan._id || current.plan);
//   const newPlan = await Plan.findById(newPlanId);
//   if (!newPlan || !newPlan.isActive) throw new ApiError(404, "New plan not found or inactive");

//   if (currentPlan._id.toString() === newPlanId) {
//     throw new ApiError(400, "You are already on this plan");
//   }

//   const isUpgrade = newPlan.price > currentPlan.price;
//   const now = new Date();

//   // For upgrades: new end date from now + new plan duration
//   // For downgrades: keep remaining days + new plan duration
//   let newEndDate;
//   if (isUpgrade) {
//     newEndDate = new Date(now.getTime() + newPlan.durationDays * 24 * 60 * 60 * 1000);
//   } else {
//     const remainingMs = Math.max(0, current.endDate - now);
//     newEndDate = new Date(now.getTime() + remainingMs + newPlan.durationDays * 24 * 60 * 60 * 1000);
//   }

//   current.previousPlan = current.plan;
//   current.plan = newPlanId;
//   current.endDate = newEndDate;
//   current.upgradeDowngradeDate = now;
//   current.status = "active";
//   current.isTrial = false;
//   current.trialEndDate = null;
//   current.amountPaid += newPlan.price;
//   current.paymentStatus = "paid";

//   await current.save();
//   await current.populate("plan");
//   await current.populate("previousPlan", "name price");

//   return {
//     message: isUpgrade
//       ? `Plan upgraded to "${newPlan.name}" successfully`
//       : `Plan downgraded to "${newPlan.name}" successfully`,
//     action: isUpgrade ? "upgrade" : "downgrade",
//     previousPlan: currentPlan.name,
//     newPlan: newPlan.name,
//     subscription: current,
//   };
// };

// const cancelSubscription = async (vendorId, cancelReason = "") => {
//   const current = await getActiveSubscription(vendorId);
//   if (!current) throw new ApiError(404, "No active subscription found");

//   current.status = "cancelled";
//   current.cancelledAt = new Date();
//   current.cancelReason = cancelReason;
//   current.autoRenew = false;

//   await current.save();
//   await current.populate("plan");

//   return {
//     message: "Subscription cancelled successfully",
//     subscription: current,
//   };
// };

// const toggleAutoRenew = async (vendorId, enable) => {
//   const current = await getActiveSubscription(vendorId);
//   if (!current) throw new ApiError(404, "No active subscription found");

//   current.autoRenew = enable;
//   await current.save();

//   return {
//     message: `Auto-renew ${enable ? "enabled" : "disabled"} successfully`,
//     autoRenew: current.autoRenew,
//   };
// };

// // ─────────────────────────────────────────────
// // ADMIN: All subscriptions
// // ─────────────────────────────────────────────

// const getAllSubscriptions = async ({ status, page = 1, limit = 20 } = {}) => {
//   const query = {};
//   if (status) query.status = status;

//   const skip = (page - 1) * limit;
//   const total = await Subscription.countDocuments(query);

//   const subscriptions = await Subscription.find(query)
//     .populate("vendor", "name email phone")
//     .populate("plan", "name price durationDays")
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(limit);

//   return {
//     total,
//     page,
//     totalPages: Math.ceil(total / limit),
//     subscriptions,
//   };
// };

// const getSubscriptionStats = async () => {
//   const stats = await Subscription.aggregate([
//     {
//       $group: {
//         _id: "$status",
//         count: { $sum: 1 },
//         totalRevenue: { $sum: "$amountPaid" },
//       },
//     },
//   ]);

//   const result = {
//     active: 0,
//     trial: 0,
//     expired: 0,
//     cancelled: 0,
//     pending: 0,
//     totalRevenue: 0,
//     totalSubscriptions: 0,
//   };

//   stats.forEach(({ _id, count, totalRevenue }) => {
//     result[_id] = count;
//     result.totalRevenue += totalRevenue;
//     result.totalSubscriptions += count;
//   });

//   return result;
// };

// // ─────────────────────────────────────────────
// // CRON: Expire subscriptions & send alerts
// // ─────────────────────────────────────────────

// const expireSubscriptions = async () => {
//   const now = new Date();

//   // Move trial → active when trial period ends (and keep going)
//   const trialsEnded = await Subscription.updateMany(
//     {
//       status: "trial",
//       trialEndDate: { $lte: now },
//       endDate: { $gt: now },
//     },
//     { $set: { status: "active", isTrial: false } }
//   );

//   // Expire active/trial subscriptions past endDate
//   const expired = await Subscription.updateMany(
//     {
//       status: { $in: ["active", "trial"] },
//       endDate: { $lte: now },
//     },
//     { $set: { status: "expired" } }
//   );

//   if (trialsEnded.modifiedCount > 0) {
//     console.log(`[Subscription] ${trialsEnded.modifiedCount} trial(s) converted to active`);
//   }
//   if (expired.modifiedCount > 0) {
//     console.log(`[Subscription] ${expired.modifiedCount} subscription(s) expired`);
//   }
// };

// const getExpiryAlerts = async () => {
//   const now = new Date();
//   const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
//   const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

//   // Subscriptions expiring within 7 days that haven't been alerted recently
//   const expiringSoon = await Subscription.find({
//     status: { $in: ["active", "trial"] },
//     endDate: { $gte: now, $lte: sevenDaysFromNow },
//   })
//     .populate("vendor", "name email phone")
//     .populate("plan", "name price");

//   return expiringSoon.map((sub) => ({
//     subscriptionId: sub._id,
//     vendor: sub.vendor,
//     plan: sub.plan,
//     endDate: sub.endDate,
//     daysRemaining: sub.daysRemaining,
//     urgency: sub.daysRemaining <= 3 ? "critical" : "warning",
//   }));
// };

// module.exports = {
//   createPlan,
//   getAllPlans,
//   getPlanById,
//   updatePlan,
//   deletePlan,
//   subscribe,
//   renewSubscription,
//   upgradeDowngradePlan,
//   cancelSubscription,
//   toggleAutoRenew,
//   getActiveSubscription,
//   getVendorSubscriptions,
//   getAllSubscriptions,
//   getSubscriptionStats,
//   expireSubscriptions,
//   getExpiryAlerts,
// };


const { Plan, Subscription } = require("../models/Subscription");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

// ─────────────────────────────────────────────
// PLAN MANAGEMENT (Admin)
// ─────────────────────────────────────────────

const createPlan = async ({
  name,
  description,
  price,
  durationDays,
  features,
  featureList,
  trialDays,
  isActive,
  isMostPopular,
}) => {
  const existing = await Plan.findOne({ name, isActive: true });
  if (existing) {
    throw new ApiError(400, "A plan with this name already exists");
  }

  // Only one plan can be "Most Popular" at a time.
  if (isMostPopular) {
    await Plan.updateMany({ isMostPopular: true }, { $set: { isMostPopular: false } });
  }

  const plan = await Plan.create({
    name,
    description,
    price,
    durationDays,
    features,
    featureList: featureList || [],
    trialDays: trialDays || 0,
    isActive: isActive !== undefined ? isActive : true,
    isMostPopular: !!isMostPopular,
  });

  return { message: "Plan created successfully", plan };
};

const getAllPlans = async (includeInactive = false) => {
  const query = includeInactive ? {} : { isActive: true };
  return await Plan.find(query).sort({ price: 1 });
};

const getPlanById = async (planId) => {
  const plan = await Plan.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");
  return plan;
};

const updatePlan = async (planId, updateData) => {
  const plan = await Plan.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");

  const allowed = [
    "name",
    "description",
    "price",
    "durationDays",
    "features",
    "featureList",
    "trialDays",
    "isActive",
    "isMostPopular",
  ];
  allowed.forEach((field) => {
    if (updateData[field] !== undefined) plan[field] = updateData[field];
  });

  // Only one plan can be "Most Popular" at a time.
  if (updateData.isMostPopular === true) {
    await Plan.updateMany(
      { _id: { $ne: planId }, isMostPopular: true },
      { $set: { isMostPopular: false } }
    );
  }

  await plan.save();
  return { message: "Plan updated successfully", plan };
};

const deletePlan = async (planId) => {
  const plan = await Plan.findById(planId);
  if (!plan) throw new ApiError(404, "Plan not found");

  // Soft-delete: deactivate instead of hard delete
  plan.isActive = false;
  await plan.save();
  return { message: "Plan deactivated successfully" };
};

// ─────────────────────────────────────────────
// SUBSCRIPTION MANAGEMENT (Vendor)
// ─────────────────────────────────────────────

const getActiveSubscription = async (vendorId) => {
  return await Subscription.findOne({
    vendor: vendorId,
    status: { $in: ["active", "trial"] },
  })
    .populate("plan")
    .populate("previousPlan", "name price");
};

const getVendorSubscriptions = async (vendorId) => {
  return await Subscription.find({ vendor: vendorId })
    .populate("plan")
    .populate("previousPlan", "name price")
    .sort({ createdAt: -1 });
};

const subscribe = async (vendorId, planId) => {
  const vendor = await User.findById(vendorId);
  if (!vendor || vendor.role !== "vendor") {
    throw new ApiError(403, "Only vendors can subscribe to plans");
  }

  const plan = await Plan.findById(planId);
  if (!plan || !plan.isActive) throw new ApiError(404, "Plan not found or inactive");

  // Check for existing active subscription
  const existing = await getActiveSubscription(vendorId);
  if (existing) {
    throw new ApiError(400, "You already have an active subscription. Use upgrade/downgrade to change plans.");
  }

  const now = new Date();
  let startDate = now;
  let endDate;
  let status;
  let trialEndDate = null;
  let isTrial = false;

  // If plan has trial days, start trial
  if (plan.trialDays > 0) {
    trialEndDate = new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000);
    endDate = new Date(trialEndDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    status = "trial";
    isTrial = true;
  } else {
    endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);
    status = "active";
  }

  const subscription = await Subscription.create({
    vendor: vendorId,
    plan: planId,
    status,
    startDate,
    endDate,
    trialEndDate,
    isTrial,
    paymentStatus: plan.trialDays > 0 ? "pending" : "paid",
    amountPaid: plan.trialDays > 0 ? 0 : plan.price,
  });

  await subscription.populate("plan");

  return {
    message: isTrial
      ? `Trial started. You have ${plan.trialDays} days free, then the plan activates.`
      : "Subscription activated successfully",
    subscription,
  };
};

const renewSubscription = async (vendorId) => {
  const current = await getActiveSubscription(vendorId);
  if (!current) throw new ApiError(404, "No active subscription found to renew");

  const plan = await Plan.findById(current.plan._id || current.plan);
  if (!plan || !plan.isActive) throw new ApiError(400, "Subscription plan is no longer available");

  // Extend end date from current end date (so there's no gap)
  const newEndDate = new Date(
    Math.max(current.endDate.getTime(), Date.now()) + plan.durationDays * 24 * 60 * 60 * 1000
  );

  current.endDate = newEndDate;
  current.status = "active";
  current.paymentStatus = "paid";
  current.amountPaid += plan.price;
  current.isTrial = false;
  current.trialEndDate = null;

  await current.save();
  await current.populate("plan");

  return {
    message: "Subscription renewed successfully",
    subscription: current,
    newEndDate,
  };
};

const upgradeDowngradePlan = async (vendorId, newPlanId) => {
  const current = await getActiveSubscription(vendorId);
  if (!current) throw new ApiError(404, "No active subscription found");

  const currentPlan = await Plan.findById(current.plan._id || current.plan);
  const newPlan = await Plan.findById(newPlanId);
  if (!newPlan || !newPlan.isActive) throw new ApiError(404, "New plan not found or inactive");

  if (currentPlan._id.toString() === newPlanId) {
    throw new ApiError(400, "You are already on this plan");
  }

  const isUpgrade = newPlan.price > currentPlan.price;
  const now = new Date();

  // For upgrades: new end date from now + new plan duration
  // For downgrades: keep remaining days + new plan duration
  let newEndDate;
  if (isUpgrade) {
    newEndDate = new Date(now.getTime() + newPlan.durationDays * 24 * 60 * 60 * 1000);
  } else {
    const remainingMs = Math.max(0, current.endDate - now);
    newEndDate = new Date(now.getTime() + remainingMs + newPlan.durationDays * 24 * 60 * 60 * 1000);
  }

  current.previousPlan = current.plan;
  current.plan = newPlanId;
  current.endDate = newEndDate;
  current.upgradeDowngradeDate = now;
  current.status = "active";
  current.isTrial = false;
  current.trialEndDate = null;
  current.amountPaid += newPlan.price;
  current.paymentStatus = "paid";

  await current.save();
  await current.populate("plan");
  await current.populate("previousPlan", "name price");

  return {
    message: isUpgrade
      ? `Plan upgraded to "${newPlan.name}" successfully`
      : `Plan downgraded to "${newPlan.name}" successfully`,
    action: isUpgrade ? "upgrade" : "downgrade",
    previousPlan: currentPlan.name,
    newPlan: newPlan.name,
    subscription: current,
  };
};

const cancelSubscription = async (vendorId, cancelReason = "") => {
  const current = await getActiveSubscription(vendorId);
  if (!current) throw new ApiError(404, "No active subscription found");

  current.status = "cancelled";
  current.cancelledAt = new Date();
  current.cancelReason = cancelReason;
  current.autoRenew = false;

  await current.save();
  await current.populate("plan");

  return {
    message: "Subscription cancelled successfully",
    subscription: current,
  };
};

const toggleAutoRenew = async (vendorId, enable) => {
  const current = await getActiveSubscription(vendorId);
  if (!current) throw new ApiError(404, "No active subscription found");

  current.autoRenew = enable;
  await current.save();

  return {
    message: `Auto-renew ${enable ? "enabled" : "disabled"} successfully`,
    autoRenew: current.autoRenew,
  };
};

// ─────────────────────────────────────────────
// ADMIN: All subscriptions
// ─────────────────────────────────────────────

const getAllSubscriptions = async ({ status, page = 1, limit = 20 } = {}) => {
  const query = {};
  if (status) query.status = status;

  const skip = (page - 1) * limit;
  const total = await Subscription.countDocuments(query);

  const subscriptions = await Subscription.find(query)
    .populate("vendor", "name email phone")
    .populate("plan", "name price durationDays")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    total,
    page,
    totalPages: Math.ceil(total / limit),
    subscriptions,
  };
};

const getSubscriptionStats = async () => {
  const stats = await Subscription.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalRevenue: { $sum: "$amountPaid" },
      },
    },
  ]);

  const result = {
    active: 0,
    trial: 0,
    expired: 0,
    cancelled: 0,
    pending: 0,
    totalRevenue: 0,
    totalSubscriptions: 0,
  };

  stats.forEach(({ _id, count, totalRevenue }) => {
    result[_id] = count;
    result.totalRevenue += totalRevenue;
    result.totalSubscriptions += count;
  });

  return result;
};

// ─────────────────────────────────────────────
// CRON: Expire subscriptions & send alerts
// ─────────────────────────────────────────────

const expireSubscriptions = async () => {
  const now = new Date();

  // Move trial → active when trial period ends (and keep going)
  const trialsEnded = await Subscription.updateMany(
    {
      status: "trial",
      trialEndDate: { $lte: now },
      endDate: { $gt: now },
    },
    { $set: { status: "active", isTrial: false } }
  );

  // Expire active/trial subscriptions past endDate
  const expired = await Subscription.updateMany(
    {
      status: { $in: ["active", "trial"] },
      endDate: { $lte: now },
    },
    { $set: { status: "expired" } }
  );

  if (trialsEnded.modifiedCount > 0) {
    console.log(`[Subscription] ${trialsEnded.modifiedCount} trial(s) converted to active`);
  }
  if (expired.modifiedCount > 0) {
    console.log(`[Subscription] ${expired.modifiedCount} subscription(s) expired`);
  }
};

const getExpiryAlerts = async () => {
  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Subscriptions expiring within 7 days that haven't been alerted recently
  const expiringSoon = await Subscription.find({
    status: { $in: ["active", "trial"] },
    endDate: { $gte: now, $lte: sevenDaysFromNow },
  })
    .populate("vendor", "name email phone")
    .populate("plan", "name price");

  return expiringSoon.map((sub) => ({
    subscriptionId: sub._id,
    vendor: sub.vendor,
    plan: sub.plan,
    endDate: sub.endDate,
    daysRemaining: sub.daysRemaining,
    urgency: sub.daysRemaining <= 3 ? "critical" : "warning",
  }));
};

module.exports = {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  subscribe,
  renewSubscription,
  upgradeDowngradePlan,
  cancelSubscription,
  toggleAutoRenew,
  getActiveSubscription,
  getVendorSubscriptions,
  getAllSubscriptions,
  getSubscriptionStats,
  expireSubscriptions,
  getExpiryAlerts,
};