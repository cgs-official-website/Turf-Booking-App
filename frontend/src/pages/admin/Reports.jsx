// Reports.jsx — Admin Reports page
// API:
//   GET    /reports/admin/all        → ADMIN — all reports
//   GET    /reports/admin/:id        → ADMIN — single report
//   PATCH  /reports/admin/:id/resolve → ADMIN — resolve
//   DELETE /reports/admin/:id        → ADMIN — delete

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import "../../assets/styles/reports.css";
import "../../assets/styles/reportDetails.css";

const PAGE_SIZE = 8;



/* ── Normalise ────────────────────────────────────────────────────────────── */
function normalizeReport(r) {
  const vendor = r.vendor ?? {};
  const turf = r.turf ?? {};
  return {
    ...r,
    reportId: r.reportId ?? "#RP-" + (r._id?.slice(-4) ?? "????"),
    vendorName: vendor.name ?? r.vendorName ?? "—",
    vendorEmail: vendor.email ?? r.vendorEmail ?? "—",
    turfName: turf.name ?? r.turfName ?? "—",
    turfLocation: turf.location ?? r.location ?? "—",
    turfImage: turf.mainImage ?? r.turfImage ?? null,
    category: r.category ?? r.type ?? "—",
    date: r.createdAt
      ? new Date(r.createdAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : (r.date ?? "—"),
    status: (r.status ?? "pending").toLowerCase().replace(/ /g, "-"),
    description: r.description ?? "",
    resolveNote: r.resolveNote ?? "",
  };
}

/* ── Avatar ───────────────────────────────────────────────────────────────── */
function VendorAvatar({ name, src }) {
  const [err, setErr] = useState(false);
  const initials =
    name
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";
  if (!src || err)
    return <div className="rp-vendor-avatar-placeholder">{initials}</div>;
  return (
    <img
      src={src}
      alt={name}
      className="rp-vendor-avatar"
      onError={() => setErr(true)}
    />
  );
}

/* ── Status badge ─────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    pending: "Pending",
    "under-review": "Under Review",
    solved: "Solved",
  };
  return (
    <span className={`rp-badge rp-badge--${status}`}>
      {map[status] ?? status}
    </span>
  );
}

/* ── Turf image ───────────────────────────────────────────────────────────── */
function TurfImg({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="rp-modal-turf-img-placeholder">
        <i className="bi bi-image" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="rp-modal-turf-img"
      onError={() => setErr(true)}
    />
  );
}

/* ── Report Detail Modal ──────────────────────────────────────────────────── */
function ReportDetailModal({ report, onClose, onResolved }) {
  const [note, setNote] = useState(report.resolveNote ?? "");
  const [status, setStatus] = useState(
    report.status === "solved" ? "solved" : "under-review",
  );
  const [sending, setSending] = useState(false);

  const isDone = report.status === "solved";

  async function handleSend() {
    if (!note.trim()) return;
    setSending(true);
    try {
      await axiosInstance.patch(`/reports/admin/${report._id}/resolve`, {
        resolveNote: note,
        status: "solved",
      });
      onResolved(report._id, note);
      onClose();
    } catch (err) {
      console.error(
        "[Reports] resolve failed:",
        err?.response?.data?.message ?? err.message,
      );
    } finally {
      setSending(false);
    }
  }

  const initials =
    report.vendorName
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "?";

  return (
    <div
      className="rp-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="rp-modal">
        {/* ── Header ── */}
        <div className="rp-modal-header">
          {/* <button className="rp-modal-back" onClick={onClose} aria-label="Go back">
            <i className="bi bi-arrow-left" />
          </button> */}
          <h1 className="rp-modal-title">Report Details</h1>
          <button className="rp-modal-close" onClick={onClose} aria-label="Close">
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="rp-modal-body">
          <p className="rp-modal-meta">
            Report ID: <strong>{report.reportId}</strong> &bull; {report.date}
          </p>

          {/* ── User (Vendor) Details ── */}
          <p className="rp-modal-section-label">USER DETAILS</p>
          <div className="rp-modal-user-card">
            <div className="rp-modal-user-avatar">{initials}</div>
            <div className="rp-modal-user-info">
              <p className="rp-modal-user-name">{report.vendorName}</p>
              <p className="rp-modal-user-email">{report.vendorEmail}</p>
            </div>
          </div>

          {/* ── Turf Information ── */}
          <p className="rp-modal-section-label">TURF INFORMATION</p>
          <div className="rp-modal-turf-card">
            <TurfImg src={report.turfImage} alt={report.turfName} />
            <div className="rp-modal-turf-info">
              <p className="rp-modal-turf-name">{report.turfName}</p>
              <p className="rp-modal-turf-loc">
                <i className="bi bi-geo-alt-fill" /> {report.turfLocation}
              </p>
            </div>
          </div>

          {/* ── Report Description ── */}
          <p className="rp-modal-section-label">REPORT DESCRIPTION</p>
          <div className="rp-modal-desc-card">
            <span className="rp-modal-category-tag">
              {report.category?.toUpperCase()}
            </span>
            <p className="rp-modal-desc-text">{report.description}</p>
          </div>

          {/* ── Resolve Queries ── */}
          <p className="rp-modal-section-label">RESOLVE QUERIES</p>
          <textarea
            className="rp-modal-textarea"
            rows={4}
            placeholder="Add a note for the internal team..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            disabled={isDone}
          />
        </div>

        {/* ── Footer ── */}
        {!isDone && (
          <div className="rp-modal-footer">
            <button
              className="rp-modal-btn rp-modal-btn--cancel"
              onClick={onClose}
              disabled={sending}
            >
              Cancel
            </button>
            <button
              className="rp-modal-btn rp-modal-btn--send"
              onClick={handleSend}
              disabled={sending || !note.trim()}
            >
              {sending ? <span className="rp-modal-spinner" /> : "Send"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}



/* ── Delete Confirm & Error Modals ─────────────────────────────────────────────────── */
function DeleteConfirmModal({ onConfirm, onClose }) {
  return (
    <div className="rp-modal-overlay">
      <div className="rp-modal" style={{maxWidth: '400px', textAlign: 'center', borderRadius: '16px', padding: '32px 28px 24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: 'none'}}>
        <div style={{width: '64px', height: '64px', borderRadius: '50%', background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px'}}>
          <i className="bi bi-trash3-fill"></i>
        </div>
        <h2 style={{fontSize: '22px', fontWeight: '700', color: '#111', margin: '0 0 10px'}}>Delete Report?</h2>
        <p style={{fontSize: '14.5px', color: '#555', lineHeight: '1.5', margin: '0 0 28px'}}>
          You're about to permanently delete this report. This action cannot be undone. Are you sure you want to proceed?
        </p>
        <div style={{display: 'flex', gap: '12px'}}>
          <button onClick={onClose} style={{flex: 1, height: '44px', borderRadius: '10px', border: '1px solid #e5e7eb', background: '#fff', color: '#374151', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.15s'}} onMouseOver={e=>e.target.style.background='#f9fafb'} onMouseOut={e=>e.target.style.background='#fff'}>Cancel</button>
          <button onClick={onConfirm} style={{flex: 1, height: '44px', borderRadius: '10px', border: 'none', background: '#ef4444', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.25)', transition: 'background 0.15s'}} onMouseOver={e=>e.target.style.background='#dc2626'} onMouseOut={e=>e.target.style.background='#ef4444'}>Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

function ErrorModal({ onClose }) {
  return (
    <div className="rp-modal-overlay">
      <div className="rp-modal" style={{maxWidth: '400px', textAlign: 'center', borderRadius: '16px', padding: '32px 28px 24px', boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: 'none'}}>
        <div style={{width: '64px', height: '64px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 20px'}}>
          <i className="bi bi-exclamation-circle-fill"></i>
        </div>
        <h2 style={{fontSize: '22px', fontWeight: '700', color: '#111', margin: '0 0 10px'}}>Action Not Allowed</h2>
        <p style={{fontSize: '14.5px', color: '#555', lineHeight: '1.5', margin: '0 0 28px'}}>
          Only reports with a <b>solved</b> status can be deleted. Please resolve this report first before attempting to delete it.
        </p>
        <button onClick={onClose} style={{width: '100%', height: '44px', borderRadius: '10px', border: 'none', background: '#f59e0b', color: '#fff', fontSize: '14px', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.25)', transition: 'background 0.15s'}} onMouseOver={e=>e.target.style.background='#d97706'} onMouseOut={e=>e.target.style.background='#f59e0b'}>Got it</button>
      </div>
    </div>
  );
}

/* ── Main component ───────────────────────────────────────────────────────── */
export default function Reports() {
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);


  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);

  const [selectedReport, setSelectedReport] = useState(null);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [errorPopupOpen, setErrorPopupOpen] = useState(false);

  function handleDeleteClick(rpt) {
    if (rpt.status !== 'solved') {
      setErrorPopupOpen(true);
    } else {
      setReportToDelete(rpt);
    }
  }


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
        const { data } = await axiosInstance.get("/reports/admin/all", {
          signal: ctrl.signal,
        });
        if (ctrl.signal.aborted) return;
        const list = Array.isArray(data) ? data : [];
        setReports(list.map(normalizeReport));
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        setReports([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => ctrl.abort();
  }, [navigate]);

  /* ── After resolve — update row in local state ── */
  function handleResolved(id, note) {
    setReports((prev) =>
      prev.map((r) =>
        r._id === id ? { ...r, status: "solved", resolveNote: note } : r,
      ),
    );
  }

  /* ── After delete ── */
  async function confirmDelete() {
    if (!reportToDelete) return;
    try {
      await axiosInstance.delete(`/reports/admin/${reportToDelete._id}`);
    } catch {
      /* optimistic */
    }
    setReports((prev) => prev.filter((r) => r._id !== reportToDelete._id));
    setReportToDelete(null);
  }

  /* ── View report — if pending, bump to under-review first ── */
  async function handleView(rpt) {
    if (rpt.status === "pending") {
      try {
        await axiosInstance.patch(`/reports/admin/${rpt._id}/resolve`, {
          resolveNote: rpt.resolveNote || "Under review by admin.",
          status: "under-review",
        });
        const updated = { ...rpt, status: "under-review" };
        setReports((prev) =>
          prev.map((r) => (r._id === rpt._id ? updated : r)),
        );
        setSelectedReport(updated);
      } catch {
        setSelectedReport(rpt);
      }
    } else {
      setSelectedReport(rpt);
    }
  }

  /* ── Derived values ── */
  const categories = [
    "All",
    ...Array.from(
      new Set(reports.map((r) => r.category).filter(Boolean)),
    ).sort(),
  ];
  const locations = [
    "All",
    ...Array.from(
      new Set(reports.map((r) => r.turfLocation).filter(Boolean)),
    ).sort(),
  ];

  const filtered = reports.filter((r) => {
    const q = search.toLowerCase();
    const ms =
      !q ||
      r.turfName?.toLowerCase().includes(q) ||
      r.vendorName?.toLowerCase().includes(q) ||
      r.reportId?.toLowerCase().includes(q);
    const mc = categoryFilter === "All" || r.category === categoryFilter;
    const ml = locationFilter === "All" || r.turfLocation === locationFilter;
    const ms2 = statusFilter === "All" || r.status === statusFilter;
    return ms && mc && ml && ms2;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    review: reports.filter((r) => r.status === "under-review").length,
    solved: reports.filter((r) => r.status === "solved").length,
  };

  function resetFilters() {
    setSearch("");
    setCategoryFilter("All");
    setLocationFilter("All");
    setStatusFilter("All");
    setPage(1);
  }

  /* ── Render ── */
  return (
    <div className="rp-page">
      {/* ── Modals ── */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onResolved={handleResolved}
        />
      )}

      {reportToDelete && (
        <DeleteConfirmModal 
          onConfirm={confirmDelete}
          onClose={() => setReportToDelete(null)}
        />
      )}

      {errorPopupOpen && (
        <ErrorModal onClose={() => setErrorPopupOpen(false)} />
      )}

      <h1 className="rp-page-title">Reports</h1>

      {/* Stat cards */}
      <div className="rp-stat-grid">
        {[
          {
            label: "Total Reports",
            value: counts.total,
            icon: "bi-file-earmark-text",
            variant: "total",
          },
          {
            label: "Pending",
            value: counts.pending,
            icon: "bi-three-dots",
            variant: "pending",
          },
          {
            label: "Under Review",
            value: counts.review,
            icon: "bi-eye",
            variant: "review",
          },
          {
            label: "Resolved",
            value: counts.solved,
            icon: "bi-check-circle",
            variant: "solved",
          },
        ].map(({ label, value, icon, variant }) => (
          <div
            key={variant}
            className={`rp-stat-card rp-stat-card--${variant}`}
          >
            <div>
              <p className="rp-stat-card__label">{label}</p>
              <p className="rp-stat-card__value">{value}</p>
            </div>
            <div
              className={`rp-stat-card__icon rp-stat-card__icon--${variant}`}
            >
              <i className={`bi ${icon}`} />
            </div>
          </div>
        ))}
      </div>

      {/* List Container wrapping Toolbar and Table */}
      <div className="rp-list-container">
      {/* Toolbar */}
      <div className="rp-toolbar">
        <div className="rp-search-box">
          <i className="bi bi-search" />
          <input
            type="text"
            className="rp-search-input"
            placeholder="Search by turf, vendor or report ID"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <select
          className="rp-select"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(1);
          }}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "Category" : c}
            </option>
          ))}
        </select>

        <select
          className="rp-select"
          value={locationFilter}
          onChange={(e) => {
            setLocationFilter(e.target.value);
            setPage(1);
          }}
        >
          {locations.map((l) => (
            <option key={l} value={l}>
              {l === "All" ? "Location" : l}
            </option>
          ))}
        </select>

        <select
          className="rp-select"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
        >
          {["All", "pending", "under-review", "solved"].map((s) => (
            <option key={s} value={s}>
              {s === "All"
                ? "Status"
                : s === "under-review"
                  ? "Under Review"
                  : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <button className="rp-reset-btn" onClick={resetFilters}>
          <i className="bi bi-arrow-clockwise" /> Reset Filter
        </button>
      </div>

        <div className="rp-table-wrap">
        <table className="rp-table">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Vendor Name</th>
              <th>Turf Name</th>
              <th>Location</th>
              <th>Category</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="rp-state-row">
                <td colSpan={8}>
                  <span className="rp-spinner" />
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr className="rp-state-row">
                <td colSpan={8}>
                  <i className="bi bi-search" />
                  <span>No reports found.</span>
                </td>
              </tr>
            ) : (
              <>
                {paginated.map((rpt) => (
                  <tr key={rpt._id}>
                    <td className="rp-td-id">{rpt.reportId}</td>
                    <td>
                      <div className="rp-td-vendor">
                        <VendorAvatar
                          name={rpt.vendorName}
                          src={rpt.vendorAvatar}
                        />
                        {rpt.vendorName}
                      </div>
                    </td>
                    <td className="rp-td-turf-name">{rpt.turfName}</td>
                    <td className="rp-td-location">{rpt.turfLocation}</td>
                    <td className="rp-td-category">{rpt.category}</td>
                    <td className="rp-td-date">{rpt.date}</td>
                    <td>
                      <StatusBadge status={rpt.status} />
                    </td>
                    <td>
                      <div className="rp-action-cell">
                        <button
                          className={`rp-action-btn ${rpt.status === "pending" ? "rp-action-btn--view" : "rp-action-btn--open"}`}
                          title="View report"
                          onClick={() => handleView(rpt)}
                        >
                          <i
                            className={`bi ${rpt.status === "pending" ? "bi-eye" : "bi-box-arrow-up-right"}`}
                          />
                        </button>
                        <button
                          className="rp-action-btn rp-action-btn--delete"
                          title={rpt.status === "solved" ? "Delete report" : "Only solved reports can be deleted"}
                          onClick={() => handleDeleteClick(rpt)}
                          disabled={rpt.status !== "solved"}
                          style={{
                            opacity: rpt.status !== "solved" ? 0.35 : 1,
                            cursor: rpt.status !== "solved" ? "not-allowed" : "pointer"
                          }}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {Array.from({ length: PAGE_SIZE - paginated.length }).map(
                  (_, i) => (
                    <tr key={`ghost-${i}`} className="rp-ghost-row">
                      <td colSpan={8} />
                    </tr>
                  ),
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
      </div>

      {/* Footer */}
      <div className="rp-table-footer">
        <span className="rp-showing-label">
          Showing {paginated.length} of {filtered.length} report
          {filtered.length !== 1 ? "s" : ""}
        </span>
        <div className="rp-pagination">
          <button
            className="rp-page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <i className="bi bi-chevron-left" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`rp-page-btn${p === page ? " rp-page-btn--active" : ""}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="rp-page-btn"
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
