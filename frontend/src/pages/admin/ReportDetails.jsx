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
  const vendor = r.vendor ?? {};
  const turf   = r.turf   ?? {};
  return {
    ...r,
    reportId:     r.reportId     ?? "#RP-" + (r._id?.slice(-4) ?? "????"),
    vendorName:   vendor.name    ?? r.vendorName  ?? "—",
    vendorEmail:  vendor.email   ?? r.vendorEmail ?? "—",
    turfName:     turf.name      ?? r.turfName    ?? "—",
    turfLocation: turf.location  ?? r.turfLocation ?? r.location ?? "—",
    turfImage:    turf.mainImage ?? r.turfImage   ?? null,
    category:     r.category     ?? r.type        ?? "—",
    date: r.createdAt
      ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
      : r.date ?? "—",
    status:      (r.status ?? "pending").toLowerCase().replace(/ /g, "-"),
    resolveNote:  r.resolveNote ?? "",
    description:  r.description ?? "",
  };
}

/* ── Turf image with fallback ── */
function TurfImage({ src, alt }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="rd-turf-img-placeholder">
        <i className="bi bi-image" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="rd-turf-img"
      onError={() => setErr(true)}
    />
  );
}

export default function ReportDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const stateReport = location.state?.report ?? null;

  const [report,  setReport]  = useState(stateReport ? normalizeReport(stateReport) : null);
  const [loading, setLoading] = useState(!stateReport);
  const [error,   setError]   = useState(null);
  const [note,    setNote]    = useState(stateReport?.resolveNote ?? "");
  const [sending, setSending] = useState(false);

  /* ── Fetch from API if no state was passed ── */
  useEffect(() => {
    if (stateReport) return;
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

  async function handleSend() {
    if (!note.trim()) return;
    setSending(true);
    try {
      await axiosInstance.patch(`/reports/admin/${report._id}/resolve`, {
        resolveNote: note,
        status: "solved",
      });
      navigate(-1);
    } catch (err) {
      console.error("[ReportDetails] resolve failed:", err?.response?.data?.message ?? err.message);
    } finally {
      setSending(false);
    }
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

  const isDone   = report.status === "solved";
  const initials = report.vendorName?.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() ?? "?";

  /* ── Render ── */
  return (
    <div className="rd-page">

      {/* Header */}
      <div className="rd-header">
        <button className="rd-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <i className="bi bi-arrow-left" />
        </button>
        <h1 className="rd-title">Report Details</h1>
        <button className="rd-close-btn" onClick={() => navigate(-1)} aria-label="Close">
          <i className="bi bi-x-lg" />
        </button>
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
          <p className="rd-user-email">{report.vendorEmail}</p>
        </div>
      </div>

      {/* Turf Information */}
      <p className="rd-section-label">Turf Information</p>
      <div className="rd-turf-card">
        <TurfImage src={report.turfImage} alt={report.turfName} />
        <div className="rd-turf-info">
          <p className="rd-turf-name">{report.turfName}</p>
          <p className="rd-turf-loc">
            <i className="bi bi-geo-alt-fill" /> {report.turfLocation}
          </p>
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
        disabled={isDone}
      />

      {/* Footer */}
      <div className="rd-footer">
        <button className="rd-btn rd-btn--cancel" onClick={() => navigate(-1)} disabled={sending}>
          Cancel
        </button>
        <button
          className="rd-btn rd-btn--send"
          onClick={handleSend}
          disabled={sending || isDone || !note.trim()}
        >
          {sending ? <span className="rd-spinner-sm" /> : "Send"}
        </button>
      </div>

    </div>
  );
}