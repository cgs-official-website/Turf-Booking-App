// TurfApprovals.jsx
// API routes:
//   GET   /turfs/pending        → pending turfs (admin)
//   GET   /turfs                → all turfs (approved + rejected counts)
//   PATCH /turfs/:id/approve    → approve
//   PATCH /turfs/:id/reject     → reject

import { useState, useEffect, useRef } from "react";
import "../../assets/styles/turfApprovals.css";

const BASE_URL = "http://localhost:5000";
const PAGE_SIZE = 5;

// ── API helper ────────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const { signal, ...rest } = options;

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminToken") ?? ""}`,
        ...rest.headers,
      },
      ...rest,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    if (err?.name !== "AbortError") {
      console.warn(`[TurfApprovals] ${path} failed:`, err.message);
    }
    return null;
  }
}

// ── Normalize raw API turf → component shape ──────────────────────────────────
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

function ReviewModal({ turf, onClose, onApprove, onReject, loading }) {
  if (!turf) return null;
  const isPending = turf.approvalStatus === "pending";

  const rows = [
    ["Vendor",        turf.vendor],
    ["Location",      turf.location ?? turf.city],
    ["Sport",         turf.sportType ? turf.sportType.charAt(0).toUpperCase() + turf.sportType.slice(1) : "—"],
    ["Base price",    turf.pricePerHour?.basePrice    != null ? `₹${turf.pricePerHour.basePrice}/hr`    : "—"],
    ["Evening price", turf.pricePerHour?.eveningPrice != null ? `₹${turf.pricePerHour.eveningPrice}/hr` : "—"],
    ["Weekend price", turf.pricePerHour?.weekendPrice != null ? `₹${turf.pricePerHour.weekendPrice}/hr` : "—"],
    ["Submitted",     turf.date],
  ];

  return (
    <div
      className="ta-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ta-modal-box" role="dialog" aria-modal="true" aria-label={`Review ${turf.name}`}>
        <div className="ta-modal-header">
          <div>
            <p className="ta-modal-title">{turf.name}</p>
            <p className="ta-modal-subtitle">{turf.displayId} · {turf.city}</p>
          </div>
          <button className="ta-modal-close" onClick={onClose} aria-label="Close">
            <i className="bi bi-x" />
          </button>
        </div>

        <div className="ta-modal-body">
          {rows.map(([label, value]) => (
            <div className="ta-modal-row" key={label}>
              <span className="ta-modal-row__label">{label}</span>
              <span className="ta-modal-row__value">{value}</span>
            </div>
          ))}
          <div className="ta-modal-row">
            <span className="ta-modal-row__label">Status</span>
            <span className="ta-modal-row__value">
              <StatusBadge status={turf.approvalStatus} />
            </span>
          </div>
        </div>

        <div className="ta-modal-actions">
          {isPending ? (
            <>
              <button
                className="ta-modal-btn ta-modal-btn--approve"
                onClick={() => onApprove(turf._id)}
                disabled={loading}
              >
                {loading
                  ? <span className="ta-spinner" />
                  : <i className="bi bi-check-lg" />}
                Approve
              </button>
              <button
                className="ta-modal-btn ta-modal-btn--reject"
                onClick={() => onReject(turf._id)}
                disabled={loading}
              >
                <i className="bi bi-x-lg" /> Reject
              </button>
            </>
          ) : (
            <button className="ta-modal-btn ta-modal-btn--close" onClick={onClose}>
              <i className="bi bi-arrow-left" /> Back
            </button>
          )}
        </div>
      </div>
    </div>
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
  const [turfs,         setTurfs]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTurf,  setSelectedTurf]  = useState(null);

  // filters
  const [search,       setSearch]       = useState("");
  const [dateFilter,   setDateFilter]   = useState("All");
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

  // ── Load from DB ────────────────────────────────────────────────────────────
  async function loadTurfs(signal) {
    setLoading(true);
    setError(null);

    const [pending, all] = await Promise.all([
      apiFetch("/turfs/pending", { signal }),
      apiFetch("/turfs",         { signal }),
    ]);

    if (signal?.aborted) return;

    if (!pending && !all) {
      setError("Could not reach the server. Check that the backend is running.");
      setLoading(false);
      return;
    }

    const combined = [
      ...(Array.isArray(pending) ? pending : []),
      ...(Array.isArray(all)     ? all     : []),
    ];
    const unique = combined.filter(
      (t, i, arr) => arr.findIndex((x) => x._id === t._id) === i
    );
    setTurfs(unique.map(normalizeTurf));
    setLoading(false);
  }

  useEffect(() => {
    const ctrl = new AbortController();
    loadTurfs(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  // ── Approve  PATCH /turfs/:id/approve ────────────────────────────────────
  async function handleApprove(id) {
    setActionLoading(true);
    const res = await apiFetch(`/turfs/${id}/approve`, { method: "PATCH" });
    if (res) {
      setTurfs((p) => p.map((t) => t._id === id ? { ...t, approvalStatus: "approved" } : t));
      addToast("Turf approved successfully", "approved");
    } else {
      addToast("Failed to approve turf", "error");
    }
    setSelectedTurf(null);
    setActionLoading(false);
  }

  // ── Reject   PATCH /turfs/:id/reject ─────────────────────────────────────
  async function handleReject(id) {
    setActionLoading(true);
    const res = await apiFetch(`/turfs/${id}/reject`, { method: "PATCH" });
    if (res) {
      setTurfs((p) => p.map((t) => t._id === id ? { ...t, approvalStatus: "rejected" } : t));
      addToast("Turf rejected", "rejected");
    } else {
      addToast("Failed to reject turf", "error");
    }
    setSelectedTurf(null);
    setActionLoading(false);
  }

  // ── Derived state ──────────────────────────────────────────────────────────
  const cities = ["All", ...Array.from(new Set(turfs.map((t) => t.city))).sort()];
  const dates  = ["All", ...Array.from(new Set(turfs.map((t) => t.date))).sort()];

  const filtered = turfs.filter((t) => {
    const q  = search.toLowerCase();
    const ms = !q || t.name.toLowerCase().includes(q) || t.vendor.toLowerCase().includes(q);
    const md = dateFilter   === "All" || t.date === dateFilter;
    const mc = cityFilter   === "All" || t.city === cityFilter;
    const mst = statusFilter === "All" || t.approvalStatus === statusFilter.toLowerCase();
    return ms && md && mc && mst;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    pending:  turfs.filter((t) => t.approvalStatus === "pending").length,
    approved: turfs.filter((t) => t.approvalStatus === "approved").length,
    rejected: turfs.filter((t) => t.approvalStatus === "rejected").length,
  };

  function resetFilters() {
    setSearch(""); setDateFilter("All"); setCityFilter("All"); setStatusFilter("All"); setPage(1);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="ta-page">
      <Toast toasts={toasts} remove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      {selectedTurf && (
        <ReviewModal
          turf={selectedTurf}
          onClose={() => setSelectedTurf(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={actionLoading}
        />
      )}

      {/* Page title */}
      <h1 className="ta-page-title">Turf Approvals</h1>

      {/* Stat cards */}
      <div className="ta-stat-grid">
        <StatCard label="Pending approvals" value={counts.pending}  iconClass="bi-clock"         variant="pending"  />
        <StatCard label="Approved turfs"    value={counts.approved} iconClass="bi-check-circle-fill" variant="approved" />
        <StatCard label="Rejected turfs"    value={counts.rejected} iconClass="bi-x-circle"  variant="rejected" />
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

        {/* <select
          className="ta-select"
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
          aria-label="Filter by date"
        >
          {dates.map((d) => (
            <option key={d} value={d}>{d === "All" ? "Date" : d}</option>
          ))}
        </select> */}

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
              <tr className="ta-state-row">
                <td colSpan={7}><span className="ta-spinner" /></td>
              </tr>
            ) : error ? (
              <tr className="ta-state-row">
                <td colSpan={7}>
                  <i className="bi bi-wifi-off" />
                  <span>{error}</span>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr className="ta-state-row">
                <td colSpan={7}>
                  <i className="bi bi-search" />
                  <span>No turfs match your filters.</span>
                </td>
              </tr>
            ) : paginated.map((turf) => (
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
                      onClick={() => setSelectedTurf(turf)}
                    >
                      Review
                    </button>
                  ) : (
                    <button
                      className="ta-action-btn ta-action-btn--view"
                      onClick={() => setSelectedTurf(turf)}
                    >
                      View Details
                    </button>
                  )}
                </td>
              </tr>
            ))}
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