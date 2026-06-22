// // services/subscription.service.js
// import axiosInstance from './axiosInstance';

// // GET all plans from MongoDB (public)
// export const getPublicPlans = async () => {
//   const response = await axiosInstance.get('/subscriptions/plans');
//   return response.data;
// };

// // GET all plans with inactive (admin)
// export const getAllPlans = async (includeInactive = false) => {
//   const response = await axiosInstance.get('/subscriptions/plans', {
//     params: { includeInactive }
//   });
//   return response.data;
// };

// // CREATE new plan in MongoDB (admin)
// export const createPlan = async (planData) => {
//   const response = await axiosInstance.post('/subscriptions/plans', planData);
//   return response.data;
// };

// // UPDATE plan in MongoDB (admin)
// export const updatePlan = async (planId, planData) => {
//   const response = await axiosInstance.put(`/subscriptions/plans/${planId}`, planData);
//   return response.data;
// };

// // DELETE plan from MongoDB (admin)
// export const deletePlan = async (planId) => {
//   const response = await axiosInstance.delete(`/subscriptions/plans/${planId}`);
//   return response.data;
// };


// services/subscription.service.js
import axiosInstance from './axiosInstance';

// GET all plans from MongoDB (public)
export const getPublicPlans = async () => {
  const response = await axiosInstance.get('/subscriptions/plans');
  return response.data;
};

// GET all plans with inactive (admin)
export const getAllPlans = async (includeInactive = false) => {
  const response = await axiosInstance.get('/subscriptions/plans', {
    params: { includeInactive }
  });
  return response.data;
};

// CREATE new plan in MongoDB (admin)
export const createPlan = async (planData) => {
  const response = await axiosInstance.post('/subscriptions/plans', planData);
  return response.data;
};

// UPDATE plan in MongoDB (admin)
export const updatePlan = async (planId, planData) => {
  const response = await axiosInstance.put(`/subscriptions/plans/${planId}`, planData);
  return response.data;
};

// DELETE plan from MongoDB (admin)
export const deletePlan = async (planId) => {
  const response = await axiosInstance.delete(`/subscriptions/plans/${planId}`);
  return response.data;
};

// GET all subscriptions across all vendors (admin) — backend route is
// GET /subscriptions/admin/all, not /subscriptions/all.
export const getAllSubscriptions = async ({ status, page = 1, limit = 20 } = {}) => {
  const response = await axiosInstance.get('/subscriptions/admin/all', {
    params: { status, page, limit }
  });
  return response.data;
};

// GET subscription stats (admin)
export const getSubscriptionStats = async () => {
  const response = await axiosInstance.get('/subscriptions/admin/stats');
  return response.data;
};

// GET expiring-soon alerts (admin)
export const getExpiryAlerts = async () => {
  const response = await axiosInstance.get('/subscriptions/admin/expiry-alerts');
  return response.data;
};