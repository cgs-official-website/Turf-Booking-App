// ReportDetails.jsx
// Standalone page for Report Details — used on mobile/tablet (< 1024px).
// On desktop the same content renders inside a modal popup in Reports.jsx.
// Route: /admin/reports/:id

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import "../../assets/styles/reports.css";
import "../../assets/styles/reportDetails.css";

/* ── helpers shared with Reports.jsx ── */
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

export default function ReportDetails() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const location  = useLocation();

  // If navigated from Reports list, the report object is passed via state
  const stateReport = location.state?.report ?? null;

  const [report,  setReport]  = useState(stateReport ? normalizeReport(stateReport) : null);
  const [loading, setLoading] = useState(!stateReport);
  const [error,   setError]   = useState(null);
  const [note,    setNote]    = useState(stateReport?.resolveNote ?? "");

  /* ── Fetch from API if no state was passed ── */
  useEffect(() => {
    if (stateReport) return; // already have data
    let cancelled = false;

    async function load() {
      try {
        const { data } = await axiosInstance.get(`/reports/admin/${id}`);
        if (!cancelled) {
          const r = normalizeReport(data);
          setReport(r);
          setNote(r.resolveNote ?? "");
        }
      } catch (err) {
        if (!cancelled) setError(err?.response?.data?.message ?? "Failed to load report.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id, stateReport]);

  function handleSend() {
    // TODO: call PATCH /reports/:id/resolve with note
    console.log("[ReportDetails] Resolve note:", note);
    navigate(-1);
  }

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="rd-page">
        <div className="rd-loading"><span className="rd-spinner" /></div>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !report) {
    return (
      <div className="rd-page">
        <div className="rd-header">
          <button className="rd-back-btn" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left" />
          </button>
          <h1 className="rd-title">Report Details</h1>
        </div>
        <div className="rd-error">
          <i className="bi bi-exclamation-circle" />
          <p>{error ?? "Report not found."}</p>
          <button className="rd-btn rd-btn--cancel" onClick={() => navigate(-1)}>Go back</button>
        </div>
      </div>
    );
  }

  const initials = report.vendorName?.split(" ").map((w) => w[0]).slice(0, 2).join("") ?? "?";

  /* ── Render ── */
  return (
    <div className="rd-page">

      {/* Header */}
      <div className="rd-header">
        <button className="rd-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <i className="bi bi-arrow-left" />
        </button>
        <h1 className="rd-title">Report Details</h1>
        <button className="rd-close-btn" onClick={() => navigate(-1)} aria-label="Close">✕</button>
      </div>

      <p className="rd-meta">
        Report ID: <strong>{report.reportId}</strong> &bull; {report.date}
      </p>

      {/* User Details */}
      <p className="rd-section-label">User Details</p>
      <div className="rd-user-card">
        <div className="rd-user-avatar">{initials}</div>
        <div>
          <p className="rd-user-name">{report.vendorName}</p>
          <p className="rd-user-email">
            {report.vendorEmail ?? `${report.vendorName?.toLowerCase().replace(" ", ".")}@example.com`}
          </p>
        </div>
      </div>

      {/* Turf Information */}
      <p className="rd-section-label">Turf Information</p>
      <div className="rd-turf-card">
        <div className="rd-turf-top">
          <div className="rd-turf-img">
            <i className="bi bi-image" />
          </div>
          <div className="rd-turf-info">
            <p className="rd-turf-name">{report.turfName}</p>
            <p className="rd-turf-loc"><i className="bi bi-geo-alt-fill" /> {report.location}</p>
            <p className="rd-turf-dist"><i className="bi bi-geo" /> {report.distance ?? "2.4 Km"}</p>
            <p className="rd-turf-price">₹ {report.price ?? "1200"}</p>
          </div>
        </div>
        <div className="rd-turf-meta">
          <span><i className="bi bi-calendar3" /> Date: {report.date}</span>
          <span><i className="bi bi-clock" /> Time: {report.time ?? "07:30"}</span>
          <span><i className="bi bi-people" /> {report.players ?? "10"} Players</span>
        </div>
      </div>

      {/* Report Description */}
      <p className="rd-section-label">Report Description</p>
      <div className="rd-desc-card">
        <span className="rd-category-tag">{report.category}</span>
        <p className="rd-desc-text">{report.description}</p>
      </div>

      {/* Resolve Queries */}
      <p className="rd-section-label">Resolve Queries</p>
      <textarea
        className="rd-textarea"
        rows={4}
        placeholder="Add a note for the internal team..."
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      {/* Footer */}
      <div className="rd-footer">
        <button className="rd-btn rd-btn--cancel" onClick={() => navigate(-1)}>Cancel</button>
        <button className="rd-btn rd-btn--send" onClick={handleSend}>Send</button>
      </div>
    </div>
  );
}
