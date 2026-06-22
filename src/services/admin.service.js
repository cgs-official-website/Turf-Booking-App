const bcrypt = require("bcryptjs");
const ApiError = require("../utils/ApiError");
const { generateToken } = require("../utils/jwt");

const Admin = require("../models/Admin");
const User = require("../models/User");
const Turf = require("../models/Turf");
const { Subscription } = require("../models/Subscription");

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
    },
  };
};

const getDashboardStats = async () => {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth() + 1;
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear;

  const startOfCurrentMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [
    totalVendors,
    totalTurfs,
    revenueData,
    activeSubscriptions,
    vendorGrowthCount,
    subscriptionGrowthCount,
    turfGrowthCount,
  ] = await Promise.all([
    User.countDocuments({
      role: "vendor",
    }),
    Turf.countDocuments(),
    Subscription.aggregate([
        {
          $match: {
            paymentStatus: "paid",
          },
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
        createdAt: { $gte: startOfCurrentMonth },
      }),
    ]);

  const totalRevenue = revenueData[0]?.total[0]?.revenue || 0;
  const revenueByMonth = new Map(
    (revenueData[0]?.byMonth || []).map(({ _id, revenue }) => [
      `${_id.year}-${_id.month}`,
      revenue,
    ]),
  );

  const monthlyRevenue = MONTH_NAMES.map((month, index) => ({
    month,
    revenue: revenueByMonth.get(`${currentYear}-${index + 1}`) || 0,
  }));

  const currentMonthRevenue =
    revenueByMonth.get(`${currentYear}-${currentMonth}`) || 0;
  const previousMonthRevenue =
    revenueByMonth.get(`${previousMonthYear}-${previousMonth}`) || 0;
  const revenueGrowth =
    previousMonthRevenue === 0
      ? 0
      : Number(
          (
            ((currentMonthRevenue - previousMonthRevenue) /
              previousMonthRevenue) *
            100
          ).toFixed(1),
        );

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
    revenueGrowth: {
      percentage: revenueGrowth,
      type: "month",
    },
    subscriptionGrowth: {
      count: subscriptionGrowthCount,
      type: "month",
    },
    turfGrowth: {
      count: turfGrowthCount,
      type: "month",
    },
    monthlyRevenue,
  };
};

const getAllVendors = async () => {
  const vendors = await User.find({ role: "vendor" })
    .select("name email phone location")
    .lean();

  const vendorData = await Promise.all(
    vendors.map(async (vendor, index) => {
      const turfs = await Turf.find({ owner: vendor._id })
        .select("name location sportType pricePerHour.basePrice approvalStatus")
        .lean();

      return {
        vendorId: 1001 + index,
        vendorName: vendor.name,
        email: vendor.email,
        phone: vendor.phone,
        location: vendor.location,
        turfCount: turfs.length,
        turfs: turfs.map((turf) => ({
          turfName: turf.name,
          location: turf.location,
          sportType: turf.sportType,
          pricePerHour: turf.pricePerHour?.basePrice || 0,
          approvalStatus: turf.approvalStatus,
        })),
      };
    }),
  );

  return vendorData;
};

module.exports = {
  loginAdmin,
  getDashboardStats,
  getAllVendors,
};
