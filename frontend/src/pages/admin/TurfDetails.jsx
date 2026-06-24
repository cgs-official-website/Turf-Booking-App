// TurfDetails.jsx
// API:
//   GET   /turfs/admin/:id      → ADMIN — turf detail (any status)
//   PATCH /turfs/:id/approve    → ADMIN — approve
//   PATCH /turfs/:id/reject     → ADMIN — reject

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import {
  MdCategory,
  MdLocalParking,
  MdSportsSoccer,
  MdSportsCricket,
  MdSportsTennis,
  MdSportsBasketball,
  MdSports,
  MdCheck,
  MdChair
} from "react-icons/md";
import { GiShuttlecock, GiCctvCamera } from "react-icons/gi";
import { FaSwimmer, FaVolleyballBall, FaTableTennis, FaRestroom, FaFirstAid, FaRegLightbulb } from "react-icons/fa";
import { FaGlassWater } from "react-icons/fa6";
import { PiLockersFill } from "react-icons/pi";
import "../../assets/styles/turfDetails.css";

// ── Icon maps ─────────────────────────────────────────────────────────────────
const FACILITY_ICON = {
  Parking:         MdLocalParking,
  parking:         MdLocalParking,
  Water:           FaGlassWater,
  water:           FaGlassWater,
  "Drinking Water": FaGlassWater,
  "drinking water": FaGlassWater,
  Floodlights:     FaRegLightbulb,
  floodlights:     FaRegLightbulb,
  "CCTV Security": GiCctvCamera,
  CCTV:            GiCctvCamera,
  cctv:            GiCctvCamera,
  "cctv camera":   GiCctvCamera,
  Restroom:        FaRestroom,
  restroom:        FaRestroom,
  Washroom:        FaRestroom,
  washroom:        FaRestroom,
  "First Aid":     FaFirstAid,
  "first aid":     FaFirstAid,
  Lockers:         PiLockersFill,
  lockers:         PiLockersFill,
  locker:          PiLockersFill,
  "Locker Room":   PiLockersFill,
  "locker room":   PiLockersFill,
  Seating:         MdChair,
  seating:         MdChair,
};
const SPORT_ICON = {
  football:      MdSportsSoccer,
  cricket:       MdSportsCricket,
  badminton:     GiShuttlecock,
  basketball:    MdSportsBasketball,
  tennis:        MdSportsTennis,
  swimming:      FaSwimmer,
  volleyball:    FaVolleyballBall,
  "table tennis": FaTableTennis,
  "table-tennis": FaTableTennis,
  "multi-sport": MdSports,
};
const DOC_ICON = {
  "PAN Card":         "bi-person-badge",
  "Aadhaar Card":     "bi-fingerprint",
  "GST Certificate":  "bi-file-earmark-text",
  "Business License": "bi-file-earmark",
};

// Default checklist labels (DB doesn't store these — admin fills them locally)
const DEFAULT_VERIFICATIONS = [
  { label: "Identity Verified" },
  { label: "Location Verified" },
  { label: "Turf Photos Verified" },
  { label: "Contact Verified" },
  { label: "Business Verified" },
];

// ── Normalise raw API response ────────────────────────────────────────────────
function normalizeTurf(t) {
  // owner is populated: { name, email, phone }
  const ownerName = t.owner?.name ?? t.ownerName ?? t.vendor ?? "—";
  const phone     = t.owner?.phone ?? t.phone ?? t.contact ?? "—";

  const pricing = t.pricePerHour?.basePrice != null
    ? `₹${t.pricePerHour.basePrice}/hr`
    : t.pricing ?? "—";

  const sportTypes =
    t.sportTypes ??
    t.sports?.map((s) => s.toLowerCase()) ??
    (t.sportType ? [t.sportType] : []);

  // documents — from DB if present, else default documents
  let rawDocs = t.documents ?? t.docs ?? [];
  if (rawDocs.length === 0) {
    rawDocs = [
      { title: "Aadhar card", sub: "ID Proof", status: "pending", icon: "bi-fingerprint" },
      { title: "Pan card", sub: "Tax ID", status: "pending", icon: "bi-person-vcard" },
      { title: "GST certificated", sub: "Business Proof", status: "pending", icon: "bi-file-earmark-ruled" },
      { title: "EB bill", sub: "Address Proof", status: "pending", icon: "bi-lightning-charge" }
    ];
  }
  const documents = rawDocs.map((d) => {
    const raw    = (d.status ?? d.docStatus ?? "pending").toLowerCase();
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

  // verifications — from DB if stored, else use default labels all unchecked
  let verifications = DEFAULT_VERIFICATIONS.map((v) => ({ ...v, checked: false }));
  if (Array.isArray(t.verifications) && t.verifications.length > 0) {
    verifications = t.verifications.map((v) => ({
      label:   v.label,
      checked: !!v.checked,
    }));
  } else if (t.verifications && typeof t.verifications === "object") {
    verifications = [
      { label: "Identity Verified",    checked: !!t.verifications.identity },
      { label: "Location Verified",    checked: !!t.verifications.location },
      { label: "Turf Photos Verified", checked: !!t.verifications.photos   },
      { label: "Contact Verified",     checked: !!t.verifications.contact  },
      { label: "Business Verified",    checked: !!t.verifications.business },
    ];
  }

  return {
    _id:            t._id,
    displayId:      t.displayId ?? "TRF-" + (t._id?.slice(-4).toUpperCase() ?? "????"),
    name:           t.name           ?? "—",
    ownerName,
    location:       t.location       ?? t.address ?? "—",
    phone,
    pricing,
    approvalStatus: (t.approvalStatus ?? "pending").toLowerCase(),
    status:         t.isAvailable ? "Active" : "Inactive",
    timing:         t.timing         ?? "24 hrs",
    submittedDate:  t.createdAt
      ? new Date(t.createdAt).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        })
      : t.submittedDate ?? "—",
    amenities:  t.amenities  ?? t.facilities ?? [],
    sportTypes,
    photos: [
      ...(Array.isArray(t.secondaryImages) ? t.secondaryImages : []),
    ].filter(Boolean),
    verifications,
    documents,
  };
}

// ── Modals ────────────────────────────────────────────────────────────────────
function ApproveModal({ turfName, onConfirm, onCancel, acting }) {
  return (
    <div className="td-modal-backdrop" role="dialog" aria-modal="true">
      <div className="td-modal">
        <div className="td-modal-icon td-modal-icon--approve">
          <i className="bi bi-patch-check-fill" />
        </div>
        <h2 className="td-modal-title">Approve this turf?</h2>
        <p className="td-modal-body">
          All checklist items are verified and all documents are confirmed.
          <strong> {turfName}</strong> will go live for bookings.
        </p>
        <div className="td-modal-actions">
          <button className="td-modal-btn td-modal-btn--cancel" onClick={onCancel} disabled={acting}>
            Cancel
          </button>
          <button className="td-modal-btn td-modal-btn--approve" onClick={onConfirm} disabled={acting}>
            {acting ? <span className="td-spinner-sm" /> : <i className="bi bi-patch-check" />}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectModal({ onConfirm, onCancel, acting }) {
  const [reason, setReason] = useState("");
  return (
    <div className="td-modal-backdrop" role="dialog" aria-modal="true">
      <div className="td-modal">
        <div className="td-modal-icon td-modal-icon--reject">
          <i className="bi bi-x-circle-fill" />
        </div>
        <h2 className="td-modal-title">Reject this turf?</h2>
        <p className="td-modal-body">Provide a reason for rejection. This will be sent to the vendor.</p>
        <textarea
          className="td-modal-textarea"
          placeholder="Enter reason for rejection..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
        />
        <div className="td-modal-actions">
          <button className="td-modal-btn td-modal-btn--cancel" onClick={onCancel} disabled={acting}>
            Cancel
          </button>
          <button
            className="td-modal-btn td-modal-btn--reject"
            onClick={() => onConfirm(reason)}
            disabled={acting}
          >
            {acting ? <span className="td-spinner-sm" /> : <i className="bi bi-x-circle" />}
            Confirm reject
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultModal({ type, turfName, onClose }) {
  const ok = type === "approved";
  return (
    <div className="td-modal-backdrop" role="dialog" aria-modal="true">
      <div className="td-modal">
        <div className={`td-modal-icon ${ok ? "td-modal-icon--approve" : "td-modal-icon--reject"}`}>
          <i className={`bi ${ok ? "bi-check-circle-fill" : "bi-x-circle-fill"}`} />
        </div>
        <h2 className="td-modal-title">{ok ? "Turf approved!" : "Turf rejected"}</h2>
        <p className="td-modal-body">
          {ok
            ? `${turfName} has been successfully approved and is now live.`
            : "The vendor has been notified with your rejection reason."}
        </p>
        <div className="td-modal-actions" style={{ justifyContent: "center" }}>
          <button
            className={`td-modal-btn ${ok ? "td-modal-btn--approve" : "td-modal-btn--reject"}`}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

const PREDEFINED_SPORTS = [
  "football", "cricket", "badminton", "multi-sport", 
  "tennis", "basketball", "volleyball", "swimming", "table-tennis"
];

const PREDEFINED_FACILITIES = [
  "Parking", "Washroom", "Drinking Water", "First Aid", "Floodlights", "Seating", "Locker Room", "CCTV"
];

function EditCategoryModal({ turf, onConfirm, onCancel, acting }) {
  const [selectedSports, setSelectedSports] = useState([...(turf.sportTypes || [])]);
  const [selectedFacilities, setSelectedFacilities] = useState([...(turf.amenities || [])]);

  const handleToggleSport = (id) => {
    setSelectedSports(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const handleToggleFacility = (id) => {
    setSelectedFacilities(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  return (
    <div className="td-modal-backdrop" role="dialog" aria-modal="true">
      <div className="td-modal" style={{maxWidth: '500px'}}>
        <h2 className="td-modal-title">Edit Category</h2>
        <div className="td-modal-body" style={{textAlign: 'left', maxHeight: '60vh', overflowY: 'auto'}}>
          <div style={{marginBottom: '1rem'}}>
            <h3 style={{fontSize: '14px', marginBottom: '8px'}}>Sports</h3>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
              {PREDEFINED_SPORTS.map(s => (
                <label key={s} style={{display: 'flex', alignItems: 'center', gap: '4px', background: '#F3F4F6', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'}}>
                  <input type="checkbox" checked={selectedSports.includes(s)} onChange={() => handleToggleSport(s)} />
                  <span style={{fontSize: '13px'}}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 style={{fontSize: '14px', marginBottom: '8px'}}>Facilities</h3>
            <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
              {PREDEFINED_FACILITIES.map(f => (
                <label key={f} style={{display: 'flex', alignItems: 'center', gap: '4px', background: '#F3F4F6', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer'}}>
                  <input type="checkbox" checked={selectedFacilities.includes(f)} onChange={() => handleToggleFacility(f)} />
                  <span style={{fontSize: '13px'}}>{f}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="td-modal-actions">
          <button className="td-modal-btn td-modal-btn--cancel" onClick={onCancel} disabled={acting}>Cancel</button>
          <button className="td-modal-btn td-modal-btn--approve" onClick={() => onConfirm({ sports: selectedSports, facilities: selectedFacilities })} disabled={acting}>
            {acting ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── DocBadge ──────────────────────────────────────────────────────────────────
function DocBadge({ status }) {
  if (status === "verified")
    return <span className="td-doc-badge td-doc-badge--verified"><i className="bi bi-check-circle-fill" /> Verified</span>;
  if (status === "rejected")
    return <span className="td-doc-badge td-doc-badge--rejected"><i className="bi bi-x-circle-fill" /> Rejected</span>;
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TurfDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [turf,       setTurf]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [acting,     setActing]     = useState(false);
  const [modal,      setModal]      = useState(null); // null | "approve-confirm" | "reject-confirm" | "approved" | "rejected"
  const [checks,     setChecks]     = useState([]);
  const [docStatuses, setDocStatuses] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);

  const infoColRef   = useRef(null);
  const photoCardRef = useRef(null);

  // ── Fetch turf from DB via admin endpoint ─────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    // Validate ObjectId client-side before hitting the server
    const isObjectId = /^[a-f\d]{24}$/i.test(id);
    if (!isObjectId) {
      setError("Invalid turf ID.");
      setLoading(false);
      return;
    }

    async function load() {
      try {
        // Use admin route so pending/rejected turfs are visible too
        const { data } = await axiosInstance.get(`/turfs/admin/${id}`);
        if (!cancelled) initTurf(normalizeTurf(data));
      } catch (err) {
        if (!cancelled) {
          const msg = err?.response?.data?.message ?? "Failed to load turf.";
          setError(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  function initTurf(n) {
    setTurf(n);
    setChecks(n.verifications.map((v) => v.checked));
    // If turf already approved/rejected, treat all docs as verified for display
    if (n.approvalStatus !== "pending") {
      setDocStatuses(n.documents.map(() => "verified"));
    } else {
      setDocStatuses(n.documents.map((d) => d.status));
    }
    setError(null);
  }

  // ── Height sync ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!turf) return;
    function sync() {
      const ic = infoColRef.current;
      const pc = photoCardRef.current;
      if (!ic || !pc) return;
      pc.style.height = ic.offsetHeight + "px";
    }
    sync();
    const ro = new ResizeObserver(sync);
    if (infoColRef.current)  ro.observe(infoColRef.current);
    if (photoCardRef.current) ro.observe(photoCardRef.current);
    return () => ro.disconnect();
  }, [turf]);

  // ── Checklist ─────────────────────────────────────────────────────────────
  function toggleCheck(i) {
    setChecks((prev) => {
      const next = prev.map((v, idx) => (idx === i ? !v : v));
      const label = turf.verifications[i]?.label;
      
      if (label === "Identity Verified") {
        setDocStatuses((ds) => ds.map((s, dIdx) => {
          const title = turf.documents[dIdx]?.title?.toLowerCase() || "";
          if (title.includes("aadhar") || title.includes("pan")) {
            return next[i] ? "verified" : "pending";
          }
          return s;
        }));
      }

      if (label === "Business Verified") {
        setDocStatuses((ds) => ds.map((s, dIdx) => {
          const title = turf.documents[dIdx]?.title?.toLowerCase() || "";
          if (title.includes("gst") || title.includes("eb bill")) {
            return next[i] ? "verified" : "pending";
          }
          return s;
        }));
      }

      if (next.every(Boolean)) {
        // All checked → auto-verify all pending docs
        setDocStatuses((ds) => ds.map((s) => (s === "pending" ? "verified" : s)));
      }
      return next;
    });
  }

  function resetChecks() {
    setChecks(turf.verifications.map(() => false));
    setDocStatuses(turf.documents.map((d) => d.status));
  }

  // ── Doc status ────────────────────────────────────────────────────────────
  function setDocStatus(i, status) {
    setDocStatuses((prev) => prev.map((s, idx) => (idx === i ? status : s)));
  }

  // ── Approval gates ────────────────────────────────────────────────────────
  const allChecked      = checks.length > 0 && checks.every(Boolean);
  const allDocsVerified = docStatuses.length > 0
    ? docStatuses.every((s) => s === "verified")
    : true; // no documents → don't block
  const canApprove = allChecked && allDocsVerified;

  // ── PATCH /turfs/:id/approve ──────────────────────────────────────────────
  async function handleApprove() {
    setActing(true);
    try {
      await axiosInstance.patch(`/turfs/${id}/approve`);
      setTurf((prev) => ({ ...prev, approvalStatus: "approved" }));
      setModal("approved");
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Approval failed. Please try again.";
      alert(msg);
    } finally {
      setActing(false);
    }
  }

  // ── PATCH /turfs/:id/reject ───────────────────────────────────────────────
  async function handleReject(reason) {
    setActing(true);
    try {
      await axiosInstance.patch(`/turfs/${id}/reject`, { reason });
      setTurf((prev) => ({ ...prev, approvalStatus: "rejected" }));
      setModal("rejected");
    } catch (err) {
      const msg = err?.response?.data?.message ?? "Rejection failed. Please try again.";
      alert(msg);
    } finally {
      setActing(false);
    }
  }

  // ── PUT /turfs/:id ───────────────────────────────────────────────
  async function handleEditCategorySave(data) {
    setActing(true);
    try {
      await axiosInstance.put(`/turfs/${id}`, data);
      setTurf((prev) => ({ ...prev, sportTypes: data.sports, amenities: data.facilities }));
      setModal(null);
    } catch (err) {
      console.error(err);
      alert("Failed to update category.");
    } finally {
      setActing(false);
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="td-page">
        <div className="td-loading"><span className="td-spinner" /></div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error || !turf) {
    return (
      <div className="td-page">
        <div className="td-title-row">
          <button className="td-back-btn" onClick={() => navigate(-1)}>
            <i className="bi bi-arrow-left" />
          </button>
          <h1 className="td-page-title">Turf details</h1>
        </div>
        <div className="td-error-state">
          <i className="bi bi-exclamation-circle" />
          <p>{error ?? "Turf not found."}</p>
          <button className="td-modal-btn td-modal-btn--cancel" onClick={() => navigate(-1)}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  const isPending  = turf.approvalStatus === "pending";
  const isApproved = turf.approvalStatus === "approved";
  const isRejected = turf.approvalStatus === "rejected";
  const isDone     = isApproved || isRejected;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="td-page">

      {/* Modals */}
      {modal === "approve-confirm" && (
        <ApproveModal
          turfName={turf.name}
          acting={acting}
          onConfirm={handleApprove}
          onCancel={() => setModal(null)}
        />
      )}
      {modal === "reject-confirm" && (
        <RejectModal
          acting={acting}
          onConfirm={handleReject}
          onCancel={() => setModal(null)}
        />
      )}
      {(modal === "approved" || modal === "rejected") && (
        <ResultModal
          type={modal}
          turfName={turf.name}
          onClose={() => {
            setModal(null);
            navigate(-1); // go back to list after result
          }}
        />
      )}
      {modal === "edit-category" && (
        <EditCategoryModal
          turf={turf}
          acting={acting}
          onConfirm={handleEditCategorySave}
          onCancel={() => setModal(null)}
        />
      )}

      {/* Back + Title */}
      <div className="td-title-row">
        <button className="td-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <i className="bi bi-arrow-left" />
        </button>
        <h1 className="td-page-title">Turf details</h1>
      </div>

      {/* Hero card */}
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
              <button
                className={`td-btn td-btn--approve${!canApprove ? " td-btn--disabled" : ""}`}
                onClick={() => canApprove && setModal("approve-confirm")}
                disabled={!canApprove}
                title={!canApprove ? "Complete checklist and verify all documents first" : ""}
              >
                <i className="bi bi-patch-check" /> Approve Turf
              </button>
              <button
                className="td-btn td-btn--reject"
                onClick={() => setModal("reject-confirm")}
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

      {/* Status hint banner — only while pending and not ready to approve */}
      {isPending && !canApprove && (
        <div className="td-info-banner">
          <i className="bi bi-info-circle-fill" />
          {!allChecked && !allDocsVerified
            ? "Complete all checklist items and verify all documents to enable approval."
            : !allChecked
            ? "Complete all checklist items to enable approval."
            : "All documents must be verified before approving the turf."}
        </div>
      )}

      {/* Main 2-col: info + photos */}
      <div className="td-main-grid">
        <div className="td-card" ref={infoColRef}>
          <div className="td-card-header">
            <span className="td-card-title">
              <i className="bi bi-info-circle" /> Turf information
            </span>
            {/* <button className="td-edit-link">
              Edit Details
            </button> */}
          </div>
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
        </div>

        <div className="td-card td-card--photos" ref={photoCardRef} style={{display:'flex', flexDirection:'column'}}>
          <div className="td-card-header">
            <span className="td-card-title">
              <i className="bi bi-images" /> Uploaded Photos
            </span>
            <span className="td-photos-count">
              {turf.photos.length} Images Provided
            </span>
          </div>
          <div className="td-photos-grid" style={{flex:1}}>
            {turf.photos.length > 0
              ? turf.photos.slice(0, 4).map((src, i) => (
                  <img 
                    key={i} 
                    src={src} 
                    alt={`Turf photo ${i + 1}`} 
                    className="td-photo" 
                    onClick={() => setPreviewImage(src)}
                    style={{ cursor: "pointer" }}
                  />
                ))
              : Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="td-photo td-photo--empty">
                    <i className="bi bi-image" />
                  </div>
                ))}
          </div>
        </div>
      </div>

      {/* Category — full width */}
      <div className="td-card td-card--full">
        <div className="td-card-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <span className="td-card-title" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <MdCategory /> Category
          </span>
          {!isDone && (
            <button className="td-edit-link" onClick={() => setModal("edit-category")} style={{background: 'none', border: 'none', color: '#10B981', cursor: 'pointer'}}>
              <i className="bi bi-pencil" /> Edit
            </button>
          )}
        </div>
        <div className="td-category-grid">
          <div>
            <p className="td-category-label">FACILITIES</p>
            <div className="td-tags">
              {turf.amenities.length > 0
                ? turf.amenities.map((a) => {
                    const Icon = FACILITY_ICON[a] || MdCheck;
                    return (
                      <span key={a} className="td-tag" style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
                        <Icon /> {a}
                      </span>
                    );
                  })
                : <span className="td-field-value">—</span>}
            </div>
          </div>
          <div>
            <p className="td-category-label">SPORTS</p>
            <div className="td-tags">
              {turf.sportTypes.length > 0
                ? turf.sportTypes.map((s) => {
                    const Icon = SPORT_ICON[s] || MdSports;
                    return (
                      <span key={s} className="td-tag" style={{display: 'inline-flex', alignItems: 'center', gap: '4px'}}>
                        <Icon />
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </span>
                    );
                  })
                : <span className="td-field-value">—</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Verification checklist — hidden after approve/reject */}
      {!isDone && (
        <div className="td-card td-card--full">
          <div className="td-card-header">
            <span className="td-card-title">
              <i className="bi bi-list-check" /> Verification checklist
            </span>
            <button className="td-reset-link" onClick={resetChecks}>
              <i className="bi bi-arrow-clockwise" /> Reset default
            </button>
          </div>
          <div className="td-checklist">
            {turf.verifications.map((v, i) => (
              <label key={v.label} className="td-check-row">
                <input
                  type="checkbox"
                  className="td-checkbox"
                  checked={checks[i] ?? false}
                  onChange={() => toggleCheck(i)}
                />
                <span className={`td-check-label${checks[i] ? " td-check-label--checked" : ""}`}>
                  {v.label}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Documents — always visible */}
      <div className="td-card td-card--full">
        <div className="td-card-header">
          <span className="td-card-title">
            <i className="bi bi-file-earmark-text" /> Document verification
          </span>
        </div>
        <div className="td-docs">
          {turf.documents.length === 0 && (
            <p className="td-field-value" style={{ color: "var(--td-text-muted)", padding: "8px 0" }}>
              No documents submitted yet.
            </p>
          )}
          {turf.documents.map((doc, i) => {
            const status      = docStatuses[i] ?? doc.status;
            const isVerified  = status === "verified";
            const isRejected  = status === "rejected";
            const showActions = allChecked && !isDone;

            return (
              <div key={doc.title + i} className="td-doc-row">
                <div className="td-doc-icon-wrap">
                  <i className={`bi ${doc.icon}`} />
                </div>
                <div className="td-doc-info">
                  <p className="td-doc-title">{doc.title}</p>
                  <p className="td-doc-sub">{doc.sub}</p>
                </div>
                <div className="td-doc-right">
                  <DocBadge status={status} />

                  {showActions && status === "pending" && (
                    <button
                      className="td-doc-action-btn td-doc-action-btn--verify"
                      onClick={() => setDocStatus(i, "verified")}
                    >
                      <i className="bi bi-check" /> Verify
                    </button>
                  )}
                  {showActions && status === "pending" && (
                    <button
                      className="td-doc-action-btn td-doc-action-btn--reject"
                      onClick={() => setDocStatus(i, "rejected")}
                    >
                      <i className="bi bi-x" /> Reject
                    </button>
                  )}

                  <a
                    href="#preview"
                    className="td-preview-link"
                    onClick={(e) => e.preventDefault()}
                    aria-label={`Preview ${doc.title}`}
                  >
                    Preview <i className="bi bi-eye" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full-screen Image Preview Modal */}
      {previewImage && (
        <div 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.85)', zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer'
          }}
          onClick={() => setPreviewImage(null)}
        >
          <img 
            src={previewImage} 
            alt="Preview" 
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px' }} 
          />
        </div>
      )}
    </div>
  );
}