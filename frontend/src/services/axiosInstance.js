// services/axiosInstance.js
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000",
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// Attach token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[axios] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`,
      token ? "✓ token attached" : "✗ no token"
    );
    return config;
  },
  (err) => Promise.reject(err)
);

// Handle 401 globally
axiosInstance.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isLoginRoute = err.config?.url?.includes("/login");
      if (!isLoginRoute) {
        console.warn("[axios] 401 on protected route — clearing token, redirecting to login");
        localStorage.removeItem("token");
        window.location.href = "/admin/login";
      }
    }
    return Promise.reject(err);
  }
);

export default axiosInstance;