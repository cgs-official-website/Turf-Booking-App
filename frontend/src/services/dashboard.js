import axiosInstance from "./axiosInstance";

export const getDashboardStats = async (period = 'month', planId = '') => {
  let url = `/admin/dashboard?period=${period}`;
  if (planId) {
    url += `&plan=${planId}`;
  }
  const response = await axiosInstance.get(url);
  return response.data;
};