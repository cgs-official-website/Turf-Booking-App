import React from "react";
import { Routes, Route } from "react-router-dom";

// Admin Pages
import Login from "../pages/admin/Login";
import Dashboard from "../pages/admin/Dashboard";
import Vendors from "../pages/admin/Vendors";
// import Bookings from "../pages/admin/Bookings";
// import Turfs from "../pages/admin/Turfs";
// import Profile from "../pages/admin/Profile";
// import Notifications from "../pages/admin/Notifications";
// import Subscriptions from "../pages/admin/Subscriptions";

// Detail Pages
import TurfDetails from "../pages/admin/TurfDetails";
// import VendorDetails from "../pages/admin/VendorDetails";
// import BookingDetails from "../pages/admin/BookingDetails";
import TurfApprovals from "../pages/admin/TurfApprovals";

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/" element={<Login />} />
      <Route path="/admin/login" element={<Login />} />

      {/* Dashboard */}
      <Route path="/admin/dashboard" element={<Dashboard />} />

      {/* Vendors */}
      <Route path="/admin/vendors" element={<Vendors />} />
      {/* <Route path="/admin/vendors/:id" element={<VendorDetails />} /> */}

      {/* Turfs */}
      <Route path="/admin/turfs" element={<TurfApprovals />} />
      <Route path="/admin/turf/:id" element={<TurfDetails />} />

      {/* Bookings */}
      {/* <Route path="/admin/bookings" element={<Bookings />} /> */}
      {/* <Route path="/admin/bookings/:id" element={<BookingDetails />} /> */}

      {/* Other Pages */}
      {/* <Route path="/admin/profile" element={<Profile />} />
      <Route path="/admin/notifications" element={<Notifications />} />
      <Route path="/admin/subscriptions" element={<Subscriptions />} /> */}
    </Routes>
  );
};

export default AdminRoutes;
