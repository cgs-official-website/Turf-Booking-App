import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MdNotifications, MdMenu } from 'react-icons/md';
import '../../assets/styles/navbar.css';

export default function Navbar({ title, notificationCount = 0, onMenuToggle }) {
  const navigate = useNavigate();

  const adminData = JSON.parse(localStorage.getItem("admin") || "{}");
  const adminName = adminData.name || "Admin";
  const adminAvatar = adminName.charAt(0).toUpperCase();

  return (
    <header className="navbar">
      {/* Hamburger — mobile/tablet only */}
      <button className="navbar-hamburger" onClick={onMenuToggle} aria-label="Toggle menu">
        <MdMenu size={24} />
      </button>

      {/* Mobile page title (replaces search on small screens) */}
      <span className="navbar-mobile-title">{title || 'Admin Panel'}</span>

      {/* Right side */}
      <div className="navbar-right">
        <button className="navbar-notif" aria-label="Notifications">
          <MdNotifications size={20} />
          {notificationCount > 0 && (
            <span className="navbar-notif-badge">
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </button>

        <div className="navbar-user">
          <div 
            className="navbar-user-avatar" 
            onClick={() => navigate('/admin/settings')}
            style={{ cursor: 'pointer' }}
            title="Settings"
          >
            {adminAvatar}
          </div>
          {/* Admin name/role hidden as requested */}
        </div>
      </div>
    </header>
  );
}


// import React from 'react';
// import '../../assets/styles/navbar.css';

// export default function Navbar({ title, notificationCount = 0 }) {
//   return (
//     <header className="navbar">
//       {/* Search */}
//       <div className="navbar-search">
//         <svg className="navbar-search-icon" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
//           <circle cx="11" cy="11" r="8"/>
//           <path d="m21 21-4.35-4.35"/>
//         </svg>
//         <input
//           type="text"
//           className="navbar-search-input"
//           placeholder="Search for Vendors, turfs and more..."
//         />
//       </div>

//       {/* Right side with user info */}
//       <div className="navbar-right">
//         <button className="navbar-notif">
//           <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
//             <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
//             <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
//           </svg>

//           {notificationCount > 0 && (
//             <span className="navbar-notif-badge">
//               {notificationCount > 99 ? '99+' : notificationCount}
//             </span>
//           )}
//         </button>

//         <div className="navbar-user">
//           <div className="navbar-user-avatar">K</div>
//           <div className="navbar-user-info">
//             <span className="navbar-user-name">Karthikeyan</span>
//             <span className="navbar-user-role">Admin</span>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }