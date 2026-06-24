const express = require("express");
const router = express.Router();

const {
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
  getVendorSubscriptionHistory,
} = require("../controllers/subscription.controller");

const { protect, authorizeRoles } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");

const {
  createPlanSchema,
  updatePlanSchema,
  subscribeSchema,
  changePlanSchema,
  cancelSchema,
  autoRenewSchema,
} = require("../validators/subscription.validator");

// ─────────────────────────────────────────────
// PUBLIC: Browse available plans
// GET /subscriptions/plans
// GET /subscriptions/plans/:id
// ─────────────────────────────────────────────
router.get("/plans", getAllPlans);
router.get("/plans/:id", getPlanById);

// ─────────────────────────────────────────────
// ADMIN: Manage plans & view all subscriptions
// POST   /subscriptions/plans
// PUT    /subscriptions/plans/:id
// DELETE /subscriptions/plans/:id
// GET    /subscriptions/admin/all
// GET    /subscriptions/admin/stats
// GET    /subscriptions/admin/expiry-alerts
// ─────────────────────────────────────────────
router.post(
  "/plans",
  protect,
  authorizeRoles("admin"),
  validate(createPlanSchema),
  createPlan
);

router.put(
  "/plans/:id",
  protect,
  authorizeRoles("admin"),
  validate(updatePlanSchema),
  updatePlan
);

router.delete("/plans/:id", protect, authorizeRoles("admin"), deletePlan);

router.get(
  "/admin/all",
  protect,
  authorizeRoles("admin"),
  getAllSubscriptions
);

router.get(
  "/admin/stats",
  protect,
  authorizeRoles("admin"),
  getSubscriptionStats
);

router.get(
  "/admin/expiry-alerts",
  protect,
  authorizeRoles("admin"),
  getExpiryAlerts
);

router.get(
  "/vendor/:vendorId",
  protect,
  authorizeRoles("admin"),
  getVendorSubscriptionHistory
);

// ─────────────────────────────────────────────
// VENDOR: Own subscription management
// POST   /subscriptions/subscribe        → subscribe to a plan
// GET    /subscriptions/my              → get active subscription
// GET    /subscriptions/my/history      → full subscription history
// POST   /subscriptions/renew           → renew current plan
// PUT    /subscriptions/change-plan     → upgrade or downgrade
// POST   /subscriptions/cancel          → cancel subscription
// PUT    /subscriptions/auto-renew      → toggle auto-renew
// ─────────────────────────────────────────────
router.post(
  "/subscribe",
  protect,
  authorizeRoles("vendor"),
  validate(subscribeSchema),
  subscribe
);

router.get("/my", protect, authorizeRoles("vendor"), getMySubscription);

router.get(
  "/my/history",
  protect,
  authorizeRoles("vendor"),
  getMySubscriptionHistory
);

router.post("/renew", protect, authorizeRoles("vendor"), renewSubscription);

router.put(
  "/change-plan",
  protect,
  authorizeRoles("vendor"),
  validate(changePlanSchema),
  upgradeDowngradePlan
);

router.post(
  "/cancel",
  protect,
  authorizeRoles("vendor"),
  validate(cancelSchema),
  cancelSubscription
);

router.put(
  "/auto-renew",
  protect,
  authorizeRoles("vendor"),
  validate(autoRenewSchema),
  toggleAutoRenew
);

module.exports = router;