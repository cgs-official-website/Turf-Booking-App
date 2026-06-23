import axiosInstance from "./axiosInstance";

export const getDashboardStats = async (period = 'month') => {
  const response = await axiosInstance.get(`/admin/dashboard?period=${period}`);
  return response.data;
};