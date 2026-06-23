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
  FiAlertCircle
} from "react-icons/fi";
import { toast } from 'react-hot-toast';
import AdminLayout from '../components/admin/AdminLayout';
import * as subscriptionApi from '../services/subscription.service';
import '../assets/styles/EditPlans.css';

const PLAN_ICON = <FiCalendar size={20} />;

const DURATION_OPTIONS = ["1 Month", "3 Month", "6 Month", "1 Year"];
const DURATION_DAYS_MAP = {
  "1 Month": 30,
  "3 Month": 90,
  "6 Month": 180,
  "1 Year": 365
};

const closestDurationLabel = (days) => {
  let best = "1 Month";
  let bestDiff = Infinity;
  for (const [label, mapped] of Object.entries(DURATION_DAYS_MAP)) {
    const diff = Math.abs(mapped - days);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = label;
    }
  }
  return best;
};

const durationToBilling = (duration) => {
  const map = {
    "1 Month": "Billed monthly",
    "3 Month": "Billed every 3 months",
    "6 Month": "Billed every 6 months",
    "1 Year": "Billed yearly"
  };
  return map[duration] || "Billed monthly";
};

const getPeriodLabel = (duration) => {
  if (duration === "1 Month") return "month";
  if (duration === "3 Month") return "3 months";
  if (duration === "6 Month") return "6 months";
  if (duration === "1 Year") return "year";
  return duration.toLowerCase();
};

// Convert backend plan to frontend (EditPlans) format
const fromBackendToEdit = (backendPlan) => {
  const features =
    Array.isArray(backendPlan.featureList) && backendPlan.featureList.length > 0
      ? backendPlan.featureList
      : ["Manage your turf"];

  const duration = closestDurationLabel(backendPlan.durationDays);

  return {
    _id: backendPlan._id,
    id: backendPlan._id,
    name: backendPlan.name,
    tagline: backendPlan.description || "Billed every month",
    price: backendPlan.price,
    duration: duration,
    billingLabel: durationToBilling(duration),
    isMostPopular: !!backendPlan.isMostPopular,
    isActive: backendPlan.isActive !== undefined ? backendPlan.isActive : true,
    features: features,
    trialDays: backendPlan.trialDays || 0,
  };
};

// Convert frontend (EditPlans) plan to backend payload
const fromEditToBackend = (editPlan) => {
  return {
    name: editPlan.name,
    description: editPlan.tagline || "",
    price: Number(editPlan.price),
    durationDays: DURATION_DAYS_MAP[editPlan.duration] || 30,
    trialDays: editPlan.trialDays || 0,
    isActive: editPlan.isActive !== undefined ? editPlan.isActive : true,
    isMostPopular: !!editPlan.isMostPopular,
    featureList: editPlan.features || [],
  };
};

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

  // ── Load plans from backend ──
  const loadPlans = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await subscriptionApi.getAllPlans(true);

      let planData = [];
      if (response?.data?.plans) {
        planData = response.data.plans;
      } else if (Array.isArray(response?.data)) {
        planData = response.data;
      } else if (Array.isArray(response?.plans)) {
        planData = response.plans;
      }

      const editPlans = planData.map(fromBackendToEdit);

      setPlans(editPlans);
      const mostPopular = editPlans.find((p) => p.isMostPopular);
      setSelectedId(mostPopular?.id || editPlans[0]?.id || null);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to load plans:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to load plans';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === selectedId) {
          setHasChanges(true);
          return { ...p, [field]: value };
        }
        return p;
      })
    );
  };

  const toggleMostPopular = () => {
    if (!selected) return;
    const willBePopular = !selected.isMostPopular;
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === selectedId) {
          return { ...p, isMostPopular: willBePopular };
        }
        if (willBePopular) {
          return { ...p, isMostPopular: false };
        }
        return p;
      })
    );
    setHasChanges(true);
  };

  const deleteFeature = (idx) => {
    if (!selected) return;
    updateSelected("features", selected.features.filter((_, i) => i !== idx));
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
      billingLabel: "Billed monthly",
      isMostPopular: false,
      isActive: true,
      features: ["Manage your turf"],
      trialDays: 0,
    };
    setPlans((prev) => [...prev, newPlan]);
    setSelectedId(newPlan.id);
    setHasChanges(true);
    toast.success('New plan added. Fill in the details and save.');
  };

  const handleDeletePlan = async () => {
    if (plans.length === 1) {
      toast.error('Cannot delete the last plan');
      return;
    }

    const planToDelete = plans.find((p) => p.id === selectedId);

    try {
      if (planToDelete._id && !planToDelete._id.toString().startsWith('temp_')) {
        await subscriptionApi.deletePlan(planToDelete._id);
        toast.success('Plan deleted successfully');
      }

      const remaining = plans.filter((p) => p.id !== selectedId);
      setPlans(remaining);
      setSelectedId(remaining[0]?.id || null);
      setShowDeleteModal(false);
      setHasChanges(true);
    } catch (err) {
      console.error('Delete failed:', err);
      const msg = err.response?.data?.message || 'Failed to delete plan';
      toast.error(msg);
    }
  };

  const reset = async () => {
    await loadPlans();
    toast.success('Reset to latest saved state');
  };

  const handleDurationChange = (val) => {
    if (!selected) return;
    setPlans((prev) =>
      prev.map((p) => {
        if (p.id === selectedId) {
          setHasChanges(true);
          return { 
            ...p, 
            duration: val, 
            billingLabel: durationToBilling(val) 
          };
        }
        return p;
      })
    );
  };

  // ── Save all plans to backend ──
  const handleSaveChanges = async () => {
    if (!hasChanges) {
      toast('No changes to save');
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

        if (plan._id && !plan._id.toString().startsWith('temp_')) {
          await subscriptionApi.updatePlan(plan._id, payload);
        } else {
          const response = await subscriptionApi.createPlan(payload);

          let newId = null;
          if (response?.data?._id) {
            newId = response.data._id;
          } else if (response?.data?.plan?._id) {
            newId = response.data.plan._id;
          }

          if (newId) {
            updatedPlans[i] = { ...updatedPlans[i], _id: newId, id: newId };
          }
        }
        savedCount++;
      }

      setPlans(updatedPlans);
      toast.success(`Successfully saved ${savedCount} plan(s)!`);

      await loadPlans();

      if (onSave) {
        await onSave();
      }

      if (onBack) {
        setTimeout(() => onBack(), 500);
      }
    } catch (err) {
      console.error('Save failed:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to save plans';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <AdminLayout>
        <div className="ep-container">
          <div className="ep-loading">
            <FiLoader className="ep-loading-spinner" size={40} />
            <p>Loading plans from backend...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error && plans.length === 0) {
    return (
      <AdminLayout>
        <div className="ep-container">
          <div className="ep-error">
            <FiAlertCircle size={40} color="#ef4444" />
            <h3>Failed to load plans</h3>
            <p>{error}</p>
            <button className="ep-retry-btn" onClick={reset}>
              <FiRefreshCw size={16} />
              Retry
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="ep-container">

        {/* ── Mobile Header: "Plain edit" title only ── */}
        <div className="ep-mobile-header">
          <button className="ep-back-btn" onClick={onBack}>
            <FiChevronLeft size={20} />
            Plain edit
          </button>
        </div>

        {/* ── Mobile: Horizontal scrollable plan tab cards ── */}
        <div className="ep-mobile-plan-tabs">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`ep-mobile-plan-tab ${selectedId === p.id ? 'ep-mobile-plan-tab--active' : ''}`}
              onClick={() => setSelectedId(p.id)}
            >
              <div className="ep-mobile-plan-tab__top">
                <span className={`ep-mobile-plan-tab__icon ${p.isMostPopular ? 'ep-mobile-plan-tab__icon--popular' : ''}`}>
                  {PLAN_ICON}
                </span>
                {p.isMostPopular && (
                  <span className="ep-mobile-plan-tab__popular-badge">
                    <FiStar size={9} /> Popular
                  </span>
                )}
              </div>
              <div className="ep-mobile-plan-tab__name">{p.name}</div>
              <div className="ep-mobile-plan-tab__price">
                {p.price} / {getPeriodLabel(p.duration)}
              </div>
              <div className="ep-mobile-plan-tab__billing">{p.billingLabel}</div>
            </div>
          ))}

          {/* Add Plan card */}
          <div className="ep-mobile-plan-tab ep-mobile-plan-tab--add" onClick={addNewPlan}>
            <div className="ep-mobile-plan-tab__add-icon">
              <FiPlus size={22} />
            </div>
            <div className="ep-mobile-plan-tab__add-label">Add plan</div>
          </div>
        </div>

        {/* ── Mobile: Reset + Save row ── */}
        <div className="ep-mobile-actions">
          <button 
            className="ep-reset-btn" 
            onClick={reset}
            disabled={isSaving}
          >
            <FiRefreshCw size={16} />
            Reset
          </button>
          <button 
            className="ep-save-btn" 
            onClick={handleSaveChanges}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <>
                <FiLoader className="ep-spin" size={16} />
                Saving...
              </>
            ) : (
              <>
                <FiSave size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>

        {/* ── Desktop Header (hidden on mobile) ── */}
        <div className="ep-header">
          <div className="ep-header-left">
            <button className="ep-back-btn" onClick={onBack}>
              <FiChevronLeft size={20} />
              Edit plans
            </button>
            <p className="ep-header-sub">
              Update pricing, features, and visibility. Changes saved to backend.
            </p>
            {hasChanges && (
              <span className="ep-unsaved-badge">● Unsaved changes</span>
            )}
          </div>
          <div className="ep-header-actions">
            <button 
              className="ep-reset-btn" 
              onClick={reset}
              disabled={isSaving}
            >
              <FiRefreshCw size={16} />
              Reset
            </button>
            <button 
              className="ep-save-btn" 
              onClick={handleSaveChanges}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <>
                  <FiLoader className="ep-spin" size={16} />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="ep-main">

          {/* Left Column – Desktop plan list */}
          <div className="ep-left">
            <h3 className="ep-left-title">Plans</h3>
            <p className="ep-left-sub">Select a plan to edit.</p>

            <div className="ep-plans-list">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className={`ep-plan-card ${selectedId === p.id ? 'ep-plan-card-active' : ''}`}
                  onClick={() => setSelectedId(p.id)}
                >
                  <div className="ep-plan-card-top">
                    <span className={`ep-plan-icon-box ${p.isMostPopular ? 'ep-plan-icon-box--popular' : ''}`}>
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
                      <span className="ep-plan-period"> / {p.duration.toLowerCase()}</span>
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
              <FiPlus size={16} />
              Add New Plan
            </button>
          </div>

          {/* Center Column – Form */}
          <div className="ep-center">
            {selected ? (
              <>
                <div className="ep-details-header">
                  <h3 className="ep-details-title">Plan Details</h3>
                  <button
                    className={`ep-most-popular-btn ${selected.isMostPopular ? 'ep-most-popular-btn-active' : ''}`}
                    onClick={toggleMostPopular}
                    disabled={isSaving}
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
                    <span className="ep-char-count">{selected.tagline.length}/150</span>
                  </div>
                </div>

                <div className="ep-section-label">PRICING &amp; DURATION</div>

                <div className="ep-two-cols">
                  <div className="ep-field">
                    <label className="ep-label">Price (£)</label>
                    <input
                      type="number"
                      className="ep-input"
                      value={selected.price}
                      onChange={(e) => updateSelected("price", Number(e.target.value))}
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
                      <FiPlus size={16} />
                      Add New Feature
                    </button>
                  )}
                </div>

                <button
                  className="ep-delete-plan"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={isSaving || plans.length === 1}
                >
                  <FiTrash2 size={16} />
                  {plans.length === 1 ? 'Cannot delete last plan' : 'Delete plan'}
                </button>
              </>
            ) : (
              <div className="ep-no-plan-selected">
                <p>No plan selected</p>
                <button className="ep-add-plan" onClick={addNewPlan}>
                  <FiPlus size={16} />
                  Add a plan
                </button>
              </div>
            )}
          </div>

          {/* Right Column – Live Preview */}
          <div className="ep-right">
            <h3 className="ep-right-title">Live Preview</h3>
            {selected ? (
              <div className={`ep-preview ${selected.isMostPopular ? 'ep-preview-popular' : ''}`}>
                {selected.isMostPopular && (
                  <div className="ep-preview-popular-tag">
                    <FiStar size={12} />
                    Most popular
                  </div>
                )}
                <div className="ep-preview-name">{selected.name}</div>
                <div className="ep-preview-tagline">{selected.tagline}</div>
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
            ) : (
              <div className="ep-preview-empty">
                <p>Select or create a plan to preview</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="ep-modal-overlay">
          <div className="ep-modal">
            <h3>Delete Plan</h3>
            <p>Are you sure you want to delete "{selected?.name}"?</p>
            <div className="ep-modal-actions">
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button onClick={handleDeletePlan} className="ep-modal-delete-btn">Delete</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
