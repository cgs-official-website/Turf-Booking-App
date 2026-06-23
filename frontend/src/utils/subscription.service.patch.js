// ── Add this new function to your subscription.service.js ──────────────────
// Replace your existing getSubscriptionStats with this version.
// It calculates real week-over-week growth from your DB.

const getSubscriptionStats = async () => {
  const now      = new Date();
  const thisWeekStart = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
  const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  // ── Current totals by status ──────────────────────────────────────────────
  const currentStats = await Subscription.aggregate([
    {
      $group: {
        _id:          "$status",
        count:        { $sum: 1 },
        totalRevenue: { $sum: "$amountPaid" },
      },
    },
  ]);

  const result = {
    active: 0, trial: 0, expired: 0,
    cancelled: 0, pending: 0,
    totalRevenue: 0, totalSubscriptions: 0,
  };

  currentStats.forEach(({ _id, count, totalRevenue }) => {
    result[_id]             = count;
    result.totalRevenue    += totalRevenue;
    result.totalSubscriptions += count;
  });

  // ── This week vs last week ────────────────────────────────────────────────
  const [thisWeek, lastWeek] = await Promise.all([
    // Subscriptions created THIS week
    Subscription.aggregate([
      { $match: { createdAt: { $gte: thisWeekStart } } },
      {
        $group: {
          _id:          "$status",
          count:        { $sum: 1 },
          totalRevenue: { $sum: "$amountPaid" },
        },
      },
    ]),
    // Subscriptions created LAST week
    Subscription.aggregate([
      { $match: { createdAt: { $gte: lastWeekStart, $lt: thisWeekStart } } },
      {
        $group: {
          _id:          "$status",
          count:        { $sum: 1 },
          totalRevenue: { $sum: "$amountPaid" },
        },
      },
    ]),
  ]);

  // Build week summary objects
  function buildWeekSummary(agg) {
    const s = { active:0, expired:0, totalRevenue:0, total:0 };
    agg.forEach(({ _id, count, totalRevenue }) => {
      if (_id === "active" || _id === "trial") s.active += count;
      if (_id === "expired") s.expired += count;
      s.totalRevenue += totalRevenue;
      s.total        += count;
    });
    return s;
  }

  const tw = buildWeekSummary(thisWeek);
  const lw = buildWeekSummary(lastWeek);

  // Growth % helper — returns e.g. "+12" or "-5" or "0"
  function growthPct(current, previous) {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  result.growth = {
    revenue:  growthPct(tw.totalRevenue, lw.totalRevenue),
    active:   growthPct(tw.active,       lw.active),
    expired:  growthPct(tw.expired,      lw.expired),
    total:    growthPct(tw.total,        lw.total),
    // Raw numbers for frontend reference
    thisWeek: tw,
    lastWeek: lw,
  };

  return result;
};
