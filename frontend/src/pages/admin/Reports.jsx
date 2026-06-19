// Reports.jsx
// Admin Reports page
// Columns: Vendor ID | Vendor Name | Turf Name | Location | Category | Date | Status | Action
// Pending rows → eye icon → opens Report Detail modal popup
// Other rows → external-link icon

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import "../../assets/styles/reports.css";

const PAGE_SIZE = 8;

/* ── Mock data ── */
const MOCK_REPORTS = [
  { _id: "r01", reportId: "#RP-398", vendorName: "Sarah Miller", vendorAvatar: null, turfName: "Enjoy turf", location: "Chennai", category: "System bug",         date: "12/12/2026", status: "under-review", description: "The booking system is not responding properly when selecting slots after 8 PM. Multiple users reported the same issue.", resolveNote: "" },
  { _id: "r02", reportId: "#RP-399", vendorName: "Sarah Miller", vendorAvatar: null, turfName: "Enjoy turf", location: "Chennai", category: "Over charged",       date: "12/12/2026", status: "under-review", description: "A user was charged twice for the same booking slot on June 10, 2026.", resolveNote: "" },
  { _id: "r03", reportId: "#RP-400", vendorName: "Sarah Miller", vendorAvatar: null, turfName: "Enjoy turf", location: "Chennai", category: "Request slot Issue",  date: "12/12/2026", status: "solved",       description: "Slot request was not being reflected in the vendor dashboard.", resolveNote: "Issue resolved by resetting slot cache." },
  { _id: "r04", reportId: "#RP-401", vendorName: "Sarah Miller", vendorAvatar: null, turfName: "Enjoy turf", location: "Chennai", category: "System bug",         date: "12/12/2026", status: "under-review", description: "Login page shows blank screen after incorrect password attempt.", resolveNote: "" },
  { _id: "r05", reportId: "#RP-402", vendorName: "Sarah Miller", vendorAvatar: null, turfName: "Enjoy turf", location: "Chennai", category: "Request slot Issue",  date: "12/12/2026", status: "pending",      description: "The netting on Field 3 is torn in several places along the north perimeter. It looks like it happened during the high-wind storm last night. It poses a safety risk for spectators as balls could pass through the gaps. Requesting immediate repair before the weekend tournament.", resolveNote: "" },
  { _id: "r06", reportId: "#RP-403", vendorName: "Sarah Miller", vendorAvatar: null, turfName: "Enjoy turf", location: "Chennai", category: "System bug",         date: "12/12/2026", status: "under-review", description: "Admin dashboard graphs are not loading correctly.", resolveNote: "" },
  { _id: "r07", reportId: "#RP-404", vendorName: "Sarah Miller", vendorAvatar: null, turfName: "Enjoy turf", location: "Chennai", category: "System bug",         date: "12/12/2026", status: "under-review", description: "Search filter is returning incorrect turf results.", resolveNote: "" },
  { _id: "r08", reportId: "#RP-405", vendorName: "Sarah Miller", vendorAvatar: null, turfName: "Enjoy turf", location: "Chennai", category: "System bug",         date: "12/12/2026", status: "under-review", description: "Notification emails are delayed by more than 2 hours.", resolveNote: "" },
  { _id: "r09", reportId: "#RP-406", vendorName: "John Dorsey",  vendorAvatar: null, turfName: "Qube Sportz Arena", location: "Perundurai", category: "Facility Damage", date: "17/06/2026", status: "pending", description: "The netting on Field 3 is torn in several places along the north perimeter. Requesting immediate repair before the weekend tournament.", resolveNote: "" },
  { _id: "r10", reportId: "#RP-407", vendorName: "Rahul Sharma", vendorAvatar: null, turfName: "Green Garden", location: "Perundurai", category: "System bug", date: "05/06/2026", status: "solved", description: "Booking confirmation was not sent via email.", resolveNote: "Fixed email service integration." },
];

function normalizeReport(r) {
  return {
    ...r,
    reportId:    r.reportId    ?? "#RP-" + (r._id?.slice(-4) ?? "????"),
    vendorName:  r.vendorName  ?? r.vendor?.name  ?? "—",
    turfName:    r.turfName    ?? r.turf?.name     ?? "—",
    location:    r.location    ?? r.turf?.city     ?? "—",
    category:    r.category    ?? r.type           ?? "—",
    date:        r.date        ?? (r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"),
    status:      (r.status     ?? "pending").toLowerCase().replace(/ /g, "-"),
    resolveNote: r.resolveNote ?? "",
  };
}

/* ── Vendor avatar ── */
function VendorAvatar({ name, src }) {
  const [err, setErr] = useState(false);
  const initials = name?.split(" ").map((w) => w[0]).slice(0, 2).join("") ?? "?";
  if (!src || err) {
    return <div className="rp-vendor-avatar-placeholder">{initials}</div>;
  }
  return <img src={src} alt={name} className="rp-vendor-avatar" onError={() => setErr(true)} />;
}

/* ── Status badge ── */
function StatusBadge({ status }) {
  const map = { pending: "Pending", "under-review": "Under Review", solved: "Solved" };
  return <span className={`rp-badge rp-badge--${status}`}>{map[status] ?? status}</span>;
}

/* ── Report Detail Modal ── */
function ReportDetailModal({ report, onClose }) {
  const [note, setNote] = useState(report.resolveNote ?? "");

  function handleSend() {
    // TODO: call PATCH /reports/:id/resolve with note
    console.log("[Reports] Resolve note:", note);
    onClose();
  }

  const initials = report.vendorName?.split(" ").map((w) => w[0]).slice(0, 2).join("") ?? "?";

  return (
    <div className="rp-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="rp-modal">
        {/* Header */}
        <div className="rp-modal-header">
          <button className="rp-modal-back" onClick={onClose}>
            <i className="bi bi-arrow-left" />
            <span>Report Details</span>
          </button>
          <button className="rp-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <p className="rp-modal-meta">
          Report ID: <strong>{report.reportId}</strong> &bull;{" "}
          {report.date}
        </p>

        {/* User Details */}
        <p className="rp-modal-section-label">User Details</p>
        <div className="rp-modal-user-card">
          <div className="rp-modal-user-avatar">{initials}</div>
          <div>
            <p className="rp-modal-user-name">{report.vendorName}</p>
            <p className="rp-modal-user-email">
              {report.vendorEmail ?? `${report.vendorName?.toLowerCase().replace(" ", ".")}@example.com`}
            </p>
          </div>
        </div>

        {/* Turf Information */}
        <p className="rp-modal-section-label">Turf Information</p>
        <div className="rp-modal-turf-card">
          <div className="rp-modal-turf-img-wrap">
            <div className="rp-modal-turf-img">
              <i className="bi bi-image" />
            </div>
            <div className="rp-modal-turf-info">
              <p className="rp-modal-turf-name">{report.turfName}</p>
              <p className="rp-modal-turf-loc">
                <i className="bi bi-geo-alt-fill" />
                {report.location}
              </p>
              <p className="rp-modal-turf-dist">
                <i className="bi bi-geo" />
                {report.distance ?? "2.4 Km"}
              </p>
              <p className="rp-modal-turf-price">
                ₹ {report.price ?? "1200"}
              </p>
            </div>
          </div>
          <div className="rp-modal-turf-meta">
            <span>
              <i className="bi bi-calendar3" />
              Date: {report.date}
            </span>
            <span>
              <i className="bi bi-clock" />
              Time: {report.time ?? "07:30"}
            </span>
            <span>
              <i className="bi bi-people" />
              {report.players ?? "10"} Players
            </span>
          </div>
        </div>

        {/* Report Description */}
        <p className="rp-modal-section-label">Report Description</p>
        <div className="rp-modal-desc-card">
          <span className="rp-modal-category-tag">{report.category}</span>
          <p className="rp-modal-desc-text">{report.description}</p>
        </div>

        {/* Resolve Queries */}
        <p className="rp-modal-resolve-label">Resolve Queries</p>
        <textarea
          className="rp-modal-textarea"
          rows={4}
          placeholder="Add a note for the internal team..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        {/* Footer */}
        <div className="rp-modal-footer">
          <button className="rp-modal-btn rp-modal-btn--cancel" onClick={onClose}>Cancel</button>
          <button className="rp-modal-btn rp-modal-btn--send" onClick={handleSend}>Send</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main component ── */
const DESKTOP_BREAKPOINT = 1024;
function isDesktop() { return window.innerWidth >= DESKTOP_BREAKPOINT; }

export default function Reports() {
  const navigate = useNavigate();

  const [reports,   setReports]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [usingMock, setUsingMock] = useState(false);

  const [search,         setSearch]         = useState("");
  const [dateFilter,     setDateFilter]     = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [statusFilter,   setStatusFilter]   = useState("All");
  const [page,           setPage]           = useState(1);

  const [selectedReport, setSelectedReport] = useState(null); // desktop modal only

  /* ── Open report: modal on desktop, page on mobile ── */
  function openReport(rpt) {
    if (isDesktop()) {
      setSelectedReport(rpt);
    } else {
      navigate(`/admin/reports/${rpt._id}`, { state: { report: rpt } });
    }
  }

  /* ── Fetch ── */
  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) { navigate("/admin/login"); return; }
      try {
        const { data } = await axiosInstance.get("/reports/admin/all", { signal: ctrl.signal });
        if (ctrl.signal.aborted) return;
        const list = Array.isArray(data) ? data : [];
        setReports(list.map(normalizeReport));
        setUsingMock(false);
      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        console.warn("[Reports] Backend unavailable — using mock data.");
        setReports(MOCK_REPORTS.map(normalizeReport));
        setUsingMock(true);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => ctrl.abort();
  }, [navigate]);

  /* ── Derived values ── */
  const categories = ["All", ...Array.from(new Set(reports.map((r) => r.category).filter(Boolean))).sort()];
  const locations  = ["All", ...Array.from(new Set(reports.map((r) => r.location).filter(Boolean))).sort()];

  const filtered = reports.filter((r) => {
    const q   = search.toLowerCase();
    const ms  = !q || r.turfName?.toLowerCase().includes(q) || r.vendorName?.toLowerCase().includes(q) || r.reportId?.toLowerCase().includes(q);
    const mc  = categoryFilter === "All" || r.category === categoryFilter;
    const ml  = locationFilter === "All" || r.location === locationFilter;
    const mst = statusFilter   === "All" || r.status   === statusFilter;
    return ms && mc && ml && mst;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const counts = {
    total:   reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    review:  reports.filter((r) => r.status === "under-review").length,
    solved:  reports.filter((r) => r.status === "solved").length,
  };

  function resetFilters() {
    setSearch(""); setDateFilter("All"); setCategoryFilter("All");
    setLocationFilter("All"); setStatusFilter("All"); setPage(1);
  }

  /* ── Render ── */
  return (
    <div className="rp-page">

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
        />
      )}

      {/* Mock banner */}
      {usingMock && (
        <div className="rp-mock-banner">
          <i className="bi bi-exclamation-triangle" />
          Backend not connected — showing demo data.
        </div>
      )}

      {/* Title */}
      <h1 className="rp-page-title">Reports</h1>

      {/* Stat Cards */}
      <div className="rp-stat-grid">
        <div className="rp-stat-card">
          <div>
            <p className="rp-stat-card__label">Total Report</p>
            <div className="rp-stat-card__row">
              <i className="bi bi-people rp-stat-card__icon-sm" />
              <p className="rp-stat-card__value">{counts.total.toLocaleString()}</p>
            </div>
          </div>
          <div className="rp-stat-card__icon rp-stat-card__icon--total">
            <i className="bi bi-file-earmark-text" />
          </div>
        </div>

        <div className="rp-stat-card">
          <div>
            <p className="rp-stat-card__label">Pending</p>
            <div className="rp-stat-card__row">
              <i className="bi bi-people rp-stat-card__icon-sm" />
              <p className="rp-stat-card__value">{counts.pending.toLocaleString()}</p>
            </div>
          </div>
          <div className="rp-stat-card__icon rp-stat-card__icon--pending">
            <i className="bi bi-emoji-neutral" />
          </div>
        </div>

        <div className="rp-stat-card">
          <div>
            <p className="rp-stat-card__label">Review</p>
            <div className="rp-stat-card__row">
              <i className="bi bi-people rp-stat-card__icon-sm" />
              <p className="rp-stat-card__value">{counts.review.toLocaleString()}</p>
            </div>
          </div>
          <div className="rp-stat-card__icon rp-stat-card__icon--review">
            <i className="bi bi-eye" />
          </div>
        </div>

        <div className="rp-stat-card">
          <div>
            <p className="rp-stat-card__label">Resolved</p>
            <div className="rp-stat-card__row">
              <i className="bi bi-people rp-stat-card__icon-sm" />
              <p className="rp-stat-card__value">{counts.solved.toLocaleString()}</p>
            </div>
          </div>
          <div className="rp-stat-card__icon rp-stat-card__icon--solved">
            <i className="bi bi-check-circle" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="rp-toolbar">
        <div className="rp-search-box">
          <i className="bi bi-search" />
          <input
            id="rp-search"
            type="text"
            className="rp-search-input"
            placeholder="Search turf by name"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            aria-label="Search reports"
          />
        </div>

        <select id="rp-date-filter" className="rp-select" value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}>
          <option value="All">Date</option>
          {["12/12/2026", "17/06/2026", "05/06/2026"].map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select id="rp-category-filter" className="rp-select" value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
          {categories.map((c) => (
            <option key={c} value={c}>{c === "All" ? "Category" : c}</option>
          ))}
        </select>

        <select id="rp-location-filter" className="rp-select" value={locationFilter}
          onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}>
          {locations.map((l) => (
            <option key={l} value={l}>{l === "All" ? "Location" : l}</option>
          ))}
        </select>

        <select id="rp-status-filter" className="rp-select" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          {["All", "pending", "under-review", "solved"].map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "Status" : s === "under-review" ? "Under Review" : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <button id="rp-reset-btn" className="rp-reset-btn" onClick={resetFilters}>
          <i className="bi bi-arrow-clockwise" />
          Reset Filter
        </button>
      </div>

      {/* Table */}
      <div className="rp-table-wrap">
        <table className="rp-table" aria-label="All reports">
          <thead>
            <tr>
              <th>Vendor ID</th>
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
                <td colSpan={8}><span className="rp-spinner" /></td>
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
                        <VendorAvatar name={rpt.vendorName} src={rpt.vendorAvatar} />
                        {rpt.vendorName}
                      </div>
                    </td>
                    <td>{rpt.turfName}</td>
                    <td>{rpt.location}</td>
                    <td>{rpt.category}</td>
                    <td>{rpt.date}</td>
                    <td><StatusBadge status={rpt.status} /></td>
                    <td>
                      <div className="rp-action-cell">
                        {/* Eye icon for Pending; open icon for others */}
                        {rpt.status === "pending" ? (
                          <button
                            className="rp-action-btn rp-action-btn--view"
                            title="View report details"
                            onClick={() => openReport(rpt)}
                          >
                            <i className="bi bi-eye" />
                          </button>
                        ) : (
                          <button
                            className="rp-action-btn rp-action-btn--open"
                            title="Open report"
                            onClick={() => openReport(rpt)}
                          >
                            <i className="bi bi-box-arrow-up-right" />
                          </button>
                        )}
                        <button
                          className="rp-action-btn rp-action-btn--delete"
                          title="Delete report"
                          onClick={() => {
                            if (window.confirm("Delete this report?")) {
                              setReports((prev) => prev.filter((r) => r._id !== rpt._id));
                            }
                          }}
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {Array.from({ length: PAGE_SIZE - paginated.length }).map((_, i) => (
                  <tr key={`ghost-${i}`} className="rp-ghost-row">
                    <td colSpan={8} />
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer / Pagination */}
      <div className="rp-table-footer">
        <span className="rp-showing-label">
          Showing {filtered.length} of {reports.length} turf{reports.length !== 1 ? "s" : ""}
        </span>
        <div className="rp-pagination">
          <button className="rp-page-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} className={`rp-page-btn${p === page ? " rp-page-btn--active" : ""}`} onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
          <button className="rp-page-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
