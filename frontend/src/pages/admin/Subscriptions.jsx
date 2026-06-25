// pages/admin/Subscriptions.jsx
import { useState, useEffect, useCallback } from "react";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { PiWalletDuotone } from "react-icons/pi";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { HiOutlineBadgeCheck } from "react-icons/hi";
import { HiOutlineSearch } from "react-icons/hi";
import TurfCard from "../../components/TurfCard";
import PricingCard from "../../components/PricingCard";
import EditPlans from '../../components/EditPlans';
import * as subscriptionApi from '../../services/subscription.service';
import * as turfApi from '../../services/turf.service';
import "../../assets/styles/Subscription.css";

// ─────────────────────────────────────────────
// STATIC DATA (Only icons and labels that don't come from API)
// ─────────────────────────────────────────────

const STAT_CARDS = [
  { label: "Total Subscription", value: 0, delta: "+0 this month", icon: HiOutlineBuildingOffice2 },
  { label: "Active Subscription", value: 0, delta: "+0 this month", icon: PiWalletDuotone },
  { label: "Expiring soon", value: 0, delta: "+0 this month", icon: HiOutlineLocationMarker },
  { label: "Expired", value: 0, delta: "+0 this month", icon: HiOutlineBadgeCheck },
];

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────

const toTurfCardProps = (turf) => ({
  turfId: turf._id ? `ERD-${turf._id.slice(-4).toUpperCase()}` : turf.turfId || turf.id || 'N/A',
  status: turf.subscriptionStatus || turf.status || (turf.isAvailable ? 'Active' : 'Expired'),
  title: turf.name || turf.title || turf.turfName || 'Turf',
  price: turf.pricePerHour?.basePrice || turf.pricePerHour || turf.price || 0,
  startDate: turf.startDate || turf.subscriptionStartDate || 'N/A',
  endDate: turf.endDate || turf.subscriptionEndDate || 'N/A',
  location: turf.location || turf.address?.city || turf.city || 'N/A',
  planDuration: turf.planDuration || turf.subscriptionPlan || 'N/A',
  turfImage: turf.mainImage || turf.turfImage || turf.image || null,
  logoImage: turf.logoImage || null,
});

const toDisplayPlanShape = (p) => ({
  id: p._id,
  title: p.name,
  billingLabel: p.description || "Billed every month",
  price: p.price,
  perLabel: `${p.durationDays} Days`,
  isMostPopular: !!p.isMostPopular,
  features: Array.isArray(p.featureList) && p.featureList.length > 0
    ? p.featureList
    : ["Manage your turf"],
});

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function Subscriptions() {
  const [activeTab, setActiveTab] = useState("subscription");
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("All plans");
  const [status, setStatus] = useState("Status");
  const [location, setLocation] = useState("Location");
  const [page, setPage] = useState(1);

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [planTabIndex, setPlanTabIndex] = useState(0);
  const [planPage, setPlanPage] = useState(0);

  const [turfs, setTurfs] = useState([]);
  const [filteredTurfs, setFilteredTurfs] = useState([]);
  const [showEditPlans, setShowEditPlans] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0
  });

  // ── Dynamically generated filter options ──
  const [planOptions, setPlanOptions] = useState(["All plans"]);
  const [statusOptions, setStatusOptions] = useState(["Status"]);
  const [locationOptions, setLocationOptions] = useState(["Location"]);

  // ── Load Plans ──
  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const plansResponse = await subscriptionApi.getAllPlans(true);
      const planData = plansResponse.data?.plans || [];
      const displayPlans = planData.map(toDisplayPlanShape);
      setPlans(displayPlans);

      const totalPlanPages = Math.max(1, Math.ceil(displayPlans.length / 3));
      setPlanPage(prev => Math.min(prev, totalPlanPages - 1));
      setPlanTabIndex(prev => Math.min(prev, Math.max(0, displayPlans.length - 1)));

      return displayPlans;
    } catch (planErr) {
      console.error('Could not load plans from backend:', planErr);
      return [];
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // ── Load All Data ──
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        await loadPlans();


        // 2. Load Turfs and Subscriptions (Admin only)
        let mappedTurfs = [];
        try {
          const token = localStorage.getItem('token');
          if (token) {
            // Fetch all turfs
            let turfData = [];
            try {
              const turfsResponse = await turfApi.getAllTurfs();
              if (turfsResponse?.data?.turfs) {
                turfData = turfsResponse.data.turfs;
              } else if (turfsResponse?.data) {
                turfData = turfsResponse.data;
              } else if (Array.isArray(turfsResponse)) {
                turfData = turfsResponse;
              }
            } catch (turfErr) {
              console.error('Failed to load turfs:', turfErr);
            }

            // Fetch all subscriptions
            const subsResponse = await subscriptionApi.getAllSubscriptions({ page: 1, limit: 100 });
            const subsData = subsResponse.data?.subscriptions || [];

            if (subsData.length > 0) {
              const active = subsData.filter(s => s.status === 'active' || s.status === 'trial').length;
              const expired = subsData.filter(s => s.status === 'expired').length;
              const expiringSoon = subsData.filter(s => {
                if (!s.endDate) return false;
                const daysRemaining = Math.ceil((new Date(s.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                return daysRemaining <= 7 && daysRemaining > 0;
              }).length;

              setStats({
                total: subsData.length,
                active,
                expiringSoon,
                expired
              });
            }

            const subMap = {};
            subsData.forEach(s => {
              const turfIdStr = s.turfId?._id || s.turfId || s.turf;
              if (!turfIdStr) return;
              const id = typeof turfIdStr === 'object' ? turfIdStr.toString() : turfIdStr;
              if (!subMap[id] || s.status === 'active' || s.status === 'trial') {
                  subMap[id] = s;
              }
            });

            if (turfData && turfData.length > 0) {
              mappedTurfs = turfData.map(t => {
                const s = subMap[t._id];
                
                // Only turfs with an active/trial subscription are Active. All others are Expired.
                const isActive = s && (s.status === 'active' || s.status === 'trial');
                
                let daysLeft = null;
                if (isActive && s.endDate) {
                  const remaining = Math.ceil((new Date(s.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                  daysLeft = remaining > 0 ? remaining : 0;
                }

                return {
                  turfId: t._id ? `ERD-${t._id.slice(-4).toUpperCase()}` : 'N/A',
                  status: isActive ? 'Active' : 'Expired',
                  title: t.name || t.turfName || t.title || 'Turf',
                  price: t.pricePerHour?.basePrice || t.pricePerHour || s?.price || 0,
                  startDate: s?.startDate ? new Date(s.startDate).toLocaleDateString() : 'N/A',
                  endDate: s?.endDate ? new Date(s.endDate).toLocaleDateString() : 'N/A',
                  daysLeft,
                  location: t.location || t.address?.city || t.city || 'N/A',
                  planDuration: s?.planId?.name || s?.planDuration || 'N/A',
                  turfImage: t.mainImage || t.turfImage || t.image || null,
                  logoImage: t.logoImage || null,
                };
              });
            } else if (subsData.length > 0) {
              mappedTurfs = subsData.map(s => {
                const t = s.turfId || {};
                const isActive = (s.status === 'active' || s.status === 'trial');
                
                let daysLeft = null;
                if (isActive && s.endDate) {
                  const remaining = Math.ceil((new Date(s.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                  daysLeft = remaining > 0 ? remaining : 0;
                }

                return {
                  turfId: s._id ? `ERD-${s._id.slice(-4).toUpperCase()}` : t._id ? `ERD-${t._id.slice(-4).toUpperCase()}` : 'N/A',
                  status: isActive ? 'Active' : 'Expired',
                  title: t.name || s.turfName || t.title || 'Turf',
                  price: t.pricePerHour?.basePrice || t.pricePerHour || s.price || 0,
                  startDate: s.startDate ? new Date(s.startDate).toLocaleDateString() : 'N/A',
                  endDate: s.endDate ? new Date(s.endDate).toLocaleDateString() : 'N/A',
                  daysLeft,
                  location: t.location || t.address?.city || t.city || 'N/A',
                  planDuration: s.planId?.name || s.planDuration || 'N/A',
                  turfImage: t.mainImage || t.turfImage || t.image || null,
                  logoImage: t.logoImage || null,
                };
              });
            }

          }
        } catch (err) {
          console.error('Could not load subscriptions or turfs:', err);
        }
        if (mappedTurfs.length > 0) {
          setTurfs(mappedTurfs);
          setFilteredTurfs(mappedTurfs);
        } else {
          setTurfs(FALLBACK_TURFS);
          setFilteredTurfs(FALLBACK_TURFS);
        }


      } catch (err) {
        console.error('Failed to load data:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadPlans]);

  // ── Filter Turfs ──
  useEffect(() => {
    // Don't filter if backend failed — keep filteredTurfs empty and let error state show
    if (error) return;

    const filtered = turfs.filter((t) => {
      const matchSearch   = t.title.toLowerCase().includes(search.toLowerCase().trim());
      const matchPlan     = plan === "All plans" || t.planDuration === plan;
      const matchStatus   = status === "Status" || t.status === status;
      const matchLocation = location === "Location" || t.location === location;
      return matchSearch && matchPlan && matchStatus && matchLocation;
    });
    setFilteredTurfs(filtered);
    setPage(1);
  }, [turfs, search, plan, status, location, error]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setPlan("All plans");
    setStatus("Status");
    setLocation("Location");
    setPage(1);
  };

  // ── Turf Pagination ──
  const PER_PAGE = 4;
  const totalPages = Math.max(1, Math.ceil(filteredTurfs.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filteredTurfs.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // ── Plan windowed pagination: 3 cards per page (desktop/tablet only) ──
  const PLANS_PER_PAGE = 3;
  const totalPlanPages = Math.max(1, Math.ceil(plans.length / PLANS_PER_PAGE));
  const safePlanPage = Math.min(planPage, totalPlanPages - 1);
  const visiblePlans = plans.slice(
    safePlanPage * PLANS_PER_PAGE,
    safePlanPage * PLANS_PER_PAGE + PLANS_PER_PAGE
  );

  const handlePlanTabClick = (i) => {
    setPlanTabIndex(i);
    setPlanPage(Math.floor(i / PLANS_PER_PAGE));
  };

  // ── Keyboard nav for plan tab (desktop) ──
  useEffect(() => {
    if (activeTab !== "plan") return;

    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;

      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setPlanPage((p) => Math.min(totalPlanPages - 1, p + 1));
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        setPlanPage((p) => Math.max(0, p - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, totalPlanPages]);

  // ── Stats Cards ──
  const statCards = STAT_CARDS.map((card, index) => {
    const keys = ['total', 'active', 'expiringSoon', 'expired'];
    return { ...card, value: stats[keys[index]] || 0 };
  });

  // ── Handle EditPlans save ──
  const handleEditPlansSave = useCallback(async () => {
    const updatedPlans = await loadPlans();
    if (updatedPlans && updatedPlans.length > 0) {
      setPlanTabIndex(0);
      setPlanPage(0);
    }
  }, [loadPlans]);

  if (showEditPlans) {
    return (
      <EditPlans
        onSave={handleEditPlansSave}
        onBack={() => setShowEditPlans(false)}
      />
    );
  }

  return (
    <>
      <div className="sub-page">

        {/* Page Title */}
        {activeTab === "subscription" && (
          <h1 className="sub-page__title">Subscriptions</h1>
        )}

        {/* Stat Cards */}
        {activeTab === "subscription" && (
          <div className="sub-page__stats">
            {statCards.map((s) => (
              <div key={s.label} className="sub-stat-card">
                <div className="sub-stat-card__left">
                  <span className="sub-stat-card__label">{s.label}</span>
                  <span className="sub-stat-card__value">{s.value}</span>
                  <span className="sub-stat-card__delta">{s.delta}</span>
                </div>
                <div className="sub-stat-card__icon">
                  <s.icon />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="sub-page__tabs">
          <button
            className={`sub-tab ${activeTab === "subscription" ? "sub-tab--active" : ""}`}
            onClick={() => setActiveTab("subscription")}
          >
            SUBSCRIPTION
          </button>
          <button
            className={`sub-tab ${activeTab === "plan" ? "sub-tab--active" : ""}`}
            onClick={() => setActiveTab("plan")}
          >
            PLAN MANAGEMENT
          </button>
          {activeTab === "plan" && (
            <button
              className="sub-edit-plans-btn sub-edit-plans-btn--tab-inline"
              onClick={() => setShowEditPlans(true)}
            >
              ✎ Edit plans
            </button>
          )}
        </div>

        {/* ── SUBSCRIPTION TAB ── */}
        {activeTab === "subscription" && (
          <>
            <div className="sub-page__filters">
              <div className="sub-search">
                <HiOutlineSearch className="sub-search__icon" />
                <input
                  type="text"
                  placeholder="Search turf by name"
                  value={search}
                  onChange={handleSearchChange}
                  className="sub-search__input"
                />
              </div>
              <select value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }} className="sub-select">
                {planOptions.map((o) => <option key={o}>{o}</option>)}
              </select>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sub-select">
                {statusOptions.map((o) => <option key={o}>{o}</option>)}
              </select>

              <select
                value={location}
                onChange={(e) => { setLocation(e.target.value); setPage(1); }}
                className="sub-select"
              >
                {["Location", ...new Set(turfs.map(t => t.location).filter(loc => loc && loc !== 'N/A'))].map((o) => (
                  <option key={o}>{o}</option>
                ))}

              </select>
              <button className="sub-reset-btn" onClick={resetFilters}>↺ Reset Filter</button>
            </div>

            <div className="sub-page__grid">
              {loading ? (
                <div className="sub-page__empty">Loading turfs...</div>
              ) : error ? (
                <div className="sub-page__empty" style={{ color: 'orange' }}>{error}</div>
              ) : paginated.length > 0 ? (
                paginated.map((turf) => <TurfCard key={turf.turfId} {...turf} />)
              ) : (
                <div className="sub-page__empty">No turfs match your filters.</div>
              )}
            </div>

            <div className="sub-page__pagination">
              <span className="sub-page__showing">
                Showing {paginated.length} of {filteredTurfs.length} turfs
              </span>
              <div className="sub-page__pager">
                <button
                  className="sub-pager-btn sub-pager-btn--arrow"
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    className={`sub-pager-btn sub-pager-btn--num ${safePage === n ? "sub-pager-btn--active" : ""}`}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  className="sub-pager-btn sub-pager-btn--arrow"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── PLAN MANAGEMENT TAB ── */}
        {activeTab === "plan" && (
          <div className="sub-plan-management">

            <div className="sub-plan-management__header">
              <button className="sub-edit-plans-btn" onClick={() => setShowEditPlans(true)}>
                ✎ Edit plans
              </button>
            </div>

            <div className="sub-plan-management__mobile-edit">
              <button className="sub-edit-plans-btn" onClick={() => setShowEditPlans(true)}>
                ✎ Edit plans
              </button>
            </div>

            {/* Mobile plan selector tabs */}
            <div className="sub-plan-tabs">
              {plans.map((p, i) => (
                <button
                  key={p.id}
                  className={`sub-plan-tab-btn ${planTabIndex === i ? "sub-plan-tab-btn--active" : ""}`}
                  onClick={() => handlePlanTabClick(i)}
                >
                  <span className="sub-plan-tab-btn__dot" />
                  {p.title.replace(/\s*plan\s*/i, "").trim() || p.title}
                </button>
              ))}
            </div>

            {plansLoading ? (
              <p style={{ padding: "2rem", color: "#888" }}>Loading plans...</p>
            ) : plans.length === 0 ? (
              <p style={{ padding: "2rem", color: "#888" }}>
                No plans available. Click "Edit plans" to create one.
              </p>
            ) : (
              <>
                {/* ── DESKTOP / TABLET: windowed 3-card view ── */}
                <div className="sub-plan-management__windowed">
                  <button
                    className="sub-plan-nav-btn"
                    disabled={safePlanPage === 0}
                    onClick={() => setPlanPage((p) => Math.max(0, p - 1))}
                    aria-label="Previous plans"
                  >
                    &#8249;
                  </button>

                  <div className="sub-plan-management__cards-grid">
                    {visiblePlans.map((p, i) => {
                      const globalIndex = safePlanPage * PLANS_PER_PAGE + i;
                      return (
                        <div
                          key={p.id}
                          className={[
                            "plan-card-wrapper",
                            planTabIndex === globalIndex ? "plan-card--visible" : "",
                            p.isMostPopular ? "plan-card--popular-wrapper" : "",
                          ].join(" ")}
                        >
                          <PricingCard plan={p} showAdminControls={false} />
                        </div>
                      );
                    })}
                  </div>

                  <button
                    className="sub-plan-nav-btn"
                    disabled={safePlanPage >= totalPlanPages - 1}
                    onClick={() => setPlanPage((p) => Math.min(totalPlanPages - 1, p + 1))}
                    aria-label="Next plans"
                  >
                    &#8250;
                  </button>
                </div>

                {/* ── MOBILE ONLY: render ALL plans, show only active tab card ── */}
                <div className="sub-plan-management__mobile-cards">
                  {plans.map((p, i) => (
                    <div
                      key={p.id}
                      className={[
                        "plan-card-wrapper",
                        planTabIndex === i ? "plan-card--visible" : "",
                        p.isMostPopular ? "plan-card--popular-wrapper" : "",
                      ].join(" ")}
                    >
                      <PricingCard plan={p} showAdminControls={false} />
                    </div>
                  ))}
                </div>

                {totalPlanPages > 1 && (
                  <div className="sub-plan-page-dots">
                    {Array.from({ length: totalPlanPages }, (_, i) => (
                      <button
                        key={i}
                        className={`sub-plan-dot ${safePlanPage === i ? "sub-plan-dot--active" : ""}`}
                        onClick={() => setPlanPage(i)}
                        aria-label={`Go to plan page ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

          </div>
        )}

      </div>
    </>
  );
}