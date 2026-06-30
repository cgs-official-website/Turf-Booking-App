// pages/admin/Vendors.jsx
import { useState, useEffect, useCallback } from "react";
import { HiOutlineSearch, HiOutlineLocationMarker, HiOutlineBadgeCheck } from "react-icons/hi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { PiWalletDuotone } from "react-icons/pi";
import Card from "../../components/Card";
import VendorDetail from "../../components/VendorDetail";
import { getAllVendors, getVendorSubscriptionHistory } from "../../services/vendors.service";
import { getSubscriptionStats } from "../../services/subscription.service";
import "../../assets/styles/Vendors.css";
import "../../assets/styles/Subscription.css";

const STATUS_OPTIONS = ["Status", "Active", "Expired"];

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function Vendors() {
  // ── State ──
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Status");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiringSoon: 0,
    expired: 0,
  });

  // Detail Page State
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showDetailPage, setShowDetailPage] = useState(false);

  // ── Load Data from Backend ──
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getAllVendors();

        // Transform backend data to match frontend format and fetch subscription status for each
        const transformedVendors = await Promise.all(response.data.map(async (vendor, index) => {
          let subscriptionStatus = 'expired';
          let daysLeft = null;

          try {
            const historyRes = await getVendorSubscriptionHistory(vendor._id);
            const history = historyRes.data || [];
            // Look for an active or trial subscription in the vendor's history
            const activeSub = history.find(s => s.status === 'active' || s.status === 'trial');
            
            if (activeSub) {
              subscriptionStatus = 'active';
              if (activeSub.endDate) {
                const remaining = Math.ceil((new Date(activeSub.endDate) - new Date()) / (1000 * 60 * 60 * 24));
                daysLeft = remaining > 0 ? remaining : 0;
              }
            }
          } catch (historyErr) {
            console.error(`Failed to load subscription history for vendor ${vendor._id}:`, historyErr);
          }

          return {
            id: index + 1,
            vendorId: `VND ID : VND-${(vendor._id || "").slice(-4).toUpperCase()}`,
            name: vendor.vendorName,
            email: vendor.email,
            phone: vendor.phone,
            location: vendor.location,
            image: vendor.bannerImage 
              ? (vendor.bannerImage.startsWith("http") ? vendor.bannerImage : `http://localhost:5000${vendor.bannerImage.startsWith("/") ? "" : "/"}${vendor.bannerImage}`)
              : (vendor.turfs?.[0]?.mainImage 
                 ? (vendor.turfs[0].mainImage.startsWith("http") ? vendor.turfs[0].mainImage : `http://localhost:5000${vendor.turfs[0].mainImage.startsWith("/") ? "" : "/"}${vendor.turfs[0].mainImage}`)
                 : "https://images.unsplash.com/photo-1516399653135-68efc5e5cf13?w=600&h=400&fit=crop"),
            logoImage: vendor.profileImage 
              ? (vendor.profileImage.startsWith("http") ? vendor.profileImage : `http://localhost:5000${vendor.profileImage.startsWith("/") ? "" : "/"}${vendor.profileImage}`) 
              : (vendor.turfs?.[0]?.logoImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(vendor.vendorName || "Vendor")}&background=dcfce7&color=15803d`),
            profileImage: vendor.profileImage 
              ? (vendor.profileImage.startsWith("http") ? vendor.profileImage : `http://localhost:5000${vendor.profileImage.startsWith("/") ? "" : "/"}${vendor.profileImage}`) 
              : null,
            subscriptionStatus,
            daysLeft,
            // Store additional vendor data for detail view
            _id: vendor._id,
            turfCount: vendor.turfCount,
            turfs: vendor.turfs || [],
            kycDocuments: vendor.kycDocuments,
          };
        }));

        try {
          const statsRes = await getSubscriptionStats();
          if (statsRes?.data) {
            setStats({
              total: statsRes.data.totalSubscriptions || statsRes.data.total || 0,
              active: statsRes.data.activeSubscriptions || statsRes.data.active || 0,
              expiringSoon: statsRes.data.expiringSoon || 0,
              expired: statsRes.data.expiredSubscriptions || statsRes.data.expired || 0,
            });
          }
        } catch (statsErr) {
          console.error("Failed to load subscription stats:", statsErr);
        }

        setVendors(transformedVendors);
        setFilteredVendors(transformedVendors);
      } catch (err) {
        console.error("Failed to load vendors from backend:", err);
        setError("Failed to load vendors from backend. Please try again.");
        setVendors([]);
        setFilteredVendors([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ── Filter Vendors ──
  useEffect(() => {
    const filtered = vendors.filter((v) => {
      const matchSearch = v.name
        .toLowerCase()
        .includes(search.toLowerCase().trim());
      const matchStatus =
        status === "Status" ||
        (status === "Active" && v.subscriptionStatus === "active") ||
        (status === "Expired" && v.subscriptionStatus === "expired");
      return matchSearch && matchStatus;
    });
    setFilteredVendors(filtered);
    setPage(1);
  }, [vendors, search, status]);

  // ── Handle Card Click ──
  const handleCardClick = (vendor) => {
    setSelectedVendor(vendor);
    setShowDetailPage(true);
  };

  // ── Handle Back from Detail Page ──
  const handleBackFromDetail = () => {
    setShowDetailPage(false);
    setSelectedVendor(null);
  };

  const handleVendorSuspended = (suspendedVendorId) => {
    setVendors(prev => prev.filter(v => v._id !== suspendedVendorId));
    setFilteredVendors(prev => prev.filter(v => v._id !== suspendedVendorId));
    setShowDetailPage(false);
    setSelectedVendor(null);
  };

  // ── Handle Search ──
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);
  };

  // ── Reset Filters ──
  const resetFilters = () => {
    setSearch("");
    setStatus("Status");
    setPage(1);
  };

  // ── Pagination ──
  const PER_PAGE = 4;
  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginated = filteredVendors.slice(
    (safePage - 1) * PER_PAGE,
    safePage * PER_PAGE,
  );

  // ── Show Detail Page if Selected ──
  if (showDetailPage && selectedVendor) {
    return (
      <VendorDetail vendor={selectedVendor} onBack={handleBackFromDetail} onVendorSuspended={handleVendorSuspended} />
    );
  }

  // ── Render Vendor List ──
  return (
    <div className="vendor-management-container">
      {/* ── Page Title ── */}
      <h1 className="page-title">Vendor Management</h1>

      {/* ── Stat Cards ── */}
      <div className="sub-page__stats">
        {[
          { label: "Total Subscription", value: stats.total, delta: `+${stats.total} this month`, icon: HiOutlineBuildingOffice2 },
          { label: "Active Subscription", value: stats.active, delta: `+${stats.active} this month`, icon: PiWalletDuotone },
          { label: "Expiring soon", value: stats.expiringSoon, delta: `+${stats.expiringSoon} this month`, icon: HiOutlineLocationMarker },
          { label: "Expired", value: stats.expired, delta: "", icon: HiOutlineBadgeCheck }
        ].map((s) => (
          <div key={s.label} className="sub-stat-card">
            <div className="sub-stat-card__left">
              <span className="sub-stat-card__label">{s.label}</span>
              <span className="sub-stat-card__value">{s.value}</span>
              {s.delta && <span className="sub-stat-card__delta">{s.delta}</span>}
            </div>
            <div className="sub-stat-card__icon">
              <s.icon />
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="filters-section">
        <div className="search-wrapper">
          <HiOutlineSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search turf by name"
            value={search}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="location-filter"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
        <button className="reset-filter-btn" onClick={resetFilters}>
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

      {/* ── List Container ── */}
      <div className="vendor-list-container">
        {/* ── Vendors Grid ── */}
        <div className="vendor-grid">
          {loading ? (
            <p>Loading vendors...</p>
          ) : error ? (
            <p style={{ color: "orange" }}>{error}</p>
          ) : paginated.length > 0 ? (
            paginated.map((vendor) => {
              return (
                <Card
                  key={vendor.id}
                  vendor={vendor}
                  onClick={() => handleCardClick(vendor)}
                />
              );
            })
          ) : (
            <p>No vendors match your filters.</p>
          )}
        </div>
      </div>

      {/* ── Pagination ── */}
      <div className="pagination-container">
        <span className="pagination-info-left">
          Showing {(safePage - 1) * PER_PAGE + 1} to {Math.min(safePage * PER_PAGE, filteredVendors.length)} results
        </span>

        <div className="pagination-center">
          <button
            className="pagination-arrow"
            disabled={safePage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>

          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={`page-number ${safePage === n ? "active" : ""}`}
                onClick={() => setPage(n)}
              >
                {n}
              </button>
            ))}
          </div>

          <button
            className="pagination-arrow"
            disabled={safePage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            ›
          </button>
        </div>

        <div className="pagination-info">
          Rows per page <span className="rows-per-page">04</span>
        </div>
      </div>
    </div>
  );
}
