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

// Convert backend turf to TurfCard props
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
  // ── State ──
  const [activeTab, setActiveTab] = useState("subscription");
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("All plans");
  const [status, setStatus] = useState("Status");
  const [location, setLocation] = useState("Location");
  const [page, setPage] = useState(1);

  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
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

        // 2. Load Turfs
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

        // 3. Load Subscription Stats (Admin only)
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            console.log('No token found, skipping subscription stats');
            return;
          }

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
    <div className="sub-page">

        {/* ── Page Title ── */}
        {activeTab === "subscription" && (
          <h1 className="sub-page__title">Subscriptions</h1>
        )}

        {/* ── Stats Cards ── */}
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

        {/* ── Tabs ── */}
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
        </div>

        {/* ── SUBSCRIPTION TAB ── */}
        {activeTab === "subscription" && (
          <>
            {/* Filters */}
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
                {LOCATION_OPTIONS.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
              <button className="sub-reset-btn" onClick={resetFilters}>
                ↺ Reset Filter
              </button>
            </div>

            <div className="sub-list-container">
            {/* Turf Grid */}
            <div className="sub-page__grid">
              {loading ? (
                <p>Loading turfs...</p>
              ) : error ? (
                <p style={{ color: 'orange' }}>{error}</p>
              ) : paginated.length > 0 ? (
                paginated.map((turf) => (
                  <TurfCard key={turf.turfId} {...turf} />
                ))
              ) : (
                <p className="sub-page__empty">No turfs match your filters.</p>
              )}
            </div>
            </div>

            {/* Pagination */}
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
                  <i className="bi bi-chevron-left" />
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
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── PLAN MANAGEMENT TAB ── */}
        {activeTab === "plan" && (
          <div className="sub-plan-management">
            <div className="sub-plan-management__header">
              <button
                className="sub-edit-plans-btn"
                onClick={() => setShowEditPlans(true)}
              >
                ✎ Edit plans
              </button>
            </div>

            <div className="sub-plan-management__row">
              {safeStartIndex > 0 && (
                <button
                  className="sub-plan-management__arrow"
                  onClick={() => setPlanStartIndex((i) => Math.max(0, i - 1))}
                  aria-label="Previous plans"
                >
                  ‹
                </button>
              )}

              <div className="sub-plan-management__grid">
                {plansLoading ? (
                  <p>Loading plans...</p>
                ) : visiblePlans.length > 0 ? (
                  visiblePlans.map((p) => (
                    <PricingCard
                      key={p.id}
                      plan={p}
                      showAdminControls={false}
                    />
                  ))
                ) : (
                  <p>No plans available. Click "Edit plans" to create one.</p>
                )}
              </div>

              {safeStartIndex < maxStartIndex && (
                <button
                  className="sub-plan-management__arrow"
                  onClick={() => setPlanStartIndex((i) => Math.min(maxStartIndex, i + 1))}
                  aria-label="Next plans"
                >
                  ›
                </button>
              )}
            </div>
          </div>
        )}

    </div>
  );
}


// // // // import { useState } from "react";
// // // // import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
// // // // import { PiWalletDuotone } from "react-icons/pi";
// // // // import { HiOutlineLocationMarker } from "react-icons/hi";
// // // // import { HiOutlineBadgeCheck } from "react-icons/hi";
// // // // import { HiOutlineSearch } from "react-icons/hi";
// // // // import AdminLayout from "../../components/admin/AdminLayout";
// // // // import TurfCard from "../../components/TurfCard";
// // // // import PricingCard from "../../components/PricingCard";
// // // // import EditPlans from '../../components/EditPlans';
// // // // import "../../assets/styles/Subscription.css";

// // // // const STAT_CARDS = [
// // // //   { label: "Total Subscription", value: 250, delta: "+15 this month", icon: HiOutlineBuildingOffice2 },
// // // //   { label: "Active Subscription", value: 150, delta: "+15 this month", icon: PiWalletDuotone },
// // // //   { label: "Expiring soon", value: 250, delta: "+15 this month", icon: HiOutlineLocationMarker },
// // // //   { label: "Expired", value: 10, delta: "+15 this month", icon: HiOutlineBadgeCheck },
// // // // ];

// // // // const TURFS = [
// // // //   { turfId: "Erd-456", status: "Active", title: "Enjoy Truf Game", price: 585, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Erode", planDuration: "1 Year", turfImage: null, logoImage: null },
// // // //   { turfId: "Erd-457", status: "Active", title: "SB Land scape Truf", price: 445, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Coimbatore", planDuration: "Free trail", turfImage: null, logoImage: null },
// // // //   { turfId: "Erd-458", status: "Active", title: "Sports hub ventures", price: 245, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Sathiyamangalam", planDuration: "3 months", turfImage: null, logoImage: null },
// // // //   { turfId: "Erd-459", status: "Active", title: "Sports men truf", price: 845, startDate: "12 / 01 / 2027", endDate: "12 / 03 / 2027", location: "Gobi", planDuration: "1 Year", turfImage: null, logoImage: null },
// // // //   { turfId: "Erd-460", status: "Inactive", title: "Green Valley Turf", price: 399, startDate: "01 / 02 / 2027", endDate: "01 / 05 / 2027", location: "Erode", planDuration: "3 months", turfImage: null, logoImage: null },
// // // //   { turfId: "Erd-461", status: "Active", title: "Royal Sports Arena", price: 699, startDate: "15 / 03 / 2027", endDate: "15 / 04 / 2027", location: "Coimbatore", planDuration: "1 Year", turfImage: null, logoImage: null },
// // // //   { turfId: "Erd-462", status: "Inactive", title: "City Premier Turf", price: 525, startDate: "20 / 01 / 2027", endDate: "20 / 02 / 2027", location: "Gobi", planDuration: "Free trail", turfImage: null, logoImage: null },
// // // //   { turfId: "Erd-463", status: "Active", title: "Victory Sports Ground", price: 750, startDate: "05 / 02 / 2027", endDate: "05 / 03 / 2027", location: "Sathiyamangalam", planDuration: "1 Year", turfImage: null, logoImage: null },
// // // // ];

// // // // const INITIAL_PLANS = [
// // // //   { id: "monthly", title: "Monthly plan", billingLabel: "Billed every month", price: 499, perLabel: "Month", isMostPopular: false,
// // // //     features: ["Mange your turf", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "Access to 100 million stock images"] },
// // // //   { id: "3month", title: "3-Month plan", billingLabel: "Billed every  3 month", price: 1497, perLabel: "3 month", isMostPopular: true,
// // // //     features: ["Mange your turf", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "Access to 100 million stock images"] },
// // // //   { id: "yearly", title: "Yearly plan", billingLabel: "Billed every year", price: 5988, perLabel: "Per year", isMostPopular: false,
// // // //     features: ["Mange your turf", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "Access to 100 million stock images"] },
// // // // ];

// // // // const PLAN_OPTIONS = ["All plans", "1 Year", "3 months", "Free trail"];
// // // // const STATUS_OPTIONS = ["Status", "Active", "Inactive", "Expired"];
// // // // const LOCATION_OPTIONS = ["Location", "Erode", "Coimbatore", "Sathiyamangalam", "Gobi"];

// // // // // ── Adapters between PricingCard shape (title/billingLabel/perLabel)
// // // // //    and EditPlans shape (name/tagline/duration/billingLabel) ──
// // // // const DURATION_TO_PER_LABEL = { "1 Month": "Month", "3 Month": "3 month", "6 Month": "6 month", "1 Year": "Per year" };
// // // // const PER_LABEL_TO_DURATION = { "Month": "1 Month", "3 month": "3 Month", "6 month": "6 Month", "Per year": "1 Year" };
// // // // const DURATION_TO_BILLING_LABEL_UPPER = {
// // // //   "1 Month": "BILLED MONTHLY",
// // // //   "3 Month": "BILLED EVERY 3 MONTHS",
// // // //   "6 Month": "BILLED EVERY 6 MONTHS",
// // // //   "1 Year": "BILLED YEARLY",
// // // // };

// // // // const toEditShape = (p) => {
// // // //   const duration = PER_LABEL_TO_DURATION[p.perLabel] || "1 Month";
// // // //   return {
// // // //     id: p.id,
// // // //     name: p.title,
// // // //     tagline: p.billingLabel,
// // // //     price: p.price,
// // // //     duration,
// // // //     billingLabel: DURATION_TO_BILLING_LABEL_UPPER[duration],
// // // //     isMostPopular: p.isMostPopular,
// // // //     features: p.features,
// // // //   };
// // // // };

// // // // const toDisplayShape = (p) => ({
// // // //   id: p.id,
// // // //   title: p.name,
// // // //   billingLabel: p.tagline,
// // // //   price: p.price,
// // // //   perLabel: DURATION_TO_PER_LABEL[p.duration] || p.duration.toLowerCase(),
// // // //   isMostPopular: p.isMostPopular,
// // // //   features: p.features,
// // // // });

// // // // export default function SubscriptionPage() {
// // // //   const [activeTab, setActiveTab] = useState("subscription");
// // // //   const [search, setSearch] = useState("");
// // // //   const [plan, setPlan] = useState("All plans");
// // // //   const [status, setStatus] = useState("Status");
// // // //   const [location, setLocation] = useState("Location");
// // // //   const [page, setPage] = useState(1);
// // // //   const [plans, setPlans] = useState(INITIAL_PLANS);
// // // //   const [showEditPlans, setShowEditPlans] = useState(false);

// // // //   if (showEditPlans) {
// // // //     return (
// // // //       <EditPlans
// // // //         initialPlans={plans.map(toEditShape)}
// // // //         onSave={(updatedEditPlans) => setPlans(updatedEditPlans.map(toDisplayShape))}
// // // //         onBack={() => setShowEditPlans(false)}
// // // //       />
// // // //     );
// // // //   }

// // // //   const resetFilters = () => {
// // // //     setSearch("");
// // // //     setPlan("All plans");
// // // //     setStatus("Status");
// // // //     setLocation("Location");
// // // //     setPage(1);
// // // //   };

// // // //   const filtered = TURFS.filter((t) => {
// // // //     const matchSearch = t.title.toLowerCase().includes(search.toLowerCase().trim());
// // // //     const matchPlan = plan === "All plans" || t.planDuration === plan;
// // // //     const matchStatus = status === "Status" || t.status === status;
// // // //     const matchLocation = location === "Location" || t.location === location;
// // // //     return matchSearch && matchPlan && matchStatus && matchLocation;
// // // //   });

// // // //   const PER_PAGE = 4;
// // // //   const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
// // // //   const safePage = Math.min(page, totalPages);
// // // //   const paginated = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

// // // //   const handleSetMostPopular = (id) => setPlans((prev) => prev.map((p) => ({ ...p, isMostPopular: p.id === id })));
// // // //   const handleRemoveMostPopular = (id) => setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, isMostPopular: false } : p)));

// // // //   const handleSearchChange = (e) => {
// // // //     const value = e.target.value;
// // // //     setSearch(value);
// // // //     setPage(1);
// // // //   };

// // // //   return (
// // // //     <AdminLayout activeNav="subscription">
// // // //       <div className="sub-page">

// // // //         {activeTab === "subscription" && <h1 className="sub-page__title">Subscription</h1>}

// // // //         {activeTab === "subscription" && (
// // // //           <div className="sub-page__stats">
// // // //             {STAT_CARDS.map((s) => (
// // // //               <div key={s.label} className="sub-stat-card">
// // // //                 <div className="sub-stat-card__left">
// // // //                   <span className="sub-stat-card__label">{s.label}</span>
// // // //                   <span className="sub-stat-card__value">{s.value}</span>
// // // //                   <span className="sub-stat-card__delta">{s.delta}</span>
// // // //                 </div>
// // // //                 <div className="sub-stat-card__icon">
// // // //                   <s.icon />
// // // //                 </div>
// // // //               </div>
// // // //             ))}
// // // //           </div>
// // // //         )}

// // // //         <div className="sub-page__tabs">
// // // //           <button
// // // //             className={`sub-tab ${activeTab === "subscription" ? "sub-tab--active" : ""}`}
// // // //             onClick={() => setActiveTab("subscription")}
// // // //           >
// // // //             SUBSCRIPTION
// // // //           </button>
// // // //           <button
// // // //             className={`sub-tab ${activeTab === "plan" ? "sub-tab--active" : ""}`}
// // // //             onClick={() => setActiveTab("plan")}
// // // //           >
// // // //             PLAN MANAGEMENT
// // // //           </button>
// // // //         </div>

// // // //         {activeTab === "subscription" && (
// // // //           <>
// // // //             <div className="sub-page__filters">
// // // //               <div className="sub-search">
// // // //                 <HiOutlineSearch className="sub-search__icon" />
// // // //                 <input
// // // //                   type="text"
// // // //                   placeholder="Search turf by name"
// // // //                   value={search}
// // // //                   onChange={handleSearchChange}
// // // //                   className="sub-search__input"
// // // //                 />
// // // //               </div>
// // // //               <select value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }} className="sub-select">
// // // //                 {PLAN_OPTIONS.map((o) => <option key={o}>{o}</option>)}
// // // //               </select>
// // // //               <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sub-select">
// // // //                 {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
// // // //               </select>
// // // //               <select value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }} className="sub-select">
// // // //                 {LOCATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
// // // //               </select>
// // // //               <button className="sub-reset-btn" onClick={resetFilters}>
// // // //                 ↺ Reset Filter
// // // //               </button>
// // // //             </div>

// // // //             <div className="sub-page__grid">
// // // //               {paginated.length > 0
// // // //                 ? paginated.map((turf) => <TurfCard key={turf.turfId} {...turf} />)
// // // //                 : <p className="sub-page__empty">No turfs match your filters.</p>}
// // // //             </div>

// // // //             <div className="sub-page__pagination">
// // // //               <span className="sub-page__showing">
// // // //                 Showing {paginated.length} of {filtered.length} turfs
// // // //               </span>
// // // //               <div className="sub-page__pager">
// // // //                 <button className="sub-pager-btn" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
// // // //                   Previous
// // // //                 </button>
// // // //                 {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
// // // //                   <button
// // // //                     key={n}
// // // //                     className={`sub-pager-btn sub-pager-btn--num ${safePage === n ? "sub-pager-btn--active" : ""}`}
// // // //                     onClick={() => setPage(n)}
// // // //                   >
// // // //                     {n}
// // // //                   </button>
// // // //                 ))}
// // // //                 <button className="sub-pager-btn" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
// // // //                   Next
// // // //                 </button>
// // // //               </div>
// // // //             </div>
// // // //           </>
// // // //         )}

// // // //         {activeTab === "plan" && (
// // // //           <div className="sub-plan-management">
// // // //             <div className="sub-plan-management__header">
// // // //               <button className="sub-edit-plans-btn" onClick={() => setShowEditPlans(true)}>
// // // //                 ✎ Edit plans
// // // //               </button>
// // // //             </div>
// // // //             <div className="sub-plan-management__grid">
// // // //               {plans.map((p) => (
// // // //                 <PricingCard
// // // //                   key={p.id}
// // // //                   plan={p}
// // // //                   onSetMostPopular={() => handleSetMostPopular(p.id)}
// // // //                   onRemoveMostPopular={() => handleRemoveMostPopular(p.id)}
// // // //                   showAdminControls={false}
// // // //                 />
// // // //               ))}
// // // //             </div>
// // // //           </div>
// // // //         )}

// // // //       </div>
// // // //     </AdminLayout>
// // // //   );
// // // // }



// // // // pages/admin/Subscriptions.jsx
// // // import { useState, useEffect } from "react";
// // // import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
// // // import { PiWalletDuotone } from "react-icons/pi";
// // // import { HiOutlineLocationMarker } from "react-icons/hi";
// // // import { HiOutlineBadgeCheck } from "react-icons/hi";
// // // import { HiOutlineSearch } from "react-icons/hi";
// // // import AdminLayout from "../../components/admin/AdminLayout";
// // // import TurfCard from "../../components/TurfCard";
// // // import PricingCard from "../../components/PricingCard";
// // // import EditPlans from '../../components/EditPlans';
// // // import * as subscriptionApi from '../../services/subscription.service';
// // // import * as turfApi from '../../services/turf.service';
// // // import "../../assets/styles/Subscription.css";

// // // const STAT_CARDS = [
// // //   { label: "Total Subscription", value: 0, delta: "+0 this month", icon: HiOutlineBuildingOffice2 },
// // //   { label: "Active Subscription", value: 0, delta: "+0 this month", icon: PiWalletDuotone },
// // //   { label: "Expiring soon", value: 0, delta: "+0 this month", icon: HiOutlineLocationMarker },
// // //   { label: "Expired", value: 0, delta: "+0 this month", icon: HiOutlineBadgeCheck },
// // // ];

// // // // Fallback turfs if API fails
// // // const FALLBACK_TURFS = [
// // //   { turfId: "Erd-456", status: "Active", title: "Enjoy Truf Game", price: 585, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Erode", planDuration: "1 Year", turfImage: null, logoImage: null },
// // //   { turfId: "Erd-457", status: "Active", title: "SB Land scape Truf", price: 445, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Coimbatore", planDuration: "Free trail", turfImage: null, logoImage: null },
// // //   { turfId: "Erd-458", status: "Active", title: "Sports hub ventures", price: 245, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Sathiyamangalam", planDuration: "3 months", turfImage: null, logoImage: null },
// // //   { turfId: "Erd-459", status: "Active", title: "Sports men truf", price: 845, startDate: "12 / 01 / 2027", endDate: "12 / 03 / 2027", location: "Gobi", planDuration: "1 Year", turfImage: null, logoImage: null },
// // //   { turfId: "Erd-460", status: "Inactive", title: "Green Valley Turf", price: 399, startDate: "01 / 02 / 2027", endDate: "01 / 05 / 2027", location: "Erode", planDuration: "3 months", turfImage: null, logoImage: null },
// // //   { turfId: "Erd-461", status: "Active", title: "Royal Sports Arena", price: 699, startDate: "15 / 03 / 2027", endDate: "15 / 04 / 2027", location: "Coimbatore", planDuration: "1 Year", turfImage: null, logoImage: null },
// // //   { turfId: "Erd-462", status: "Inactive", title: "City Premier Turf", price: 525, startDate: "20 / 01 / 2027", endDate: "20 / 02 / 2027", location: "Gobi", planDuration: "Free trail", turfImage: null, logoImage: null },
// // //   { turfId: "Erd-463", status: "Active", title: "Victory Sports Ground", price: 750, startDate: "05 / 02 / 2027", endDate: "05 / 03 / 2027", location: "Sathiyamangalam", planDuration: "1 Year", turfImage: null, logoImage: null },
// // // ];

// // // const PLAN_OPTIONS = ["All plans", "1 Year", "3 months", "Free trail"];
// // // const STATUS_OPTIONS = ["Status", "Active", "Inactive", "Expired"];
// // // const LOCATION_OPTIONS = ["Location", "Erode", "Coimbatore", "Sathiyamangalam", "Gobi"];

// // // // ── Adapters between PricingCard shape and EditPlans shape ──
// // // const DURATION_TO_PER_LABEL = { "1 Month": "Month", "3 Month": "3 month", "6 Month": "6 month", "1 Year": "Per year" };
// // // const PER_LABEL_TO_DURATION = { "Month": "1 Month", "3 month": "3 Month", "6 month": "6 Month", "Per year": "1 Year" };
// // // const DURATION_TO_BILLING_LABEL_UPPER = {
// // //   "1 Month": "BILLED MONTHLY",
// // //   "3 Month": "BILLED EVERY 3 MONTHS",
// // //   "6 Month": "BILLED EVERY 6 MONTHS",
// // //   "1 Year": "BILLED YEARLY",
// // // };

// // // const toEditShape = (p) => {
// // //   const duration = PER_LABEL_TO_DURATION[p.perLabel] || "1 Month";
// // //   return {
// // //     id: p.id,
// // //     name: p.title,
// // //     tagline: p.billingLabel,
// // //     price: p.price,
// // //     duration,
// // //     billingLabel: DURATION_TO_BILLING_LABEL_UPPER[duration],
// // //     isMostPopular: p.isMostPopular,
// // //     features: p.features,
// // //   };
// // // };

// // // const toDisplayShape = (p) => ({
// // //   id: p.id,
// // //   title: p.name,
// // //   billingLabel: p.tagline,
// // //   price: p.price,
// // //   perLabel: DURATION_TO_PER_LABEL[p.duration] || p.duration.toLowerCase(),
// // //   isMostPopular: p.isMostPopular,
// // //   features: p.features,
// // // });

// // // // Convert backend turf to TurfCard props
// // // const toTurfCardProps = (turf) => ({
// // //   turfId: turf._id || turf.turfId,
// // //   status: turf.approvalStatus || turf.status || "Active",
// // //   title: turf.name || turf.title || "Turf",
// // //   price: turf.pricePerHour?.basePrice || turf.price || 0,
// // //   startDate: turf.startDate || "N/A",
// // //   endDate: turf.endDate || "N/A",
// // //   location: turf.location || turf.address?.city || "N/A",
// // //   planDuration: turf.planDuration || "N/A",
// // //   turfImage: turf.mainImage || turf.turfImage || null,
// // //   logoImage: turf.logoImage || null,
// // // });

// // // // Convert backend plan to display format
// // // const toDisplayPlanShape = (p) => ({
// // //   id: p._id,
// // //   title: p.name,
// // //   billingLabel: p.description || "Billed every month",
// // //   price: p.price,
// // //   perLabel: `${p.durationDays} Days`,
// // //   isMostPopular: p.isMostPopular || false,
// // //   features: p.features ? Object.entries(p.features)
// // //     .filter(([_, value]) => value === true || value > 0)
// // //     .map(([key, value]) => {
// // //       if (key === 'maxTurfs') return `Manage up to ${value} turfs`;
// // //       if (key === 'prioritySupport') return 'Priority Support';
// // //       if (key === 'analyticsAccess') return 'Analytics & Reports';
// // //       if (key === 'bookingDiscountPercent') return `${value}% Booking Discount`;
// // //       return `${key}: ${value}`;
// // //     }) : ["Manage your turf"],
// // // });

// // // export default function Subscriptions() {
// // //   const [activeTab, setActiveTab] = useState("subscription");
// // //   const [search, setSearch] = useState("");
// // //   const [plan, setPlan] = useState("All plans");
// // //   const [status, setStatus] = useState("Status");
// // //   const [location, setLocation] = useState("Location");
// // //   const [page, setPage] = useState(1);
// // //   const [plans, setPlans] = useState([]);
// // //   const [turfs, setTurfs] = useState(FALLBACK_TURFS);
// // //   const [filteredTurfs, setFilteredTurfs] = useState(FALLBACK_TURFS);
// // //   const [showEditPlans, setShowEditPlans] = useState(false);
// // //   const [loading, setLoading] = useState(true);
// // //   const [error, setError] = useState(null);
// // //   const [stats, setStats] = useState({
// // //     total: 0,
// // //     active: 0,
// // //     expiringSoon: 0,
// // //     expired: 0
// // //   });

// // //   // Load data from backend
// // //   useEffect(() => {
// // //     const loadData = async () => {
// // //       setLoading(true);
// // //       setError(null);
// // //       try {
// // //         // Load plans
// // //         try {
// // //           const plansResponse = await subscriptionApi.getPublicPlans();
// // //           const planData = plansResponse.data?.plans || [];
// // //           if (planData.length > 0) {
// // //             setPlans(planData.map(toDisplayPlanShape));
// // //           }
// // //         } catch (planErr) {
// // //           console.log('Could not load plans from backend:', planErr);
// // //         }

// // //         // Load turfs from backend
// // //         try {
// // //           console.log('Fetching turfs from backend...');
// // //           const turfsResponse = await turfApi.getAllTurfs();
// // //           console.log('Turfs response:', turfsResponse);
          
// // //           let turfData = [];
// // //           if (turfsResponse?.data?.turfs) {
// // //             turfData = turfsResponse.data.turfs;
// // //           } else if (turfsResponse?.data) {
// // //             turfData = turfsResponse.data;
// // //           } else if (Array.isArray(turfsResponse)) {
// // //             turfData = turfsResponse;
// // //           }
          
// // //           if (turfData && turfData.length > 0) {
// // //             const mappedTurfs = turfData.map(toTurfCardProps);
// // //             setTurfs(mappedTurfs);
// // //             setFilteredTurfs(mappedTurfs);
// // //             console.log('Turfs loaded successfully:', mappedTurfs.length);
// // //           } else {
// // //             console.log('No turfs found, using fallback data');
// // //             setTurfs(FALLBACK_TURFS);
// // //             setFilteredTurfs(FALLBACK_TURFS);
// // //           }
// // //         } catch (turfErr) {
// // //           console.error('Failed to load turfs:', turfErr);
// // //           setTurfs(FALLBACK_TURFS);
// // //           setFilteredTurfs(FALLBACK_TURFS);
// // //         }

// // //         // Load subscription stats - This requires admin authentication
// // //         try {
// // //           console.log('Fetching subscription stats...');
// // //           const token = localStorage.getItem('token');
// // //           console.log('Token exists:', !!token);
          
// // //           if (!token) {
// // //             console.log('No token found, skipping subscription stats');
// // //             return;
// // //           }
          
// // //           const subsResponse = await subscriptionApi.getAllSubscriptions({ page: 1, limit: 100 });
// // //           console.log('Subscriptions response:', subsResponse);
          
// // //           const subsData = subsResponse.data?.subscriptions || [];
          
// // //           if (subsData.length > 0) {
// // //             const active = subsData.filter(s => s.status === 'active' || s.status === 'trial').length;
// // //             const expired = subsData.filter(s => s.status === 'expired').length;
// // //             const expiringSoon = subsData.filter(s => {
// // //               if (!s.endDate) return false;
// // //               const daysRemaining = Math.ceil((new Date(s.endDate) - new Date()) / (1000 * 60 * 60 * 24));
// // //               return daysRemaining <= 7 && daysRemaining > 0;
// // //             }).length;
            
// // //             setStats({
// // //               total: subsData.length,
// // //               active,
// // //               expiringSoon,
// // //               expired
// // //             });
// // //             console.log('Stats updated:', { total: subsData.length, active, expiringSoon, expired });
// // //           } else {
// // //             console.log('No subscriptions found');
// // //           }
// // //         } catch (subsErr) {
// // //           console.error('Could not load subscription stats:', subsErr);
// // //         }
// // //       } catch (err) {
// // //         console.error('Failed to load data:', err);
// // //         setError('Failed to load some data. Using fallback data.');
// // //       } finally {
// // //         setLoading(false);
// // //       }
// // //     };
// // //     loadData();
// // //   }, []);

// // //   // Filter turfs based on search and filters
// // //   useEffect(() => {
// // //     const filtered = turfs.filter((t) => {
// // //       const matchSearch = t.title.toLowerCase().includes(search.toLowerCase().trim());
// // //       const matchPlan = plan === "All plans" || t.planDuration === plan;
// // //       const matchStatus = status === "Status" || t.status === status;
// // //       const matchLocation = location === "Location" || t.location === location;
// // //       return matchSearch && matchPlan && matchStatus && matchLocation;
// // //     });
// // //     setFilteredTurfs(filtered);
// // //     setPage(1);
// // //   }, [turfs, search, plan, status, location]);

// // //   if (showEditPlans) {
// // //     return (
// // //       <EditPlans
// // //         initialPlans={plans}
// // //         onSave={async (updatedPlans) => {
// // //           setPlans(updatedPlans);
// // //         }}
// // //         onBack={() => setShowEditPlans(false)}
// // //       />
// // //     );
// // //   }

// // //   const resetFilters = () => {
// // //     setSearch("");
// // //     setPlan("All plans");
// // //     setStatus("Status");
// // //     setLocation("Location");
// // //     setPage(1);
// // //   };

// // //   const PER_PAGE = 4;
// // //   const totalPages = Math.max(1, Math.ceil(filteredTurfs.length / PER_PAGE));
// // //   const safePage = Math.min(page, totalPages);
// // //   const paginated = filteredTurfs.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

// // //   const handleSetMostPopular = (id) => setPlans((prev) => prev.map((p) => ({ ...p, isMostPopular: p.id === id })));
// // //   const handleRemoveMostPopular = (id) => setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, isMostPopular: false } : p)));

// // //   const handleSearchChange = (e) => {
// // //     const value = e.target.value;
// // //     setSearch(value);
// // //     setPage(1);
// // //   };

// // //   const statCards = STAT_CARDS.map((card, index) => {
// // //     const keys = ['total', 'active', 'expiringSoon', 'expired'];
// // //     return {
// // //       ...card,
// // //       value: stats[keys[index]] || 0
// // //     };
// // //   });

// // //   return (
// // //     <AdminLayout activeNav="subscription">
// // //       <div className="sub-page">

// // //         {activeTab === "subscription" && <h1 className="sub-page__title">Subscriptions</h1>}

// // //         {activeTab === "subscription" && (
// // //           <div className="sub-page__stats">
// // //             {statCards.map((s) => (
// // //               <div key={s.label} className="sub-stat-card">
// // //                 <div className="sub-stat-card__left">
// // //                   <span className="sub-stat-card__label">{s.label}</span>
// // //                   <span className="sub-stat-card__value">{s.value}</span>
// // //                   <span className="sub-stat-card__delta">{s.delta}</span>
// // //                 </div>
// // //                 <div className="sub-stat-card__icon">
// // //                   <s.icon />
// // //                 </div>
// // //               </div>
// // //             ))}
// // //           </div>
// // //         )}

// // //         <div className="sub-page__tabs">
// // //           <button
// // //             className={`sub-tab ${activeTab === "subscription" ? "sub-tab--active" : ""}`}
// // //             onClick={() => setActiveTab("subscription")}
// // //           >
// // //             SUBSCRIPTION
// // //           </button>
// // //           <button
// // //             className={`sub-tab ${activeTab === "plan" ? "sub-tab--active" : ""}`}
// // //             onClick={() => setActiveTab("plan")}
// // //           >
// // //             PLAN MANAGEMENT
// // //           </button>
// // //         </div>

// // //         {activeTab === "subscription" && (
// // //           <>
// // //             <div className="sub-page__filters">
// // //               <div className="sub-search">
// // //                 <HiOutlineSearch className="sub-search__icon" />
// // //                 <input
// // //                   type="text"
// // //                   placeholder="Search turf by name"
// // //                   value={search}
// // //                   onChange={handleSearchChange}
// // //                   className="sub-search__input"
// // //                 />
// // //               </div>
// // //               <select value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }} className="sub-select">
// // //                 {PLAN_OPTIONS.map((o) => <option key={o}>{o}</option>)}
// // //               </select>
// // //               <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sub-select">
// // //                 {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
// // //               </select>
// // //               <select value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }} className="sub-select">
// // //                 {LOCATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
// // //               </select>
// // //               <button className="sub-reset-btn" onClick={resetFilters}>
// // //                 ↺ Reset Filter
// // //               </button>
// // //             </div>

// // //             <div className="sub-page__grid">
// // //               {loading ? (
// // //                 <p>Loading turfs...</p>
// // //               ) : error ? (
// // //                 <p style={{ color: 'orange' }}>{error}</p>
// // //               ) : paginated.length > 0 ? (
// // //                 paginated.map((turf) => <TurfCard key={turf.turfId} {...turf} />)
// // //               ) : (
// // //                 <p className="sub-page__empty">No turfs match your filters.</p>
// // //               )}
// // //             </div>

// // //             <div className="sub-page__pagination">
// // //               <span className="sub-page__showing">
// // //                 Showing {paginated.length} of {filteredTurfs.length} turfs
// // //               </span>
// // //               <div className="sub-page__pager">
// // //                 <button className="sub-pager-btn" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
// // //                   Previous
// // //                 </button>
// // //                 {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
// // //                   <button
// // //                     key={n}
// // //                     className={`sub-pager-btn sub-pager-btn--num ${safePage === n ? "sub-pager-btn--active" : ""}`}
// // //                     onClick={() => setPage(n)}
// // //                   >
// // //                     {n}
// // //                   </button>
// // //                 ))}
// // //                 <button className="sub-pager-btn" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
// // //                   Next
// // //                 </button>
// // //               </div>
// // //             </div>
// // //           </>
// // //         )}

// // //         {activeTab === "plan" && (
// // //           <div className="sub-plan-management">
// // //             <div className="sub-plan-management__header">
// // //               <button className="sub-edit-plans-btn" onClick={() => setShowEditPlans(true)}>
// // //                 ✎ Edit plans
// // //               </button>
// // //             </div>
// // //             <div className="sub-plan-management__grid">
// // //               {plans.length > 0 ? (
// // //                 plans.map((p) => (
// // //                   <PricingCard
// // //                     key={p.id}
// // //                     plan={p}
// // //                     onSetMostPopular={() => handleSetMostPopular(p.id)}
// // //                     onRemoveMostPopular={() => handleRemoveMostPopular(p.id)}
// // //                     showAdminControls={false}
// // //                   />
// // //                 ))
// // //               ) : (
// // //                 <p>No plans available</p>
// // //               )}
// // //             </div>
// // //           </div>
// // //         )}

// // //       </div>
// // //     </AdminLayout>
// // //   );
// // // }


// // // pages/admin/Subscriptions.jsx
// // import { useState, useEffect, useCallback } from "react";
// // import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
// // import { PiWalletDuotone } from "react-icons/pi";
// // import { HiOutlineLocationMarker } from "react-icons/hi";
// // import { HiOutlineBadgeCheck } from "react-icons/hi";
// // import { HiOutlineSearch } from "react-icons/hi";
// // import AdminLayout from "../../components/admin/AdminLayout";
// // import TurfCard from "../../components/TurfCard";
// // import PricingCard from "../../components/PricingCard";
// // import EditPlans from '../../components/EditPlans';
// // import * as subscriptionApi from '../../services/subscription.service';
// // import * as turfApi from '../../services/turf.service';
// // import "../../assets/styles/Subscription.css";

// // const STAT_CARDS = [
// //   { label: "Total Subscription", value: 0, delta: "+0 this month", icon: HiOutlineBuildingOffice2 },
// //   { label: "Active Subscription", value: 0, delta: "+0 this month", icon: PiWalletDuotone },
// //   { label: "Expiring soon", value: 0, delta: "+0 this month", icon: HiOutlineLocationMarker },
// //   { label: "Expired", value: 0, delta: "+0 this month", icon: HiOutlineBadgeCheck },
// // ];

// // const FALLBACK_TURFS = [
// //   { turfId: "Erd-456", status: "Active", title: "Enjoy Truf Game", price: 585, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Erode", planDuration: "1 Year", turfImage: null, logoImage: null },
// //   { turfId: "Erd-457", status: "Active", title: "SB Land scape Truf", price: 445, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Coimbatore", planDuration: "Free trail", turfImage: null, logoImage: null },
// //   { turfId: "Erd-458", status: "Active", title: "Sports hub ventures", price: 245, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Sathiyamangalam", planDuration: "3 months", turfImage: null, logoImage: null },
// //   { turfId: "Erd-459", status: "Active", title: "Sports men truf", price: 845, startDate: "12 / 01 / 2027", endDate: "12 / 03 / 2027", location: "Gobi", planDuration: "1 Year", turfImage: null, logoImage: null },
// //   { turfId: "Erd-460", status: "Inactive", title: "Green Valley Turf", price: 399, startDate: "01 / 02 / 2027", endDate: "01 / 05 / 2027", location: "Erode", planDuration: "3 months", turfImage: null, logoImage: null },
// //   { turfId: "Erd-461", status: "Active", title: "Royal Sports Arena", price: 699, startDate: "15 / 03 / 2027", endDate: "15 / 04 / 2027", location: "Coimbatore", planDuration: "1 Year", turfImage: null, logoImage: null },
// //   { turfId: "Erd-462", status: "Inactive", title: "City Premier Turf", price: 525, startDate: "20 / 01 / 2027", endDate: "20 / 02 / 2027", location: "Gobi", planDuration: "Free trail", turfImage: null, logoImage: null },
// //   { turfId: "Erd-463", status: "Active", title: "Victory Sports Ground", price: 750, startDate: "05 / 02 / 2027", endDate: "05 / 03 / 2027", location: "Sathiyamangalam", planDuration: "1 Year", turfImage: null, logoImage: null },
// // ];

// // const PLAN_OPTIONS = ["All plans", "1 Year", "3 months", "Free trail"];
// // const STATUS_OPTIONS = ["Status", "Active", "Inactive", "Expired"];
// // const LOCATION_OPTIONS = ["Location", "Erode", "Coimbatore", "Sathiyamangalam", "Gobi"];

// // const toTurfCardProps = (turf) => ({
// //   turfId: turf._id || turf.turfId,
// //   status: turf.approvalStatus || turf.status || "Active",
// //   title: turf.name || turf.title || "Turf",
// //   price: turf.pricePerHour?.basePrice || turf.price || 0,
// //   startDate: turf.startDate || "N/A",
// //   endDate: turf.endDate || "N/A",
// //   location: turf.location || turf.address?.city || "N/A",
// //   planDuration: turf.planDuration || "N/A",
// //   turfImage: turf.mainImage || turf.turfImage || null,
// //   logoImage: turf.logoImage || null,
// // });

// // // Convert backend plan -> the read-only PricingCard display shape.
// // // Uses featureList (free-text bullets) directly -- this is now the same
// // // source of truth EditPlans reads/writes, so the two views can never
// // // drift apart the way they did before.
// // const toDisplayPlanShape = (p) => ({
// //   id: p._id,
// //   title: p.name,
// //   billingLabel: p.description || "Billed every month",
// //   price: p.price,
// //   perLabel: `${p.durationDays} Days`,
// //   isMostPopular: !!p.isMostPopular,
// //   features:
// //     Array.isArray(p.featureList) && p.featureList.length > 0
// //       ? p.featureList
// //       : ["Manage your turf"],
// // });

// // export default function Subscriptions() {
// //   const [activeTab, setActiveTab] = useState("subscription");
// //   const [search, setSearch] = useState("");
// //   const [plan, setPlan] = useState("All plans");
// //   const [status, setStatus] = useState("Status");
// //   const [location, setLocation] = useState("Location");
// //   const [page, setPage] = useState(1);
// //   const [plans, setPlans] = useState([]);
// //   const [plansLoading, setPlansLoading] = useState(true);
// //   const [turfs, setTurfs] = useState(FALLBACK_TURFS);
// //   const [filteredTurfs, setFilteredTurfs] = useState(FALLBACK_TURFS);
// //   const [showEditPlans, setShowEditPlans] = useState(false);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [stats, setStats] = useState({
// //     total: 0,
// //     active: 0,
// //     expiringSoon: 0,
// //     expired: 0
// //   });

// //   // Plans are reloaded independently from turfs/stats so that returning from
// //   // EditPlans (which writes straight to the backend) can refresh just this
// //   // slice of state without re-fetching everything else.
// //   const loadPlans = useCallback(async () => {
// //     setPlansLoading(true);
// //     try {
// //       const plansResponse = await subscriptionApi.getPublicPlans();
// //       const planData = plansResponse.data?.plans || [];
// //       setPlans(planData.map(toDisplayPlanShape));
// //     } catch (planErr) {
// //       console.error('Could not load plans from backend:', planErr);
// //     } finally {
// //       setPlansLoading(false);
// //     }
// //   }, []);

// //   useEffect(() => {
// //     const loadData = async () => {
// //       setLoading(true);
// //       setError(null);
// //       try {
// //         await loadPlans();

// //         try {
// //           const turfsResponse = await turfApi.getAllTurfs();

// //           let turfData = [];
// //           if (turfsResponse?.data?.turfs) {
// //             turfData = turfsResponse.data.turfs;
// //           } else if (turfsResponse?.data) {
// //             turfData = turfsResponse.data;
// //           } else if (Array.isArray(turfsResponse)) {
// //             turfData = turfsResponse;
// //           }

// //           if (turfData && turfData.length > 0) {
// //             const mappedTurfs = turfData.map(toTurfCardProps);
// //             setTurfs(mappedTurfs);
// //             setFilteredTurfs(mappedTurfs);
// //           } else {
// //             setTurfs(FALLBACK_TURFS);
// //             setFilteredTurfs(FALLBACK_TURFS);
// //           }
// //         } catch (turfErr) {
// //           console.error('Failed to load turfs:', turfErr);
// //           setTurfs(FALLBACK_TURFS);
// //           setFilteredTurfs(FALLBACK_TURFS);
// //         }

// //         try {
// //           const token = localStorage.getItem('token');
// //           if (!token) {
// //             console.log('No token found, skipping subscription stats');
// //             return;
// //           }

// //           const subsResponse = await subscriptionApi.getAllSubscriptions({ page: 1, limit: 100 });
// //           const subsData = subsResponse.data?.subscriptions || [];

// //           if (subsData.length > 0) {
// //             const active = subsData.filter(s => s.status === 'active' || s.status === 'trial').length;
// //             const expired = subsData.filter(s => s.status === 'expired').length;
// //             const expiringSoon = subsData.filter(s => {
// //               if (!s.endDate) return false;
// //               const daysRemaining = Math.ceil((new Date(s.endDate) - new Date()) / (1000 * 60 * 60 * 24));
// //               return daysRemaining <= 7 && daysRemaining > 0;
// //             }).length;

// //             setStats({
// //               total: subsData.length,
// //               active,
// //               expiringSoon,
// //               expired
// //             });
// //           }
// //         } catch (subsErr) {
// //           // Most likely an expired/invalid token (401) -- see axiosInstance/Login token handling.
// //           console.error('Could not load subscription stats:', subsErr);
// //         }
// //       } catch (err) {
// //         console.error('Failed to load data:', err);
// //         setError('Failed to load some data. Using fallback data.');
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     loadData();
// //   }, [loadPlans]);

// //   useEffect(() => {
// //     const filtered = turfs.filter((t) => {
// //       const matchSearch = t.title.toLowerCase().includes(search.toLowerCase().trim());
// //       const matchPlan = plan === "All plans" || t.planDuration === plan;
// //       const matchStatus = status === "Status" || t.status === status;
// //       const matchLocation = location === "Location" || t.location === location;
// //       return matchSearch && matchPlan && matchStatus && matchLocation;
// //     });
// //     setFilteredTurfs(filtered);
// //     setPage(1);
// //   }, [turfs, search, plan, status, location]);

// //   if (showEditPlans) {
// //     return (
// //       <EditPlans
// //         onSave={loadPlans}
// //         onBack={() => setShowEditPlans(false)}
// //       />
// //     );
// //   }

// //   const resetFilters = () => {
// //     setSearch("");
// //     setPlan("All plans");
// //     setStatus("Status");
// //     setLocation("Location");
// //     setPage(1);
// //   };

// //   const PER_PAGE = 4;
// //   const totalPages = Math.max(1, Math.ceil(filteredTurfs.length / PER_PAGE));
// //   const safePage = Math.min(page, totalPages);
// //   const paginated = filteredTurfs.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

// //   const handleSearchChange = (e) => {
// //     const value = e.target.value;
// //     setSearch(value);
// //     setPage(1);
// //   };

// //   const statCards = STAT_CARDS.map((card, index) => {
// //     const keys = ['total', 'active', 'expiringSoon', 'expired'];
// //     return {
// //       ...card,
// //       value: stats[keys[index]] || 0
// //     };
// //   });

// //   return (
// //     <AdminLayout activeNav="subscription">
// //       <div className="sub-page">

// //         {activeTab === "subscription" && <h1 className="sub-page__title">Subscriptions</h1>}

// //         {activeTab === "subscription" && (
// //           <div className="sub-page__stats">
// //             {statCards.map((s) => (
// //               <div key={s.label} className="sub-stat-card">
// //                 <div className="sub-stat-card__left">
// //                   <span className="sub-stat-card__label">{s.label}</span>
// //                   <span className="sub-stat-card__value">{s.value}</span>
// //                   <span className="sub-stat-card__delta">{s.delta}</span>
// //                 </div>
// //                 <div className="sub-stat-card__icon">
// //                   <s.icon />
// //                 </div>
// //               </div>
// //             ))}
// //           </div>
// //         )}

// //         <div className="sub-page__tabs">
// //           <button
// //             className={`sub-tab ${activeTab === "subscription" ? "sub-tab--active" : ""}`}
// //             onClick={() => setActiveTab("subscription")}
// //           >
// //             SUBSCRIPTION
// //           </button>
// //           <button
// //             className={`sub-tab ${activeTab === "plan" ? "sub-tab--active" : ""}`}
// //             onClick={() => setActiveTab("plan")}
// //           >
// //             PLAN MANAGEMENT
// //           </button>
// //         </div>

// //         {activeTab === "subscription" && (
// //           <>
// //             <div className="sub-page__filters">
// //               <div className="sub-search">
// //                 <HiOutlineSearch className="sub-search__icon" />
// //                 <input
// //                   type="text"
// //                   placeholder="Search turf by name"
// //                   value={search}
// //                   onChange={handleSearchChange}
// //                   className="sub-search__input"
// //                 />
// //               </div>
// //               <select value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }} className="sub-select">
// //                 {PLAN_OPTIONS.map((o) => <option key={o}>{o}</option>)}
// //               </select>
// //               <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sub-select">
// //                 {STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}
// //               </select>
// //               <select value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }} className="sub-select">
// //                 {LOCATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
// //               </select>
// //               <button className="sub-reset-btn" onClick={resetFilters}>
// //                 ↺ Reset Filter
// //               </button>
// //             </div>

// //             <div className="sub-page__grid">
// //               {loading ? (
// //                 <p>Loading turfs...</p>
// //               ) : error ? (
// //                 <p style={{ color: 'orange' }}>{error}</p>
// //               ) : paginated.length > 0 ? (
// //                 paginated.map((turf) => <TurfCard key={turf.turfId} {...turf} />)
// //               ) : (
// //                 <p className="sub-page__empty">No turfs match your filters.</p>
// //               )}
// //             </div>

// //             <div className="sub-page__pagination">
// //               <span className="sub-page__showing">
// //                 Showing {paginated.length} of {filteredTurfs.length} turfs
// //               </span>
// //               <div className="sub-page__pager">
// //                 <button className="sub-pager-btn" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
// //                   Previous
// //                 </button>
// //                 {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
// //                   <button
// //                     key={n}
// //                     className={`sub-pager-btn sub-pager-btn--num ${safePage === n ? "sub-pager-btn--active" : ""}`}
// //                     onClick={() => setPage(n)}
// //                   >
// //                     {n}
// //                   </button>
// //                 ))}
// //                 <button className="sub-pager-btn" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
// //                   Next
// //                 </button>
// //               </div>
// //             </div>
// //           </>
// //         )}

// //         {activeTab === "plan" && (
// //           <div className="sub-plan-management">
// //             <div className="sub-plan-management__header">
// //               <button className="sub-edit-plans-btn" onClick={() => setShowEditPlans(true)}>
// //                 ✎ Edit plans
// //               </button>
// //             </div>
// //             <div className="sub-plan-management__grid">
// //               {plansLoading ? (
// //                 <p>Loading plans...</p>
// //               ) : plans.length > 0 ? (
// //                 plans.map((p) => (
// //                   <PricingCard
// //                     key={p.id}
// //                     plan={p}
// //                     showAdminControls={false}
// //                   />
// //                 ))
// //               ) : (
// //                 <p>No plans available</p>
// //               )}
// //             </div>
// //           </div>
// //         )}

// //       </div>
// //     </AdminLayout>
// //   );
// // }


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

// // Convert backend turf to TurfCard props
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

// // Convert backend plan -> read-only PricingCard display shape
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
//   const [turfs, setTurfs] = useState(FALLBACK_TURFS);
//   const [filteredTurfs, setFilteredTurfs] = useState(FALLBACK_TURFS);
//   const [showEditPlans, setShowEditPlans] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [stats, setStats] = useState({
//     total: 0,
//     active: 0,
//     expiringSoon: 0,
//     expired: 0
//   });

//   // ── Load Plans Function ──
//   const loadPlans = useCallback(async () => {
//     setPlansLoading(true);
//     try {
//       const plansResponse = await subscriptionApi.getPublicPlans();
//       const planData = plansResponse.data?.plans || [];
//       const displayPlans = planData.map(toDisplayPlanShape);
//       setPlans(displayPlans);
//       console.log('✅ Plans loaded:', displayPlans.length);
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
//         // 1. Load Plans
//         await loadPlans();

//         // 2. Load Turfs
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
//             console.log('✅ Turfs loaded:', mappedTurfs.length);
//           } else {
//             console.log('No turfs found, using fallback data');
//             setTurfs(FALLBACK_TURFS);
//             setFilteredTurfs(FALLBACK_TURFS);
//           }
//         } catch (turfErr) {
//           console.error('Failed to load turfs:', turfErr);
//           setTurfs(FALLBACK_TURFS);
//           setFilteredTurfs(FALLBACK_TURFS);
//         }

//         // 3. Load Subscription Stats (Admin only)
//         try {
//           const token = localStorage.getItem('token');
//           if (!token) {
//             console.log('No token found, skipping subscription stats');
//             return;
//           }

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

//             setStats({
//               total: subsData.length,
//               active,
//               expiringSoon,
//               expired
//             });
//             console.log('✅ Stats updated:', { total: subsData.length, active, expiringSoon, expired });
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

//   // ── Handle Search ──
//   const handleSearchChange = (e) => {
//     const value = e.target.value;
//     setSearch(value);
//     setPage(1);
//   };

//   // ── Reset Filters ──
//   const resetFilters = () => {
//     setSearch("");
//     setPlan("All plans");
//     setStatus("Status");
//     setLocation("Location");
//     setPage(1);
//   };

//   // ── Pagination ──
//   const PER_PAGE = 4;
//   const totalPages = Math.max(1, Math.ceil(filteredTurfs.length / PER_PAGE));
//   const safePage = Math.min(page, totalPages);
//   const paginated = filteredTurfs.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

//   // ── Stats Cards ──
//   const statCards = STAT_CARDS.map((card, index) => {
//     const keys = ['total', 'active', 'expiringSoon', 'expired'];
//     return {
//       ...card,
//       value: stats[keys[index]] || 0
//     };
//   });

//   // ── Show EditPlans if active ──
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
//     <AdminLayout activeNav="subscription">
//       <div className="sub-page">

//         {/* ── Page Title ── */}
//         {activeTab === "subscription" && (
//           <h1 className="sub-page__title">Subscriptions</h1>
//         )}

//         {/* ── Stats Cards ── */}
//         {activeTab === "subscription" && (
//           <div className="sub-page__stats">
//             {statCards.map((s) => (
//               <div key={s.label} className="sub-stat-card">
//                 <div className="sub-stat-card__left">
//                   <span className="sub-stat-card__label">{s.label}</span>
//                   <span className="sub-stat-card__value">{s.value}</span>
//                   <span className="sub-stat-card__delta">{s.delta}</span>
//                 </div>
//                 <div className="sub-stat-card__icon">
//                   <s.icon />
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}

//         {/* ── Tabs ── */}
//         <div className="sub-page__tabs">
//           <button
//             className={`sub-tab ${activeTab === "subscription" ? "sub-tab--active" : ""}`}
//             onClick={() => setActiveTab("subscription")}
//           >
//             SUBSCRIPTION
//           </button>
//           <button
//             className={`sub-tab ${activeTab === "plan" ? "sub-tab--active" : ""}`}
//             onClick={() => setActiveTab("plan")}
//           >
//             PLAN MANAGEMENT
//           </button>
//         </div>

//         {/* ── SUBSCRIPTION TAB ── */}
//         {activeTab === "subscription" && (
//           <>
//             {/* Filters */}
//             <div className="sub-page__filters">
//               <div className="sub-search">
//                 <HiOutlineSearch className="sub-search__icon" />
//                 <input
//                   type="text"
//                   placeholder="Search turf by name"
//                   value={search}
//                   onChange={handleSearchChange}
//                   className="sub-search__input"
//                 />
//               </div>
//               <select 
//                 value={plan} 
//                 onChange={(e) => { setPlan(e.target.value); setPage(1); }} 
//                 className="sub-select"
//               >
//                 {PLAN_OPTIONS.map((o) => (
//                   <option key={o}>{o}</option>
//                 ))}
//               </select>
//               <select 
//                 value={status} 
//                 onChange={(e) => { setStatus(e.target.value); setPage(1); }} 
//                 className="sub-select"
//               >
//                 {STATUS_OPTIONS.map((o) => (
//                   <option key={o}>{o}</option>
//                 ))}
//               </select>
//               <select 
//                 value={location} 
//                 onChange={(e) => { setLocation(e.target.value); setPage(1); }} 
//                 className="sub-select"
//               >
//                 {LOCATION_OPTIONS.map((o) => (
//                   <option key={o}>{o}</option>
//                 ))}
//               </select>
//               <button className="sub-reset-btn" onClick={resetFilters}>
//                 ↺ Reset Filter
//               </button>
//             </div>

//             {/* Turf Grid */}
//             <div className="sub-page__grid">
//               {loading ? (
//                 <p>Loading turfs...</p>
//               ) : error ? (
//                 <p style={{ color: 'orange' }}>{error}</p>
//               ) : paginated.length > 0 ? (
//                 paginated.map((turf) => (
//                   <TurfCard key={turf.turfId} {...turf} />
//                 ))
//               ) : (
//                 <p className="sub-page__empty">No turfs match your filters.</p>
//               )}
//             </div>

//             {/* Pagination */}
//             <div className="sub-page__pagination">
//               <span className="sub-page__showing">
//                 Showing {paginated.length} of {filteredTurfs.length} turfs
//               </span>
//               <div className="sub-page__pager">
//                 <button 
//                   className="sub-pager-btn" 
//                   disabled={safePage === 1} 
//                   onClick={() => setPage((p) => Math.max(1, p - 1))}
//                 >
//                   Previous
//                 </button>
//                 {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
//                   <button
//                     key={n}
//                     className={`sub-pager-btn sub-pager-btn--num ${safePage === n ? "sub-pager-btn--active" : ""}`}
//                     onClick={() => setPage(n)}
//                   >
//                     {n}
//                   </button>
//                 ))}
//                 <button 
//                   className="sub-pager-btn" 
//                   disabled={safePage === totalPages} 
//                   onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
//                 >
//                   Next
//                 </button>
//               </div>
//             </div>
//           </>
//         )}

//         {/* ── PLAN MANAGEMENT TAB ── */}
//         {activeTab === "plan" && (
//           <div className="sub-plan-management">
//             <div className="sub-plan-management__header">
//               <button 
//                 className="sub-edit-plans-btn" 
//                 onClick={() => setShowEditPlans(true)}
//               >
//                 ✎ Edit plans
//               </button>
//             </div>
//             <div className="sub-plan-management__grid">
//               {plansLoading ? (
//                 <p>Loading plans...</p>
//               ) : plans.length > 0 ? (
//                 plans.map((p) => (
//                   <PricingCard
//                     key={p.id}
//                     plan={p}
//                     showAdminControls={false}
//                   />
//                 ))
//               ) : (
//                 <p>No plans available. Click "Edit plans" to create one.</p>
//               )}
//             </div>
//           </div>
//         )}

//       </div>
//     </AdminLayout>
//   );
// }