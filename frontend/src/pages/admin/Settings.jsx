import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';
import { getLoginActivity } from '../../services/adminApi';
import '../../assets/styles/settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [loginActivity, setLoginActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    fetchAdminProfile();
    fetchActivity();
  }, []);

  const fetchActivity = async () => {
    try {
      setActivityLoading(true);
      const data = await getLoginActivity();
      
      let list = [];
      if (Array.isArray(data)) list = data;
      else if (data.data && Array.isArray(data.data)) list = data.data;
      else if (data.activities && Array.isArray(data.activities)) list = data.activities;
      else if (data.data && data.data.activities && Array.isArray(data.data.activities)) list = data.data.activities;
      
      // Sort newest first
      list.sort((a, b) => new Date(b.loginTime) - new Date(a.loginTime));
      
      // Filter for unique devices (browser + os)
      const seenDevices = new Set();
      const uniqueList = [];
      
      for (const activity of list) {
        const deviceKey = `${activity.browser || 'Unknown'}-${activity.os || 'Unknown'}`;
        if (!seenDevices.has(deviceKey)) {
          seenDevices.add(deviceKey);
          uniqueList.push(activity);
        }
      }
      
      // Keep up to 10 unique recent devices
      setLoginActivity(uniqueList.slice(0, 10));
    } catch (err) {
      console.error("Failed to fetch login activity:", err);
      setActivityError("Failed to load activity");
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axiosInstance.get('/admin/profile');
      
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("admin");
    navigate("/admin/login");
  };

  const formatDate = (isoString) => {
    if (!isoString) return "Unknown Time";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Unknown Time";
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const time = date.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${day} ${month} ${year}, ${time}`;
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
            <div className="profile-image-container">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(admin?.name || 'Admin')}&background=0D8B41&color=fff`} 
                alt={admin?.name || 'Admin'} 
              />
              <div className="upload-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </div>
            </div>
            <div className="profile-details">
              <h2>{admin?.name}</h2>
              <p className="profile-role">Admin</p>
              <p className="profile-email">{admin?.email}</p>
            </div>
          </div>
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
              
              {activityLoading ? (
                <div style={{ padding: '20px 0', fontSize: '14px', color: '#666' }}>Loading activity...</div>
              ) : activityError ? (
                <div style={{ padding: '20px 0', fontSize: '14px', color: '#ef4444' }}>{activityError}</div>
              ) : loginActivity.length === 0 ? (
                <div style={{ padding: '20px 0', fontSize: '14px', color: '#666' }}>No recent login activity found</div>
              ) : (
                loginActivity.map((activity, index) => (
                  <div className="device-item" key={index}>
                    <div className="device-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                      </svg>
                    </div>
                    <div className="device-info">
                      <p className="device-name">{activity.browser || 'Unknown'} &bull; {activity.os || 'Unknown'}</p>
                      <p className="device-location">{formatDate(activity.loginTime)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <button className="btn-logout-all" onClick={handleLogout}>Log out from All Devices</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
