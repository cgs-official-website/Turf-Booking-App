const bcrypt = require("bcryptjs");
const ApiError = require("../utils/ApiError");
const { generateToken } = require("../utils/jwt");

const mongoose = require("mongoose");
const Admin = require("../models/Admin");
const User = require("../models/User");
const Turf = require("../models/Turf");
const Booking = require("../models/Booking");
const { Subscription } = require("../models/Subscription");
const Review = require("../models/Review");
const Report = require("../models/Report");
const Notification = require("../models/notification");

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const loginAdmin = async ({ email, password }) => {
  const admin = await Admin.findOne({ email });

  if (!admin) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isMatch = await bcrypt.compare(password, admin.password);

  if (!isMatch) {
    throw new ApiError(401, "Invalid email or password");
  }

  const token = generateToken(admin);

  return {
    success: true,
    token,
    admin: {
      id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      profileImage: admin.profileImage || "",
    },
  };
};

const getDashboardStats = async (period = "month", planId = "") => {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;

  let targetYear = currentYear;
  let targetMonth = currentMonth;
  let compareYear = currentYear;
  let compareMonth = currentMonth;
  let isYearly = false;

  if (period === 'last-month') {
    targetMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    targetYear = currentMonth === 1 ? currentYear - 1 : currentYear;
    compareMonth = targetMonth === 1 ? 12 : targetMonth - 1;
    compareYear = targetMonth === 1 ? targetYear - 1 : targetYear;
  } else if (period === 'last-year') {
    targetYear = currentYear - 1;
    compareYear = targetYear - 1;
    isYearly = true;
  } else if (period === 'current-year') {
    targetYear = currentYear;
    compareYear = currentYear - 1;
    isYearly = true;
  } else {
    // current-month is default
    compareMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    compareYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  }

  const startOfTarget = isYearly
    ? new Date(Date.UTC(targetYear, 0, 1))
    : new Date(Date.UTC(targetYear, targetMonth - 1, 1));
  const endOfTarget = isYearly
    ? new Date(Date.UTC(targetYear + 1, 0, 1))
    : new Date(Date.UTC(targetYear, targetMonth, 1));

  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  const startOfCurrentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const revenueMatchStage = { paymentStatus: "paid" };
  if (planId) {
    revenueMatchStage.plan = new mongoose.Types.ObjectId(planId);
  }

  const [
    totalVendors,
    totalTurfs,
    revenueData,
    activeSubscriptions,
    vendorGrowthCount,
    subscriptionGrowthCount,
    turfGrowthCount,
    expiringSubs,
  ] = await Promise.all([
    User.countDocuments({
      role: "vendor",
    }),
    Turf.countDocuments({ approvalStatus: "approved" }),
    Subscription.aggregate([
      {
        $match: revenueMatchStage,
      },
      {
        $facet: {
          total: [
            {
              $group: {
                _id: null,
                revenue: {
                  $sum: "$amountPaid",
                },
              },
            },
          ],
          byMonth: [
            {
              $match: {
                createdAt: { $gte: startOfTarget, $lt: endOfTarget },
              },
            },
            {
              $group: {
                _id: {
                  year: {
                    $year: "$createdAt",
                  },
                  month: {
                    $month: "$createdAt",
                  },
                },
                revenue: {
                  $sum: "$amountPaid",
                },
              },
            },
          ],
          byDay: [
            {
              $match: {
                createdAt: { $gte: startOfTarget, $lt: endOfTarget },
              },
            },
            {
              $group: {
                _id: {
                  day: { $dayOfMonth: "$createdAt" },
                  month: { $month: "$createdAt" },
                  year: { $year: "$createdAt" },
                },
                revenue: {
                  $sum: "$amountPaid",
                },
              },
            },
            {
              $sort: { "_id.day": 1 },
            },
          ],
        },
      },
    ]),
    Subscription.countDocuments({
      status: {
        $in: ["active", "trial"],
      },
      endDate: {
        $gt: now,
      },
    }),
    User.countDocuments({
      role: "vendor",
      createdAt: { $gte: startOfCurrentMonth },
    }),
    Subscription.countDocuments({
      status: { $in: ["active", "trial"] },
      createdAt: { $gte: startOfCurrentMonth },
    }),
    Turf.countDocuments({
      approvalStatus: "approved",
      createdAt: { $gte: startOfCurrentMonth },
    }),
    Subscription.find({
      status: { $in: ["active", "trial"] },
      endDate: { $gte: now, $lte: thirtyDaysFromNow },
    })
      .populate("vendor", "name")
      .populate("plan", "name")
      .sort({ endDate: 1 }),
  ]);

  const totalRevenue = revenueData[0]?.total[0]?.revenue || 0;
  const revenueByMonth = new Map(
    (revenueData[0]?.byMonth || []).map(({ _id, revenue }) => [
      `${_id.year}-${_id.month}`,
      revenue,
    ]),
  );

  let formattedMonthlyRevenue = [];
  if (isYearly) {
    formattedMonthlyRevenue = MONTH_NAMES.map((month, index) => ({
      month,
      revenue: revenueByMonth.get(`${targetYear}-${index + 1}`) || 0,
    }));
  } else {
    // Daily data for the target month — fill all days with 0, then populate from DB
    const daysInMonth = new Date(Date.UTC(targetYear, targetMonth, 0)).getUTCDate();
    const monthAbbr = MONTH_NAMES[targetMonth - 1]; // e.g. "Jun"
    const dayRevenueMap = new Map();
    (revenueData[0]?.byDay || []).forEach((d) => {
      dayRevenueMap.set(d._id.day, d.revenue);
    });
    formattedMonthlyRevenue = Array.from({ length: daysInMonth }, (_, i) => ({
      month: `${i + 1} ${monthAbbr}`,   // "1 Jun", "2 Jun" ...
      revenue: dayRevenueMap.get(i + 1) || 0,
    }));
  }

  // Chart specific revenue and growth
  const targetRevenue = isYearly
    ? Array.from({ length: 12 }).reduce((sum, _, i) => sum + (revenueByMonth.get(`${targetYear}-${i + 1}`) || 0), 0)
    : revenueByMonth.get(`${targetYear}-${targetMonth}`) || 0;

  const compareRevenue = isYearly
    ? Array.from({ length: 12 }).reduce((sum, _, i) => sum + (revenueByMonth.get(`${compareYear}-${i + 1}`) || 0), 0)
    : revenueByMonth.get(`${compareYear}-${compareMonth}`) || 0;

  let chartRevenueGrowth;
  if (compareRevenue === 0 && targetRevenue === 0) {
    chartRevenueGrowth = { percentage: 0, type: "none" };
  } else if (compareRevenue === 0) {
    chartRevenueGrowth = { percentage: 100, type: "new" };
  } else {
    chartRevenueGrowth = {
      percentage: Number((((targetRevenue - compareRevenue) / compareRevenue) * 100).toFixed(1)),
      type: isYearly ? "year" : "month",
    };
  }

  // Original global stats calculation
  const currentMonthRevenue = revenueByMonth.get(`${currentYear}-${currentMonth}`) || 0;
  const lastMonthRevenue = revenueByMonth.get(`${previousMonthYear}-${previousMonth}`) || 0;
  let revenueGrowth;

  if (lastMonthRevenue === 0 && currentMonthRevenue === 0) {
    revenueGrowth = { percentage: 0, type: "none" };
  } else if (lastMonthRevenue === 0) {
    revenueGrowth = { percentage: 100, type: "new" };
  } else {
    revenueGrowth = {
      percentage: Number((((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)),
      type: "month",
    };
  }

  return {
    totalVendors,
    totalTurfs,
    totalRevenue,
    activeSubscriptions: Number.isFinite(activeSubscriptions)
      ? activeSubscriptions
      : 0,
    vendorGrowth: {
      count: vendorGrowthCount,
      type: "month",
    },
    revenueGrowth,
    subscriptionGrowth: {
      count: subscriptionGrowthCount,
      type: "month",
    },
    turfGrowth: {
      count: turfGrowthCount,
      type: "month",
    },
    chartTotalRevenue: targetRevenue,
    chartRevenueGrowth: chartRevenueGrowth,
    monthlyRevenue: formattedMonthlyRevenue,
    expiringSubscriptions: expiringSubs.map((sub) => {
      const diff = sub.endDate - now;
      const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      return {
        vendorId: sub.vendor?._id,
        vendorName: sub.vendor?.name,
        plan: sub.plan?.name,
        expiryDate: sub.endDate,
        daysLeft,
      };
    }),
  };
};

const getAllVendors = async () => {
  const vendors = await User.find({ role: "vendor" })
    .select("name email phone location profileImage createdAt kycDocuments")
    .lean();

  const vendorData = await Promise.all(
    vendors.map(async (vendor, index) => {
      const turfs = await Turf.find({ owner: vendor._id })
        .select("name location sportType pricePerHour.basePrice approvalStatus mainImage secondaryImages facilities sports")
        .lean();

      return {
        _id: vendor._id,
        vendorId: 1001 + index,
        vendorName: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        location: vendor.location,
        profileImage: vendor.profileImage || "",        
        bannerImage: turfs[0]?.mainImage || "",   
        createdAt: vendor.createdAt,
        kycDocuments: vendor.kycDocuments || {},
        turfCount: turfs.length,
        turfs: turfs.map((turf) => ({
          turfName: turf.name,
          location: turf.location,
          sportType: turf.sportType,
          pricePerHour: turf.pricePerHour?.basePrice || 0,
          approvalStatus: turf.approvalStatus,
          mainImage: turf.mainImage,
          secondaryImages: turf.secondaryImages || [],
          facilities: turf.facilities || [],
          sports: turf.sports || [],
        })),
      };
    }),
  );

  return vendorData;
};

const getVendorBookingStats = async (vendorId) => {
  const turfs = await Turf.find({ owner: vendorId }).select("_id").lean();
  const turfIds = turfs.map((t) => t._id);

  const totalBookings = await Booking.countDocuments({ turf: { $in: turfIds } });
  const confirmedBookings = await Booking.countDocuments({
    turf: { $in: turfIds },
    bookingStatus: "confirmed",
  });
  const cancelledBookings = await Booking.countDocuments({
    turf: { $in: turfIds },
    bookingStatus: { $in: ["rejected", "expired"] },
  });
  const pendingBookings = await Booking.countDocuments({
    turf: { $in: turfIds },
    bookingStatus: "pending",
  });

  const activeBookings = await Booking.countDocuments({
    turf: { $in: turfIds },
    bookingStatus: "confirmed",
    startDateTime: { $gt: new Date() }
  });

  return {
    totalBookings,
    confirmedBookings,
    cancelledBookings,
    pendingBookings,
    activeBookings,
  };
};

const getAllBookings = async (vendorId) => {
  let query = {};
  if (vendorId) {
    const turfs = await Turf.find({ owner: vendorId }).select("_id").lean();
    const turfIds = turfs.map((t) => t._id);
    query.turf = { $in: turfIds };
  }

  const bookings = await Booking.find(query)
    .populate("user", "name email phone")
    .populate("turf", "name location")
    .sort({ createdAt: -1 })
    .lean();

  return bookings;
};

const getVendorRecentBookings = async (vendorId) => {
  const turfs = await Turf.find({ owner: vendorId }).select("_id").lean();
  const turfIds = turfs.map((t) => t._id);

  const bookings = await Booking.find({ turf: { $in: turfIds } })
    .populate("user", "name")
    .populate("turf", "name")
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  return bookings.map((booking) => {
    let bookingDate = "—";
    let startTime = "—";
    let endTime = "—";

    if (booking.startDateTime) {
      const start = new Date(booking.startDateTime);
      bookingDate = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC"
      }).format(start);

      startTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC"
      }).format(start);
    } else if (booking.bookingDate || booking.createdAt) {
      const fallbackDate = new Date(booking.bookingDate || booking.createdAt);
      bookingDate = new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC"
      }).format(fallbackDate);
    }

    if (booking.endDateTime) {
      const end = new Date(booking.endDateTime);
      endTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
        timeZone: "UTC"
      }).format(end);
    }

    if (startTime === "—" && endTime === "—" && booking.timeSlot) {
      const parts = booking.timeSlot.split("-");
      if (parts.length === 2) {
        startTime = parts[0].trim();
        endTime = parts[1].trim();
      }
    }

    return {
      _id: booking._id,
      bookingId: booking.displayId || "BKG-" + booking._id.toString().slice(-4).toUpperCase(),
      userName: booking.user?.name || booking.userName || booking.customerName || "—",
      turfName: booking.turf?.name || booking.turfName || "—",
      bookingDate,
      startTime,
      endTime,
      amount: booking.totalPrice || booking.totalAmount || booking.amount || booking.price || 0,
      status: booking.bookingStatus || booking.status || "pending",
    };
  });
};

const suspendVendor = async (vendorId) => {
  const performDelete = async (sessionToUse) => {
    const opts = sessionToUse ? { session: sessionToUse } : {};

    // 1. Find vendor by vendorId
    const vendor = await User.findOne({ _id: vendorId, role: "vendor" }, null, opts);
    if (!vendor) {
      throw new ApiError(404, "Vendor not found");
    }

    // 2. Get all turfs owned by vendor
    const turfs = await Turf.find({ owner: vendorId }, "_id", opts);
    const turfIds = turfs.map((t) => t._id);

    // 3. Delete related vendor records:
    console.log("Deleting subscriptions");
    const subDelete = await Subscription.deleteMany({ vendor: vendorId }, opts);

    console.log("Deleting notifications");
    const notificationDelete = await Notification.deleteMany({ user: vendorId }, opts);

    console.log("Deleting reports");
    const reportDelete = await Report.deleteMany({
      $or: [
        { vendor: vendorId },
        { turf: { $in: turfIds } }
      ]
    }, opts);

    console.log("Deleting bookings");
    const bookingDelete = await Booking.deleteMany({ turf: { $in: turfIds } }, opts);

    console.log("Deleting reviews");
    const reviewDelete = await Review.deleteMany({ turf: { $in: turfIds } }, opts);

    console.log("Deleting turfs");
    const turfDelete = await Turf.deleteMany({ owner: vendorId }, opts);

    console.log("Deleting vendor");
    const vendorDelete = await User.deleteOne({ _id: vendorId, role: "vendor" }, opts);

    // Log deleted counts
    console.log(`[Suspend Vendor] Vendor ${vendorId} suspended.`);
    console.log(`Deleted user: ${vendorDelete.deletedCount}`);
    console.log(`Deleted turfs: ${turfDelete.deletedCount}`);
    console.log(`Deleted subscriptions: ${subDelete.deletedCount}`);
    console.log(`Deleted bookings: ${bookingDelete.deletedCount}`);
    console.log(`Deleted reviews: ${reviewDelete.deletedCount}`);
    console.log(`Deleted notifications: ${notificationDelete.deletedCount}`);
    console.log(`Deleted reports: ${reportDelete.deletedCount}`);

    return vendor;
  };

  let session = null;
  let useTransaction = true;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    console.log("Transactions Enabled: true");
    const vendor = await performDelete(session);
    await session.commitTransaction();
    session.endSession();
    return {
      success: true,
      message: "Vendor suspended successfully"
    };
  } catch (error) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // ignore abort error if transaction never started
      }
      session.endSession();
    }

    const isTransactionError = error.message?.includes("Transaction numbers are only allowed") ||
      error.codeName === "TransactionSystemFailed" ||
      error.message?.includes("replica set");

    if (isTransactionError) {
      useTransaction = false;
      console.log("Transactions Enabled:", useTransaction);
      try {
        await performDelete(null);
        return {
          success: true,
          message: "Vendor suspended successfully"
        };
      } catch (fallbackError) {
        throw fallbackError;
      }
    } else {
      throw error;
    }
  }
};

module.exports = {
  loginAdmin,
  getDashboardStats,
  getAllVendors,
  getVendorBookingStats,
  getAllBookings,
  getVendorRecentBookings,
  suspendVendor,
};