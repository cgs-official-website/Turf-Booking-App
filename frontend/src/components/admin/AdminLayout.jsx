import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import '../../assets/styles/layout.css';

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  useEffect(() => {
    if (!sidebarOpen) return;

    const handleScroll = (event) => {
      // Do not close if the user scrolls inside the sidebar itself
      if (event.target.closest('.sidebar')) {
        return;
      }
      setSidebarOpen(false);
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [sidebarOpen]);

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