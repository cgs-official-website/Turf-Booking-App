// components/EditPlans.jsx
import { useState, useEffect } from "react";
import {
  FiCalendar,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiChevronLeft,
  FiRefreshCw,
  FiSave,
  FiStar,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import * as subscriptionApi from "../services/subscription.service";
import "../assets/styles/EditPlans.css";

const PLAN_ICON = <FiCalendar size={20} />;

const DURATION_OPTIONS = ["1 Month", "3 Month", "6 Month", "1 Year"];
const DURATION_DAYS_MAP = {
  "1 Month": 30,
  "3 Month": 90,
  "6 Month": 180,
  "1 Year": 365,
};

function closestDurationLabel(days) {
  let best = "1 Month",
    bestDiff = Infinity;
  for (const [label, mapped] of Object.entries(DURATION_DAYS_MAP)) {
    const diff = Math.abs(mapped - days);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = label;
    }
  }
  return best;
}

function durationToBilling(duration) {
  return (
    {
      "1 Month": "BILLED MONTHLY",
      "3 Month": "BILLED EVERY 3 MONTHS",
      "6 Month": "BILLED EVERY 6 MONTHS",
      "1 Year": "BILLED YEARLY",
    }[duration] ?? "BILLED MONTHLY"
  );
}

function getPeriodLabel(duration) {
  return (
    {
      "1 Month": "month",
      "3 Month": "3 months",
      "6 Month": "6 months",
      "1 Year": "year",
    }[duration] ?? duration.toLowerCase()
  );
}

function fromBackendToEdit(p) {
  const features =
    Array.isArray(p.featureList) && p.featureList.length > 0
      ? p.featureList
      : ["Manage your turf"];
  const duration = closestDurationLabel(p.durationDays);
  return {
    _id: p._id,
    id: p._id,
    name: p.name,
    tagline: p.description || "Billed every month",
    price: p.price,
    duration,
    billingLabel: durationToBilling(duration),
    isMostPopular: !!p.isMostPopular,
    isActive: p.isActive !== undefined ? p.isActive : true,
    features,
    trialDays: p.trialDays || 0,
  };
}

function fromEditToBackend(p) {
  return {
    name: p.name,
    description: p.tagline || "",
    price: Number(p.price),
    durationDays: DURATION_DAYS_MAP[p.duration] || 30,
    trialDays: p.trialDays || 0,
    isActive: p.isActive !== undefined ? p.isActive : true,
    isMostPopular: !!p.isMostPopular,
    featureList: p.features || [],
  };
}

export default function EditPlans({ onBack, onSave }) {
  const [plans, setPlans] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [addingFeature, setAddingFeature] = useState(false);
  const [newFeatureText, setNewFeatureText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadPlans = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await subscriptionApi.getAllPlans(true);
      let planData = [];
      if (response?.data?.plans) planData = response.data.plans;
      else if (Array.isArray(response?.data)) planData = response.data;
      else if (Array.isArray(response?.plans)) planData = response.plans;

      const editPlans = planData.map(fromBackendToEdit);
      setPlans(editPlans);
      const popular = editPlans.find((p) => p.isMostPopular);
      setSelectedId(popular?.id || editPlans[0]?.id || null);
      setHasChanges(false);
    } catch (err) {
      console.error("Failed to load plans:", err);
      const msg =
        err.response?.data?.message || err.message || "Failed to load plans";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const selected = plans.find((p) => p.id === selectedId) || plans[0];

  const updateSelected = (field, value) => {
    setHasChanges(true);
    setPlans((prev) =>
      prev.map((p) => (p.id === selectedId ? { ...p, [field]: value } : p)),
    );
  };

  const toggleMostPopular = () => {
    if (!selected) return;
    const willBePopular = !selected.isMostPopular;
    setHasChanges(true);
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === selectedId) return { ...p, isMostPopular: willBePopular };
        return willBePopular ? { ...p, isMostPopular: false } : p;
      }),
    );
  };

  const deleteFeature = (idx) => {
    if (!selected) return;
    updateSelected(
      "features",
      selected.features.filter((_, i) => i !== idx),
    );
  };

  const confirmAddFeature = () => {
    if (!selected || !newFeatureText.trim()) return;
    updateSelected("features", [...selected.features, newFeatureText.trim()]);
    setNewFeatureText("");
    setAddingFeature(false);
  };

  const addNewPlan = () => {
    const newPlan = {
      id: `temp_${Date.now()}`,
      _id: null,
      name: "New Plan",
      tagline: "Billed every month",
      price: 0,
      duration: "1 Month",
      billingLabel: "BILLED MONTHLY",
      isMostPopular: false,
      isActive: true,
      features: ["Manage your turf"],
      trialDays: 0,
    };
    setPlans((prev) => [...prev, newPlan]);
    setSelectedId(newPlan.id);
    setHasChanges(true);
    toast.success("New plan added. Fill in the details and save.");
  };

  const handleDeletePlan = async () => {
    if (plans.length === 1) {
      toast.error("Cannot delete the last plan");
      return;
    }
    const planToDelete = plans.find((p) => p.id === selectedId);
    try {
      if (planToDelete._id && !String(planToDelete._id).startsWith("temp_")) {
        await subscriptionApi.deletePlan(planToDelete._id);
        toast.success("Plan deleted successfully");
      }
      const remaining = plans.filter((p) => p.id !== selectedId);
      setPlans(remaining);
      setSelectedId(remaining[0]?.id || null);
      setShowDeleteModal(false);
      setHasChanges(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete plan");
    }
  };

  const reset = async () => {
    await loadPlans();
    toast.success("Reset to latest saved state");
  };

  const handleDurationChange = (val) => {
    if (!selected) return;
    setHasChanges(true);
    setPlans((prev) =>
      prev.map((p) =>
        p.id === selectedId
          ? { ...p, duration: val, billingLabel: durationToBilling(val) }
          : p,
      ),
    );
  };

  const handleSaveChanges = async () => {
    if (!hasChanges) {
      toast("No changes to save");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      let savedCount = 0;
      const updatedPlans = [...plans];
      for (let i = 0; i < updatedPlans.length; i++) {
        const plan = updatedPlans[i];
        const payload = fromEditToBackend(plan);
        if (plan._id && !String(plan._id).startsWith("temp_")) {
          await subscriptionApi.updatePlan(plan._id, payload);
        } else {
          const response = await subscriptionApi.createPlan(payload);
          const newId = response?.data?._id || response?.data?.plan?._id;
          if (newId)
            updatedPlans[i] = { ...updatedPlans[i], _id: newId, id: newId };
        }
        savedCount++;
      }
      setPlans(updatedPlans);
      toast.success(`Successfully saved ${savedCount} plan(s)!`);
      await loadPlans();
      if (onSave) await onSave();
      if (onBack) setTimeout(() => onBack(), 500);
    } catch (err) {
      const msg =
        err.response?.data?.message || err.message || "Failed to save plans";
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="ep-container">
        <div className="ep-loading">
          <FiLoader className="ep-loading-spinner" size={40} />
          <p>Loading plans from backend...</p>
        </div>
      </div>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  if (error && plans.length === 0) {
    return (
      <div className="ep-container">
        <div className="ep-error">
          <FiAlertCircle size={40} color="#ef4444" />
          <h3>Failed to load plans</h3>
          <p>{error}</p>
          <button className="ep-retry-btn" onClick={reset}>
            <FiRefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="ep-container">
      {/* Header */}
      <div className="ep-header">
        <div className="ep-header-left">
          <button className="ep-back-btn" onClick={onBack}>
            <FiChevronLeft size={20} /> Edit plans
          </button>
          <p className="ep-header-sub">
            Update pricing, features, and visibility. Changes saved to backend.
          </p>
          {hasChanges && (
            <span className="ep-unsaved-badge">● Unsaved changes</span>
          )}
        </div>
        <div className="ep-header-actions">
          <button className="ep-reset-btn" onClick={reset} disabled={isSaving}>
            <FiRefreshCw size={16} /> Reset
          </button>
          <button
            className="ep-save-btn"
            onClick={handleSaveChanges}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <>
                <FiLoader className="ep-spin" size={16} /> Saving...
              </>
            ) : (
              <>
                <FiSave size={16} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="ep-main">
        {/* Left — Plan list */}
        <div className="ep-left">
          <h3 className="ep-left-title">Plans</h3>
          <p className="ep-left-sub">Select a plan to edit.</p>

          <div className="ep-plans-list">
            {plans.map((p) => (
              <div
                key={p.id}
                className={`ep-plan-card${selectedId === p.id ? " ep-plan-card-active" : ""}`}
                onClick={() => setSelectedId(p.id)}
              >
                <div className="ep-plan-card-top">
                  <span
                    className={`ep-plan-icon-box${p.isMostPopular ? " ep-plan-icon-box--popular" : ""}`}
                  >
                    {PLAN_ICON}
                  </span>
                  {p.isMostPopular && (
                    <span className="ep-most-popular-badge">
                      <FiStar size={10} /> Most Popular
                    </span>
                  )}
                </div>
                <div className="ep-plan-info">
                  <div className="ep-plan-name">{p.name}</div>
                  <div className="ep-plan-price">
                    ₹{p.price.toLocaleString("en-IN")}
                    <span className="ep-plan-period">
                      {" "}
                      / {p.duration.toLowerCase()}
                    </span>
                  </div>
                  <div className="ep-plan-billing">{p.billingLabel}</div>
                </div>
              </div>
            ))}
          </div>

          <button
            className="ep-add-plan"
            onClick={addNewPlan}
            disabled={isSaving}
          >
            <FiPlus size={16} /> Add New Plan
          </button>
        </div>

        {/* Center — Editor */}
        <div className="ep-center">
          {selected ? (
            <>
              <div className="ep-details-header">
                <h3 className="ep-details-title">Plan Details</h3>
                <button
                  className={`ep-most-popular-btn${selected.isMostPopular ? " ep-most-popular-btn-active" : ""}`}
                  onClick={toggleMostPopular}
                  disabled={isSaving}
                >
                  <FiStar size={14} /> Most Popular
                </button>
              </div>

              <div className="ep-field">
                <label className="ep-label">Plan Name</label>
                <input
                  type="text"
                  className="ep-input"
                  value={selected.name}
                  onChange={(e) => updateSelected("name", e.target.value)}
                  disabled={isSaving}
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
                    disabled={isSaving}
                  />
                  <span className="ep-char-count">
                    {selected.tagline.length}/150
                  </span>
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
                    onChange={(e) =>
                      updateSelected("price", Number(e.target.value))
                    }
                    disabled={isSaving}
                    min={0}
                  />
                </div>
                <div className="ep-field">
                  <label className="ep-label">Duration</label>
                  <select
                    className="ep-input ep-select"
                    value={selected.duration}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    disabled={isSaving}
                  >
                    {DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
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
                      disabled={isSaving}
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
                        if (e.key === "Escape") {
                          setAddingFeature(false);
                          setNewFeatureText("");
                        }
                      }}
                      autoFocus
                      disabled={isSaving}
                    />
                    <div className="ep-add-feature-actions">
                      <button
                        className="ep-add-feature-confirm"
                        onClick={confirmAddFeature}
                        disabled={isSaving}
                      >
                        Add
                      </button>
                      <button
                        className="ep-add-feature-cancel"
                        onClick={() => {
                          setAddingFeature(false);
                          setNewFeatureText("");
                        }}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="ep-add-feature-btn"
                    onClick={() => setAddingFeature(true)}
                    disabled={isSaving}
                  >
                    <FiPlus size={16} /> Add New Feature
                  </button>
                )}
              </div>

              <button
                className="ep-delete-plan"
                onClick={() => setShowDeleteModal(true)}
                disabled={isSaving || plans.length === 1}
              >
                <FiTrash2 size={16} />
                {plans.length === 1 ? "Cannot delete last plan" : "Delete plan"}
              </button>
            </>
          ) : (
            <div className="ep-no-plan-selected">
              <p>No plan selected</p>
              <button className="ep-add-plan" onClick={addNewPlan}>
                <FiPlus size={16} /> Add a plan
              </button>
            </div>
          )}
        </div>

        {/* Right — Preview */}
        <div className="ep-right">
          <h3 className="ep-right-title">Live Preview</h3>
          {selected ? (
            <div
              className={`ep-preview${selected.isMostPopular ? " ep-preview-popular" : ""}`}
            >
              {selected.isMostPopular && (
                <div className="ep-preview-popular-tag">
                  <FiStar size={12} /> Most popular
                </div>
              )}
              <div className="ep-preview-name">{selected.name}</div>
              <div className="ep-preview-tagline">{selected.tagline}</div>
              <div className="ep-preview-price">
                <span className="ep-preview-currency">₹</span>
                <span className="ep-preview-amount">
                  {selected.price.toLocaleString("en-IN")}
                </span>
                <span className="ep-preview-period">
                  / {getPeriodLabel(selected.duration)}
                </span>
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
          ) : (
            <div className="ep-preview-empty">
              <p>Select or create a plan to preview</p>
            </div>
          )}
        </div>
      </div>
      {/* end ep-main */}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="ep-modal-overlay">
          <div className="ep-modal">
            <h3>Delete Plan</h3>
            <p>Are you sure you want to delete "{selected?.name}"?</p>
            <div className="ep-modal-actions">
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button
                className="ep-modal-delete-btn"
                onClick={handleDeletePlan}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div> /* end ep-container */
  );
}
