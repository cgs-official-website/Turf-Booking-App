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
// STATIC DATA
// ─────────────────────────────────────────────

const STAT_CARDS = [
  { label: "Total Subscription", value: 0, delta: "+0 this month", icon: HiOutlineBuildingOffice2 },
  { label: "Active Subscription", value: 0, delta: "+0 this month", icon: PiWalletDuotone },
  { label: "Expiring soon", value: 0, delta: "+0 this month", icon: HiOutlineLocationMarker },
  { label: "Expired", value: 0, delta: "+0 this month", icon: HiOutlineBadgeCheck },
];

const FALLBACK_TURFS = [
  { turfId: "Erd-456", status: "Active", title: "Enjoy Turf Game", price: 585, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Erode", planDuration: "1 Year", turfImage: null, logoImage: null },
  { turfId: "Erd-457", status: "Active", title: "SB Landscape Turf", price: 445, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Coimbatore", planDuration: "Free trial", turfImage: null, logoImage: null },
  { turfId: "Erd-458", status: "Active", title: "Sports Hub Ventures", price: 245, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Sathiyamangalam", planDuration: "3 months", turfImage: null, logoImage: null },
  { turfId: "Erd-459", status: "Active", title: "Sports Men Turf", price: 845, startDate: "12 / 01 / 2027", endDate: "12 / 03 / 2027", location: "Gobi", planDuration: "1 Year", turfImage: null, logoImage: null },
  { turfId: "Erd-460", status: "Expired", title: "Green Valley Turf", price: 399, startDate: "01 / 02 / 2027", endDate: "01 / 05 / 2027", location: "Erode", planDuration: "3 months", turfImage: null, logoImage: null },
  { turfId: "Erd-461", status: "Active", title: "Royal Sports Arena", price: 699, startDate: "15 / 03 / 2027", endDate: "15 / 04 / 2027", location: "Coimbatore", planDuration: "1 Year", turfImage: null, logoImage: null },
  { turfId: "Erd-462", status: "Expired", title: "City Premier Turf", price: 525, startDate: "20 / 01 / 2027", endDate: "20 / 02 / 2027", location: "Gobi", planDuration: "Free trial", turfImage: null, logoImage: null },
  { turfId: "Erd-463", status: "Active", title: "Victory Sports Ground", price: 750, startDate: "05 / 02 / 2027", endDate: "05 / 03 / 2027", location: "Sathiyamangalam", planDuration: "1 Year", turfImage: null, logoImage: null },
];

const PLAN_OPTIONS = ["All plans", "1 Year", "3 months", "Free trial"];
const STATUS_OPTIONS = ["Status", "Active", "Expired"];
const LOCATION_OPTIONS = ["Location", "Erode", "Coimbatore", "Sathiyamangalam", "Gobi"];

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────

// Convert backend turf to TurfCard props
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

// Convert backend plan -> read-only PricingCard display shape
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
  const [planStartIndex, setPlanStartIndex] = useState(0);

  const [turfs, setTurfs] = useState(FALLBACK_TURFS);
  const [filteredTurfs, setFilteredTurfs] = useState(FALLBACK_TURFS);
  const [showEditPlans, setShowEditPlans] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0
  });

  // ── Load Plans Function ──
  // Always includes inactive plans so the admin "Plan Management" tab shows
  // every plan that exists in the database, not only currently-active ones.
  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const plansResponse = await subscriptionApi.getAllPlans(true);
      const planData = plansResponse.data?.plans || [];
      const displayPlans = planData.map(toDisplayPlanShape);
      setPlans(displayPlans);
      setPlanStartIndex(0);
    } catch (planErr) {
      console.error('Could not load plans from backend:', planErr);
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
        // 1. Load Plans
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
        setError('Failed to load some data. Using fallback data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [loadPlans]);

  // ── Filter Turfs ──
  useEffect(() => {
    const filtered = turfs.filter((t) => {
      const matchSearch = t.title.toLowerCase().includes(search.toLowerCase().trim());
      const matchPlan = plan === "All plans" || t.planDuration === plan;
      const matchStatus = status === "Status" || t.status === status;
      const matchLocation = location === "Location" || t.location === location;
      return matchSearch && matchPlan && matchStatus && matchLocation;
    });
    setFilteredTurfs(filtered);
    setPage(1);
  }, [turfs, search, plan, status, location]);

  // ── Handle Search ──
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);
  };

  // ── Reset Filters ──
  const resetFilters = () => {
    setSearch("");
    setPlan("All plans");
    setStatus("Status");
    setLocation("Location");
    setPage(1);
  };

  // ── Pagination (turf grid) ──
  const PER_PAGE = 4;
  const totalPages = Math.max(1, Math.ceil(filteredTurfs.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filteredTurfs.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // ── Plan Management slider — always shows exactly 3 cards, sliding by
  //    1 card at a time. Window: [planStartIndex, planStartIndex + 3) ──
  const PLANS_VISIBLE = 3;
  const maxStartIndex = Math.max(0, plans.length - PLANS_VISIBLE);
  const safeStartIndex = Math.min(planStartIndex, maxStartIndex);
  const visiblePlans = plans.slice(safeStartIndex, safeStartIndex + PLANS_VISIBLE);

  // Right arrow / Space → slide forward by 1 card. Left arrow / Backspace → slide back by 1 card.
  // Only active on the "plan" tab, and only when not typing in an input,
  // so it never hijacks the search box on the Subscription tab.
  useEffect(() => {
    if (activeTab !== "plan") return;

    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;

      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setPlanStartIndex((i) => Math.min(maxStartIndex, i + 1));
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        setPlanStartIndex((i) => Math.max(0, i - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, maxStartIndex]);

  // ── Stats Cards ──
  const statCards = STAT_CARDS.map((card, index) => {
    const keys = ['total', 'active', 'expiringSoon', 'expired'];
    return {
      ...card,
      value: stats[keys[index]] || 0
    };
  });

  // ── Show EditPlans if active ──
  if (showEditPlans) {
    return (
      <EditPlans
        onSave={loadPlans}
        onBack={() => setShowEditPlans(false)}
      />
    );
  }

  // ── Render ──
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

        {/* SUBSCRIPTION TAB */}
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
              <select
                value={plan}
                onChange={(e) => { setPlan(e.target.value); setPage(1); }}
                className="sub-select"
              >
                {PLAN_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                className="sub-select"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
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
              <button className="sub-reset-btn" onClick={resetFilters}>
                ↺ Reset Filter
              </button>
            </div>

            <div className="sub-page__grid">
              {loading ? (
                <div className="sub-page__empty">Loading turfs...</div>
              ) : error ? (
                <div className="sub-page__empty" style={{ color: 'orange' }}>{error}</div>
              ) : paginated.length > 0 ? (
                paginated.map((turf) => (
                  <TurfCard key={turf.turfId} {...turf} />
                ))
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
                  className="sub-pager-btn"
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  &#8249;
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
                  className="sub-pager-btn"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  &#8250;
                </button>
              </div>
            </div >
          </>
        )}

{/* PLAN MANAGEMENT TAB */ }
{
  activeTab === "plan" && (
    <div className="sub-plan-management">
      <div className="sub-plan-management__header">
        <button
          className="sub-edit-plans-btn"
          onClick={() => setShowEditPlans(true)}
        >
          ✎ Edit plans
        </button>
      </div>

      {/* Mobile plan selector */}
      <div className="sub-plan-tabs">
        {plans.map((p, i) => (
          <button
            key={p.id}
            className={`sub-plan-tab-btn ${planTabIndex === i ? "sub-plan-tab-btn--active" : ""}`}
            onClick={() => setPlanTabIndex(i)}
          >
            <span className="sub-plan-tab-btn__dot" />
            {p.title.replace(/\s*plan\s*/i, "").trim() || p.title}
          </button>
        ))}
      </div>

      {/* Scrollable plan cards */}
      <div className="sub-plan-management__scroll-wrapper">
        <div className="sub-plan-management__cards">
          {plansLoading ? (
            <p>Loading plans...</p>
          ) : plans.length > 0 ? (
            plans.map((p, i) => (
              <div
                key={p.id}
                className={`plan-card-wrapper ${i === planTabIndex ? "plan-card--visible" : ""}`}
              >
                <PricingCard
                  plan={p}
                  showAdminControls={false}
                />
              </div>
            ))
          ) : (
            <p>No plans available. Click "Edit plans" to create one.</p>
          )}
        </div>
      </div>
    </div>
  )
}

      </div >
    </>
  );
}
