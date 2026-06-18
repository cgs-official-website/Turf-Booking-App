import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';
import '../../assets/styles/settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [notifications, setNotifications] = useState({
    email: true,
    vendor: true,
    booking: true,
    payment: false,
  });

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get('/admin/profile');
      
      console.log("PROFILE RESPONSE:", response.data);
      
      // Extract the actual admin object from the backend response wrapper
      const adminData = response.data.data || response.data;
      
      if (adminData) {
        setAdmin(adminData);
      } else {
        throw new Error("No data returned");
      }
    } catch (err) {
      console.error("Failed to fetch admin profile:", err);
      try {
        const localAdmin = JSON.parse(localStorage.getItem("admin"));
        if (localAdmin) {
          setAdmin(localAdmin);
        } else {
          setError("Failed to load profile data.");
        }
      } catch (parseErr) {
        setError("Failed to load profile data.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/admin/login");
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage Platform Settings Preferences</p>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: '#0A9847' }}>
          Loading profile...
        </div>
      </div>
    );
  }

  if (error && !admin) {
    return (
      <div className="settings-page">
        <div className="settings-header">
          <h1>Settings</h1>
          <p>Manage Platform Settings Preferences</p>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage Platform Settings Preferences</p>
      </div>

      <div className="settings-content">
        <div className="profile-banner">
          <div className="profile-info">
            <div className="profile-image">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(admin?.name || 'Admin')}&background=0D8B41&color=fff`} 
                alt={admin?.name || 'Admin'} 
              />
            </div>
            <div className="profile-details">
              <h2>{admin?.name}</h2>
              <p>{admin?.email}</p>
            </div>
          </div>
          <button className="btn-edit-profile">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit Profile
          </button>
        </div>

        <div className="settings-two-column">
          <div className="settings-card left-card">
            <div className="card-header">
              <h3>Personal Information</h3>
              <p>Manage your personal details and store details</p>
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" value={admin?.name || ''} readOnly />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={admin?.email || ''} readOnly />
            </div>
          </div>

          <div className="settings-card right-card">
            <div className="card-header">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A9847" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                Security
              </h3>
            </div>
            <div className="login-activity">
              <h4>Recent Login Activity</h4>
              <div className="device-item">
                <div className="device-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                </div>
                <div className="device-info">
                  <p className="device-name">Chrome on MacOS</p>
                  <p className="device-location">Palo Alto, CA • <span className="active-status">Active Now</span></p>
                </div>
              </div>
              <div className="device-item">
                <div className="device-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                    <line x1="12" y1="18" x2="12.01" y2="18"></line>
                  </svg>
                </div>
                <div className="device-info">
                  <p className="device-name">iPhone 14 Pro</p>
                  <p className="device-location">Palo Alto, CA • 2 hours ago</p>
                </div>
              </div>
            </div>
            <button className="btn-logout-all" onClick={handleLogout}>Log out from All Devices</button>
          </div>
        </div>

        <div className="settings-card notifications-card">
          <div className="card-header">
            <h3>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0A9847" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              System Notifications
            </h3>
          </div>
          <div className="notification-list">
            <div className="notification-item">
              <div className="notification-info">
                <h4>Email Notifications</h4>
                <p>Get weekly digest and system status updates.</p>
              </div>
              <div className={`toggle-switch ${notifications.email ? 'active' : ''}`} onClick={() => handleToggle('email')}>
                <div className="toggle-slider"></div>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-info">
                <h4>Vendor Registration Alerts</h4>
                <p>Instant alerts when a new vendor signs up for verification.</p>
              </div>
              <div className={`toggle-switch ${notifications.vendor ? 'active' : ''}`} onClick={() => handleToggle('vendor')}>
                <div className="toggle-slider"></div>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-info">
                <h4>Booking Issue Alerts</h4>
                <p>Notifications for disputed or cancelled bookings.</p>
              </div>
              <div className={`toggle-switch ${notifications.booking ? 'active' : ''}`} onClick={() => handleToggle('booking')}>
                <div className="toggle-slider"></div>
              </div>
            </div>
            <div className="notification-item">
              <div className="notification-info">
                <h4>Payment Alerts</h4>
                <p>High-value transaction Premium Plans</p>
              </div>
              <div className={`toggle-switch ${notifications.payment ? 'active' : ''}`} onClick={() => handleToggle('payment')}>
                <div className="toggle-slider"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
