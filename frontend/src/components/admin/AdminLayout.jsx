import React from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import '../../assets/styles/layout.css';

export default function AdminLayout({ children }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-main">
        <Navbar />
        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}