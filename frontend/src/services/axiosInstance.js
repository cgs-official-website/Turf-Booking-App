// services/axiosInstance.js
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log(`[axios] ${config.method?.toUpperCase()} ${config.url} | token: ${token ? "✓" : "✗ MISSING"}`);
  return config;
});

// Handle 401 — skip redirect on login route itself
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes("/login")) {
      console.warn("[axios] 401 — token expired or invalid, redirecting to login");
      localStorage.removeItem("token");
      localStorage.removeItem("admin");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;