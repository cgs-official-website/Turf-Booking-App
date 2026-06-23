// pages/admin/Vendors.jsx
import { useState, useEffect, useCallback } from "react";
import { HiOutlineSearch } from "react-icons/hi";
import Card from "../../components/Card";
import VendorDetail from "../../components/VendorDetail";
import { getAllVendors } from "../../services/vendors.service";
import "../../assets/styles/Vendors.css";

const LOCATION_OPTIONS = [
  "Location",
  "Erode",
  "Coimbatore",
  "Chennai",
  "Bangalore",
];

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function Vendors() {
  // ── State ──
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("Location");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        // Transform backend data to match frontend format
        const transformedVendors = response.data.map((vendor, index) => ({
          id: index + 1,
          vendorId: `VND ID: ERD-${vendor.vendorId}`,
          name: vendor.vendorName,
          email: vendor.email,
          phone: vendor.phone,
          location: vendor.location,
          image:
            "https://images.unsplash.com/photo-1516399653135-68efc5e5cf13?w=600&h=400&fit=crop",
          // Store additional vendor data for detail view
          _id: vendor._id,
          turfCount: vendor.turfCount,
          turfs: vendor.turfs || [],
        }));

        setVendors(transformedVendors);
        setFilteredVendors(transformedVendors);
        console.log(
          "✅ Vendors loaded from backend:",
          transformedVendors.length,
        );
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
      const matchLocation = location === "Location" || v.location === location;
      return matchSearch && matchLocation;
    });
    setFilteredVendors(filtered);
    setPage(1);
  }, [vendors, search, location]);

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

  // ── Handle Search ──
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    setPage(1);
  };

  // ── Reset Filters ──
  const resetFilters = () => {
    setSearch("");
    setLocation("Location");
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
      <VendorDetail vendor={selectedVendor} onBack={handleBackFromDetail} />
    );
  }

  // ── Render Vendor List ──
  return (
    <div className="vendor-management-container">
      {/* ── Page Title ── */}
      <h1 className="page-title">Vendor Management</h1>

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
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            setPage(1);
          }}
          className="location-filter"
        >
          {LOCATION_OPTIONS.map((o) => (
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
            paginated.map((vendor) => (
              <Card
                key={vendor.id}
                vendor={vendor}
                onClick={() => handleCardClick(vendor)}
              />
            ))
          ) : (
            <p>No vendors match your filters.</p>
          )}
        </div>
      </div>

      {/* ── Pagination ── */}
      <div className="pagination-container">
        <button
          className="pagination-arrow"
          disabled={safePage === 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          <i className="bi bi-chevron-left" />
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
          <i className="bi bi-chevron-right" />
        </button>

        <div className="pagination-info">
          Showing {paginated.length} of {filteredVendors.length} results | Rows
          per page <span className="rows-per-page">04</span>
        </div>
      </div>
    </div>
    // </div>
  );
}
