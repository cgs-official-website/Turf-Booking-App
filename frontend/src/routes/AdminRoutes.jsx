// import { Routes, Route } from "react-router-dom";
// import Login from "../pages/admin/Login";
// import Dashboard from "../pages/admin/Dashboard";
// import Settings from "../pages/admin/Settings";
// import Vendors from "../pages/admin/Vendors";
// import Bookings from "../pages/admin/Bookings";
// import TurfApprovals from "../pages/admin/TurfApprovals";
// import Subscriptions from "../pages/admin/Subscriptions";
// import Reports from "../pages/admin/Reports";
// import ProtectedRoute from "./ProtectedRoute";

// function AdminRoutes() {
//   return (
//     <Routes>
//       <Route path="/" element={<Login />} />
//       <Route path="/admin/login" element={<Login />} />
//       <Route 
//         path="/admin/dashboard" 
//         element={
//           <ProtectedRoute>
//             <Dashboard />
//           </ProtectedRoute>
//         } 
//       />
//       <Route 
//         path="/admin/vendors" 
//         element={
//           <ProtectedRoute>
//             <Vendors />
//           </ProtectedRoute>
//         } 
//       />
//       <Route 
//         path="/admin/bookings" 
//         element={
//           <ProtectedRoute>
//             <Bookings />
//           </ProtectedRoute>
//         } 
//       />
//       <Route 
//         path="/admin/turfs" 
//         element={
//           <ProtectedRoute>
//             <TurfApprovals />
//           </ProtectedRoute>
//         } 
//       />
//       <Route 
//         path="/admin/subscriptions" 
//         element={
//           <ProtectedRoute>
//             <Subscriptions />
//           </ProtectedRoute>
//         } 
//       />
//       <Route 
//         path="/admin/reports" 
//         element={
//           <ProtectedRoute>
//             <Reports />
//           </ProtectedRoute>
//         } 
//       />
//       <Route 
//         path="/admin/settings" 
//         element={
//           <ProtectedRoute>
//             <Settings />
//           </ProtectedRoute>
//         } 
//       />
//     </Routes>
//   );
// }

// export default AdminRoutes;


// AdminRoutes.js
import { Routes, Route } from "react-router-dom";
import Login from "../pages/admin/Login";
import Dashboard from "../pages/admin/Dashboard";
import Settings from "../pages/admin/Settings";
import Vendors from "../pages/admin/Vendors";
import Bookings from "../pages/admin/Bookings";
import TurfApprovals from "../pages/admin/TurfApprovals";
import Subscriptions from "../pages/admin/Subscriptions"; // Make sure this imports your component
import Reports from "../pages/admin/Reports";
import ProtectedRoute from "./ProtectedRoute";

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/admin/login" element={<Login />} />
      <Route 
        path="/admin/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/vendors" 
        element={
          <ProtectedRoute>
            <Vendors />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/bookings" 
        element={
          <ProtectedRoute>
            <Bookings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/turfs" 
        element={
          <ProtectedRoute>
            <TurfApprovals />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/subscriptions" 
        element={
          <ProtectedRoute>
            <Subscriptions />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/reports" 
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin/settings" 
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

export default AdminRoutes;