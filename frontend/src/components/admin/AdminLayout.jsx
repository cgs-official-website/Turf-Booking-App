import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import '../../assets/styles/layout.css';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      {sidebarOpen && (
        <div
          className="sidebar-overlay open"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar sidebarOpen={sidebarOpen} />
      <div className="layout-main">
        <Navbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
        <main className="layout-content">
          <div className="page-content">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
}