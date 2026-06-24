// Bookings.jsx
// API routes used:
//   GET /bookings/admin/all  → ADMIN — ALL bookings

import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import "../../assets/styles/bookings.css";

const PAGE_SIZE = 8;


/* ── Normalise API record ── */
function normalizeBooking(b, turfVendorMap = {}) {
  const status = (b.status ?? b.bookingStatus ?? "pending").toLowerCase();
  
  const turfName = b.turfName ?? b.turf?.name ?? "—";
  const turfId = b.turf?._id ?? b.turfId ?? null;
  
  let vendorName = turfVendorMap[turfId] || turfVendorMap[turfName];
  if (!vendorName || vendorName === "—") {
    vendorName =
      b.vendorName ??
      b.vendor?.name ??
      b.turf?.vendor?.name ??
      b.turf?.vendorName ??
      b.turf?.owner?.name ??
      b.turf?.ownerName ??
      b.turf?.vendor ??
      "—";
  }

  return {
    ...b,
    displayId:
      b.displayId ?? "BKST-" + (b._id?.slice(-4).toUpperCase() ?? "????"),
    turfName,
    turfLocation:
      b.turfLocation ??
      b.turf?.city ??
      (b.turf?.location ? b.turf.location.split(",").pop().trim() : "—"),
    vendorName,
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


export default function Bookings() {
  const navigate = useNavigate();
  const location = useLocation();
  const vendorId = new URLSearchParams(location.search).get("vendorId");

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

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
        const response = await axiosInstance.get(url, {
          signal: ctrl.signal,
        });
        if (ctrl.signal.aborted) return;

        console.log("API Response:", response);
        console.log("Bookings:", response.data);

        // Fetch turfs list to construct vendor map
        let turfsList = [];
        try {
          const turfsRes = await axiosInstance.get("/turfs", { signal: ctrl.signal });
          const turfsData = turfsRes.data;
          if (turfsData?.data?.turfs) {
            turfsList = turfsData.data.turfs;
          } else if (turfsData?.turfs) {
            turfsList = turfsData.turfs;
          } else if (turfsData?.data) {
            turfsList = turfsData.data;
          } else if (Array.isArray(turfsData)) {
            turfsList = turfsData;
          }
        } catch (turfErr) {
          console.error("Failed to fetch turfs for vendor map:", turfErr);
        }

        const turfVendorMap = {};
        turfsList.forEach((t) => {
          const vName = t.owner?.name ?? t.ownerName ?? t.vendor ?? "—";
          if (t.name) turfVendorMap[t.name] = vName;
          if (t._id) turfVendorMap[t._id] = vName;
        });

        const list = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.bookings || response.data?.data || []);

        setBookings(list.map((b) => normalizeBooking(b, turfVendorMap)));
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        console.error("[Bookings] Backend unavailable:", err?.message);
        setBookings([]);
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
      b.vendorName?.toLowerCase().includes(q);
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


      {/* Title */}
      <h1 className="bk-page-title">Bookings</h1>

      {/* List Container wrapping Toolbar and Table */}
      <div className="bk-list-container">
        {/* Toolbar */}
        <div className="bk-toolbar">
        <div className="bk-search-box">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            id="bk-search"
            type="text"
            className="bk-search-input"
            placeholder="Search turf name or vendor name"
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

        <div className="bk-table-wrap">
        <table className="bk-table" aria-label="All bookings">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Vendor Name</th>
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
                    <td className="bk-td-vendor">{bk.vendorName}</td>
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
      </div>

      {/* Footer / Pagination */}
      <div className="bk-table-footer">
        <span className="bk-showing-label">
          Showing {paginated.length} of {filtered.length} booking
          {filtered.length !== 1 ? "s" : ""}
        </span>
        <div className="bk-pagination">
          <button
            className="bk-page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <i className="bi bi-chevron-left" />
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
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      </div>
    </div>
  );
}
