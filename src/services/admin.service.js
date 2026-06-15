const bcrypt = require("bcryptjs");
const ApiError = require("../utils/ApiError");
const { generateToken } = require("../utils/jwt");

const Admin = require("../models/Admin");
const User = require("../models/User");
const Turf = require("../models/Turf");
const Booking = require("../models/Booking");

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
  const totalVendors = await User.countDocuments({
    role: "vendor",
  });

  const totalTurfs = await Turf.countDocuments();

  const revenueData = await Booking.aggregate([
    {
      $match: {
        bookingStatus: "confirmed",
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: {
          $sum: "$totalAmount",
        },
      },
    },
  ]);

  const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

  const activeSubscriptions = await User.countDocuments({
    subscriptionStatus: "active",
  });

  return {
    totalVendors,
    totalTurfs,
    totalRevenue,
    activeSubscriptions,
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
