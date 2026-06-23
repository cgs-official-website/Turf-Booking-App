import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import '../../assets/styles/sidebar.css';

const navItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/admin/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "vendors",
    label: "Vendor management",
    path: "/admin/vendors",          // ✅ FIXED: was /admin/vendor
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  {
    id: "subscriptions",
    label: "Subscription",
    path: "/admin/subscriptions",    // ✅ FIXED: was /admin/subscription
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
  id: "turfs",
  label: "Turf Approvals",
  path: "/admin/turf-approvals",
  icon: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 2l2.4 2.1 3.2-.5 1.3 3 3 1.3-.5 3.2L22 12l-2.1 2.4.5 3.2-3 1.3-1.3 3-3.2-.5L12 22l-2.4-2.1-3.2.5-1.3-3-3-1.3.5-3.2L2 12l2.1-2.4-.5-3.2 3-1.3 1.3-3 3.2.5L12 2z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  ),
},
  {
    id: "bookings",
    label: "Bookings",
    path: "/admin/bookings",         // ✅ Already correct
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
  },
  {
  id: "payment",
  label: "Payment History",
  path: "/admin/payment",
  icon: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 6.3L3 8" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
},
  {
  id: "reports",
  label: "Reports",
  path: "/admin/reports",
  icon: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7.86 2h8.28L22 7.86v8.28L16.14 22H7.86L2 16.14V7.86L7.86 2z" />
      <line x1="12" y1="7" x2="12" y2="13" />
      <circle cx="12" cy="17" r="1" />
    </svg>
  ),
},
  {
    id: "settings",
    label: "Settings",
    path: "/admin/settings",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.53731 21L9.1791 18.12C8.98507 18.045 8.80239 17.955 8.63105 17.85C8.4597 17.745 8.29164 17.6325 8.12687 17.5125L5.46269 18.6375L3 14.3625L5.30597 12.6075C5.29104 12.5025 5.28358 12.4014 5.28358 12.3042V11.6967C5.28358 11.5989 5.29104 11.4975 5.30597 11.3925L3 9.6375L5.46269 5.3625L8.12687 6.4875C8.29105 6.3675 8.46269 6.255 8.64179 6.15C8.8209 6.045 9 5.955 9.1791 5.88L9.53731 3H14.4627L14.8209 5.88C15.0149 5.955 15.1979 6.045 15.3699 6.15C15.5418 6.255 15.7096 6.3675 15.8731 6.4875L18.5373 5.3625L21 9.6375L18.694 11.3925C18.709 11.4975 18.7164 11.5989 18.7164 11.6967V12.3033C18.7164 12.4011 18.7015 12.5025 18.6716 12.6075L20.9776 14.3625L18.5149 18.6375L15.8731 17.5125C15.709 17.6325 15.5373 17.745 15.3582 17.85C15.1791 17.955 15 18.045 14.8209 18.12L14.4627 21H9.53731ZM11.1045 19.2H12.8731L13.1866 16.815C13.6493 16.695 14.0785 16.5189 14.4743 16.2867C14.8701 16.0545 15.2319 15.7731 15.5597 15.4425L17.7761 16.365L18.6493 14.835L16.7239 13.3725C16.7985 13.1625 16.8507 12.9414 16.8806 12.7092C16.9104 12.477 16.9254 12.2406 16.9254 12C16.9254 11.7594 16.9104 11.5233 16.8806 11.2917C16.8507 11.0601 16.7985 10.8387 16.7239 10.6275L18.6493 9.165L17.7761 7.635L15.5597 8.58C15.2313 8.235 14.8696 7.9464 14.4743 7.7142C14.0791 7.482 13.6499 7.3056 13.1866 7.185L12.8955 4.8H11.1269L10.8134 7.185C10.3507 7.305 9.92179 7.4814 9.52657 7.7142C9.13134 7.947 8.76925 8.2281 8.4403 8.5575L6.22388 7.635L5.35075 9.165L7.27612 10.605C7.20149 10.83 7.14925 11.055 7.1194 11.28C7.08955 11.505 7.07463 11.745 7.07463 12C7.07463 12.24 7.08955 12.4725 7.1194 12.6975C7.14925 12.9225 7.20149 13.1475 7.27612 13.3725L5.35075 14.835L6.22388 16.365L8.4403 15.42C8.76866 15.765 9.13075 16.0539 9.52657 16.2867C9.92239 16.5195 10.3513 16.6956 10.8134 16.815L11.1045 19.2ZM12.0448 15.15C12.9104 15.15 13.6493 14.8425 14.2612 14.2275C14.8731 13.6125 15.1791 12.87 15.1791 12C15.1791 11.13 14.8731 10.3875 14.2612 9.7725C13.6493 9.1575 12.9104 8.85 12.0448 8.85C11.1642 8.85 10.4215 9.1575 9.81672 9.7725C9.21194 10.3875 8.90985 11.13 8.91045 12C8.91105 12.87 9.21343 13.6125 9.81761 14.2275C10.4218 14.8425 11.1642 15.15 12.0448 15.15Z" fill="black"/>
      </svg>
    ),
  },
];

export default function Sidebar({ sidebarOpen }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getActivePage = () => {
    const activeItem = navItems.find(item => location.pathname === item.path);
    return activeItem ? activeItem.id : null;  // ✅ null fallback, no false active
  };

  const activePage = getActivePage();

  const adminData = JSON.parse(localStorage.getItem("admin") || "{}");
  const adminName = adminData.name || "Admin";
  const adminAvatar = adminName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/admin/login");
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="sidebar-header">
        <div className="sidebar-title-wrapper">
          <div className="sidebar-title">
            Admin <span>panel</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-nav-item ${activePage === item.id ? "active" : ""}`}
            onClick={() => navigate(item.path)}
          >
            <span className="sidebar-nav-icon">{item.icon}</span>
            <span className="sidebar-nav-text">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{adminAvatar}</div>
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{adminName}</span>
            <span className="sidebar-user-role">Admin</span>
          </div>
        </div>
        <button className="sidebar-logout" onClick={handleLogout} title="Logout">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </div>
    </aside>
  );
}