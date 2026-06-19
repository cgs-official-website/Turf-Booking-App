// RecentBookings.jsx
// A dashboard widget showing the latest platform bookings.
// Props:
//   limit      {number}  – max rows to show (default 5)
//   showHeader {boolean} – show card header (default true)

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import "../../assets/styles/bookings.css";

/* ── Mock fallback ── */
const MOCK_RECENT = [
  {
    _id: "r001",
    displayId: "BKG-5001",
    userName: "Rahul Sharma",
    date: "Jun 5, 2026",
    status: "confirmed",
  },
  {
    _id: "r002",
    displayId: "BKG-5002",
    userName: "Priya Patel",
    date: "Jun 6, 2026",
    status: "confirmed",
  },
  {
    _id: "r003",
    displayId: "BKG-5003",
    userName: "Amit Kumar",
    date: "Jun 7, 2026",
    status: "pending",
  },
  {
    _id: "r004",
    displayId: "BKG-5004",
    userName: "Sneha Reddy",
    date: "Jun 8, 2026",
    status: "confirmed",
  },
  {
    _id: "r005",
    displayId: "BKG-5005",
    userName: "Vikram Singh",
    date: "Jun 9, 2026",
    status: "rejected",
  },
];

function normalizeRecent(b) {
  const status = (b.status ?? b.bookingStatus ?? "pending").toLowerCase();
  return {
    ...b,
    displayId:
      b.displayId ??
      "BKG-" + (b._id?.slice(-4).toUpperCase() ?? "????"),
    userName:
      b.userName ?? b.user?.name ?? b.customerName ?? "—",
    date: b.date
      ? b.date
      : b.bookingDate
      ? new Date(b.bookingDate).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : b.createdAt
      ? new Date(b.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—",
    status,
  };
}

function RbBadge({ status }) {
  const label =
    status === "confirmed" ? "Confirmed" :
    status === "pending"   ? "Pending"   :
    status === "rejected"  ? "Rejected"  :
    status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`rb-badge rb-badge--${status}`}>
      {label}
    </span>
  );
}

export default function RecentBookings({
  limit = 5,
  showHeader = true,
}) {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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
        // Sort newest first and slice
        const sorted = [...list]
          .sort((a, b) => {
            const da = a.bookingDate ?? a.createdAt ?? 0;
            const db = b.bookingDate ?? b.createdAt ?? 0;
            return new Date(db) - new Date(da);
          })
          .slice(0, limit);
        setBookings(sorted.map(normalizeRecent));
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
          <h2 className="rb-card-title">Recent Platform Bookings</h2>
          <a
            href="#"
            className="rb-view-all"
            onClick={(e) => {
              e.preventDefault();
              navigate("/admin/bookings");
            }}
            aria-label="View all bookings"
          >
            View all →
          </a>
        </div>
      )}

      {loading ? (
        <div className="rb-spinner" aria-label="Loading bookings" />
      ) : bookings.length === 0 ? (
        <p className="rb-empty">No recent bookings found.</p>
      ) : (
        <table className="rb-table" aria-label="Recent bookings">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>User</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((bk) => (
              <tr key={bk._id}>
                <td className="rb-td-id">{bk.displayId}</td>
                <td className="rb-td-user">{bk.userName}</td>
                <td className="rb-td-date">{bk.date}</td>
                <td>
                  <RbBadge status={bk.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
