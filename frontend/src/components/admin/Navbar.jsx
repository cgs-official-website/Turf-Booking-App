import React from 'react';
import '../../assets/styles/navbar.css';

export default function Navbar({ title, notificationCount = 0 }) {
  return (
    <header className="navbar">
      {/* Search */}
      <div className="navbar-search">
        <svg className="navbar-search-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          type="text"
          className="navbar-search-input"
          placeholder="Search for Vendors, turfs and more..."
        />
      </div>

      {/* Right side with user info */}
      <div className="navbar-right">
        <button className="navbar-notif">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>

          {notificationCount > 0 && (
            <span className="navbar-notif-badge">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>

        <div className="navbar-user">
          <div className="navbar-user-avatar">K</div>
          <div className="navbar-user-info">
            <span className="navbar-user-name">Karthikeyan</span>
            <span className="navbar-user-role">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}