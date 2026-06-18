// routes/AdminRoutes.jsx

import React from "react";
import { Routes, Route } from "react-router-dom";

import Login        from "../pages/admin/Login";
import Dashboard    from "../pages/admin/Dashboard";
import Vendors      from "../pages/admin/Vendors";
import TurfApprovals from "../pages/admin/TurfApprovals";
import TurfDetails  from "../pages/admin/TurfDetails";

// import Bookings       from "../pages/admin/Bookings";
// import BookingDetails from "../pages/admin/BookingDetails";
// import Profile        from "../pages/admin/Profile";
// import Notifications  from "../pages/admin/Notifications";
// import Subscriptions  from "../pages/admin/Subscriptions";

const AdminRoutes = () => {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/"                   element={<Login />} />
      <Route path="/admin/login"        element={<Login />} />

      {/* Core admin */}
      <Route path="/admin/dashboard"    element={<Dashboard />} />
      <Route path="/admin/vendors"      element={<Vendors />} />

      {/* Turf approvals list  →  /admin/turf-approvals */}
      <Route path="/admin/turf-approvals"      element={<TurfApprovals />} />

      {/* Turf detail page  →  /admin/turf-approvals/:id */}
      <Route path="/admin/turf-approvals/:id"  element={<TurfDetails />} />

      {/* Bookings (uncomment when ready) */}
      {/* <Route path="/admin/bookings"         element={<Bookings />} /> */}
      {/* <Route path="/admin/bookings/:id"     element={<BookingDetails />} /> */}

      {/* Other pages */}
      {/* <Route path="/admin/profile"          element={<Profile />} /> */}
      {/* <Route path="/admin/notifications"    element={<Notifications />} /> */}
      {/* <Route path="/admin/subscriptions"    element={<Subscriptions />} /> */}
    </Routes>
  );
};

export default AdminRoutes;