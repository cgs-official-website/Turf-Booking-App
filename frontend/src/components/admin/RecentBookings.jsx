// RecentBookings.jsx
// Dashboard widget — shows the latest N bookings from the platform.
// Props:
//   limit      {number}  – max rows to show (default 3)
//   showHeader {boolean} – show card header  (default true)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import "../../assets/styles/recentBookings.css";

/* ── Mock fallback ── */
const MOCK_RECENT = [
  { _id: "r001", displayId: "BKG-5001", userName: "Rahul Sharma", date: "Jun 5, 2026",  status: "confirmed" },
  { _id: "r002", displayId: "BKG-5002", userName: "Priya Patel",  date: "Jun 6, 2026",  status: "pending"   },
  { _id: "r003", displayId: "BKG-5003", userName: "Amit Kumar",   date: "Jun 7, 2026",  status: "rejected"  },
];

/* ── Normalise ── */
function normalizeRecent(b) {
  const status = (b.bookingStatus ?? b.status ?? "pending").toLowerCase();
  return {
    ...b,
    displayId: b.displayId ?? "BKG-" + (b._id?.slice(-4).toUpperCase() ?? "????"),
    userName:  b.user?.name ?? b.userName ?? b.customerName ?? "—",
    turfName:  b.turf?.name ?? b.turfName ?? "—",
    date: b.createdAt
      ? new Date(b.createdAt).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        })
      : b.bookingDate
      ? new Date(b.bookingDate).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        })
      : b.date ?? "—",
    status,
  };
}

/* ── Badge ── */
function RbBadge({ status }) {
  const labels = {
    confirmed: "Confirmed",
    pending:   "Pending",
    rejected:  "Rejected",
    expired:   "Expired",
  };
  return (
    <span className={`rb-badge rb-badge--${status}`}>
      {labels[status] ?? status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

/* ── Main ── */
export default function RecentBookings({ limit = 3, showHeader = true }) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const ctrl = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const { data } = await axiosInstance.get("/bookings/admin/all", {
          signal: ctrl.signal,
        });
        if (ctrl.signal.aborted) return;

        const list = Array.isArray(data) ? data : [];

        // Sort by createdAt descending (newest first) then take only `limit` rows
        const recent = [...list]
          .sort((a, b) => new Date(b.createdAt ?? 0) - new Date(a.createdAt ?? 0))
          .slice(0, limit)
          .map(normalizeRecent);

        setBookings(recent);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        setBookings(MOCK_RECENT.slice(0, limit).map(normalizeRecent));
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => ctrl.abort();
  }, [limit]);

  return (
    <div className="rb-card">
      {showHeader && (
        <div className="rb-card-header">
          <h2 className="rb-card-title">Recent Bookings</h2>
          <a
            href="#"
            className="rb-view-all"
            onClick={(e) => { e.preventDefault(); navigate("/admin/bookings"); }}
            aria-label="View all bookings"
          >
            View all →
          </a>
        </div>
      )}

      {loading ? (
        <div className="rb-loading"><span className="rb-spinner" aria-label="Loading" /></div>
      ) : bookings.length === 0 ? (
        <p className="rb-empty">No recent bookings found.</p>
      ) : (
        <table className="rb-table" aria-label="Recent bookings">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Turf</th>
              <th>User</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((bk) => (
              <tr key={bk._id}>
                <td className="rb-td-id">{bk.displayId}</td>
                <td className="rb-td-turf">{bk.turfName}</td>
                <td className="rb-td-user">{bk.userName}</td>
                <td className="rb-td-date">{bk.date}</td>
                <td><RbBadge status={bk.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}