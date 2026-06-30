const mongoose = require("mongoose");
const Turf = require("../models/Turf");
const Booking = require("../models/Booking");
const ApiError = require("../utils/ApiError");
const Notification = require("../models/notification");

// ─────────────────────────────────────────────
// HELPER — validate ObjectId before any DB call
// ─────────────────────────────────────────────
function assertObjectId(id, label = "ID") {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, `Invalid ${label}: "${id}" is not a valid ObjectId`);
  }
}

// ─────────────────────────────────────────────
// ADD a new turf
// ─────────────────────────────────────────────
const addTurf = async ({
  name, location, sportType, sports, facilities, pricePerHour, description,
  amenities, mainImage, secondaryImages, logo, ownerId, aadhar, pan, gst, ebBill, documents
}) => {
  const existing = await Turf.findOne({ name, location });
  if (existing) {
    throw new ApiError(400, "A turf with this name already exists at this location");
  }

  const User = require("../models/User");
  const vendor = await User.findById(ownerId);
  if (!vendor) {
    throw new ApiError(404, "Vendor not found");
  }

  // Handle KYC documents logic
  const turfDocs = [];
  
  // Check if vendor already has an approved turf
  const approvedTurf = await Turf.findOne({ owner: ownerId, approvalStatus: "approved" });
  const hasApprovedTurf = !!approvedTurf;
  const defaultKycStatus = hasApprovedTurf ? "verified" : "pending";

  if (vendor.kycDocuments) {
    if (vendor.kycDocuments.aadhar?.url) {
      turfDocs.push({ title: "Aadhar card", sub: "ID Proof", status: defaultKycStatus, icon: "bi-fingerprint", url: vendor.kycDocuments.aadhar.url });
    }
    if (vendor.kycDocuments.pan?.url) {
      turfDocs.push({ title: "Pan card", sub: "Tax ID", status: defaultKycStatus, icon: "bi-person-vcard", url: vendor.kycDocuments.pan.url });
    }
    if (vendor.kycDocuments.gst?.url) {
      turfDocs.push({ title: "GST certificated", sub: "Business Proof", status: defaultKycStatus, icon: "bi-file-earmark-ruled", url: vendor.kycDocuments.gst.url });
    }
  } else {
    if (aadhar) turfDocs.push({ title: "Aadhar card", sub: "ID Proof", status: defaultKycStatus, icon: "bi-fingerprint" });
    if (pan) turfDocs.push({ title: "Pan card", sub: "Tax ID", status: defaultKycStatus, icon: "bi-person-vcard" });
    if (gst) turfDocs.push({ title: "GST certificated", sub: "Business Proof", status: defaultKycStatus, icon: "bi-file-earmark-ruled" });
  }

  // Handle EB Bill (location specific) - ALWAYS pending for new turf
  let providedEbBillUrl = ebBill;
  if (!providedEbBillUrl && documents && Array.isArray(documents)) {
    const docEbBill = documents.find(d => d.title?.toLowerCase().includes("eb bill"));
    if (docEbBill && docEbBill.url) providedEbBillUrl = docEbBill.url;
  }

  if (providedEbBillUrl) {
    turfDocs.push({ title: "EB bill", sub: "Address Proof", status: "pending", icon: "bi-lightning-charge", url: providedEbBillUrl });
  } else if (vendor.kycDocuments && vendor.kycDocuments.ebBill?.url) {
    turfDocs.push({ title: "EB bill", sub: "Address Proof", status: "pending", icon: "bi-lightning-charge", url: vendor.kycDocuments.ebBill.url });
  } else if (!vendor.kycDocuments && ebBill) {
    turfDocs.push({ title: "EB bill", sub: "Address Proof", status: "pending", icon: "bi-lightning-charge" });
  }

  const finalDocs = turfDocs.length > 0 ? turfDocs : (documents || []);

  const verifications = [
    { label: "Turf photos verified", checked: false },
    { label: "Aadhar card verified", checked: hasApprovedTurf },
    { label: "Pan card verified", checked: hasApprovedTurf },
    { label: "GST certificate verified", checked: hasApprovedTurf },
    { label: "EB bill verified", checked: false }
  ];

  const turf = await Turf.create({
    name, location, sportType, sports, facilities, pricePerHour, description,
    amenities: amenities || [],
    mainImage,
    secondaryImages: secondaryImages || [],
    logo: logo || "",
    owner: ownerId,
    isAvailable: true,
    approvalStatus: "pending",
    documents: finalDocs,
    verifications: verifications,
    verificationChecklist: {
      identityVerified: hasApprovedTurf,
      locationVerified: false,
      turfPhotosVerified: false,
      contactVerified: false,
      businessVerified: hasApprovedTurf,
      documentVerification: {
        aadhar: hasApprovedTurf,
        pan: hasApprovedTurf,
        gst: hasApprovedTurf,
        ebBill: false
      }
    }
  });

  try {
    const User = require("../models/User");
    const Admin = require("../models/Admin");
    const { createNotification } = require("./notification.service");
    
    const vendor = await User.findById(ownerId);
    const vendorName = vendor ? vendor.name : "Unknown Vendor";
    
    const admin = await Admin.findOne({});
    if (admin) {
      await createNotification({
        userId: admin._id,
        title: "New Turf Submission",
        message: `Vendor "${vendorName}" submitted a new turf "${turf.name}" for approval.`,
        type: "turf_submitted",
        vendorId: ownerId,
        turfId: turf._id,
      });
    }
  } catch (notifErr) {
    console.error("Failed to create turf_submitted notification:", notifErr);
  }

  return { message: "Turf created successfully and waiting for admin approval", turf };
};

// ─────────────────────────────────────────────
// GET all approved turfs — PUBLIC
// ─────────────────────────────────────────────
const getAllTurfs = async ({ location, minPrice, maxPrice, sportType } = {}) => {
  const query = { isAvailable: true, approvalStatus: "approved" };

  if (location) query.location = { $regex: location, $options: "i" };
  if (sportType) query.sportType = sportType;
  if (minPrice || maxPrice) {
    query["pricePerHour.basePrice"] = {};
    if (minPrice) query["pricePerHour.basePrice"].$gte = Number(minPrice);
    if (maxPrice) query["pricePerHour.basePrice"].$lte = Number(maxPrice);
  }

  return await Turf.find(query)
    .populate("owner", "name email")
    .select("-__v")
    .sort({ createdAt: -1 });
};

// ─────────────────────────────────────────────
// GET all turfs — ADMIN (pending + approved + rejected)
// ─────────────────────────────────────────────
const getAllTurfsAdmin = async () => {
  return await Turf.find({})
    .populate("owner", "name email phone")
    .select("-__v")
    .sort({ createdAt: -1 });
};

// ─────────────────────────────────────────────
// SEARCH turfs
// ─────────────────────────────────────────────
const searchTurfs = async (query) => {
  const turfs = await Turf.find({
    approvalStatus: "approved",
    isAvailable: true,
    name: { $regex: query, $options: "i" },
  })
    .select("_id name")
    .limit(10);

  return turfs.map((turf) => ({ id: turf._id, name: turf.name }));
};

// ─────────────────────────────────────────────
// GET pending turfs — ADMIN
// ─────────────────────────────────────────────
const getPendingTurfs = async () => {
  return await Turf.find({ approvalStatus: "pending" })
    .populate("owner", "name email")
    .select("-__v")
    .sort({ createdAt: -1 });
};

// ─────────────────────────────────────────────
// GET turf by ID — ADMIN (any status)
// ─────────────────────────────────────────────
const getTurfById = async (turfId) => {
  assertObjectId(turfId, "turf ID");
  const turf = await Turf.findById(turfId)
    .populate("owner", "name email phone profileImage kycDocuments");
  if (!turf) throw new ApiError(404, "Turf not found");
  return turf;
};

// ─────────────────────────────────────────────
// GET turf by ID — PUBLIC (approved only)
// ─────────────────────────────────────────────
const getPublicTurfById = async (turfId) => {
  assertObjectId(turfId, "turf ID");
  const turf = await Turf.findById(turfId)
    .populate("owner", "name email");
  if (!turf) throw new ApiError(404, "Turf not found");
  if (turf.approvalStatus !== "approved") throw new ApiError(404, "Turf not found");
  return turf;
};

// ─────────────────────────────────────────────
// APPROVE turf
// ─────────────────────────────────────────────
const approveTurf = async (turfId) => {
  assertObjectId(turfId, "turf ID");
  const turf = await Turf.findById(turfId);
  if (!turf) throw new ApiError(404, "Turf not found");
  if (turf.approvalStatus === "approved") throw new ApiError(400, "Turf is already approved");

  turf.approvalStatus = "approved";
  await turf.save();

  await Notification.create({
    user: turf.owner,
    title: "Turf Approved",
    message: `${turf.name} has been approved by admin`,
    type: "TURF_APPROVED",
  });

  return { message: "Turf approved successfully", turf };
};

// ─────────────────────────────────────────────
// REJECT turf
// ─────────────────────────────────────────────
const rejectTurf = async (turfId, reason) => {
  assertObjectId(turfId, "turf ID");
  const turf = await Turf.findById(turfId);
  if (!turf) throw new ApiError(404, "Turf not found");
  if (turf.approvalStatus === "rejected") throw new ApiError(400, "Turf is already rejected");

  turf.approvalStatus = "rejected";
  turf.rejectionReason = reason || "";
  
  if (turf.documents && turf.documents.length > 0) {
    turf.documents.forEach(doc => {
      if (doc.status !== "verified") {
        doc.status = "rejected";
      }
    });
  }
  
  await turf.save();

  await Notification.create({
    user: turf.owner,
    title: "Turf Rejected",
    message: reason ? `${turf.name} has been rejected by admin. Reason: ${reason}` : `${turf.name} has been rejected by admin`,
    type: "TURF_REJECTED",
  });

  return { message: "Turf rejected successfully", turf };
};

// ─────────────────────────────────────────────
// UPDATE turf
// ─────────────────────────────────────────────
const updateTurf = async (turfId, requesterId, requesterRole, updateData) => {
  assertObjectId(turfId, "turf ID");
  const turf = await Turf.findById(turfId);
  if (!turf) throw new ApiError(404, "Turf not found");

  if (requesterRole !== "admin" && turf.owner.toString() !== requesterId.toString()) {
    throw new ApiError(403, "Not authorised to update this turf");
  }

  const allowedFields = [
    "name", "location", "sportType", "sports", "facilities", "pricePerHour", "description",
    "amenities", "mainImage", "secondaryImages", "logo", "isAvailable", "verifications", "documents", "verificationChecklist"
  ];

  allowedFields.forEach((field) => {
    if (updateData[field] !== undefined) turf[field] = updateData[field];
  });

  if (updateData.ebBill) {
    if (!turf.documents) turf.documents = [];
    const ebIndex = turf.documents.findIndex(d => d.title?.toLowerCase().includes("eb bill"));
    if (ebIndex >= 0) {
      turf.documents[ebIndex].url = updateData.ebBill;
      turf.documents[ebIndex].status = "pending";
    } else {
      turf.documents.push({ title: "EB bill", sub: "Address Proof", status: "pending", icon: "bi-lightning-charge", url: updateData.ebBill });
    }
  }

  if (requesterRole === "vendor") turf.approvalStatus = "pending";

  await turf.save();
  return { message: "Turf updated successfully", turf };
};

// ─────────────────────────────────────────────
// DELETE turf
// ─────────────────────────────────────────────
const deleteTurf = async (turfId, requesterId, requesterRole) => {
  assertObjectId(turfId, "turf ID");
  const turf = await Turf.findById(turfId);
  if (!turf) throw new ApiError(404, "Turf not found");

  if (requesterRole !== "admin" && turf.owner.toString() !== requesterId.toString()) {
    throw new ApiError(403, "Not authorised to delete this turf");
  }

  const User = require("../models/User");
  const Admin = require("../models/Admin");
  const { createNotification } = require("./notification.service");

  const vendor = await User.findById(turf.owner);
  const vendorName = vendor ? vendor.name : "Unknown Vendor";

  await turf.deleteOne();

  try {
    const admin = await Admin.findOne({});
    if (admin) {
      await createNotification({
        userId: admin._id,
        title: "Turf Deleted",
        message: `Vendor "${vendorName}" deleted turf "${turf.name}".`,
        type: "turf_deleted",
        vendorId: turf.owner,
        turfId: turf._id,
      });
    }
  } catch (notifErr) {
    console.error("Failed to create Turf Deleted notification:", notifErr);
  }

  return { message: "Turf deleted successfully" };
};

// ─────────────────────────────────────────────
// GET available slots
// ─────────────────────────────────────────────
const getAvailableSlots = async (turfId, date) => {
  assertObjectId(turfId, "turf ID");
  const turf = await Turf.findById(turfId);
  if (!turf) throw new ApiError(404, "Turf not found");

  const queryDate = new Date(date);
  if (isNaN(queryDate.getTime())) throw new ApiError(400, "Invalid date format");

  const startOfDay = new Date(queryDate);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(queryDate);
  endOfDay.setUTCHours(24, 0, 0, 0);

  const bookedSlots = await Booking.find({
    turf: turfId,
    bookingStatus: { $in: ["pending", "confirmed"] },
    startDateTime: { $lt: endOfDay },
    endDateTime: { $gt: startOfDay },
  })
    .select("startDateTime endDateTime")
    .sort({ startDateTime: 1 });

  const rawSegments = [];
  let current = new Date(startOfDay);

  while (current < endOfDay) {
    const nextHour = new Date(current);
    nextHour.setUTCHours(nextHour.getUTCHours() + 1);

    const isBooked = bookedSlots.some(
      (b) => b.startDateTime < nextHour && b.endDateTime > current,
    );

    rawSegments.push({
      startTime: current.toISOString(),
      endTime: nextHour.toISOString(),
      isAvailable: !isBooked,
    });

    current = nextHour;
  }

  return rawSegments;
};

// ─────────────────────────────────────────────
// REVIEWS
// ─────────────────────────────────────────────
const addReview = async (userId, turfId, rating, comment) => {
  assertObjectId(turfId, "turf ID");
  const Review = require("../models/Review");

  const confirmedBooking = await Booking.findOne({
    user: userId, turf: turfId, bookingStatus: "confirmed",
  });
  if (!confirmedBooking) {
    throw new ApiError(403, "You can only review a turf after a confirmed booking");
  }

  const existingReview = await Review.findOne({ user: userId, turf: turfId });
  if (existingReview) throw new ApiError(400, "You have already reviewed this turf");

  const review = await Review.create({ user: userId, turf: turfId, rating, comment });

  const stats = await Review.aggregate([
    { $match: { turf: new mongoose.Types.ObjectId(turfId) } },
    { $group: { _id: "$turf", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Turf.findByIdAndUpdate(turfId, {
      averageRating: stats[0].averageRating,
      totalReviews: stats[0].totalReviews,
    });
  }

  await review.populate("user", "name");
  return review;
};

const getTurfReviews = async (turfId) => {
  assertObjectId(turfId, "turf ID");
  const Review = require("../models/Review");
  return await Review.find({ turf: turfId }).populate("user", "name").sort({ createdAt: -1 });
};

const getMyReviews = async (userId) => {
  const Review = require("../models/Review");
  return await Review.find({ user: userId })
    .populate("turf", "name location")
    .sort({ createdAt: -1 });
};

const deleteReview = async (userId, reviewId, userRole) => {
  const Review = require("../models/Review");
  const review = await Review.findById(reviewId);
  if (!review) throw new ApiError(404, "Review not found");

  if (userRole !== "admin" && review.user.toString() !== userId.toString()) {
    throw new ApiError(403, "Not authorised to delete this review");
  }

  const turfId = review.turf;
  await review.deleteOne();

  const stats = await Review.aggregate([
    { $match: { turf: new mongoose.Types.ObjectId(turfId) } },
    { $group: { _id: "$turf", averageRating: { $avg: "$rating" }, totalReviews: { $sum: 1 } } },
  ]);

  if (stats.length > 0) {
    await Turf.findByIdAndUpdate(turfId, {
      averageRating: stats[0].averageRating,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await Turf.findByIdAndUpdate(turfId, { averageRating: 0, totalReviews: 0 });
  }

  return { message: "Review deleted successfully" };
};

// getTurfByIdAdmin is an alias — same logic, named for clarity in the controller
const getTurfByIdAdmin = getTurfById;

module.exports = {
  addTurf,
  getAllTurfs,
  getAllTurfsAdmin,
  getTurfByIdAdmin,
  searchTurfs,
  getPendingTurfs,
  approveTurf,
  rejectTurf,
  getTurfById,
  getPublicTurfById,
  updateTurf,
  deleteTurf,
  getAvailableSlots,
  addReview,
  getTurfReviews,
  getMyReviews,
  deleteReview,
};