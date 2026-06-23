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
  { turfId: "Erd-460", status: "Inactive", title: "Green Valley Turf", price: 399, startDate: "01 / 02 / 2027", endDate: "01 / 05 / 2027", location: "Erode", planDuration: "3 months", turfImage: null, logoImage: null },
  { turfId: "Erd-461", status: "Active", title: "Royal Sports Arena", price: 699, startDate: "15 / 03 / 2027", endDate: "15 / 04 / 2027", location: "Coimbatore", planDuration: "1 Year", turfImage: null, logoImage: null },
  { turfId: "Erd-462", status: "Inactive", title: "City Premier Turf", price: 525, startDate: "20 / 01 / 2027", endDate: "20 / 02 / 2027", location: "Gobi", planDuration: "Free trial", turfImage: null, logoImage: null },
  { turfId: "Erd-463", status: "Active", title: "Victory Sports Ground", price: 750, startDate: "05 / 02 / 2027", endDate: "05 / 03 / 2027", location: "Sathiyamangalam", planDuration: "1 Year", turfImage: null, logoImage: null },
];

const PLAN_OPTIONS = ["All plans", "1 Year", "3 months", "Free trial"];
const STATUS_OPTIONS = ["Status", "Active", "Inactive", "Expired"];
const LOCATION_OPTIONS = ["Location", "Erode", "Coimbatore", "Sathiyamangalam", "Gobi"];

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────

const toTurfCardProps = (turf) => ({
  turfId: turf._id || turf.turfId,
  status: turf.approvalStatus || turf.status || "Active",
  title: turf.name || turf.title || "Turf",
  price: turf.pricePerHour?.basePrice || turf.price || 0,
  startDate: turf.startDate || "N/A",
  endDate: turf.endDate || "N/A",
  location: turf.location || turf.address?.city || "N/A",
  planDuration: turf.planDuration || "N/A",
  turfImage: turf.mainImage || turf.turfImage || null,
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
  // ── State ──
  const [activeTab, setActiveTab] = useState("subscription");
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("All plans");
  const [status, setStatus] = useState("Status");
  const [location, setLocation] = useState("Location");
  const [page, setPage] = useState(1);
  const [planPeriod, setPlanPeriod] = useState("1 month");

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [planPage, setPlanPage] = useState(1);

  const [turfs, setTurfs] = useState(FALLBACK_TURFS);
  const [filteredTurfs, setFilteredTurfs] = useState(FALLBACK_TURFS);
  const [showEditPlans, setShowEditPlans] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
  });

  // ── Load Plans ──
  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const plansResponse = await subscriptionApi.getAllPlans(true);
      const planData = plansResponse.data?.plans || [];
      const displayPlans = planData.map(toDisplayPlanShape);
      setPlans(displayPlans);
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
        await loadPlans();

        try {
          const turfsResponse = await turfApi.getAllTurfs();
          let turfData = [];
          if (turfsResponse?.data?.turfs) {
            turfData = turfsResponse.data.turfs;
          } else if (turfsResponse?.data) {
            turfData = turfsResponse.data;
          } else if (Array.isArray(turfsResponse)) {
            turfData = turfsResponse;
          }

          if (turfData && turfData.length > 0) {
            const mappedTurfs = turfData.map(toTurfCardProps);
            setTurfs(mappedTurfs);
            setFilteredTurfs(mappedTurfs);
          } else {
            setTurfs(FALLBACK_TURFS);
            setFilteredTurfs(FALLBACK_TURFS);
          }
        } catch (turfErr) {
          console.error('Failed to load turfs:', turfErr);
          setTurfs(FALLBACK_TURFS);
          setFilteredTurfs(FALLBACK_TURFS);
        }

        try {
          const token = localStorage.getItem('token');
          if (!token) return;

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

            setStats({ total: subsData.length, active, expiringSoon, expired });
          }
        } catch (subsErr) {
          console.error('Could not load subscription stats:', subsErr);
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

  // ── Handlers ──
  const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };
  const resetFilters = () => { setSearch(""); setPlan("All plans"); setStatus("Status"); setLocation("Location"); setPage(1); };

  // ── Pagination for Turfs ──
  const PER_PAGE = 4;
  const totalPages = Math.max(1, Math.ceil(filteredTurfs.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filteredTurfs.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  // ── Pagination for Plans ──
  const PLANS_PER_PAGE = 3;
  const totalPlanPages = Math.max(1, Math.ceil(plans.length / PLANS_PER_PAGE));
  const safePlanPage = Math.min(planPage, totalPlanPages);
  const paginatedPlans = plans.slice((safePlanPage - 1) * PLANS_PER_PAGE, safePlanPage * PLANS_PER_PAGE);

  // ── Stat cards with live values ──
  const statCards = STAT_CARDS.map((card, index) => {
    const keys = ['total', 'active', 'expiringSoon', 'expired'];
    return { ...card, value: stats[keys[index]] || 0 };
  });

  // ── Show EditPlans view ──
  if (showEditPlans) {
    return (
      <EditPlans
        onSave={loadPlans}
        onBack={() => setShowEditPlans(false)}
      />
    );
  }

  // ── Get filtered plans based on selected period ──
  const getFilteredPlans = () => {
    if (plans.length === 0) return [];
    
    let filtered = [];
    if (planPeriod === "1 month") {
      filtered = plans.filter(p => 
        p.perLabel?.includes("30") || 
        p.title?.toLowerCase().includes("monthly") ||
        p.title?.toLowerCase().includes("1 month")
      );
    } else if (planPeriod === "3 month") {
      filtered = plans.filter(p => 
        p.perLabel?.includes("90") || 
        p.title?.toLowerCase().includes("3 month") ||
        p.title?.toLowerCase().includes("quarterly")
      );
    } else if (planPeriod === "yearly") {
      filtered = plans.filter(p => 
        p.perLabel?.includes("365") || 
        p.title?.toLowerCase().includes("yearly") ||
        p.title?.toLowerCase().includes("annual")
      );
    }
    
    if (filtered.length === 0) {
      return plans;
    }
    return filtered;
  };

  const filteredPlans = getFilteredPlans();

  // ── Render ──
  return (
    <div className="subscription-management-container">
      {/* ── Page Title ── */}
      <h1 className="sub-page-title">Subscriptions</h1>

      {/* ── Stat Cards ── */}
      <div className="sub-stats-section">
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

      {/* ── Tabs ── */}
      <div className="sub-tabs-section">
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
      </div>

      {/* ════════════════════════════════════════
            SUBSCRIPTION TAB
            ════════════════════════════════════════ */}
      {activeTab === "subscription" && (
        <>
          {/* ── Filters ── */}
          <div className="sub-filters-section">
            <div className="sub-search-wrapper">
              <HiOutlineSearch className="sub-search-icon" />
              <input
                type="text"
                placeholder="Search turf by name"
                value={search}
                onChange={handleSearchChange}
                className="sub-search-input"
              />
            </div>
            <select
              value={plan}
              onChange={(e) => { setPlan(e.target.value); setPage(1); }}
              className="sub-filter-select"
            >
              {PLAN_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <select
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
              className="sub-filter-select"
            >
              {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <select
              value={location}
              onChange={(e) => { setLocation(e.target.value); setPage(1); }}
              className="sub-filter-select"
            >
              {LOCATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
            <button className="sub-reset-filter-btn" onClick={resetFilters}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                width="16"
                height="16"
                style={{ strokeWidth: 2 }}
              >
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2-8.94"></path>
              </svg>
              Reset filter
            </button>
          </div>

          {/* ── Turf Grid - 2 Columns ── */}
          <div className="sub-turf-grid">
            {loading ? (
              <div className="sub-grid-message">Loading turfs...</div>
            ) : error ? (
              <div className="sub-grid-message" style={{ color: "orange" }}>{error}</div>
            ) : paginated.length > 0 ? (
              paginated.map((turf) => (
                <div className="sub-turf-item" key={turf.turfId}>
                  <TurfCard {...turf} />
                </div>
              ))
            ) : (
              <div className="sub-grid-message">No turfs match your filters.</div>
            )}
          </div>

          {/* ── Pagination ── */}
          <div className="sub-pagination-container">
            <button
              className="sub-pagination-arrow"
              disabled={safePage === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ‹
            </button>

            <div className="sub-page-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  className={`sub-page-number ${safePage === n ? "active" : ""}`}
                  onClick={() => setPage(n)}
                >
                  {n}
                </button>
              ))}
            </div>

            <button
              className="sub-pagination-arrow"
              disabled={safePage === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              ›
            </button>

            <div className="sub-pagination-info">
              Showing {paginated.length} of {filteredTurfs.length} results | Rows
              per page <span className="sub-rows-per-page">04</span>
            </div>
          </div>
        </>
      )}

      {/* ════════════════════════════════════════
            PLAN MANAGEMENT TAB
            ════════════════════════════════════════ */}
      {activeTab === "plan" && (
        <>
          {/* ── Plan Management Header ── */}
{/* Plan Management Header */}
<div className="sub-plan-header-section">
  <div className="sub-plan-tabs">
    <button 
      className={`sub-plan-period-tab ${planPeriod === "1 month" ? "sub-plan-period-tab--active" : ""}`}
      onClick={() => setPlanPeriod("1 month")}
    >
      <span className="sub-plan-radio"></span>
      1 month
    </button>
    <button 
      className={`sub-plan-period-tab ${planPeriod === "3 month" ? "sub-plan-period-tab--active" : ""}`}
      onClick={() => setPlanPeriod("3 month")}
    >
      <span className="sub-plan-radio"></span>
      3 month
    </button>
    <button 
      className={`sub-plan-period-tab ${planPeriod === "yearly" ? "sub-plan-period-tab--active" : ""}`}
      onClick={() => setPlanPeriod("yearly")}
    >
      <span className="sub-plan-radio"></span>
      yearly
    </button>
  </div>
  <button
    className="sub-edit-plans-btn"
    onClick={() => setShowEditPlans(true)}
  >
    <span className="edit-icon">✎</span>
    Edit plans
  </button>
</div>
          {/* ── Plan Cards ── */}
          <div className="sub-plan-grid">
            {plansLoading ? (
              <div className="sub-grid-message">Loading plans...</div>
            ) : filteredPlans.length > 0 ? (
              filteredPlans.map((p) => (
                <div key={p.id} className="sub-plan-item">
                  <PricingCard
                    plan={p}
                    showAdminControls={false}
                  />
                </div>
              ))
            ) : (
              <div className="sub-grid-message">No plans available. Click "Edit plans" to create one.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// // pages/admin/Subscriptions.jsx
// import { useState, useEffect, useCallback } from "react";
// import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
// import { PiWalletDuotone } from "react-icons/pi";
// import { HiOutlineLocationMarker } from "react-icons/hi";
// import { HiOutlineBadgeCheck } from "react-icons/hi";
// import { HiOutlineSearch } from "react-icons/hi";
// import TurfCard from "../../components/TurfCard";
// import PricingCard from "../../components/PricingCard";
// import EditPlans from '../../components/EditPlans';
// import * as subscriptionApi from '../../services/subscription.service';
// import * as turfApi from '../../services/turf.service';
// import "../../assets/styles/Subscription.css";

// // ─────────────────────────────────────────────
// // STATIC DATA
// // ─────────────────────────────────────────────

// const STAT_CARDS = [
//   { label: "Total Subscription", value: 0, delta: "+0 this month", icon: HiOutlineBuildingOffice2 },
//   { label: "Active Subscription", value: 0, delta: "+0 this month", icon: PiWalletDuotone },
//   { label: "Expiring soon", value: 0, delta: "+0 this month", icon: HiOutlineLocationMarker },
//   { label: "Expired", value: 0, delta: "+0 this month", icon: HiOutlineBadgeCheck },
// ];

// const FALLBACK_TURFS = [
//   { turfId: "Erd-456", status: "Active", title: "Enjoy Turf Game", price: 585, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Erode", planDuration: "1 Year", turfImage: null, logoImage: null },
//   { turfId: "Erd-457", status: "Active", title: "SB Landscape Turf", price: 445, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Coimbatore", planDuration: "Free trial", turfImage: null, logoImage: null },
//   { turfId: "Erd-458", status: "Active", title: "Sports Hub Ventures", price: 245, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Sathiyamangalam", planDuration: "3 months", turfImage: null, logoImage: null },
//   { turfId: "Erd-459", status: "Active", title: "Sports Men Turf", price: 845, startDate: "12 / 01 / 2027", endDate: "12 / 03 / 2027", location: "Gobi", planDuration: "1 Year", turfImage: null, logoImage: null },
//   { turfId: "Erd-460", status: "Inactive", title: "Green Valley Turf", price: 399, startDate: "01 / 02 / 2027", endDate: "01 / 05 / 2027", location: "Erode", planDuration: "3 months", turfImage: null, logoImage: null },
//   { turfId: "Erd-461", status: "Active", title: "Royal Sports Arena", price: 699, startDate: "15 / 03 / 2027", endDate: "15 / 04 / 2027", location: "Coimbatore", planDuration: "1 Year", turfImage: null, logoImage: null },
//   { turfId: "Erd-462", status: "Inactive", title: "City Premier Turf", price: 525, startDate: "20 / 01 / 2027", endDate: "20 / 02 / 2027", location: "Gobi", planDuration: "Free trial", turfImage: null, logoImage: null },
//   { turfId: "Erd-463", status: "Active", title: "Victory Sports Ground", price: 750, startDate: "05 / 02 / 2027", endDate: "05 / 03 / 2027", location: "Sathiyamangalam", planDuration: "1 Year", turfImage: null, logoImage: null },
// ];

// const PLAN_OPTIONS = ["All plans", "1 Year", "3 months", "Free trial"];
// const STATUS_OPTIONS = ["Status", "Active", "Inactive", "Expired"];
// const LOCATION_OPTIONS = ["Location", "Erode", "Coimbatore", "Sathiyamangalam", "Gobi"];

// // ─────────────────────────────────────────────
// // HELPER FUNCTIONS
// // ─────────────────────────────────────────────

// const toTurfCardProps = (turf) => ({
//   turfId: turf._id || turf.turfId,
//   status: turf.approvalStatus || turf.status || "Active",
//   title: turf.name || turf.title || "Turf",
//   price: turf.pricePerHour?.basePrice || turf.price || 0,
//   startDate: turf.startDate || "N/A",
//   endDate: turf.endDate || "N/A",
//   location: turf.location || turf.address?.city || "N/A",
//   planDuration: turf.planDuration || "N/A",
//   turfImage: turf.mainImage || turf.turfImage || null,
//   logoImage: turf.logoImage || null,
// });

// const toDisplayPlanShape = (p) => ({
//   id: p._id,
//   title: p.name,
//   billingLabel: p.description || "Billed every month",
//   price: p.price,
//   perLabel: `${p.durationDays} Days`,
//   isMostPopular: !!p.isMostPopular,
//   features: Array.isArray(p.featureList) && p.featureList.length > 0
//     ? p.featureList
//     : ["Manage your turf"],
// });

// // ─────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────

// export default function Subscriptions() {
//   // ── State ──
//   const [activeTab, setActiveTab] = useState("subscription");
//   const [search, setSearch] = useState("");
//   const [plan, setPlan] = useState("All plans");
//   const [status, setStatus] = useState("Status");
//   const [location, setLocation] = useState("Location");
//   const [page, setPage] = useState(1);
//   const [planPeriod, setPlanPeriod] = useState("1 month");

//   const [plans, setPlans] = useState([]);
//   const [plansLoading, setPlansLoading] = useState(true);
//   const [planPage, setPlanPage] = useState(1);

//   const [turfs, setTurfs] = useState(FALLBACK_TURFS);
//   const [filteredTurfs, setFilteredTurfs] = useState(FALLBACK_TURFS);
//   const [showEditPlans, setShowEditPlans] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [stats, setStats] = useState({
//     total: 0,
//     active: 0,
//     expiringSoon: 0,
//     expired: 0,
//   });

//   // ── Load Plans ──
//   const loadPlans = useCallback(async () => {
//     setPlansLoading(true);
//     try {
//       const plansResponse = await subscriptionApi.getAllPlans(true);
//       const planData = plansResponse.data?.plans || [];
//       const displayPlans = planData.map(toDisplayPlanShape);
//       setPlans(displayPlans);
//     } catch (planErr) {
//       console.error('Could not load plans from backend:', planErr);
//     } finally {
//       setPlansLoading(false);
//     }
//   }, []);

//   // ── Load All Data ──
//   useEffect(() => {
//     const loadData = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         await loadPlans();

//         try {
//           const turfsResponse = await turfApi.getAllTurfs();
//           let turfData = [];
//           if (turfsResponse?.data?.turfs) {
//             turfData = turfsResponse.data.turfs;
//           } else if (turfsResponse?.data) {
//             turfData = turfsResponse.data;
//           } else if (Array.isArray(turfsResponse)) {
//             turfData = turfsResponse;
//           }

//           if (turfData && turfData.length > 0) {
//             const mappedTurfs = turfData.map(toTurfCardProps);
//             setTurfs(mappedTurfs);
//             setFilteredTurfs(mappedTurfs);
//           } else {
//             setTurfs(FALLBACK_TURFS);
//             setFilteredTurfs(FALLBACK_TURFS);
//           }
//         } catch (turfErr) {
//           console.error('Failed to load turfs:', turfErr);
//           setTurfs(FALLBACK_TURFS);
//           setFilteredTurfs(FALLBACK_TURFS);
//         }

//         try {
//           const token = localStorage.getItem('token');
//           if (!token) return;

//           const subsResponse = await subscriptionApi.getAllSubscriptions({ page: 1, limit: 100 });
//           const subsData = subsResponse.data?.subscriptions || [];

//           if (subsData.length > 0) {
//             const active = subsData.filter(s => s.status === 'active' || s.status === 'trial').length;
//             const expired = subsData.filter(s => s.status === 'expired').length;
//             const expiringSoon = subsData.filter(s => {
//               if (!s.endDate) return false;
//               const daysRemaining = Math.ceil((new Date(s.endDate) - new Date()) / (1000 * 60 * 60 * 24));
//               return daysRemaining <= 7 && daysRemaining > 0;
//             }).length;

//             setStats({ total: subsData.length, active, expiringSoon, expired });
//           }
//         } catch (subsErr) {
//           console.error('Could not load subscription stats:', subsErr);
//         }
//       } catch (err) {
//         console.error('Failed to load data:', err);
//         setError('Failed to load some data. Using fallback data.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, [loadPlans]);

//   // ── Filter Turfs ──
//   useEffect(() => {
//     const filtered = turfs.filter((t) => {
//       const matchSearch = t.title.toLowerCase().includes(search.toLowerCase().trim());
//       const matchPlan = plan === "All plans" || t.planDuration === plan;
//       const matchStatus = status === "Status" || t.status === status;
//       const matchLocation = location === "Location" || t.location === location;
//       return matchSearch && matchPlan && matchStatus && matchLocation;
//     });
//     setFilteredTurfs(filtered);
//     setPage(1);
//   }, [turfs, search, plan, status, location]);

//   // ── Handlers ──
//   const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };
//   const resetFilters = () => { setSearch(""); setPlan("All plans"); setStatus("Status"); setLocation("Location"); setPage(1); };

//   // ── Pagination for Turfs ──
//   const PER_PAGE = 4;
//   const totalPages = Math.max(1, Math.ceil(filteredTurfs.length / PER_PAGE));
//   const safePage = Math.min(page, totalPages);
//   const paginated = filteredTurfs.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

//   // ── Pagination for Plans ──
//   const PLANS_PER_PAGE = 3;
//   const totalPlanPages = Math.max(1, Math.ceil(plans.length / PLANS_PER_PAGE));
//   const safePlanPage = Math.min(planPage, totalPlanPages);
//   const paginatedPlans = plans.slice((safePlanPage - 1) * PLANS_PER_PAGE, safePlanPage * PLANS_PER_PAGE);

//   // ── Stat cards with live values ──
//   const statCards = STAT_CARDS.map((card, index) => {
//     const keys = ['total', 'active', 'expiringSoon', 'expired'];
//     return { ...card, value: stats[keys[index]] || 0 };
//   });

//   // ── Show EditPlans view ──
//   if (showEditPlans) {
//     return (
//       <EditPlans
//         onSave={loadPlans}
//         onBack={() => setShowEditPlans(false)}
//       />
//     );
//   }

//   // ── Render ──
//   return (
//     <div className="subscription-management-container">
//       {/* ── Page Title ── */}
//       <h1 className="sub-page-title">Subscriptions</h1>

//       {/* ── Stat Cards ── */}
//       <div className="sub-stats-section">
//         {statCards.map((s) => (
//           <div key={s.label} className="sub-stat-card">
//             <div className="sub-stat-card__left">
//               <span className="sub-stat-card__label">{s.label}</span>
//               <span className="sub-stat-card__value">{s.value}</span>
//               <span className="sub-stat-card__delta">{s.delta}</span>
//             </div>
//             <div className="sub-stat-card__icon">
//               <s.icon />
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* ── Tabs ── */}
//       <div className="sub-tabs-section">
//         <button
//           className={`sub-tab ${activeTab === "subscription" ? "sub-tab--active" : ""}`}
//           onClick={() => setActiveTab("subscription")}
//         >
//           SUBSCRIPTION
//         </button>
//         <button
//           className={`sub-tab ${activeTab === "plan" ? "sub-tab--active" : ""}`}
//           onClick={() => setActiveTab("plan")}
//         >
//           PLAN MANAGEMENT
//         </button>
//       </div>

//       {/* ════════════════════════════════════════
//             SUBSCRIPTION TAB
//             ════════════════════════════════════════ */}
//       {activeTab === "subscription" && (
//         <>
//           {/* ── Filters ── */}
//           <div className="sub-filters-section">
//             <div className="sub-search-wrapper">
//               <HiOutlineSearch className="sub-search-icon" />
//               <input
//                 type="text"
//                 placeholder="Search turf by name"
//                 value={search}
//                 onChange={handleSearchChange}
//                 className="sub-search-input"
//               />
//             </div>
//             <select
//               value={plan}
//               onChange={(e) => { setPlan(e.target.value); setPage(1); }}
//               className="sub-filter-select"
//             >
//               {PLAN_OPTIONS.map((o) => <option key={o}>{o}</option>)}
//             </select>
//             <select
//               value={status}
//               onChange={(e) => { setStatus(e.target.value); setPage(1); }}
//               className="sub-filter-select"
//             >
//               {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
//             </select>
//             <select
//               value={location}
//               onChange={(e) => { setLocation(e.target.value); setPage(1); }}
//               className="sub-filter-select"
//             >
//               {LOCATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
//             </select>
//             <button className="sub-reset-filter-btn" onClick={resetFilters}>
//               <svg
//                 viewBox="0 0 24 24"
//                 fill="none"
//                 stroke="currentColor"
//                 width="16"
//                 height="16"
//                 style={{ strokeWidth: 2 }}
//               >
//                 <polyline points="23 4 23 10 17 10"></polyline>
//                 <path d="M20.49 15a9 9 0 1 1-2-8.94"></path>
//               </svg>
//               Reset filter
//             </button>
//           </div>

//           {/* ── Turf Grid - 2 Columns ── */}
//           <div className="sub-turf-grid">
//             {loading ? (
//               <div className="sub-grid-message">Loading turfs...</div>
//             ) : error ? (
//               <div className="sub-grid-message" style={{ color: "orange" }}>{error}</div>
//             ) : paginated.length > 0 ? (
//               paginated.map((turf) => (
//                 <div className="sub-turf-item" key={turf.turfId}>
//                   <TurfCard {...turf} />
//                 </div>
//               ))
//             ) : (
//               <div className="sub-grid-message">No turfs match your filters.</div>
//             )}
//           </div>

//           {/* ── Pagination ── */}
//           <div className="sub-pagination-container">
//             <button
//               className="sub-pagination-arrow"
//               disabled={safePage === 1}
//               onClick={() => setPage((p) => Math.max(1, p - 1))}
//             >
//               ‹
//             </button>

//             <div className="sub-page-numbers">
//               {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
//                 <button
//                   key={n}
//                   className={`sub-page-number ${safePage === n ? "active" : ""}`}
//                   onClick={() => setPage(n)}
//                 >
//                   {n}
//                 </button>
//               ))}
//             </div>

//             <button
//               className="sub-pagination-arrow"
//               disabled={safePage === totalPages}
//               onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//             >
//               ›
//             </button>

//             <div className="sub-pagination-info">
//               Showing {paginated.length} of {filteredTurfs.length} results | Rows
//               per page <span className="sub-rows-per-page">04</span>
//             </div>
//           </div>
//         </>
//       )}

//       {/* ════════════════════════════════════════
//             PLAN MANAGEMENT TAB
//             ════════════════════════════════════════ */}
//       {activeTab === "plan" && (
//         <>
//           {/* ── Plan Management Header ── */}
//           <div className="sub-plan-header-section">
//             <div className="sub-plan-tabs">
//               <button 
//                 className={`sub-plan-period-tab ${planPeriod === "1 month" ? "sub-plan-period-tab--active" : ""}`}
//                 onClick={() => setPlanPeriod("1 month")}
//               >
//                 1 month
//               </button>
//               <button 
//                 className={`sub-plan-period-tab ${planPeriod === "3 month" ? "sub-plan-period-tab--active" : ""}`}
//                 onClick={() => setPlanPeriod("3 month")}
//               >
//                 3 month
//               </button>
//               <button 
//                 className={`sub-plan-period-tab ${planPeriod === "yearly" ? "sub-plan-period-tab--active" : ""}`}
//                 onClick={() => setPlanPeriod("yearly")}
//               >
//                 yearly
//               </button>
//             </div>
//             <button
//               className="sub-edit-plans-btn"
//               onClick={() => setShowEditPlans(true)}
//             >
//               ✎ Edit plans
//             </button>
//           </div>

//           {/* ── Plan Grid ── */}
//           <div className="sub-plan-grid">
//             {plansLoading ? (
//               <div className="sub-grid-message">Loading plans...</div>
//             ) : paginatedPlans.length > 0 ? (
//               paginatedPlans.map((p) => (
//                 <div key={p.id} className="sub-plan-item">
//                   <PricingCard
//                     plan={p}
//                     showAdminControls={false}
//                   />
//                 </div>
//               ))
//             ) : (
//               <div className="sub-grid-message">No plans available. Click "Edit plans" to create one.</div>
//             )}
//           </div>

//           {/* ── Plan Pagination ── */}
//           {plans.length > PLANS_PER_PAGE && (
//             <div className="sub-pagination-container">
//               <button
//                 className="sub-pagination-arrow"
//                 disabled={safePlanPage === 1}
//                 onClick={() => setPlanPage((p) => Math.max(1, p - 1))}
//               >
//                 ‹
//               </button>

//               <div className="sub-page-numbers">
//                 {Array.from({ length: totalPlanPages }, (_, i) => i + 1).map((n) => (
//                   <button
//                     key={n}
//                     className={`sub-page-number ${safePlanPage === n ? "active" : ""}`}
//                     onClick={() => setPlanPage(n)}
//                   >
//                     {n}
//                   </button>
//                 ))}
//               </div>

//               <button
//                 className="sub-pagination-arrow"
//                 disabled={safePlanPage === totalPlanPages}
//                 onClick={() => setPlanPage((p) => Math.min(totalPlanPages, p + 1))}
//               >
//                 ›
//               </button>

//               <div className="sub-pagination-info">
//                 Showing {paginatedPlans.length} of {plans.length} results | Rows
//                 per page <span className="sub-rows-per-page">03</span>
//               </div>
//             </div>
//           )}
//         </>
//       )}
//     </div>
//   );
// }

// // pages/admin/Subscriptions.jsx
// import { useState, useEffect, useCallback } from "react";
// import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
// import { PiWalletDuotone } from "react-icons/pi";
// import { HiOutlineLocationMarker } from "react-icons/hi";
// import { HiOutlineBadgeCheck } from "react-icons/hi";
// import { HiOutlineSearch } from "react-icons/hi";
// import AdminLayout from "../../components/admin/AdminLayout";
// import TurfCard from "../../components/TurfCard";
// import PricingCard from "../../components/PricingCard";
// import EditPlans from '../../components/EditPlans';
// import * as subscriptionApi from '../../services/subscription.service';
// import * as turfApi from '../../services/turf.service';
// import "../../assets/styles/Subscription.css";

// // ─────────────────────────────────────────────
// // STATIC DATA
// // ─────────────────────────────────────────────

// const STAT_CARDS = [
//   { label: "Total Subscription", value: 0, delta: "+0 this month", icon: HiOutlineBuildingOffice2 },
//   { label: "Active Subscription", value: 0, delta: "+0 this month", icon: PiWalletDuotone },
//   { label: "Expiring soon", value: 0, delta: "+0 this month", icon: HiOutlineLocationMarker },
//   { label: "Expired", value: 0, delta: "+0 this month", icon: HiOutlineBadgeCheck },
// ];

// const FALLBACK_TURFS = [
//   { turfId: "Erd-456", status: "Active", title: "Enjoy Turf Game", price: 585, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Erode", planDuration: "1 Year", turfImage: null, logoImage: null },
//   { turfId: "Erd-457", status: "Active", title: "SB Landscape Turf", price: 445, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Coimbatore", planDuration: "Free trial", turfImage: null, logoImage: null },
//   { turfId: "Erd-458", status: "Active", title: "Sports Hub Ventures", price: 245, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Sathiyamangalam", planDuration: "3 months", turfImage: null, logoImage: null },
//   { turfId: "Erd-459", status: "Active", title: "Sports Men Turf", price: 845, startDate: "12 / 01 / 2027", endDate: "12 / 03 / 2027", location: "Gobi", planDuration: "1 Year", turfImage: null, logoImage: null },
//   { turfId: "Erd-460", status: "Inactive", title: "Green Valley Turf", price: 399, startDate: "01 / 02 / 2027", endDate: "01 / 05 / 2027", location: "Erode", planDuration: "3 months", turfImage: null, logoImage: null },
//   { turfId: "Erd-461", status: "Active", title: "Royal Sports Arena", price: 699, startDate: "15 / 03 / 2027", endDate: "15 / 04 / 2027", location: "Coimbatore", planDuration: "1 Year", turfImage: null, logoImage: null },
//   { turfId: "Erd-462", status: "Inactive", title: "City Premier Turf", price: 525, startDate: "20 / 01 / 2027", endDate: "20 / 02 / 2027", location: "Gobi", planDuration: "Free trial", turfImage: null, logoImage: null },
//   { turfId: "Erd-463", status: "Active", title: "Victory Sports Ground", price: 750, startDate: "05 / 02 / 2027", endDate: "05 / 03 / 2027", location: "Sathiyamangalam", planDuration: "1 Year", turfImage: null, logoImage: null },
// ];

// const PLAN_OPTIONS = ["All plans", "1 Year", "3 months", "Free trial"];
// const STATUS_OPTIONS = ["Status", "Active", "Inactive", "Expired"];
// const LOCATION_OPTIONS = ["Location", "Erode", "Coimbatore", "Sathiyamangalam", "Gobi"];

// // ─────────────────────────────────────────────
// // HELPER FUNCTIONS
// // ─────────────────────────────────────────────

// const toTurfCardProps = (turf) => ({
//   turfId: turf._id || turf.turfId,
//   status: turf.approvalStatus || turf.status || "Active",
//   title: turf.name || turf.title || "Turf",
//   price: turf.pricePerHour?.basePrice || turf.price || 0,
//   startDate: turf.startDate || "N/A",
//   endDate: turf.endDate || "N/A",
//   location: turf.location || turf.address?.city || "N/A",
//   planDuration: turf.planDuration || "N/A",
//   turfImage: turf.mainImage || turf.turfImage || null,
//   logoImage: turf.logoImage || null,
// });

// const toDisplayPlanShape = (p) => ({
//   id: p._id,
//   title: p.name,
//   billingLabel: p.description || "Billed every month",
//   price: p.price,
//   perLabel: `${p.durationDays} Days`,
//   isMostPopular: !!p.isMostPopular,
//   features: Array.isArray(p.featureList) && p.featureList.length > 0
//     ? p.featureList
//     : ["Manage your turf"],
// });

// // ─────────────────────────────────────────────
// // MAIN COMPONENT
// // ─────────────────────────────────────────────

// export default function Subscriptions() {
//   // ── State ──
//   const [activeTab, setActiveTab] = useState("subscription");
//   const [search, setSearch] = useState("");
//   const [plan, setPlan] = useState("All plans");
//   const [status, setStatus] = useState("Status");
//   const [location, setLocation] = useState("Location");
//   const [page, setPage] = useState(1);

//   const [plans, setPlans] = useState([]);
//   const [plansLoading, setPlansLoading] = useState(true);
//   const [planStartIndex, setPlanStartIndex] = useState(0);
//   const [planTabIndex, setPlanTabIndex] = useState(0); // mobile radio-tab index

//   const [turfs, setTurfs] = useState(FALLBACK_TURFS);
//   const [filteredTurfs, setFilteredTurfs] = useState(FALLBACK_TURFS);
//   const [showEditPlans, setShowEditPlans] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [stats, setStats] = useState({
//     total: 0,
//     active: 0,
//     expiringSoon: 0,
//     expired: 0,
//   });

//   // ── Load Plans ──
//   const loadPlans = useCallback(async () => {
//     setPlansLoading(true);
//     try {
//       const plansResponse = await subscriptionApi.getAllPlans(true);
//       const planData = plansResponse.data?.plans || [];
//       const displayPlans = planData.map(toDisplayPlanShape);
//       setPlans(displayPlans);
//       setPlanStartIndex(0);
//       setPlanTabIndex(0);
//     } catch (planErr) {
//       console.error('Could not load plans from backend:', planErr);
//     } finally {
//       setPlansLoading(false);
//     }
//   }, []);

//   // ── Load All Data ──
//   useEffect(() => {
//     const loadData = async () => {
//       setLoading(true);
//       setError(null);

//       try {
//         await loadPlans();

//         try {
//           const turfsResponse = await turfApi.getAllTurfs();
//           let turfData = [];
//           if (turfsResponse?.data?.turfs) {
//             turfData = turfsResponse.data.turfs;
//           } else if (turfsResponse?.data) {
//             turfData = turfsResponse.data;
//           } else if (Array.isArray(turfsResponse)) {
//             turfData = turfsResponse;
//           }

//           if (turfData && turfData.length > 0) {
//             const mappedTurfs = turfData.map(toTurfCardProps);
//             setTurfs(mappedTurfs);
//             setFilteredTurfs(mappedTurfs);
//           } else {
//             setTurfs(FALLBACK_TURFS);
//             setFilteredTurfs(FALLBACK_TURFS);
//           }
//         } catch (turfErr) {
//           console.error('Failed to load turfs:', turfErr);
//           setTurfs(FALLBACK_TURFS);
//           setFilteredTurfs(FALLBACK_TURFS);
//         }

//         try {
//           const token = localStorage.getItem('token');
//           if (!token) return;

//           const subsResponse = await subscriptionApi.getAllSubscriptions({ page: 1, limit: 100 });
//           const subsData = subsResponse.data?.subscriptions || [];

//           if (subsData.length > 0) {
//             const active = subsData.filter(s => s.status === 'active' || s.status === 'trial').length;
//             const expired = subsData.filter(s => s.status === 'expired').length;
//             const expiringSoon = subsData.filter(s => {
//               if (!s.endDate) return false;
//               const daysRemaining = Math.ceil((new Date(s.endDate) - new Date()) / (1000 * 60 * 60 * 24));
//               return daysRemaining <= 7 && daysRemaining > 0;
//             }).length;

//             setStats({ total: subsData.length, active, expiringSoon, expired });
//           }
//         } catch (subsErr) {
//           console.error('Could not load subscription stats:', subsErr);
//         }
//       } catch (err) {
//         console.error('Failed to load data:', err);
//         setError('Failed to load some data. Using fallback data.');
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadData();
//   }, [loadPlans]);

//   // ── Filter Turfs ──
//   useEffect(() => {
//     const filtered = turfs.filter((t) => {
//       const matchSearch = t.title.toLowerCase().includes(search.toLowerCase().trim());
//       const matchPlan = plan === "All plans" || t.planDuration === plan;
//       const matchStatus = status === "Status" || t.status === status;
//       const matchLocation = location === "Location" || t.location === location;
//       return matchSearch && matchPlan && matchStatus && matchLocation;
//     });
//     setFilteredTurfs(filtered);
//     setPage(1);
//   }, [turfs, search, plan, status, location]);

//   // ── Keyboard nav for desktop plan slider ──
//   useEffect(() => {
//     if (activeTab !== "plan") return;
//     const handleKeyDown = (e) => {
//       const tag = e.target.tagName;
//       if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;
//       if (e.key === "ArrowRight" || e.key === " ") {
//         e.preventDefault();
//         setPlanStartIndex((i) => Math.min(maxStartIndex, i + 1));
//       } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
//         e.preventDefault();
//         setPlanStartIndex((i) => Math.max(0, i - 1));
//       }
//     };
//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

//   // ── Handlers ──
//   const handleSearchChange = (e) => { setSearch(e.target.value); setPage(1); };
//   const resetFilters = () => { setSearch(""); setPlan("All plans"); setStatus("Status"); setLocation("Location"); setPage(1); };

//   // ── Pagination ──
//   const PER_PAGE = 4;
//   const totalPages = Math.max(1, Math.ceil(filteredTurfs.length / PER_PAGE));
//   const safePage = Math.min(page, totalPages);
//   const paginated = filteredTurfs.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

//   // ── Plan slider (desktop: 3-up window) ──
//   const PLANS_VISIBLE = 3;
//   const maxStartIndex = Math.max(0, plans.length - PLANS_VISIBLE);
//   const safeStartIndex = Math.min(planStartIndex, maxStartIndex);
//   const visiblePlans = plans.slice(safeStartIndex, safeStartIndex + PLANS_VISIBLE);

//   // ── Stat cards with live values ──
//   const statCards = STAT_CARDS.map((card, index) => {
//     const keys = ['total', 'active', 'expiringSoon', 'expired'];
//     return { ...card, value: stats[keys[index]] || 0 };
//   });

//   // ── Show EditPlans view ──
//   if (showEditPlans) {
//     return (
//       <EditPlans
//         onSave={loadPlans}
//         onBack={() => setShowEditPlans(false)}
//       />
//     );
//   }

//   // ── Render ──
//   return (
//     <div className="sub-page">

//       {/* ── Page Title (subscription tab only) ── */}
//       {activeTab === "subscription" && (
//         <h1 className="sub-page__title">Subscriptions</h1>
//       )}

//       {/* ── Stat Cards (subscription tab only) ── */}
//       {activeTab === "subscription" && (
//         <div className="sub-page__stats">
//           {statCards.map((s) => (
//             <div key={s.label} className="sub-stat-card">
//               <div className="sub-stat-card__left">
//                 <span className="sub-stat-card__label">{s.label}</span>
//                 <span className="sub-stat-card__value">{s.value}</span>
//                 <span className="sub-stat-card__delta">{s.delta}</span>
//               </div>
//               <div className="sub-stat-card__icon">
//                 <s.icon />
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* ── Tabs ── */}
//       <div className="sub-page__tabs">
//         <button
//           className={`sub-tab ${activeTab === "subscription" ? "sub-tab--active" : ""}`}
//           onClick={() => setActiveTab("subscription")}
//         >
//           SUBSCRIPTION
//         </button>
//         <button
//           className={`sub-tab ${activeTab === "plan" ? "sub-tab--active" : ""}`}
//           onClick={() => setActiveTab("plan")}
//         >
//           PLAN MANAGEMENT
//         </button>

//         {/* Tablet-only: Edit plans button lives in the tab bar */}
//         {activeTab === "plan" && (
//           <button
//             className="sub-edit-plans-btn sub-edit-plans-btn--tab-inline"
//             onClick={() => setShowEditPlans(true)}
//           >
//             ✎ Edit plans
//           </button>
//         )}
//       </div>

//       {/* ════════════════════════════════════════
//             SUBSCRIPTION TAB
//             ════════════════════════════════════════ */}
//       {activeTab === "subscription" && (
//         <>
//           {/* Filters */}
//           <div className="sub-page__filters">
//             <div className="sub-search">
//               <HiOutlineSearch className="sub-search__icon" />
//               <input
//                 type="text"
//                 placeholder="Search turf by name"
//                 value={search}
//                 onChange={handleSearchChange}
//                 className="sub-search__input"
//               />
//             </div>
//             <select
//               value={plan}
//               onChange={(e) => { setPlan(e.target.value); setPage(1); }}
//               className="sub-select"
//             >
//               {PLAN_OPTIONS.map((o) => <option key={o}>{o}</option>)}
//             </select>
//             <select
//               value={status}
//               onChange={(e) => { setStatus(e.target.value); setPage(1); }}
//               className="sub-select"
//             >
//               {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
//             </select>
//             <select
//               value={location}
//               onChange={(e) => { setLocation(e.target.value); setPage(1); }}
//               className="sub-select"
//             >
//               {LOCATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
//             </select>
//             <button className="sub-reset-btn" onClick={resetFilters}>
//               ↺ Reset Filter
//             </button>
//           </div>

//           {/* Turf Grid */}
//           <div className="sub-page__grid">
//             {loading ? (
//               <p>Loading turfs...</p>
//             ) : error ? (
//               <p style={{ color: 'orange' }}>{error}</p>
//             ) : paginated.length > 0 ? (
//               paginated.map((turf) => (
//                 <TurfCard key={turf.turfId} {...turf} />
//               ))
//             ) : (
//               <p className="sub-page__empty">No turfs match your filters.</p>
//             )}
//           </div>

//           {/* Pagination */}
//           <div className="sub-page__pagination">
//             <span className="sub-page__showing">
//               Showing {paginated.length} of {filteredTurfs.length} turfs
//             </span>
//             <div className="sub-page__pager">
//               <button
//                 className="sub-pager-btn sub-pager-btn--arrow"
//                 disabled={safePage === 1}
//                 onClick={() => setPage((p) => Math.max(1, p - 1))}
//                 aria-label="Previous page"
//               >
//                 &#8249;
//               </button>
//               {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
//                 <button
//                   key={n}
//                   className={`sub-pager-btn sub-pager-btn--num ${safePage === n ? "sub-pager-btn--active" : ""}`}
//                   onClick={() => setPage(n)}
//                 >
//                   {n}
//                 </button>
//               ))}
//               <button
//                 className="sub-pager-btn sub-pager-btn--arrow"
//                 disabled={safePage === totalPages}
//                 onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                 aria-label="Next page"
//               >
//                 &#8250;
//               </button>
//             </div>
//           </div>
//         </>
//       )}

//       {/* ════════════════════════════════════════
//             PLAN MANAGEMENT TAB
//             ════════════════════════════════════════ */}
//       {activeTab === "plan" && (
//         <div className="sub-plan-management">

//           {/* Desktop / mobile standalone header with Edit plans btn */}
//           <div className="sub-plan-management__header">
//             <button
//               className="sub-edit-plans-btn"
//               onClick={() => setShowEditPlans(true)}
//             >
//               ✎ Edit plans
//             </button>
//           </div>

//           {/* ── Mobile radio-pill plan selector ── */}
//           <div className="sub-plan-tabs">
//             {plans.map((p, i) => (
//               <button
//                 key={p.id}
//                 className={`sub-plan-tab-btn ${planTabIndex === i ? "sub-plan-tab-btn--active" : ""}`}
//                 onClick={() => setPlanTabIndex(i)}
//               >
//                 <span className="sub-plan-tab-btn__dot" />
//                 {p.title.replace(/\s*plan\s*/i, "").trim() || p.title}
//               </button>
//             ))}
//           </div>

//           {/* ── Plan cards row ── */}
//           <div className="sub-plan-management__row">
//             {safeStartIndex > 0 && (
//               <button
//                 className="sub-plan-management__arrow"
//                 onClick={() => setPlanStartIndex((i) => Math.max(0, i - 1))}
//                 aria-label="Previous plans"
//               >
//                 ‹
//               </button>
//             )}

//             <div className="sub-plan-management__grid">
//               {plansLoading ? (
//                 <p>Loading plans...</p>
//               ) : plans.length > 0 ? (
//                 plans.map((p, i) => (
//                   <div
//                     key={p.id}
//                     className={[
//                       i === planTabIndex ? "plan-card--visible" : "",
//                       p.isMostPopular ? "plan-card--popular-wrapper" : "",
//                     ].filter(Boolean).join(" ")}
//                   >
//                     <PricingCard
//                       plan={p}
//                       showAdminControls={false}
//                     />
//                   </div>
//                 ))
//               ) : (
//                 <p>No plans available. Click "Edit plans" to create one.</p>
//               )}
//             </div>

//             {safeStartIndex < maxStartIndex && (
//               <button
//                 className="sub-plan-management__arrow"
//                 onClick={() => setPlanStartIndex((i) => Math.min(maxStartIndex, i + 1))}
//                 aria-label="Next plans"
//               >
//                 ›
//               </button>
//             )}
//           </div>
//         </div>
//       )}

//     </div>
//   );
// }