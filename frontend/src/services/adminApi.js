import axiosInstance from './axiosInstance';

export const adminLogin = async (data) => {
  const response = await axiosInstance.post('/admin/login', data);
  return response.data;
};

export const adminApi = {
  adminLogin
};
