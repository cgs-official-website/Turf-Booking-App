// Bookings.jsx
// API routes used:
//   GET /bookings/admin/all  → ADMIN — ALL bookings

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import "../../assets/styles/bookings.css";

const PAGE_SIZE = 8;

/* ── Mock data ── */
const MOCK_BOOKINGS = [
  {
    _id: "bk001",
    displayId: "BKST-1001",
    turfName: "Green Garden",
    turfLocation: "Perundurai",
    turfImage: null,
    userName: "Rahul Sharma",
    date: "Jun 5, 2026",
    status: "confirmed",
  },
  {
    _id: "bk002",
    displayId: "BKST-1001",
    turfName: "Green Garden",
    turfLocation: "Perundurai",
    turfImage: null,
    userName: "Rahul Sharma",
    date: "Jun 5, 2026",
    status: "pending",
  },
  {
    _id: "bk003",
    displayId: "BKST-1001",
    turfName: "Green Garden",
    turfLocation: "Perundurai",
    turfImage: null,
    userName: "Rahul Sharma",
    date: "Jun 5, 2026",
    status: "rejected",
  },
  {
    _id: "bk004",
    displayId: "BKST-1001",
    turfName: "Green Garden",
    turfLocation: "Perundurai",
    turfImage: null,
    userName: "Rahul Sharma",
    date: "Jun 5, 2026",
    status: "confirmed",
  },
  {
    _id: "bk005",
    displayId: "BKST-1001",
    turfName: "Green Garden",
    turfLocation: "Perundurai",
    turfImage: null,
    userName: "Rahul Sharma",
    date: "Jun 5, 2026",
    status: "confirmed",
  },
  {
    _id: "bk006",
    displayId: "BKST-1001",
    turfName: "Green Garden",
    turfLocation: "Perundurai",
    turfImage: null,
    userName: "Rahul Sharma",
    date: "Jun 5, 2026",
    status: "confirmed",
  },
  {
    _id: "bk007",
    displayId: "BKST-1002",
    turfName: "Sports Hub",
    turfLocation: "Coimbatore",
    turfImage: null,
    userName: "Priya Patel",
    date: "Jun 6, 2026",
    status: "confirmed",
  },
  {
    _id: "bk008",
    displayId: "BKST-1002",
    turfName: "Sports Hub",
    turfLocation: "Coimbatore",
    turfImage: null,
    userName: "Amit Kumar",
    date: "Jun 7, 2026",
    status: "pending",
  },
  {
    _id: "bk009",
    displayId: "BKST-1003",
    turfName: "Kick Arena",
    turfLocation: "Chennai",
    turfImage: null,
    userName: "Sneha Reddy",
    date: "Jun 8, 2026",
    status: "confirmed",
  },
  {
    _id: "bk010",
    displayId: "BKST-1003",
    turfName: "Kick Arena",
    turfLocation: "Chennai",
    turfImage: null,
    userName: "Vikram Singh",
    date: "Jun 9, 2026",
    status: "rejected",
  },
];

/* ── Normalise API record ── */
function normalizeBooking(b) {
  const status = (b.status ?? b.bookingStatus ?? "pending").toLowerCase();
  return {
    ...b,
    displayId:
      b.displayId ?? "BKST-" + (b._id?.slice(-4).toUpperCase() ?? "????"),
    turfName: b.turfName ?? b.turf?.name ?? "—",
    turfLocation:
      b.turfLocation ??
      b.turf?.city ??
      (b.turf?.location ? b.turf.location.split(",").pop().trim() : "—"),
    turfImage: b.turfImage ?? b.turf?.images?.[0] ?? null,
    userName: b.userName ?? b.user?.name ?? b.customerName ?? "—",
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

/* ── Sub-components ── */
function StatusBadge({ status }) {
  const label =
    status === "confirmed"
      ? "Confirmed"
      : status === "pending"
        ? "Pending"
        : status === "rejected"
          ? "Rejected"
          : status === "expired"
            ? "Expired"
            : status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`bk-badge bk-badge--${status}`}>{label}</span>;
}

function TurfImage({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="bk-td-img-placeholder" aria-hidden="true">
        <i className="bi bi-image" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="bk-td-img"
      onError={() => setErr(true)}
    />
  );
}

/* ── Main component ── */
export default function Bookings() {
  const navigate = useNavigate();
  const location = useLocation();
  const vendorId = new URLSearchParams(location.search).get("vendorId");

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  /* ── Fetch ── */
  useEffect(() => {
    const ctrl = new AbortController();

    async function load() {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/admin/login");
        return;
      }

      try {
        const url = vendorId ? `/admin/bookings?vendorId=${vendorId}` : "/bookings/admin/all";
        const { data } = await axiosInstance.get(url, {
          signal: ctrl.signal,
        });
        if (ctrl.signal.aborted) return;
        const list = Array.isArray(data) ? data : [];
        setBookings(list.map(normalizeBooking));
        setUsingMock(false);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        console.warn(
          "[Bookings] Backend unavailable — using mock data.",
          err?.message,
        );
        setBookings(MOCK_BOOKINGS.map(normalizeBooking));
        setUsingMock(true);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => ctrl.abort();
  }, [navigate, vendorId]);

  /* ── Derived values ── */
  const locations = [
    "All",
    ...Array.from(
      new Set(bookings.map((b) => b.turfLocation).filter(Boolean)),
    ).sort(),
  ];

  const filtered = bookings.filter((b) => {
    const q = search.toLowerCase();
    const ms =
      !q ||
      b.turfName?.toLowerCase().includes(q) ||
      b.userName?.toLowerCase().includes(q);
    const ml = locationFilter === "All" || b.turfLocation === locationFilter;
    const mst = statusFilter === "All" || b.status === statusFilter;
    return ms && ml && mst;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() {
    setSearch("");
    setLocationFilter("All");
    setStatusFilter("All");
    setPage(1);
  }

  /* ── Render ── */
  return (
    <div className="bk-page">
      {/* Mock banner */}
      {usingMock && (
        <div className="bk-mock-banner">
          <i className="bi bi-exclamation-triangle" />
          Backend not connected — showing demo data.
        </div>
      )}

      {/* Title */}
      <h1 className="bk-page-title">Bookings</h1>

      {/* Toolbar */}
      <div className="bk-toolbar">
        <div className="bk-search-box">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            id="bk-search"
            type="text"
            className="bk-search-input"
            placeholder="Search turf by name"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            aria-label="Search bookings"
          />
        </div>

        <select
          id="bk-location-filter"
          className="bk-select"
          value={locationFilter}
          onChange={(e) => {
            setLocationFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by location"
        >
          {locations.map((l) => (
            <option key={l} value={l}>
              {l === "All" ? "Location" : l}
            </option>
          ))}
        </select>

        <select
          id="bk-status-filter"
          className="bk-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
        >
          {["All", "confirmed", "pending", "rejected", "expired"].map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "Status" : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <button
          id="bk-reset-btn"
          className="bk-reset-btn"
          onClick={resetFilters}
        >
          <i className="bi bi-arrow-clockwise" aria-hidden="true" />
          Reset Filter
        </button>
      </div>

      {/* Table */}
      <div className="bk-table-wrap">
        <table className="bk-table" aria-label="All bookings">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Turf Image</th>
              <th>Turf Name</th>
              <th>Turf Location</th>
              <th>User Name</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="bk-state-row">
                <td colSpan={7}>
                  <span className="bk-spinner" />
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr className="bk-state-row">
                <td colSpan={7}>
                  <i className="bi bi-search" />
                  <span>No bookings found.</span>
                </td>
              </tr>
            ) : (
              <>
                {paginated.map((bk) => (
                  <tr key={bk._id}>
                    <td className="bk-td-id">{bk.displayId}</td>
                    <td>
                      <TurfImage src={bk.turfImage} alt={bk.turfName} />
                    </td>
                    <td className="bk-td-name">{bk.turfName}</td>
                    <td className="bk-td-location">{bk.turfLocation}</td>
                    <td className="bk-td-user">{bk.userName}</td>
                    <td className="bk-td-date">{bk.date}</td>
                    <td>
                      <StatusBadge status={bk.status} />
                    </td>
                  </tr>
                ))}
                {Array.from({ length: PAGE_SIZE - paginated.length }).map(
                  (_, i) => (
                    <tr key={`ghost-${i}`} className="bk-ghost-row">
                      <td colSpan={7} />
                    </tr>
                  ),
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="bk-table-footer">
        <span className="bk-showing-label">
          Showing {filtered.length} of {bookings.length} turf
          {bookings.length !== 1 ? "s" : ""}
        </span>
        <div className="bk-pagination">
          <button
            className="bk-page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`bk-page-btn${p === page ? " bk-page-btn--active" : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="bk-page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
