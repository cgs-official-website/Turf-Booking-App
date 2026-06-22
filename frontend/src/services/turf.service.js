// services/turf.service.js
import axiosInstance from './axiosInstance';

// Get all turfs (public - no authentication required)
export const getAllTurfs = async (params = {}) => {
  const response = await axiosInstance.get('/turfs', { params });
  return response.data;
};

// Get turf by ID
export const getTurfById = async (turfId) => {
  const response = await axiosInstance.get(`/turfs/${turfId}`);
  return response.data;
};

// Get available slots for a turf
export const getAvailableSlots = async (turfId, date) => {
  const response = await axiosInstance.get(`/turfs/${turfId}/slots`, { params: { date } });
  return response.data;
};