// TurfDetailPage.jsx
// Route: /admin/turf/:id
// Fetches from backend; falls back to mock data if unavailable.

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { MOCK_TURFS } from "../../data/mockTurfs";
import "../../assets/styles/turfDetails.css";

// ── helpers ───────────────────────────────────────────────────────────────────

function normalizeTurf(t) {
  return {
    ...t,
    displayId:
      t.displayId ?? "TRF-" + (t._id?.slice(-4).toUpperCase() ?? "????"),
    vendor: t.ownerName ?? t.vendor ?? "—",
    city: t.city ?? t.location?.split(",").pop()?.trim() ?? "—",
    submittedDate: t.createdAt
      ? new Date(t.createdAt).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        })
      : "—",
    approvalStatus: (t.approvalStatus ?? "pending").toLowerCase(),
    pricing:
      t.pricePerHour?.basePrice != null
        ? `₹${t.pricePerHour.basePrice}/hour`
        : t.pricing ?? "—",
    timing: t.timing ?? "24 hrs",
    status: t.status ?? "Free trial",
    contact: t.contact ?? t.phone ?? "—",
    address: t.address ?? t.location ?? "—",
    facilities: Array.isArray(t.facilities) ? t.facilities : [],
    sports: Array.isArray(t.sports) ? t.sports : [],
    documents: Array.isArray(t.documents) ? t.documents : [],
    photos: Array.isArray(t.photos) ? t.photos : [],
    verifications: t.verifications ?? {
      identity: true, location: true, photos: true, contact: true, business: false,
    },
  };
}

// ── small pieces ──────────────────────────────────────────────────────────────

function Tag({ icon, label }) {
  return (
    <span className="tdp-tag">
      <i className={`bi ${icon}`} aria-hidden="true" />
      {label}
    </span>
  );
}

const DOC_STATUS = {
  verified: { cls: "verified", label: "Verified",  icon: "bi-check-circle-fill" },
  viewed:   { cls: "viewed",   label: "Viewed",    icon: "bi-check-circle-fill" },
  pending:  { cls: "pending",  label: "Pending",   icon: "bi-clock"             },
  rejected: { cls: "rejected", label: "Rejected",  icon: "bi-x-circle-fill"    },
};

function DocRow({ doc }) {
  const s = DOC_STATUS[doc.status?.toLowerCase()] ?? DOC_STATUS.pending;
  return (
    <div className="tdp-doc-row">
      <div className="tdp-doc-icon">
        <i className="bi bi-file-earmark-text" />
      </div>
      <div className="tdp-doc-info">
        <p className="tdp-doc-name">{doc.name}</p>
        <p className="tdp-doc-sub">{doc.subtitle ?? ""}</p>
      </div>
      <span className={`tdp-doc-badge tdp-doc-badge--${s.cls}`}>
        <i className={`bi ${s.icon}`} />
        {s.label}
      </span>
      <button className="tdp-doc-preview">
        Preview <i className="bi bi-eye" />
      </button>
    </div>
  );
}

function Toast({ msg, type, onDismiss }) {
  if (!msg) return null;
  return (
    <div className={`tdp-toast tdp-toast--${type}`} onClick={onDismiss} role="alert">
      <i className={`bi ${type === "success" ? "bi-check-circle-fill" : "bi-x-circle-fill"}`} />
      {msg}
    </div>
  );
}

function ActionArea({ status, onApprove, onReject, loading }) {
  if (status === "approved") {
    return (
      <div className="tdp-status-btn tdp-status-btn--approved">
        <i className="bi bi-check-circle-fill" /> Turf Approved
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="tdp-status-btn tdp-status-btn--rejected">
        <i className="bi bi-slash-circle-fill" /> Turf Rejected
      </div>
    );
  }
  return (
    <div className="tdp-action-btns">
      <button className="tdp-btn tdp-btn--approve" onClick={onApprove} disabled={loading}>
        {loading ? <span className="tdp-spinner" /> : <i className="bi bi-check-circle-fill" />}
        Approve Turf
      </button>
      <button className="tdp-btn tdp-btn--reject" onClick={onReject} disabled={loading}>
        <i className="bi bi-slash-circle-fill" /> Reject Turf
      </button>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function TurfDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [turf,    setTurf]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [actLoad, setActLoad] = useState(false);
  const [usingMock, setUsingMock] = useState(false);
  const [toast,   setToast]   = useState({ msg: "", type: "success" });

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3500);
  }

  const fetchTurf = useCallback(async (signal) => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/turfs/${id}`, { signal });
      setTurf(normalizeTurf(res.data));
      setUsingMock(false);
    } catch (err) {
      if (err?.name === "CanceledError") return;
      // Fallback to mock
      const mock = MOCK_TURFS.find((t) => t._id === id);
      if (mock) {
        setTurf(normalizeTurf(mock));
        setUsingMock(true);
      } else {
        setTurf(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchTurf(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchTurf]);

  async function handleApprove() {
    setActLoad(true);
    try {
      if (!usingMock) await axiosInstance.patch(`/turfs/${id}/approve`);
      setTurf((t) => ({ ...t, approvalStatus: "approved" }));
      showToast("Turf approved successfully!", "success");
    } catch {
      showToast("Failed to approve turf.", "error");
    } finally {
      setActLoad(false);
    }
  }

  async function handleReject() {
    setActLoad(true);
    try {
      if (!usingMock) await axiosInstance.patch(`/turfs/${id}/reject`);
      setTurf((t) => ({ ...t, approvalStatus: "rejected" }));
      showToast("Turf has been rejected.", "error");
    } catch {
      showToast("Failed to reject turf.", "error");
    } finally {
      setActLoad(false);
    }
  }

  // ── render states ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="tdp-page tdp-center">
        <span className="tdp-spinner tdp-spinner--lg" />
      </div>
    );
  }

  if (!turf) {
    return (
      <div className="tdp-page tdp-center">
        <i className="bi bi-search tdp-err-icon" />
        <p className="tdp-err-msg">Turf not found.</p>
        <button className="tdp-btn tdp-btn--outline" onClick={() => navigate(-1)}>
          Go back
        </button>
      </div>
    );
  }

  const verItems = [
    { label: "Identity Verified",    key: "identity" },
    { label: "Location Verified",    key: "location" },
    { label: "Turf Photos Verified", key: "photos"   },
    { label: "Contact Verified",     key: "contact"  },
    { label: "Business Verified",    key: "business" },
  ];

  const facilityIcons = {
    floodlights:      "bi-lightbulb",
    parking:          "bi-p-circle",
    water:            "bi-droplet",
    "cctv security":  "bi-camera-video",
    restroom:         "bi-door-open",
  };

  const defaultDocs = [
    { name: "PAN Card",         subtitle: "Permanent Account Number", status: "viewed"   },
    { name: "Aadhaar Card",     subtitle: "Identity Proof",           status: "verified" },
    { name: "GST Certificate",  subtitle: "Tax Registration",         status: "verified" },
    { name: "Business License", subtitle: "Trade Permit",
      status: turf.approvalStatus === "approved" ? "verified" : "pending" },
  ];

  const docs = turf.documents.length ? turf.documents : defaultDocs;

  return (
    <div className="tdp-page">
      {/* Toast */}
      <div className="tdp-toast-bar">
        <Toast msg={toast.msg} type={toast.type} onDismiss={() => setToast({ msg: "" })} />
      </div>

      {/* Mock banner */}
      {usingMock && (
        <div style={{
          background: "#fffbe6", border: "1px solid #ffe58f", borderRadius: 8,
          padding: "8px 14px", fontSize: 12, color: "#7c5800", marginBottom: 16,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <i className="bi bi-exclamation-triangle" />
          Demo mode — backend not connected. Approve/Reject updates UI only.
        </div>
      )}

      {/* Back */}
      <button className="tdp-back-btn" onClick={() => navigate(-1)}>
        <i className="bi bi-arrow-left" /> Turf details
      </button>

      {/* ── Header card ── */}
      <div className="tdp-header-card">
        <div className="tdp-header-left">
          <div className="tdp-vendor-logo">
            <i className="bi bi-building" />
          </div>
          <div>
            <p className="tdp-vendor-name">{turf.vendor}</p>
            <p className="tdp-vendor-sub">Turf Information Details</p>
          </div>
          <span className="tdp-id-badge">
            <i className="bi bi-dot" /> Turf ID : {turf.displayId}
          </span>
        </div>
        <ActionArea
          status={turf.approvalStatus}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={actLoad}
        />
      </div>

      {/* ── Info + Photos ── */}
      <div className="tdp-row tdp-row--info">
        <div className="tdp-card tdp-card--info">
          <div className="tdp-card-header">
            <span className="tdp-card-title">
              <i className="bi bi-info-circle" /> Turf information
            </span>
            <button className="tdp-edit-btn">Edit Details</button>
          </div>
          <div className="tdp-info-grid">
            <div>
              <p className="tdp-field-label">TURF NAME</p>
              <p className="tdp-field-value">{turf.name}</p>
            </div>
            <div>
              <p className="tdp-field-label">VENDOR</p>
              <p className="tdp-field-value">{turf.vendor}</p>
            </div>
            <div>
              <p className="tdp-field-label">ADDRESS</p>
              <p className="tdp-field-value">{turf.address}</p>
            </div>
            <div>
              <p className="tdp-field-label">PRICING</p>
              <p className="tdp-field-value">{turf.pricing}</p>
            </div>
            <div>
              <p className="tdp-field-label">CONTACT</p>
              <p className="tdp-field-value">{turf.contact}</p>
            </div>
            <div>
              <p className="tdp-field-label">STATUS</p>
              <p className="tdp-field-value">{turf.status}</p>
            </div>
            <div>
              <p className="tdp-field-label">SUBMITTED DATE</p>
              <p className="tdp-field-value">{turf.submittedDate}</p>
            </div>
            <div>
              <p className="tdp-field-label">TIMING</p>
              <p className="tdp-field-value">{turf.timing}</p>
            </div>
          </div>
        </div>

        <div className="tdp-card tdp-card--photos">
          <div className="tdp-card-header">
            <span className="tdp-card-title">
              <i className="bi bi-images" /> Uploaded Photos
            </span>
            <span className="tdp-photo-count">
              {turf.photos.length || 4} Images Provided
            </span>
          </div>
          <div className="tdp-photo-grid">
            {turf.photos.length > 0
              ? turf.photos.slice(0, 4).map((src, i) => (
                  <img key={i} src={src} alt={`Turf ${i + 1}`} className="tdp-photo" />
                ))
              : Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="tdp-photo tdp-photo--placeholder">
                    <i className="bi bi-image" />
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* ── Category ── */}
      <div className="tdp-card">
        <div className="tdp-card-header">
          <span className="tdp-card-title">
            <i className="bi bi-info-circle" /> Category
          </span>
        </div>
        <div className="tdp-row tdp-row--category">
          <div className="tdp-category-section">
            <p className="tdp-category-label">FACILITIES</p>
            <div className="tdp-tags">
              {(turf.facilities.length
                ? turf.facilities
                : ["Floodlights", "Parking", "Water", "CCTV Security", "Restroom"]
              ).map((f) => (
                <Tag key={f} icon={facilityIcons[f.toLowerCase()] ?? "bi-check"} label={f} />
              ))}
            </div>
          </div>
          <div className="tdp-category-divider" />
          <div className="tdp-category-section">
            <p className="tdp-category-label">SPORTS</p>
            <div className="tdp-tags">
              {(turf.sports.length ? turf.sports : ["Football", "Cricket", "Badminton"]).map(
                (s) => <Tag key={s} icon="bi-trophy" label={s} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Verification checklist ── */}
      <div className="tdp-card">
        <div className="tdp-card-header">
          <span className="tdp-card-title">
            <i className="bi bi-patch-check" /> Turf information
          </span>
          <button className="tdp-reset-btn">
            <i className="bi bi-arrow-clockwise" /> Reset default
          </button>
        </div>
        <div className="tdp-verif-list">
          {verItems.map(({ label, key }) => {
            const checked = turf.verifications?.[key] ?? (key !== "business");
            return (
              <label key={key} className="tdp-verif-item">
                <input type="checkbox" defaultChecked={checked} className="tdp-verif-cb" />
                <span className={`tdp-verif-box ${checked ? "tdp-verif-box--checked" : ""}`}>
                  {checked && <i className="bi bi-check" />}
                </span>
                <span className="tdp-verif-label">{label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── Documents ── */}
      <div className="tdp-card">
        <div className="tdp-card-header">
          <span className="tdp-card-title">
            <i className="bi bi-file-earmark-text" /> Turf information
          </span>
        </div>
        <div className="tdp-doc-list">
          {docs.map((doc, i) => <DocRow key={i} doc={doc} />)}
        </div>
      </div>
    </div>
  );
}