import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MdNotifications, MdMenu } from 'react-icons/md';
import axiosInstance from '../../services/axiosInstance';
import '../../assets/styles/navbar.css';
import '../../assets/styles/notif-panel.css';
import emptyNotifImg from '../../assets/images/Empty notifications illustration.png';

/* ── Time formatter ────────────────────────────────────────────────────────── */
function formatNotifTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = date.toLocaleString('en-US', { month: 'long' });
  const day   = date.getDate();
  const year  = date.getFullYear();
  const hh    = String(date.getHours()).padStart(2, '0');
  const mm    = String(date.getMinutes()).padStart(2, '0');
  return `${month} ${day}, ${year} | ${hh}:${mm} ${date.getHours() >= 12 ? 'PM' : 'AM'}`;
}

/* ── Main component ────────────────────────────────────────────────────────── */
export default function Navbar({ title, onMenuToggle }) {
  const navigate = useNavigate();

  const adminData   = JSON.parse(localStorage.getItem('admin') || '{}');
  const adminName   = adminData.name || 'Admin';
  const profileImage = adminData.profileImage ? `http://localhost:5000${adminData.profileImage}` : null;
  const adminAvatar = profileImage 
    ? <img src={profileImage} alt={adminName} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', display: 'block', flexShrink: 0 }} />
    : adminName.charAt(0).toUpperCase();

  /* ── Notification state ── */
  const [notifications, setNotifications] = useState([]);
  const [panelOpen, setPanelOpen]         = useState(false);

  const panelRef = useRef(null);
  const bellRef  = useRef(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  /* ── Fetch notifications ── */
  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get('/notifications');
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch {
      // silent fail
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Poll every 60s to keep badge current
    const id = setInterval(fetchNotifications, 60000);
    return () => clearInterval(id);
  }, [fetchNotifications]);

  /* ── Close panel on outside click and keydown ── */
  useEffect(() => {
    if (!panelOpen) return;
    function handleOutside(e) {
      if (
        panelRef.current && !panelRef.current.contains(e.target) &&
        bellRef.current  && !bellRef.current.contains(e.target)
      ) {
        setPanelOpen(false);
      }
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        setPanelOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [panelOpen]);

  /* ── Prevent body scrolling when open ── */
  useEffect(() => {
    if (panelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [panelOpen]);

  /* ── Mark all unread as read ── */
  async function markAllAsRead() {
    const unread = notifications.filter(n => !n.isRead);
    if (!unread.length) return;
    try {
      await Promise.all(unread.map(n => axiosInstance.patch(`/notifications/${n._id}/read`)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {
      // silent
    }
  }

  /* ── Bell click — open panel & immediately clear red dot ── */
  function handleBellClick() {
    const opening = !panelOpen;
    setPanelOpen(opening);
    if (opening) markAllAsRead();
  }

  /* ── Dismiss single item (mark read + remove from list) ── */
  function handleDismiss(id) {
    axiosInstance.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.filter(n => n._id !== id));
  }

  /* ── Render ── */
  return (
    <header className="navbar">
      {/* Hamburger — mobile only */}
      <button className="navbar-hamburger" onClick={onMenuToggle} aria-label="Toggle menu">
        <MdMenu size={24} />
      </button>

      <span className="navbar-mobile-title">{title || 'Admin Panel'}</span>

      <div className="navbar-right">

        {/* ── Bell + Dropdown ── */}
        <div className="notif-bell-wrapper">
          <button
            ref={bellRef}
            className="navbar-notif"
            aria-label="Notifications"
            onClick={handleBellClick}
          >
            <MdNotifications size={20} />
            {unreadCount > 0 && (
              <span className="navbar-notif-badge">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {panelOpen && (
            <>
              <div className="notif-backdrop" onClick={() => setPanelOpen(false)} />
              <div ref={panelRef} className="notif-panel">
                {/* Panel header */}
                <div className="notif-panel-header">
                  <h2 className="notif-panel-title">Notifications</h2>
                  <button
                    className="notif-panel-close"
                    onClick={() => setPanelOpen(false)}
                    aria-label="Close notifications"
                  >
                    ✕
                  </button>
                </div>

                {/* Read all link */}
                {notifications.length > 0 && (
                  <div className="notif-panel-readall-row">
                    <button className="notif-panel-readall-btn" onClick={markAllAsRead}>
                      Read all
                    </button>
                  </div>
                )}

                {/* List */}
                <div className="notif-panel-list">
                  {notifications.length === 0 ? (
                    <div className="notif-panel-empty">
                      <img src={emptyNotifImg} alt="No notifications" className="notif-panel-empty-img" />
                      <p>No notifications yet.</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif._id}
                        className={`notif-panel-item${notif.isRead ? '' : ' notif-panel-item--unread'}`}
                      >
                        {/* Avatar circle */}
                        <div className="notif-panel-avatar" />

                        {/* Content */}
                        <div className="notif-panel-content">
                          <p className="notif-panel-msg">{notif.message}</p>
                          <span className="notif-panel-time">{formatNotifTime(notif.createdAt)}</span>
                        </div>

                        {/* Dismiss */}
                        <button
                          className="notif-panel-dismiss"
                          onClick={() => handleDismiss(notif._id)}
                          aria-label="Dismiss notification"
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Avatar → Settings */}
        <div className="navbar-user">
          <div
            className="navbar-user-avatar"
            onClick={() => navigate('/admin/settings')}
            style={{ cursor: 'pointer' }}
            title="Settings"
          >
            {adminAvatar}
          </div>
        </div>
      </div>
    </header>
  );
}