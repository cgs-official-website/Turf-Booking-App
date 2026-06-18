// EditPlans.jsx
import { useState } from "react";
import { 
  FiCalendar, 
  FiPlus,
  FiTrash2,
  FiCheck,
  FiChevronLeft,
  FiRefreshCw,
  FiSave,
  FiStar
} from "react-icons/fi";
import AdminLayout from '../components/admin/AdminLayout';
import { DeletePlanModal } from '../context/DeleteModal';
import '../assets/styles/EditPlans.css';

// All plans use the same calendar icon
const PLAN_ICON = <FiCalendar size={20} />;
// All plans use the same color
const ICON_COLOR = "#22c55e";

const DURATION_OPTIONS = ["1 Month", "3 Month", "6 Month", "1 Year"];

const INITIAL_PLANS = [
  {
    id: 1,
    name: "1 Month",
    tagline: "Billed every month",
    price: 499,
    duration: "1 Month",
    billingLabel: "BILLED MONTHLY",
    isMostPopular: false,
    features: [
      "Manage your turf",
      "Booking management",
      "Payment tracking",
      "Analytics & reports",
      "Customer support",
      "Access to 100 million stock images",
    ],
  },
  {
    id: 2,
    name: "3 Months",
    tagline: "Billed every 3 months",
    price: 800,
    duration: "3 Month",
    billingLabel: "BILLED EVERY 3 MONTHS",
    isMostPopular: true,
    features: [
      "Manage your turf",
      "Booking management",
      "Payment tracking",
      "Analytics & reports",
      "Customer support",
      "Access to 100 million stock images",
    ],
  },
  {
    id: 3,
    name: "12 Months",
    tagline: "Billed every year",
    price: 8000,
    duration: "1 Year",
    billingLabel: "BILLED YEARLY",
    isMostPopular: false,
    features: [
      "Manage your turf",
      "Booking management",
      "Payment tracking",
      "Analytics & reports",
      "Customer support",
      "Access to 100 million stock images",
    ],
  },
];

let nextId = 10;

const getPeriodLabel = (duration) => {
  if (duration === "1 Month") return "month";
  if (duration === "3 Month") return "3 month";
  if (duration === "6 Month") return "6 month";
  if (duration === "1 Year") return "year";
  return duration.toLowerCase();
};

export default function EditPlans({ onBack, onSave, initialPlans }) {
  const [plans, setPlans] = useState(initialPlans || INITIAL_PLANS);
  const [selectedId, setSelectedId] = useState(initialPlans?.[0]?.id || 2);
  const [addingFeature, setAddingFeature] = useState(false);
  const [newFeatureText, setNewFeatureText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const selected = plans.find((p) => p.id === selectedId) || plans[0];

  const updateSelected = (field, value) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === selectedId ? { ...p, [field]: value } : p))
    );
  };

  const toggleMostPopular = () => {
    const willBePopular = !selected.isMostPopular;
    setPlans((prev) =>
      prev.map((p) =>
        p.id === selectedId
          ? { ...p, isMostPopular: willBePopular }
          : willBePopular ? { ...p, isMostPopular: false } : p
      )
    );
  };

  const deleteFeature = (idx) => {
    updateSelected("features", selected.features.filter((_, i) => i !== idx));
  };

  const confirmAddFeature = () => {
    if (!newFeatureText.trim()) return;
    updateSelected("features", [...selected.features, newFeatureText.trim()]);
    setNewFeatureText("");
    setAddingFeature(false);
  };

  const addNewPlan = () => {
    const id = nextId++;
    const plan = {
      id,
      name: "New Plan",
      tagline: "Billed every month",
      price: 0,
      duration: "1 Month",
      billingLabel: "BILLED MONTHLY",
      isMostPopular: false,
      features: ["Manage your turf"],
    };
    setPlans((prev) => [...prev, plan]);
    setSelectedId(id);
  };

  const handleDeletePlan = () => {
    if (plans.length === 1) return;
    const remaining = plans.filter((p) => p.id !== selectedId);
    setPlans(remaining);
    setSelectedId(remaining[0].id);
    setShowDeleteModal(false);
  };

  const reset = () => {
    setPlans(initialPlans || INITIAL_PLANS);
    setSelectedId(initialPlans?.[0]?.id || 2);
    setAddingFeature(false);
  };

  const durationToBilling = (d) => {
    if (d === "1 Month") return "BILLED MONTHLY";
    if (d === "3 Month") return "BILLED EVERY 3 MONTHS";
    if (d === "6 Month") return "BILLED EVERY 6 MONTHS";
    if (d === "1 Year") return "BILLED YEARLY";
    return "BILLED MONTHLY";
  };

  const handleDurationChange = (val) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === selectedId
          ? { ...p, duration: val, billingLabel: durationToBilling(val) }
          : p
      )
    );
  };

  const handleSaveChanges = () => {
    if (onSave) onSave(plans);
    if (onBack) onBack();
  };

  return (
    <AdminLayout>
      <div className="ep-container">
        {/* Header */}
        <div className="ep-header">
          <div className="ep-header-left">
            <button className="ep-back-btn" onClick={onBack}>
              <FiChevronLeft size={20} />
              Edit plans
            </button>
            <p className="ep-header-sub">
              Update pricing, features, and visibility. Preview updates live on the right before publishing.
            </p>
          </div>
          <div className="ep-header-actions">
            <button className="ep-reset-btn" onClick={reset}>
              <FiRefreshCw size={16} />
              Reset
            </button>
            <button className="ep-save-btn" onClick={handleSaveChanges}>
              <FiSave size={16} />
              Save Changes
            </button>
          </div>
        </div>

        {/* Main Content - 3 Column Layout */}
        <div className="ep-main">

          {/* ── Left Column – Plans List ── */}
          <div className="ep-left">
            <h3 className="ep-left-title">Plans</h3>
            <p className="ep-left-sub">Select a plan to edit.</p>

            <div className="ep-plans-list">
              {plans.map((p, idx) => (
                <div
                  key={p.id}
                  className={`ep-plan-card ${selectedId === p.id ? 'ep-plan-card-active' : ''}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  {/* Top row: icon left, Most Popular badge right */}
                  <div className="ep-plan-card-top">
                    <span className="ep-plan-icon" style={{ color: ICON_COLOR }}>
                      {PLAN_ICON}
                    </span>
                    {p.isMostPopular && (
                      <span className="ep-most-popular-badge">
                        <FiStar size={10} /> Most Popular
                      </span>
                    )}
                  </div>
                  {/* Info below */}
                  <div className="ep-plan-info">
                    <div className="ep-plan-name">{p.name}</div>
                    <div className="ep-plan-price">
                      ₹{p.price.toLocaleString("en-IN")}
                      <span className="ep-plan-period"> / {p.duration.toLowerCase()}</span>
                    </div>
                    <div className="ep-plan-billing">{p.billingLabel}</div>
                  </div>
                </div>
              ))}
            </div>

            <button className="ep-add-plan" onClick={addNewPlan}>
              <FiPlus size={16} />
              Add New Plan
            </button>
          </div>

          {/* ── Center Column – Plan Details Form ── */}
          <div className="ep-center">
            {selected && (
              <>
                <div className="ep-details-header">
                  <h3 className="ep-details-title">Plan Details</h3>
                  <button
                    className={`ep-most-popular-btn ${selected.isMostPopular ? 'ep-most-popular-btn-active' : ''}`}
                    onClick={toggleMostPopular}
                  >
                    <FiStar size={14} />
                    Most Popular
                  </button>
                </div>

                <div className="ep-field">
                  <label className="ep-label">Plan Name</label>
                  <input
                    type="text"
                    className="ep-input"
                    value={selected.name}
                    onChange={(e) => updateSelected("name", e.target.value)}
                  />
                </div>

                <div className="ep-field">
                  <label className="ep-label">Tagline</label>
                  <div className="ep-textarea-wrapper">
                    <textarea
                      className="ep-textarea"
                      value={selected.tagline}
                      onChange={(e) => updateSelected("tagline", e.target.value)}
                      rows={2}
                      maxLength={150}
                    />
                    <span className="ep-char-count">{selected.tagline.length}/150</span>
                  </div>
                </div>

                <div className="ep-section-label">PRICING &amp; DURATION</div>

                <div className="ep-two-cols">
                  <div className="ep-field">
                    <label className="ep-label">Price (₹)</label>
                    <input
                      type="number"
                      className="ep-input"
                      value={selected.price}
                      onChange={(e) => updateSelected("price", Number(e.target.value))}
                    />
                  </div>
                  <div className="ep-field">
                    <label className="ep-label">Duration</label>
                    <select
                      className="ep-input ep-select"
                      value={selected.duration}
                      onChange={(e) => handleDurationChange(e.target.value)}
                    >
                      {DURATION_OPTIONS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="ep-section-label">FEATURES</div>

                <div className="ep-features-list">
                  {selected.features.map((feature, index) => (
                    <div key={index} className="ep-feature-item">
                      <FiCheck className="ep-check" size={15} color="#22c55e" />
                      <span className="ep-feature-text">{feature}</span>
                      <button
                        className="ep-feature-delete"
                        onClick={() => deleteFeature(index)}
                      >
                        <FiTrash2 size={14} color="#ef4444" />
                      </button>
                    </div>
                  ))}

                  {addingFeature ? (
                    <div className="ep-add-feature-form">
                      <input
                        type="text"
                        className="ep-input"
                        placeholder="Enter feature name..."
                        value={newFeatureText}
                        onChange={(e) => setNewFeatureText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") confirmAddFeature();
                          if (e.key === "Escape") { setAddingFeature(false); setNewFeatureText(""); }
                        }}
                        autoFocus
                      />
                      <div className="ep-add-feature-actions">
                        <button className="ep-add-feature-confirm" onClick={confirmAddFeature}>Add</button>
                        <button className="ep-add-feature-cancel" onClick={() => { setAddingFeature(false); setNewFeatureText(""); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button className="ep-add-feature-btn" onClick={() => setAddingFeature(true)}>
                      <FiPlus size={16} />
                      Add New Feature
                    </button>
                  )}
                </div>

                <button
                  className="ep-delete-plan"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <FiTrash2 size={16} />
                  Delete plan
                </button>
              </>
            )}
          </div>

          {/* ── Right Column – Live Preview ── */}
          <div className="ep-right">
            <h3 className="ep-right-title">Live Preview</h3>
            {selected && (
              <div className={`ep-preview ${selected.isMostPopular ? 'ep-preview-popular' : ''}`}>

                {/* "Most popular" pill – top right corner */}
                {selected.isMostPopular && (
                  <div className="ep-preview-popular-tag">
                    <FiStar size={12} />
                    Most popular
                  </div>
                )}

                <div className="ep-preview-name">
                  {selected.name}
                </div>
                <div className="ep-preview-tagline">
                  {selected.tagline}
                </div>

                <div className="ep-preview-price">
                  <span className="ep-preview-currency">₹</span>
                  <span className="ep-preview-amount">
                    {selected.price.toLocaleString("en-IN")}
                  </span>
                  <span className="ep-preview-period">/ {getPeriodLabel(selected.duration)}</span>
                </div>

                <ul className="ep-preview-features">
                  {selected.features.map((feature, index) => (
                    <li key={index}>
                      <FiCheck size={14} color="#22c55e" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>

      <DeletePlanModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeletePlan}
        planName={selected?.name}
      />
    </AdminLayout>
  );
}