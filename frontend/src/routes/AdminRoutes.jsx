import { Routes, Route } from "react-router-dom";
import Login from "../pages/admin/Login";
import Dashboard from "../pages/admin/Dashboard";
import Settings from "../pages/admin/Settings";

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/settings" element={<Settings />} />
    </Routes>
  );
}

export default AdminRoutes;