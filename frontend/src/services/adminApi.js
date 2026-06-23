import axiosInstance from './axiosInstance';

export const adminLogin = async (data) => {
  const response = await axiosInstance.post('/admin/login', data);
  return response.data;
};

export const adminForgotPassword = async (data) => {
  const response = await axiosInstance.post('/admin/forgot-password', data);
  return response.data;
};

export const adminResetPassword = async (data) => {
  const response = await axiosInstance.post('/admin/reset-password', data);
  return response.data;
};

export const getLoginActivity = async () => {
  const response = await axiosInstance.get('/admin/login-activity');
  return response.data;
};

export const adminApi = {
  adminLogin,
  adminForgotPassword,
  adminResetPassword,
  getLoginActivity
};
