// TurfApprovals.jsx
// API routes:
//   GET   /turfs/pending        → pending turfs (admin)
//   GET   /turfs                → all turfs
//   Falls back to mock data if backend is unreachable / returns 401

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { MOCK_TURFS } from "../../data/mockTurfs";
import "../../assets/styles/turfApprovals.css";

const PAGE_SIZE = 8;
const ROW_HEIGHT = 52; // px — must match ta-table td padding in CSS

// ── Normalize raw API turf → component shape ─────────────────────────────────
function normalizeTurf(t) {
  return {
    ...t,
    displayId: t.displayId ?? ("TRF-" + (t._id?.slice(-4).toUpperCase() ?? "????")),
    vendor:    t.ownerName  ?? t.vendor ?? "—",
    city:      t.city       ?? t.location?.split(",").pop()?.trim() ?? "—",
    date:      t.createdAt
      ? new Date(t.createdAt).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        })
      : "—",
    approvalStatus: (t.approvalStatus ?? "pending").toLowerCase(),
  };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, iconClass, variant }) {
  return (
    <div className={`ta-stat-card ta-stat-card--${variant}`}>
      <div>
        <p className="ta-stat-card__label">{label}</p>
        <p className="ta-stat-card__value">{value ?? "—"}</p>
      </div>
      <div className={`ta-stat-card__icon ta-stat-card__icon--${variant}`}>
        <i className={`bi ${iconClass}`} aria-hidden="true" />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`ta-badge ta-badge--${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function Toast({ toasts, remove }) {
  const ICON = {
    approved: "bi-check-circle-fill",
    rejected: "bi-x-circle-fill",
    error:    "bi-exclamation-circle-fill",
    info:     "bi-info-circle-fill",
  };
  return (
    <div className="ta-toast-bar" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`ta-toast ta-toast--${t.type}`}
          onClick={() => remove(t.id)}
          role="alert"
        >
          <i className={`bi ${ICON[t.type] ?? ICON.info}`} aria-hidden="true" />
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TurfApprovals() {
  const navigate = useNavigate();

  const [turfs,   setTurfs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [usingMock, setUsingMock] = useState(false);

  // filters
  const [search,       setSearch]       = useState("");
  const [cityFilter,   setCityFilter]   = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page,         setPage]         = useState(1);

  // toasts
  const [toasts,  setToasts]  = useState([]);
  const toastId = useRef(0);

  function addToast(msg, type = "info") {
    const id = ++toastId.current;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }

  // ── Load from API, fallback to mock ─────────────────────────────────────────
  useEffect(() => {
    const ctrl = new AbortController();

    async function loadTurfs() {
      setLoading(true);
      setError(null);

      try {
        const [pendingRes, allRes] = await Promise.all([
          axiosInstance.get("/turfs/pending", { signal: ctrl.signal }),
          axiosInstance.get("/turfs",          { signal: ctrl.signal }),
        ]);

        const combined = [
          ...(Array.isArray(pendingRes.data) ? pendingRes.data : []),
          ...(Array.isArray(allRes.data)     ? allRes.data     : []),
        ];
        const unique = combined.filter(
          (t, i, arr) => arr.findIndex((x) => x._id === t._id) === i
        );
        setTurfs(unique.map(normalizeTurf));
        setUsingMock(false);
      } catch (err) {
        if (err?.name === "CanceledError") return;
        // ── Backend unreachable or 401 → use mock data ──
        console.warn("[TurfApprovals] Backend unavailable — using mock data.");
        setTurfs(MOCK_TURFS.map(normalizeTurf));
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    }

    loadTurfs();
    return () => ctrl.abort();
  }, []);

  // ── Derived state ──────────────────────────────────────────────────────────
  const cities = ["All", ...Array.from(new Set(turfs.map((t) => t.city))).sort()];

  const filtered = turfs.filter((t) => {
    const q   = search.toLowerCase();
    const ms  = !q || t.name.toLowerCase().includes(q) || t.vendor.toLowerCase().includes(q);
    const mc  = cityFilter   === "All" || t.city === cityFilter;
    const mst = statusFilter === "All" || t.approvalStatus === statusFilter.toLowerCase();
    return ms && mc && mst;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    pending:  turfs.filter((t) => t.approvalStatus === "pending").length,
    approved: turfs.filter((t) => t.approvalStatus === "approved").length,
    rejected: turfs.filter((t) => t.approvalStatus === "rejected").length,
  };

  function resetFilters() {
    setSearch(""); setCityFilter("All"); setStatusFilter("All"); setPage(1);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ta-page">
      <Toast toasts={toasts} remove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      {/* Mock data banner */}
      {usingMock && (
        <div style={{
          background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 8,
          padding: "8px 14px", fontSize: 12, color: "#7c5800", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <i className="bi bi-exclamation-triangle" />
          Backend not connected — showing demo data. Connect your server to see live turfs.
        </div>
      )}

      {/* Page title */}
      <h1 className="ta-page-title">Turf Approvals</h1>

      {/* Stat cards */}
      <div className="ta-stat-grid">
        <StatCard label="Pending approvals" value={counts.pending}  iconClass="bi-clock"            variant="pending"  />
        <StatCard label="Approved turfs"    value={counts.approved} iconClass="bi-check-circle-fill" variant="approved" />
        <StatCard label="Rejected turfs"    value={counts.rejected} iconClass="bi-x-circle"          variant="rejected" />
      </div>

      {/* Toolbar */}
      <div className="ta-toolbar">
        <div className="ta-search-box">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            type="text"
            className="ta-search-input"
            placeholder="Search turf by name"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search turfs"
          />
        </div>

        <select
          className="ta-select"
          value={cityFilter}
          onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
          aria-label="Filter by location"
        >
          {cities.map((c) => (
            <option key={c} value={c}>{c === "All" ? "Location" : c}</option>
          ))}
        </select>

        <select
          className="ta-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          aria-label="Filter by status"
        >
          {["All", "pending", "approved", "rejected"].map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "Status all" : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <button className="ta-reset-btn" onClick={resetFilters}>
          <i className="bi bi-arrow-clockwise" aria-hidden="true" />
          Reset Filter
        </button>
      </div>

      {/* Table */}
      <div className="ta-table-wrap">
        <table className="ta-table" aria-label="Turf approvals">
          <thead>
            <tr>
              <th>Turf ID</th>
              <th>Turf Name</th>
              <th>Vendor</th>
              <th>City</th>
              <th>Submitted Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                <tr className="ta-state-row">
                  <td colSpan={7}><span className="ta-spinner" /></td>
                </tr>
                {Array.from({ length: PAGE_SIZE - 1 }).map((_, i) => (
                  <tr key={`ghost-load-${i}`} className="ta-ghost-row"><td colSpan={7} /></tr>
                ))}
              </>
            ) : paginated.length === 0 ? (
              <>
                <tr className="ta-state-row">
                  <td colSpan={7}>
                    <i className="bi bi-search" />
                    <span>No turfs match your filters.</span>
                  </td>
                </tr>
                {Array.from({ length: PAGE_SIZE - 1 }).map((_, i) => (
                  <tr key={`ghost-empty-${i}`} className="ta-ghost-row"><td colSpan={7} /></tr>
                ))}
              </>
            ) : (
              <>
                {paginated.map((turf) => (
                  <tr key={turf._id}>
                    <td className="ta-td-id">{turf.displayId}</td>
                    <td className="ta-td-name">{turf.name}</td>
                    <td className="ta-td-vendor">{turf.vendor}</td>
                    <td>{turf.city}</td>
                    <td className="ta-td-date">{turf.date}</td>
                    <td><StatusBadge status={turf.approvalStatus} /></td>
                    <td>
                      {turf.approvalStatus === "pending" ? (
                        <button
                          className="ta-action-btn ta-action-btn--review"
                          onClick={() => navigate(`/admin/turf/${turf._id}`)}
                        >
                          Review
                        </button>
                      ) : (
                        <button
                          className="ta-action-btn ta-action-btn--view"
                          onClick={() => navigate(`/admin/turf/${turf._id}`)}
                        >
                          View Details
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {Array.from({ length: PAGE_SIZE - paginated.length }).map((_, i) => (
                  <tr key={`ghost-${i}`} className="ta-ghost-row"><td colSpan={7} /></tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="ta-table-footer">
        <span className="ta-showing-label">
          Showing {filtered.length} of {turfs.length} turf{turfs.length !== 1 ? "s" : ""}
        </span>
        <div className="ta-pagination">
          <button
            className="ta-page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`ta-page-btn${p === page ? " ta-page-btn--active" : ""}`}
              onClick={() => setPage(p)}
              aria-current={p === page ? "page" : undefined}
            >
              {p}
            </button>
          ))}
          <button
            className="ta-page-btn"
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