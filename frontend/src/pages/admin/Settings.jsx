import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../services/axiosInstance';
import { getLoginActivity, updateAdminProfile, uploadAdminProfileImage, deleteAdminProfileImage } from '../../services/adminApi';
import '../../assets/styles/settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);
  
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const fileInputRef = React.useRef(null);
  const popupRef = React.useRef(null);
  
  const [loginActivity, setLoginActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState("");

  useEffect(() => {
    fetchAdminProfile();
    fetchActivity();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowImageMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
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
        setEditName(adminData.name || "");
      } else {
        throw new Error("No data returned");
      }
    } catch (err) {
      console.error("Failed to fetch admin profile:", err);
      try {
        const localAdmin = JSON.parse(localStorage.getItem("admin"));
        if (localAdmin) {
          setAdmin(localAdmin);
          setEditName(localAdmin.name || "");
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

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    try {
      setIsSavingName(true);
      const response = await updateAdminProfile({ name: editName });
      const updatedAdmin = response.data || response;
      setAdmin(updatedAdmin);
      setIsEditingName(false);
      // Update local storage
      const localAdmin = JSON.parse(localStorage.getItem("admin") || "{}");
      localStorage.setItem("admin", JSON.stringify({ ...localAdmin, name: updatedAdmin.name }));
    } catch (err) {
      console.error("Failed to update name:", err);
      alert("Failed to update name. Please try again.");
    } finally {
      setIsSavingName(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('profileImage', file);
    
    try {
      setIsUploadingImage(true);
      const response = await uploadAdminProfileImage(formData);
      const updatedAdmin = response.data || response;
      if (updatedAdmin && updatedAdmin.profileImage && !updatedAdmin.profileImage.includes('?')) {
        updatedAdmin.profileImage = `${updatedAdmin.profileImage}?t=${Date.now()}`;
      }
      setAdmin(updatedAdmin);
      const localAdmin = JSON.parse(localStorage.getItem("admin") || "{}");
      localStorage.setItem("admin", JSON.stringify({ ...localAdmin, profileImage: updatedAdmin.profileImage }));
    } catch (err) {
      console.error("Failed to upload image:", err);
      alert("Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteImage = async () => {
    if (!window.confirm("Are you sure you want to delete your profile picture?")) return;
    try {
      setIsUploadingImage(true);
      const response = await deleteAdminProfileImage();
      const updatedAdmin = response.data || response;
      setAdmin(updatedAdmin);
      const localAdmin = JSON.parse(localStorage.getItem("admin") || "{}");
      localStorage.setItem("admin", JSON.stringify({ ...localAdmin, profileImage: "" }));
    } catch (err) {
      console.error("Failed to delete image:", err);
      alert("Failed to delete image.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageClick = () => {
    if (admin?.profileImage) {
      setShowImageMenu(!showImageMenu);
    } else {
      fileInputRef.current?.click();
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
            <div className="profile-image-container" style={{ position: 'relative', cursor: 'pointer' }} onClick={handleImageClick} ref={popupRef}>
              <img 
                src={admin?.profileImage ? `http://localhost:5000${admin.profileImage}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(admin?.name || 'Admin')}&background=0D8B41&color=fff`} 
                alt={admin?.name || 'Admin'} 
                style={{ opacity: isUploadingImage ? 0.5 : 1, transition: 'opacity 0.2s' }}
              />
              {!admin?.profileImage && (
                <div 
                  className="upload-icon" 
                  title="Upload Picture"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </div>
              )}
              {showImageMenu && admin?.profileImage && (
                <div style={{ position: 'absolute', top: '90px', left: '0', background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', minWidth: '130px' }}>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowImageMenu(false); fileInputRef.current?.click(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'none', border: 'none', borderBottom: '1px solid #f0f0f0', color: '#111', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Change Photo
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowImageMenu(false); handleDeleteImage(); }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', textAlign: 'left', fontSize: '12px', fontWeight: 500 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Delete Photo
                  </button>
                </div>
              )}
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => { setShowImageMenu(false); handleImageUpload(e); }} 
                accept="image/*" 
                style={{ display: 'none' }} 
              />
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
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>Personal Information</h3>
                <p>Manage your personal details and store details</p>
              </div>
              {!isEditingName ? (
                <button 
                  onClick={() => setIsEditingName(true)} 
                  style={{ background: 'none', border: 'none', color: '#0A9847', cursor: 'pointer', fontWeight: 500 }}
                >
                  Edit
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={() => {
                      setIsEditingName(false);
                      setEditName(admin?.name || "");
                    }} 
                    style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontWeight: 500 }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveName}
                    disabled={isSavingName}
                    style={{ background: '#0A9847', border: 'none', color: 'white', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
                  >
                    {isSavingName ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
            <div className="form-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={isEditingName ? editName : (admin?.name || '')} 
                onChange={(e) => setEditName(e.target.value)}
                readOnly={!isEditingName} 
                style={isEditingName ? { border: '1px solid #0A9847', outline: 'none' } : {}}
              />
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
