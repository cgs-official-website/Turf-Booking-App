import { Routes, Route } from "react-router-dom";
import Login from "../pages/admin/Login";
import Dashboard from "../pages/admin/Dashboard";
import Settings from "../pages/admin/Settings";
import Vendors from "../pages/admin/Vendors";
import Bookings from "../pages/admin/Bookings";
import TurfApprovals from "../pages/admin/TurfApprovals";
import Subscriptions from "../pages/admin/Subscriptions";
import Reports from "../pages/admin/Reports";
import ForgotPassword from "../pages/admin/ForgotPassword";
import ForgotPasswordSuccess from "../pages/admin/ForgotPasswordSuccess";
import ResetPassword from "../pages/admin/ResetPassword";
import ProtectedRoute from "./ProtectedRoute";
import AdminLayout from "../components/admin/AdminLayout";

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/forgot-password" element={<ForgotPassword />} />
      <Route path="/admin/forgot-password-success" element={<ForgotPasswordSuccess />} />
      <Route path="/admin/reset-password" element={<ResetPassword />} />

      <Route element={
        <ProtectedRoute>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/vendors" element={<Vendors />} />
        <Route path="/admin/bookings" element={<Bookings />} />
        <Route path="/admin/turfs" element={<TurfApprovals />} />
        <Route path="/admin/subscriptions" element={<Subscriptions />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default AdminRoutes;