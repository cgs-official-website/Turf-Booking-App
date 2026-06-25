// Notifications.jsx — Admin Notifications page
// API:
//   GET   /notifications          → fetch admin notifications (newest first)
//   PATCH /notifications/:id/read → mark single notification as read

import { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../services/axiosInstance";
import "../../assets/styles/notifications.css";

/* ── Type label map ─────────────────────────────────────────────────────── */
const TYPE_META = {
  TURF_APPROVED:           { label: "Turf Approved",              icon: "bi-check-circle-fill",       color: "green"  },
  TURF_REJECTED:           { label: "Turf Rejected",              icon: "bi-x-circle-fill",            color: "red"    },
  turf_deleted:            { label: "Turf Deleted",               icon: "bi-trash-fill",               color: "red"    },
  BOOKING_APPROVED:        { label: "Booking Approved",           icon: "bi-calendar-check-fill",      color: "green"  },
  BOOKING_REJECTED:        { label: "Booking Rejected",           icon: "bi-calendar-x-fill",          color: "red"    },
  booking_received:        { label: "New Booking",                icon: "bi-calendar-plus-fill",       color: "blue"   },
  subscription_expiring:   { label: "Subscription Expiring Soon", icon: "bi-clock-fill",               color: "yellow" },
  subscription_expired:    { label: "Subscription Expired",       icon: "bi-exclamation-circle-fill",  color: "red"    },
  subscription_upgraded:   { label: "Subscription Upgraded",      icon: "bi-arrow-up-circle-fill",     color: "green"  },
  subscription_downgraded: { label: "Subscription Downgraded",    icon: "bi-arrow-down-circle-fill",   color: "yellow" },
  autopay_cancelled:       { label: "Autopay Cancelled",          icon: "bi-x-octagon-fill",           color: "red"    },
  vendor_report:           { label: "Vendor Report Submitted",    icon: "bi-flag-fill",                color: "orange" },
};

function getMeta(type) {
  return TYPE_META[type] ?? { label: type ?? "Notification", icon: "bi-bell-fill", color: "blue" };
}

/* ── Time formatter ─────────────────────────────────────────────────────── */
function formatTime(dateStr) {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ── Notification Item ──────────────────────────────────────────────────── */
function NotifItem({ notif, onMarkRead }) {
  const meta = getMeta(notif.type);

  return (
    <div className={`notif-item ${notif.isRead ? "notif-item--read" : "notif-item--unread"}`}>
      <div className={`notif-icon notif-icon--${meta.color}`}>
        <i className={`bi ${meta.icon}`} />
      </div>

      <div className="notif-body">
        <div className="notif-top">
          <span className={`notif-type-badge notif-type-badge--${meta.color}`}>
            {meta.label}
          </span>
          {!notif.isRead && <span className="notif-unread-dot" title="Unread" />}
        </div>
        <p className="notif-title">{notif.title}</p>
        <p className="notif-message">{notif.message}</p>
        <span className="notif-time">{formatTime(notif.createdAt)}</span>
      </div>

      {!notif.isRead && (
        <button
          className="notif-mark-btn"
          title="Mark as read"
          onClick={() => onMarkRead(notif._id)}
        >
          <i className="bi bi-check2" />
        </button>
      )}
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────────── */
export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [markingAll, setMarkingAll]       = useState(false);
  const [filter, setFilter]               = useState("all"); // "all" | "unread" | "read"

  /* ── Fetch ── */
  const fetchNotifications = useCallback(async (signal) => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/notifications", { signal });
      if (signal?.aborted) return;
      const list = Array.isArray(data.notifications) ? data.notifications : [];
      setNotifications(list); // already sorted newest first by backend
    } catch (err) {
      if (err?.name === "CanceledError" || err?.name === "AbortError") return;
      setNotifications([]);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchNotifications(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchNotifications]);

  /* ── Mark single as read ── */
  async function handleMarkRead(id) {
    try {
      await axiosInstance.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("[Notifications] markRead failed:", err?.response?.data?.message ?? err.message);
    }
  }

  /* ── Mark all as read ── */
  async function handleMarkAll() {
    const unread = notifications.filter((n) => !n.isRead);
    if (!unread.length) return;
    setMarkingAll(true);
    try {
      await Promise.all(unread.map((n) => axiosInstance.patch(`/notifications/${n._id}/read`)));
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("[Notifications] markAll failed:", err?.response?.data?.message ?? err.message);
    } finally {
      setMarkingAll(false);
    }
  }

  /* ── Derived ── */
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read")   return n.isRead;
    return true;
  });

  /* ── Render ── */
  return (
    <div className="notif-page">
      <div className="notif-page-header">
        <div className="notif-page-title-row">
          <h1 className="notif-page-title">Notifications</h1>
          {unreadCount > 0 && (
            <span className="notif-count-badge">{unreadCount} unread</span>
          )}
        </div>

        <div className="notif-header-actions">
          {/* Filter tabs */}
          <div className="notif-filter-tabs">
            {["all", "unread", "read"].map((f) => (
              <button
                key={f}
                className={`notif-filter-tab ${filter === f ? "notif-filter-tab--active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* Mark all */}
          <button
            className="notif-mark-all-btn"
            onClick={handleMarkAll}
            disabled={unreadCount === 0 || markingAll}
          >
            {markingAll ? (
              <><span className="notif-spinner" /> Marking…</>
            ) : (
              <><i className="bi bi-check2-all" /> Mark all as read</>
            )}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="notif-list-container">
        {loading ? (
          <div className="notif-state-box">
            <span className="notif-spinner notif-spinner--lg" />
            <p>Loading notifications…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="notif-state-box">
            <i className="bi bi-bell-slash notif-empty-icon" />
            <p className="notif-empty-text">
              {filter === "unread" ? "No unread notifications." : "No notifications yet."}
            </p>
          </div>
        ) : (
          <div className="notif-list">
            {filtered.map((notif) => (
              <NotifItem
                key={notif._id}
                notif={notif}
                onMarkRead={handleMarkRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
