const subscriptionService = require("../services/subscription.service");
const ApiResponse = require("../utils/ApiResponse");

// ─────────────────────────────────────────────
// PLAN ROUTES (Admin)
// ─────────────────────────────────────────────

const createPlan = async (req, res, next) => {
  try {
    const result = await subscriptionService.createPlan(req.body);
    return res.status(201).json(new ApiResponse(201, result.message, result.plan));
  } catch (error) {
    next(error);
  }
};

const getAllPlans = async (req, res, next) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const plans = await subscriptionService.getAllPlans(includeInactive);
    return res.status(200).json(
      new ApiResponse(200, "Plans fetched successfully", { count: plans.length, plans })
    );
  } catch (error) {
    next(error);
  }
};

const getPlanById = async (req, res, next) => {
  try {
    const plan = await subscriptionService.getPlanById(req.params.id);
    return res.status(200).json(new ApiResponse(200, "Plan fetched successfully", plan));
  } catch (error) {
    next(error);
  }
};

const updatePlan = async (req, res, next) => {
  try {
    const result = await subscriptionService.updatePlan(req.params.id, req.body);
    return res.status(200).json(new ApiResponse(200, result.message, result.plan));
  } catch (error) {
    next(error);
  }
};

const deletePlan = async (req, res, next) => {
  try {
    const result = await subscriptionService.deletePlan(req.params.id);
    return res.status(200).json(new ApiResponse(200, result.message));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// SUBSCRIPTION ROUTES (Vendor)
// ─────────────────────────────────────────────

const subscribe = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const result = await subscriptionService.subscribe(req.user.id, planId);
    return res.status(201).json(new ApiResponse(201, result.message, result.subscription));
  } catch (error) {
    next(error);
  }
};

const getMySubscription = async (req, res, next) => {
  try {
    const subscription = await subscriptionService.getActiveSubscription(req.user.id);
    if (!subscription) {
      return res
        .status(200)
        .json(new ApiResponse(200, "No active subscription found", null));
    }
    return res
      .status(200)
      .json(new ApiResponse(200, "Active subscription fetched successfully", subscription));
  } catch (error) {
    next(error);
  }
};

const getMySubscriptionHistory = async (req, res, next) => {
  try {
    const subscriptions = await subscriptionService.getVendorSubscriptions(req.user.id);
    return res.status(200).json(
      new ApiResponse(200, "Subscription history fetched successfully", {
        count: subscriptions.length,
        subscriptions,
      })
    );
  } catch (error) {
    next(error);
  }
};

const renewSubscription = async (req, res, next) => {
  try {
    const result = await subscriptionService.renewSubscription(req.user.id);
    return res.status(200).json(new ApiResponse(200, result.message, result.subscription));
  } catch (error) {
    next(error);
  }
};

const upgradeDowngradePlan = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const result = await subscriptionService.upgradeDowngradePlan(req.user.id, planId);
    return res.status(200).json(new ApiResponse(200, result.message, result));
  } catch (error) {
    next(error);
  }
};

const cancelSubscription = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await subscriptionService.cancelSubscription(req.user.id, reason);
    return res.status(200).json(new ApiResponse(200, result.message, result.subscription));
  } catch (error) {
    next(error);
  }
};

const toggleAutoRenew = async (req, res, next) => {
  try {
    const { enable } = req.body;
    if (typeof enable !== "boolean") {
      return res.status(400).json(new ApiResponse(400, "enable must be a boolean"));
    }
    const result = await subscriptionService.toggleAutoRenew(req.user.id, enable);
    return res.status(200).json(new ApiResponse(200, result.message, { autoRenew: result.autoRenew }));
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────
// ADMIN: All subscriptions
// ─────────────────────────────────────────────

const getAllSubscriptions = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await subscriptionService.getAllSubscriptions({
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, "Subscriptions fetched successfully", result));
  } catch (error) {
    next(error);
  }
};

const getSubscriptionStats = async (req, res, next) => {
  try {
    const stats = await subscriptionService.getSubscriptionStats();
    return res
      .status(200)
      .json(new ApiResponse(200, "Subscription stats fetched successfully", stats));
  } catch (error) {
    next(error);
  }
};

const getExpiryAlerts = async (req, res, next) => {
  try {
    const alerts = await subscriptionService.getExpiryAlerts();
    return res.status(200).json(
      new ApiResponse(200, "Expiry alerts fetched successfully", {
        count: alerts.length,
        alerts,
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  subscribe,
  getMySubscription,
  getMySubscriptionHistory,
  renewSubscription,
  upgradeDowngradePlan,
  cancelSubscription,
  toggleAutoRenew,
  getAllSubscriptions,
  getSubscriptionStats,
  getExpiryAlerts,
};