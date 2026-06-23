// TurfApprovals.jsx
// API routes used:
//   GET /turfs/admin/all  → ADMIN — ALL turfs (pending + approved + rejected)
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { MOCK_TURFS } from "../../data/mockTurfs";
import "../../assets/styles/turfApprovals.css";
const PAGE_SIZE = 8;
function normalizeTurf(t) {
  const vendor =
    t.owner?.name ??
    t.ownerName   ??
    t.vendor      ??
    "—";
  const city =
    t.city ??
    (t.location ? t.location.split(",").pop().trim() : "—");
  return {
    ...t,
    displayId:      t.displayId ?? "TRF-" + (t._id?.slice(-4).toUpperCase() ?? "????"),
    vendor,
    city,
    date: t.createdAt
      ? new Date(t.createdAt).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        })
      : "—",
    approvalStatus: (t.approvalStatus ?? "pending").toLowerCase(),
  };
}
function StatCard({ label, value, iconClass, variant }) {
  return (
    <div className={`ta-stat-card ta-stat-card--${variant}`}>
      <div>
        <p className="ta-stat-card__label">{label}</p>
        <p className="ta-stat-card__value">{value ?? 0}</p>
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
        <div key={t.id} className={`ta-toast ta-toast--${t.type}`}
          onClick={() => remove(t.id)} role="alert">
          <i className={`bi ${ICON[t.type] ?? ICON.info}`} aria-hidden="true" />
          {t.msg}
        </div>
      ))}
    </div>
  );
}
export default function TurfApprovals() {
  const navigate = useNavigate();
  const [turfs,     setTurfs]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,       setSearch]       = useState("");
  const [cityFilter,   setCityFilter]   = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page,         setPage]         = useState(1);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);
  function addToast(msg, type = "info") {
    const id = ++toastId.current;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }
  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { navigate("/admin/login"); return; }
      try {
        // Single call — returns ALL turfs regardless of approvalStatus
        const { data } = await axiosInstance.get("/turfs/admin/all", {
          signal: ctrl.signal,
        });
        if (ctrl.signal.aborted) return;
        const list = Array.isArray(data) ? data : [];
        setTurfs(list.map(normalizeTurf));
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        console.error("[TurfApprovals] Backend unavailable:", err?.message);
        setTurfs([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => ctrl.abort();
  }, [navigate]);
  const cities = [
    "All",
    ...Array.from(new Set(turfs.map((t) => t.city).filter(Boolean))).sort(),
  ];
  const filtered = turfs.filter((t) => {
    const q   = search.toLowerCase();
    const ms  = !q || t.name?.toLowerCase().includes(q) || t.vendor?.toLowerCase().includes(q);
    const mc  = cityFilter   === "All" || t.city          === cityFilter;
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
  function goToDetail(turf) {
    navigate(`/admin/turf-approvals/${turf._id}`);
  }
  return (
    <div className="ta-page">
      <Toast toasts={toasts} remove={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />

      <h1 className="ta-page-title">Turf Approvals</h1>
      <div className="ta-stat-grid">
        <StatCard label="Pending approvals" value={counts.pending}  iconClass="bi-clock"            variant="pending"  />
        <StatCard label="Approved turfs"    value={counts.approved} iconClass="bi-check-circle-fill" variant="approved" />
        <StatCard label="Rejected turfs"    value={counts.rejected} iconClass="bi-x-circle"         variant="rejected" />
      </div>
      <div className="ta-list-container">
      <div className="ta-toolbar">
        <div className="ta-search-box">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            type="text"
            className="ta-search-input"
            placeholder="Search by turf name or vendor"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search turfs"
          />
        </div>
        <select className="ta-select" value={cityFilter}
          onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
          aria-label="Filter by city">
          {cities.map((c) => (
            <option key={c} value={c}>{c === "All" ? "All cities" : c}</option>
          ))}
        </select>
        <select className="ta-select" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          aria-label="Filter by status">
          {["All", "pending", "approved", "rejected"].map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All status" : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <button className="ta-reset-btn" onClick={resetFilters}>
          <i className="bi bi-arrow-clockwise" aria-hidden="true" /> Reset Filter
        </button>
      </div>
        <div className="ta-table-wrap">
        <table className="ta-table" aria-label="All turfs">
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
            ) : paginated.length === 0 ? (
              <tr className="ta-state-row">
                <td colSpan={7}>
                  <i className="bi bi-search" />
                  <span>No turfs found.</span>
                </td>
              </tr>
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
                      <button
                        className={
                          turf.approvalStatus === "pending"
                            ? "ta-action-btn ta-action-btn--review"
                            : "ta-action-btn ta-action-btn--view"
                        }
                        onClick={() => goToDetail(turf)}
                      >
                        {turf.approvalStatus === "pending" ? "Review" : "View Details"}
                      </button>
                    </td>
                  </tr>
                ))}
                {Array.from({ length: PAGE_SIZE - paginated.length }).map((_, i) => (
                  <tr key={`ghost-${i}`} className="ta-ghost-row">
                    <td colSpan={7} />
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
      </div>
      <div className="ta-table-footer">
        <span className="ta-showing-label">
          Showing {paginated.length} of {filtered.length} turf{filtered.length !== 1 ? "s" : ""}
        </span>
        <div className="ta-pagination">
          <button className="ta-page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            <i className="bi bi-chevron-left" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p}
              className={`ta-page-btn${p === page ? " ta-page-btn--active" : ""}`}
              onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
          <button className="ta-page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            <i className="bi bi-chevron-right" />
          </button>
        </div>
      </div>
    </div>
  );
}