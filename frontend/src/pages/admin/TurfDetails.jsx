
// TurfDetails.jsx
// API:
//   GET   /turfs/:id          → PUBLIC  — turf detail
//   PATCH /turfs/:id/approve  → ADMIN   — approve
//   PATCH /turfs/:id/reject   → ADMIN   — reject

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import { MOCK_TURFS } from "../../data/mockTurfs";
import "../../assets/styles/turfDetails.css";

// ── Icon maps ─────────────────────────────────────────────────────────────────
const FACILITY_ICON = {
  Parking:         "bi-p-circle",
  Water:           "bi-droplet",
  Floodlights:     "bi-lightbulb",
  "CCTV Security": "bi-camera-video",
  Restroom:        "bi-door-open",
};
const SPORT_ICON = {
  football:      "bi-dribbble",
  cricket:       "bi-trophy",
  badminton:     "bi-lightning-charge",
  basketball:    "bi-dribbble",
  tennis:        "bi-circle",
  swimming:      "bi-water",
  "multi-sport": "bi-grid",
};

const DOC_ICON = {
  "PAN Card":         "bi-person-badge",
  "Aadhaar Card":     "bi-fingerprint",
  "GST Certificate":  "bi-file-earmark-text",
  "Business License": "bi-file-earmark",
};

// ── Normalise ─────────────────────────────────────────────────────────────────
function normalizeTurf(t) {
  let verifications = [];
  if (Array.isArray(t.verifications)) {
    verifications = t.verifications;
  } else if (t.verifications && typeof t.verifications === "object") {
    verifications = [
      { label: "Identity Verified",    checked: !!t.verifications.identity  },
      { label: "Location Verified",    checked: !!t.verifications.location  },
      { label: "Turf Photos Verified", checked: !!t.verifications.photos    },
      { label: "Contact Verified",     checked: !!t.verifications.contact   },
      { label: "Business Verified",    checked: !!t.verifications.business  },
    ];
  }

  const rawDocs = t.documents ?? t.docs ?? [];
  const documents = rawDocs.map((d) => {
    const raw = (d.status ?? d.docStatus ?? "pending").toLowerCase();
    const status = raw === "verified" ? "verified"
                 : raw === "rejected" ? "rejected"
                 : "pending";
    const name = d.name ?? d.title ?? "Document";
    return {
      icon:   DOC_ICON[name] ?? d.icon ?? "bi-file-earmark",
      title:  name,
      sub:    d.subtitle ?? d.sub ?? "",
      status,
    };
  });

  const sportTypes =
    t.sportTypes ??
    t.sports?.map((s) => s.toLowerCase()) ??
    (t.sportType ? [t.sportType] : []);

  return {
    _id:           t._id,
    displayId:     t.displayId ?? "TRF-" + (t._id?.slice(-4).toUpperCase() ?? "????"),
    name:          t.name ?? "—",
    ownerName:     t.ownerName ?? t.vendor ?? "—",
    location:      t.location ?? t.address ?? "—",
    phone:         t.phone ?? t.contact ?? "—",
    pricing:       t.pricePerHour?.basePrice != null
                     ? `₹${t.pricePerHour.basePrice}/hr`
                     : t.pricing ?? "—",
    status:        t.status ?? "—",
    timing:        t.timing ?? "—",
    submittedDate: t.createdAt
                     ? new Date(t.createdAt).toLocaleDateString("en-IN", {
                         day: "numeric", month: "short", year: "numeric",
                       })
                     : t.submittedDate ?? "—",
    approvalStatus: (t.approvalStatus ?? "pending").toLowerCase(),
    amenities:     t.amenities ?? t.facilities ?? [],
    sportTypes,
    photos: [
      ...(t.mainImage ? [t.mainImage] : []),
      ...(Array.isArray(t.secondaryImages) ? t.secondaryImages : []),
      ...(Array.isArray(t.photos) ? t.photos : []),
    ].filter(Boolean),
    verifications,
    documents,
  };
}

// ── DocBadge ──────────────────────────────────────────────────────────────────
function DocBadge({ status }) {
  if (status === "verified") {
    return (
      <span className="td-doc-badge td-doc-badge--verified">
        <i className="bi bi-check-circle-fill" /> Verified
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="td-doc-badge td-doc-badge--rejected">
        <i className="bi bi-x-circle-fill" /> Rejected
      </span>
    );
  }
  // pending — shown as pending badge (only visible when checkbox checked)
  return (
    <span className="td-doc-badge td-doc-badge--pending">
      <i className="bi bi-clock-fill" /> Pending
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function TurfDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [turf,      setTurf]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [acting,    setActing]    = useState(false);
  const [editMode,  setEditMode]  = useState(false);
  const [editData,  setEditData]  = useState({});

  // Verification checkboxes (one per verification item)
  // true = checked → shows document in doc section
  const [checks, setChecks] = useState([]);

  // Document-level action state: { [docTitle]: "verified" | "rejected" | original }
  const [docStatuses, setDocStatuses] = useState({});

  // Remove confirmation modal
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  // ── fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await axiosInstance.get(`/turfs/${id}`);
        if (!cancelled) init(data);
      } catch {
        if (!cancelled) {
          const mock = MOCK_TURFS.find((t) => t._id === id) ?? MOCK_TURFS[0];
          init(mock);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  function init(raw) {
    const n = normalizeTurf(raw);
    setTurf(n);
    setChecks(n.verifications.map((v) => v.checked));
    // Seed docStatuses from normalized docs
    const seed = {};
    n.documents.forEach((d) => { seed[d.title] = d.status; });
    setDocStatuses(seed);
    setEditData({
      name:     n.name,
      location: n.location,
      phone:    n.phone,
      pricing:  n.pricing,
      status:   n.status,
      timing:   n.timing,
    });
  }

  // ── checkbox helpers ──────────────────────────────────────────────────────
  function toggleCheck(i) {
    setChecks((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  function resetChecks() {
    // Refresh = untick ALL checkboxes
    setChecks((prev) => prev.map(() => false));
  }

  // ── document verify / reject ──────────────────────────────────────────────
  function verifyDoc(title) {
    setDocStatuses((prev) => ({ ...prev, [title]: "verified" }));
  }

  function rejectDoc(title) {
    setDocStatuses((prev) => ({ ...prev, [title]: "rejected" }));
  }

  // ── edit helpers ──────────────────────────────────────────────────────────
  function handleEditSave() {
    setTurf((prev) => ({ ...prev, ...editData }));
    setEditMode(false);
  }

  function handleRemove() {
    setShowRemoveConfirm(true);
  }

  async function confirmRemove() {
    try {
      await axiosInstance.delete(`/turfs/${id}`);
    } catch { /* ignore */ }
    navigate(-1);
  }

  // ── approval logic ────────────────────────────────────────────────────────
  // Docs that are currently checked (checkbox ticked) are "under review"
  // approval is allowed only when ALL documents are "verified"
  const allDocs = turf ? turf.documents : [];

  // Effective status of each doc (from docStatuses override or original)
  const effectiveDocStatus = (doc) => docStatuses[doc.title] ?? doc.status;

  // Docs visible in the document section = those whose checkbox is ticked OR that are verified/rejected (after decision)
  // Docs that count toward approval = those with verified status
  const verifiedCount  = allDocs.filter((d) => effectiveDocStatus(d) === "verified").length;
  const rejectedCount  = allDocs.filter((d) => effectiveDocStatus(d) === "rejected").length;
  const pendingCount   = allDocs.filter((d) => effectiveDocStatus(d) === "pending").length;
  const totalDocs      = allDocs.length;

  const allDocsVerified  = totalDocs > 0 && verifiedCount === totalDocs;
  const allDocsRejected  = totalDocs > 0 && rejectedCount === totalDocs;
  const someDocsVerified = verifiedCount > 0 && verifiedCount < totalDocs;
  const hasAnyAction     = verifiedCount > 0 || rejectedCount > 0;

  // ── approve / reject ──────────────────────────────────────────────────────
  async function handleApprove() {
    if (!allDocsVerified) return;
    setActing(true);
    try {
      await axiosInstance.patch(`/turfs/${id}/approve`);
    } catch { /* optimistic */ }
    setTurf((prev) => ({ ...prev, approvalStatus: "approved" }));
    setActing(false);
  }

  async function handleReject() {
    setActing(true);
    try {
      await axiosInstance.patch(`/turfs/${id}/reject`);
    } catch { /* optimistic */ }
    setTurf((prev) => ({ ...prev, approvalStatus: "rejected" }));
    setActing(false);
  }

  // ── loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="td-page">
        <div className="td-loading"><span className="td-spinner" /></div>
      </div>
    );
  }

  const isPending  = turf.approvalStatus === "pending";
  const isApproved = turf.approvalStatus === "approved";
  const isRejected = turf.approvalStatus === "rejected";
  const isDone     = isApproved || isRejected;

  // Docs shown in the verification checklist section
  // Unchecked checkboxes = nothing shown for that doc
  // After approval/rejection, show all verified/rejected docs
  const docsToShow = isDone
    ? allDocs.filter((d) => effectiveDocStatus(d) === "verified" || effectiveDocStatus(d) === "rejected")
    : allDocs.filter((_, i) => checks[i]);

  // ── render ────────────────────────────────────────────────────────────────
  return (
    <div className="td-page">

      {/* Back + Title */}
      <div className="td-title-row">
        <button className="td-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <i className="bi bi-arrow-left" />
        </button>
        <h1 className="td-page-title">Turf details</h1>
      </div>

      {/* ── Hero card ── */}
      <div className="td-hero-card">
        <div className="td-hero-left">
          <div className="td-hero-logo">
            <i className="bi bi-patch-check-fill" />
          </div>
          <div>
            <p className="td-hero-vendor">{turf.ownerName}</p>
            <p className="td-hero-sub">Turf Information Details</p>
          </div>
          <span className="td-hero-id-badge">
            <i className="bi bi-circle-fill td-dot" />
            Turf ID : {turf.displayId}
          </span>
        </div>

        <div className="td-hero-actions">
          {isPending && (
            <>
              {/* Approve — only enabled when ALL docs are verified */}
              <button
                className={`td-btn td-btn--approve${!allDocsVerified ? " td-btn--disabled" : ""}`}
                onClick={handleApprove}
                disabled={acting || !allDocsVerified}
                title={!allDocsVerified ? "Verify all documents before approving" : ""}
              >
                {acting ? <span className="td-spinner-sm" /> : <i className="bi bi-patch-check" />}
                Approve Turf
              </button>

              {/* Reject — enabled when all docs are rejected OR pending */}
              <button
                className="td-btn td-btn--reject"
                onClick={handleReject}
                disabled={acting}
              >
                <i className="bi bi-x-circle" /> Reject Turf
              </button>
            </>
          )}

          {isApproved && (
            <button className="td-btn td-btn--approved-state" disabled>
              <i className="bi bi-patch-check-fill" /> Turf Approved
            </button>
          )}

          {isRejected && (
            <button className="td-btn td-btn--rejected-state" disabled>
              <i className="bi bi-x-circle-fill" /> Turf Rejected
            </button>
          )}
        </div>
      </div>

      {/* ── Status Banners ── */}
      {isPending && allDocsVerified && (
        <div className="td-success-banner">
          <i className="bi bi-check-circle-fill" />
          All documents verified! You can now approve this turf.
        </div>
      )}

      {isPending && someDocsVerified && pendingCount > 0 && (
        <div className="td-warning-banner">
          <i className="bi bi-exclamation-triangle-fill" />
          <span>
            <strong>{verifiedCount} of {totalDocs}</strong> documents verified.
            Verify the remaining {pendingCount} document{pendingCount > 1 ? "s" : ""} to enable approval,
            or reject the turf.
          </span>
        </div>
      )}

      {isPending && rejectedCount > 0 && rejectedCount < totalDocs && verifiedCount === 0 && (
        <div className="td-warning-banner">
          <i className="bi bi-exclamation-triangle-fill" />
          Some documents have been rejected. You may reject the turf or continue verifying remaining documents.
        </div>
      )}

      {isPending && allDocsRejected && (
        <div className="td-error-banner">
          <i className="bi bi-x-circle-fill" />
          All documents rejected. Please reject this turf.
        </div>
      )}

      {isPending && !hasAnyAction && (
        <div className="td-info-banner">
          <i className="bi bi-info-circle-fill" />
          Check the verification checkboxes below to review and verify each document before approving.
        </div>
      )}

      {/* ── Main 2-col grid: info + photos ── */}
      <div className="td-main-grid">

        {/* Turf info */}
        <div className="td-card">
          <div className="td-card-header">
            <span className="td-card-title">
              <i className="bi bi-info-circle" /> Turf information
            </span>
            {!editMode && (
              <div className="td-card-actions">
                <button className="td-action-btn td-action-btn--edit" onClick={() => setEditMode(true)}>
                  <i className="bi bi-pencil" /> Edit Details
                </button>
                <button className="td-action-btn td-action-btn--remove" onClick={handleRemove}>
                  <i className="bi bi-trash" /> Remove
                </button>
              </div>
            )}
            {editMode && (
              <div className="td-card-actions">
                <button className="td-action-btn td-action-btn--save" onClick={handleEditSave}>
                  <i className="bi bi-check-lg" /> Save
                </button>
                <button className="td-action-btn td-action-btn--cancel" onClick={() => setEditMode(false)}>
                  <i className="bi bi-x-lg" /> Cancel
                </button>
              </div>
            )}
          </div>

          {!editMode ? (
            <div className="td-info-grid">
              {[
                ["TURF NAME",      turf.name],
                ["VENDOR",         turf.ownerName],
                ["ADDRESS",        turf.location],
                ["PRICING",        turf.pricing],
                ["CONTACT",        turf.phone],
                ["STATUS",         turf.status],
                ["SUBMITTED DATE", turf.submittedDate],
                ["TIMING",         turf.timing],
              ].map(([label, val]) => (
                <div key={label}>
                  <p className="td-field-label">{label}</p>
                  <p className="td-field-value">{val}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="td-edit-form">
              {[
                ["name",     "Turf Name",  "text"],
                ["location", "Address",    "text"],
                ["phone",    "Contact",    "text"],
                ["pricing",  "Pricing",    "text"],
                ["status",   "Status",     "text"],
                ["timing",   "Timing",     "text"],
              ].map(([key, label, type]) => (
                <div key={key} className="td-edit-field">
                  <label className="td-field-label">{label.toUpperCase()}</label>
                  <input
                    type={type}
                    className="td-edit-input"
                    value={editData[key] ?? ""}
                    onChange={(e) => setEditData((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Uploaded photos */}
        <div className="td-card">
          <div className="td-card-header">
            <span className="td-card-title">
              <i className="bi bi-images" /> Uploaded Photos
            </span>
            <span className="td-photos-count">
              {turf.photos.length} Images Provided
            </span>
          </div>
          <div className="td-photos-grid">
            {turf.photos.length > 0
              ? turf.photos.slice(0, 4).map((src, i) => (
                  <img key={i} src={src} alt={`Turf photo ${i + 1}`} className="td-photo" />
                ))
              : Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="td-photo td-photo--empty">
                    <i className="bi bi-image" />
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* ── Category ── */}
      <div className="td-card td-card--full">
        <div className="td-card-header">
          <span className="td-card-title">
            <i className="bi bi-grid" /> Category
          </span>
        </div>
        <div className="td-category-grid">
          <div>
            <p className="td-category-label">FACILITIES</p>
            <div className="td-tags">
              {turf.amenities.map((a) => (
                <span key={a} className="td-tag">
                  <i className={`bi ${FACILITY_ICON[a] ?? "bi-check2"}`} /> {a}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="td-category-label">SPORTS</p>
            <div className="td-tags">
              {turf.sportTypes.map((s) => (
                <span key={s} className="td-tag">
                  <i className={`bi ${SPORT_ICON[s] ?? "bi-trophy"}`} />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Verification Checklist — hidden after approve/reject ── */}
      {!isDone && (
        <div className="td-card td-card--full">
          <div className="td-card-header">
            <span className="td-card-title">
              <i className="bi bi-list-check" /> Document Verification
            </span>
            <button className="td-reset-link" onClick={resetChecks} title="Untick all checkboxes">
              <i className="bi bi-arrow-clockwise" /> Reset &amp; Untick All
            </button>
          </div>
          <p className="td-checklist-hint">
            Tick each checkbox to review and verify the corresponding document below.
            All checkboxes unchecked = no documents shown.
          </p>
          <div className="td-checklist">
            {turf.verifications.map((v, i) => (
              <label key={v.label} className="td-check-row">
                <input
                  type="checkbox"
                  className="td-checkbox"
                  checked={checks[i] ?? false}
                  onChange={() => toggleCheck(i)}
                />
                <span className={`td-check-label${checks[i] ? " td-check-label--active" : ""}`}>
                  {v.label}
                </span>
                {checks[i] && (
                  <span className="td-check-indicator">
                    <i className="bi bi-eye" /> Reviewing
                  </span>
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── Documents Section ── */}
      {/* 
        RULES:
        - While PENDING: only show docs whose checkbox is ticked (checks[i] === true)
          If NO checkboxes ticked → show nothing / empty state
        - After APPROVED or REJECTED: show all verified + rejected docs (no checkboxes)
      */}
      {(docsToShow.length > 0 || isDone) && (
        <div className="td-card td-card--full">
          <div className="td-card-header">
            <span className="td-card-title">
              <i className="bi bi-file-earmark-text" /> Document Verification
            </span>
            {isDone && (
              <span className={`td-status-chip ${isApproved ? "td-status-chip--approved" : "td-status-chip--rejected"}`}>
                <i className={`bi ${isApproved ? "bi-patch-check-fill" : "bi-x-circle-fill"}`} />
                {isApproved ? "Turf Approved" : "Turf Rejected"}
              </span>
            )}
          </div>

          {docsToShow.length === 0 && isDone && (
            <div className="td-empty-docs">
              <i className="bi bi-file-earmark-x" />
              <p>No verified or rejected documents to display.</p>
            </div>
          )}

          {docsToShow.length > 0 && (
            <div className="td-docs">
              {docsToShow.map((doc, i) => {
                const currentStatus = effectiveDocStatus(doc);
                // Find the index of this doc in allDocs to check its checkbox
                const docIndex = allDocs.findIndex((d) => d.title === doc.title);
                return (
                  <div key={doc.title} className="td-doc-row">
                    <div className="td-doc-icon-wrap">
                      <i className={`bi ${doc.icon}`} />
                    </div>
                    <div className="td-doc-info">
                      <p className="td-doc-title">{doc.title}</p>
                      <p className="td-doc-sub">{doc.sub}</p>
                    </div>
                    <div className="td-doc-right">
                      <DocBadge status={currentStatus} />

                      {/* Action buttons only shown while pending and not yet verified/rejected */}
                      {isPending && currentStatus === "pending" && (
                        <div className="td-doc-actions">
                          <button
                            className="td-doc-verify-btn"
                            onClick={() => verifyDoc(doc.title)}
                          >
                            <i className="bi bi-check-lg" /> Verify
                          </button>
                          <button
                            className="td-doc-reject-btn"
                            onClick={() => rejectDoc(doc.title)}
                          >
                            <i className="bi bi-x-lg" /> Reject
                          </button>
                        </div>
                      )}

                      {/* Reminder badge if verified but 2+ other docs still pending */}
                      {isPending && currentStatus === "verified" && pendingCount > 0 && (
                        <span className="td-doc-reminder">
                          <i className="bi bi-bell" /> {pendingCount} pending
                        </span>
                      )}

                      <button className="td-preview-btn">
                        Preview <i className="bi bi-eye" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Partial verification reminder */}
          {isPending && someDocsVerified && pendingCount > 0 && (
            <div className="td-doc-reminder-bar">
              <i className="bi bi-bell-fill" />
              <span>
                <strong>Reminder:</strong> {pendingCount} document{pendingCount > 1 ? "s" : ""} still pending verification.
                Verify all to approve, or reject the turf.
              </span>
            </div>
          )}

          {/* All rejected reminder */}
          {isPending && allDocsRejected && (
            <div className="td-doc-error-bar">
              <i className="bi bi-x-octagon-fill" />
              <span>All documents rejected. Please click <strong>Reject Turf</strong> above.</span>
            </div>
          )}
        </div>
      )}

      {/* ── Remove Confirm Modal ── */}
      {showRemoveConfirm && (
        <div className="td-modal-overlay" onClick={() => setShowRemoveConfirm(false)}>
          <div className="td-modal" onClick={(e) => e.stopPropagation()}>
            <div className="td-modal-icon">
              <i className="bi bi-trash3-fill" />
            </div>
            <h2 className="td-modal-title">Remove Turf?</h2>
            <p className="td-modal-body">
              This action will permanently remove <strong>{turf.name}</strong> from the platform.
              This cannot be undone.
            </p>
            <div className="td-modal-actions">
              <button className="td-modal-btn td-modal-btn--cancel" onClick={() => setShowRemoveConfirm(false)}>
                Cancel
              </button>
              <button className="td-modal-btn td-modal-btn--confirm" onClick={confirmRemove}>
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}