// services/vendor.service.js
import axiosInstance from './axiosInstance';

// GET all vendors (admin)
export const getAllVendors = async () => {
  const response = await axiosInstance.get('/admin/vendors');
  return response.data;
};

// GET single vendor by ID (admin)
export const getVendorById = async (vendorId) => {
  const response = await axiosInstance.get(`/admin/vendors/${vendorId}`);
  return response.data;
};

// GET vendor statistics (admin)
export const getVendorStats = async () => {
  const response = await axiosInstance.get('/admin/vendors/stats');
  return response.data;
};

// GET vendor bookings statistics (admin)
export const getVendorBookingsStats = async (vendorId) => {
  const response = await axiosInstance.get(`/admin/vendors/${vendorId}/bookings`);
  return response.data;
};

// GET vendor recent bookings (admin)
export const getVendorRecentBookings = async (vendorId) => {
  const response = await axiosInstance.get(`/admin/vendors/${vendorId}/recent-bookings`);
  return response.data;
};

// UPDATE vendor status (admin)
export const updateVendorStatus = async (vendorId, status) => {
  const response = await axiosInstance.put(`/admin/vendors/${vendorId}/status`, { status });
  return response.data;
};

// SUSPEND vendor account (admin)
export const suspendVendor = async (vendorId) => {
  const response = await axiosInstance.delete(`/admin/vendors/${vendorId}`);
  return response.data;
};

// UNSUSPEND vendor account (admin)
export const unsuspendVendor = async (vendorId) => {
  const response = await axiosInstance.post(`/admin/vendors/${vendorId}/unsuspend`);
  return response.data;
};

// ──────────────────────────────────────────────
// SUBSCRIPTION HISTORY - NEW!
// ──────────────────────────────────────────────

// GET vendor subscription history (admin)
export const getVendorSubscriptionHistory = async (vendorId) => {
  const response = await axiosInstance.get(`/subscriptions/vendor/${vendorId}`);
  return response.data;
};

// GET all vendor subscriptions with filters (admin)
export const getAllVendorSubscriptions = async (filters = {}) => {
  const response = await axiosInstance.get('/subscriptions/admin/all', {
    params: filters
  });
  return response.data;
};

// GET subscription statistics (admin)
export const getSubscriptionStats = async () => {
  const response = await axiosInstance.get('/subscriptions/admin/stats');
  return response.data;
};