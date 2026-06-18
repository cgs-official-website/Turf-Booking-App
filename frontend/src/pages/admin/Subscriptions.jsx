import { useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import TurfCard from "../../components/TurfCard";
import PricingCard from "../../components/PricingCard";
import EditPlans from '../../components/EditPlans';
import "../../assets/styles/Subscription.css";

const STAT_CARDS = [
  { label: "Total Subscription", value: 250, delta: "+15 this month", icon: "🏢" },
  { label: "Active Subscription", value: 150, delta: "+15 this month", icon: "📋" },
  { label: "Expiring soon", value: 250, delta: "+15 this month", icon: "📍" },
  { label: "Expired", value: 10, delta: "+15 this month", icon: "✅" },
];

const TURFS = [
  { turfId: "Erd-456", status: "Active", title: "Enjoy Truf Game", price: 585, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Erode", planDuration: "1 Year", defaultImage: null, defaultLogo: null },
  { turfId: "Erd-456", status: "Active", title: "SB Land scape Truf", price: 445, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Coimbatore", planDuration: "Free trail", defaultImage: null, defaultLogo: null },
  { turfId: "Erd-456", status: "Active", title: "Sports hub ventures", price: 245, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Sathiyamangalam", planDuration: "3 months", defaultImage: null, defaultLogo: null },
  { turfId: "Erd-456", status: "Active", title: "Sports men truf", price: 845, startDate: "12 / 01 / 2027", endDate: "12 / 03 / 2027", location: "Gobi", planDuration: "1 Year", defaultImage: null, defaultLogo: null },
];

const INITIAL_PLANS = [
  { id: "monthly", title: "Monthly plan", billingLabel: "Billed every month", price: 499, perLabel: "Month", isMostPopular: false, features: ["Manage your turf", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "Access to 100 million stock images"] },
  { id: "3month", title: "3-Month plan", billingLabel: "Billed every 3 month", price: 1497, perLabel: "3 month", isMostPopular: true, features: ["Manage your turf", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "Access to 100 million stock images"] },
  { id: "yearly", title: "Yearly plan", billingLabel: "Billed every year", price: 5988, perLabel: "Per year", isMostPopular: false, features: ["Manage your turf", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "20,000+ of PNG & SVG graphics", "Access to 100 million stock images"] },
];

const PLAN_OPTIONS = ["All plans", "1 Year", "3 months", "Free trail"];
const STATUS_OPTIONS = ["Status", "Active", "Inactive", "Expired"];
const LOCATION_OPTIONS = ["Location", "Erode", "Coimbatore", "Sathiyamangalam", "Gobi"];

export default function SubscriptionPage() {
  const [activeTab, setActiveTab] = useState("subscription");
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("All plans");
  const [status, setStatus] = useState("Status");
  const [location, setLocation] = useState("Location");
  const [page, setPage] = useState(1);
  const [plans, setPlans] = useState(INITIAL_PLANS);
  const [showEditPlans, setShowEditPlans] = useState(false);

  // Show EditPlans page when button clicked
  if (showEditPlans) {
    return <EditPlans onBack={() => setShowEditPlans(false)} />;
  }

  const resetFilters = () => { setSearch(""); setPlan("All plans"); setStatus("Status"); setLocation("Location"); setPage(1); };

  const filtered = TURFS.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchPlan = plan === "All plans" || t.planDuration === plan;
    const matchStatus = status === "Status" || t.status === status;
    const matchLocation = location === "Location" || t.location === location;
    return matchSearch && matchPlan && matchStatus && matchLocation;
  });

  const PER_PAGE = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleSetMostPopular = (id) => setPlans((prev) => prev.map((p) => ({ ...p, isMostPopular: p.id === id })));
  const handleRemoveMostPopular = (id) => setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, isMostPopular: false } : p)));

  return (
    <AdminLayout>
      <div className="sub-page">

        {activeTab === "subscription" && <h1 className="sub-page__title">Subscription</h1>}

        {activeTab === "subscription" && (
          <div className="sub-page__stats">
            {STAT_CARDS.map((s) => (
              <div key={s.label} className="sub-stat-card">
                <div className="sub-stat-card__left">
                  <span className="sub-stat-card__label">{s.label}</span>
                  <span className="sub-stat-card__value">{s.value}</span>
                  <span className="sub-stat-card__delta">{s.delta}</span>
                </div>
                <div className="sub-stat-card__icon">{s.icon}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="sub-page__tabs">
          <button className={`sub-tab ${activeTab === "subscription" ? "sub-tab--active" : ""}`} onClick={() => setActiveTab("subscription")}>
            Subscription
          </button>
          <button className={`sub-tab ${activeTab === "plan" ? "sub-tab--active" : ""}`} onClick={() => setActiveTab("plan")}>
            Plan Management
          </button>
        </div>

        {/* Subscription tab */}
        {activeTab === "subscription" && (
          <>
            <div className="sub-page__filters">
              <div className="sub-search">
                <span className="sub-search__icon">🔍</span>
                <input type="text" placeholder="Search turf by name" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="sub-search__input" />
              </div>
              <select value={plan} onChange={(e) => { setPlan(e.target.value); setPage(1); }} className="sub-select">{PLAN_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
              <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="sub-select">{STATUS_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
              <select value={location} onChange={(e) => { setLocation(e.target.value); setPage(1); }} className="sub-select">{LOCATION_OPTIONS.map((o) => <option key={o}>{o}</option>)}</select>
              <button className="sub-reset-btn" onClick={resetFilters}>↺ Reset Filter</button>
            </div>

            <div className="sub-page__grid">
              {paginated.length > 0
                ? paginated.map((turf, i) => <TurfCard key={i} {...turf} />)
                : <p className="sub-page__empty">No turfs match your filters.</p>}
            </div>

            <div className="sub-page__pagination">
              <span className="sub-page__showing">Showing {filtered.length} of {TURFS.length} turfs</span>
              <div className="sub-page__pager">
                <button className="sub-pager-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button key={n} className={`sub-pager-btn sub-pager-btn--num ${page === n ? "sub-pager-btn--active" : ""}`} onClick={() => setPage(n)}>{n}</button>
                ))}
                <button className="sub-pager-btn" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </>
        )}

        {/* Plan Management tab */}
        {activeTab === "plan" && (
          <div className="sub-plan-management">
            <div className="sub-plan-management__header">
              <button className="sub-edit-plans-btn" onClick={() => setShowEditPlans(true)}>
                ✎ Edit plans
              </button>
            </div>
            <div className="sub-plan-management__grid">
              {plans.map((p) => (
                <PricingCard
                  key={p.id}
                  plan={p}
                  onSetMostPopular={() => handleSetMostPopular(p.id)}
                  onRemoveMostPopular={() => handleRemoveMostPopular(p.id)}
                  showAdminControls={false}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
}