import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import '../../assets/styles/layout.css';

// Map paths to page titles for mobile navbar
const PAGE_TITLES = {
  '/admin/dashboard':       'Dashboard',
  '/admin/vendors':         'Vendor Management',
  '/admin/subscriptions':   'Subscription',
  '/admin/turfs':           'Turf Approvals',
  '/admin/bookings':        'Bookings',
  '/admin/payment-history': 'Payment History',
  '/admin/reports':         'Reports',
  '/admin/settings':        'Settings',
};

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on route change (mobile nav)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) setSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const pageTitle = PAGE_TITLES[location.pathname] || 'Admin Panel';

  return (
    <div className="layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="layout-main">
        <Navbar
          title={pageTitle}
          notificationCount={3}
          onMenuToggle={() => setSidebarOpen(prev => !prev)}
        />
        <main className="layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}


// import React from 'react';
// import Sidebar from './Sidebar';
// import Navbar from './Navbar';
// import '../../assets/styles/layout.css';

// export default function AdminLayout({ children }) {
//   return (
//     <div className="layout">
//       <Sidebar />
//       <div className="layout-main">
//         <Navbar />
//         <main className="layout-content">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// }