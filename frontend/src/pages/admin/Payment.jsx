// Payment.jsx — Payment History
// APIs:
//   GET /subscriptions/admin/all    → { data: { subscriptions: [], total } }
//   GET /subscriptions/admin/stats  → { data: { totalRevenue, active, expired } }
//   GET /admin/vendors              → { data: [...] }

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import "../../assets/styles/payment.css";

const PAGE_SIZE = 8;

function extractData(res) {
  return res?.data?.data ?? res?.data ?? null;
}

function normalizeRow(sub, index) {
  return {
    _id:        sub._id,
    vndId:      "VND-" + String(index + 101).padStart(3, "0"),
    vendorName: sub.vendor?.name  ?? "—",
    email:      sub.vendor?.email ?? "",
    phone:      sub.vendor?.phone ?? "",
    location:   sub.vendor?.city  ?? sub.location ?? "—",
    amount:     sub.amountPaid != null
      ? `₹${sub.amountPaid.toLocaleString("en-IN")}`
      : "₹0",
    planName:   sub.plan?.name ?? "—",
    paymentMode: "Razor Pay",   // your DB doesn't store mode yet; placeholder
    date:       sub.createdAt
      ? new Date(sub.createdAt).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        }) + ", " + new Date(sub.createdAt).toLocaleTimeString("en-IN", {
          hour: "2-digit", minute: "2-digit", hour12: false,
        })
      : "—",
    // Map paymentStatus → Success / Failed / Pending
    status: sub.paymentStatus === "paid"   ? "Success"
          : sub.paymentStatus === "failed" ? "Failed"
          : "Pending",
    subStatus: (sub.status ?? "pending"),
  };
}

function StatCard({ icon, iconVariant, label, value, growth, growthDir }) {
  return (
    <div className="pay-stat-card">
      <div className={`pay-stat-card__icon pay-stat-card__icon--${iconVariant}`}>
        <i className={`bi ${icon}`} />
      </div>
      <div className="pay-stat-card__info">
        <p className="pay-stat-card__label">{label}</p>
        <p className="pay-stat-card__value">{value ?? "—"}</p>
        {growth && (
          <p className={`pay-stat-card__growth ${growthDir}`}>
            <i className={`bi bi-arrow-${growthDir}`} /> {growth}
          </p>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  if (status === "Success") return (
    <span className="pay-badge pay-badge--success">
      <i className="bi bi-check-circle-fill" /> Success
    </span>
  );
  if (status === "Failed") return (
    <span className="pay-badge pay-badge--failed">
      <i className="bi bi-dash-circle-fill" /> Failed
    </span>
  );
  return (
    <span className="pay-badge pay-badge--pending">
      <i className="bi bi-clock-fill" /> Pending
    </span>
  );
}

export default function Payment() {
  const navigate = useNavigate();

  const [rows,    setRows]    = useState([]);
  const [stats,   setStats]   = useState(null);
  const [vendors, setVendors] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // Filters
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page,         setPage]         = useState(1);

  useEffect(() => {
    const ctrl = new AbortController();

    async function load() {
      const token = localStorage.getItem("token");
      if (!token) { navigate("/admin/login"); return; }

      setLoading(true);
      setError("");

      try {
        const [subRes, statsRes, vendorRes] = await Promise.allSettled([
          axiosInstance.get("/subscriptions/admin/all",   { signal: ctrl.signal }),
          axiosInstance.get("/subscriptions/admin/stats", { signal: ctrl.signal }),
          axiosInstance.get("/admin/vendors",             { signal: ctrl.signal }),
        ]);

        if (ctrl.signal.aborted) return;

        // Subscriptions
        if (subRes.status === "fulfilled") {
          const d    = extractData(subRes.value);
          const list = Array.isArray(d?.subscriptions) ? d.subscriptions
                     : Array.isArray(d)                ? d : [];
          setRows(list.map((sub, i) => normalizeRow(sub, i)));
        } else {
          console.warn("[Payment] subscriptions failed:", subRes.reason?.message);
        }

        // Stats
        if (statsRes.status === "fulfilled") {
          setStats(extractData(statsRes.value));
        }

        // Vendor count
        if (vendorRes.status === "fulfilled") {
          const d    = extractData(vendorRes.value);
          const list = Array.isArray(d) ? d : (d?.vendors ?? []);
          setVendors(list.length);
        }

      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        setError("Failed to load payment data. Check your connection.");
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => ctrl.abort();
  }, [navigate]);

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = rows.filter((r) => {
    const q   = search.toLowerCase();
    const ms  = !q
      || r.vendorName.toLowerCase().includes(q)
      || r.vndId.toLowerCase().includes(q)
      || r.location.toLowerCase().includes(q);
    const mst = statusFilter === "All" || r.status === statusFilter;
    return ms && mst;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() {
    setSearch(""); setStatusFilter("All"); setPage(1);
  }

  // ── Stats display values ──────────────────────────────────────────────────
  const totalRevenue = stats?.totalRevenue != null
    ? `₹${Number(stats.totalRevenue).toLocaleString("en-IN")}`
    : "—";
  const activeSubs  = stats?.active  ?? "—";
  const expiredSubs = stats?.expired ?? "—";

  return (
    <div className="pay-page">
      <h1 className="pay-page-title">Payment history</h1>

      {/* Stat Cards */}
      <div className="pay-stat-grid">
        <StatCard icon="bi-currency-rupee" iconVariant="revenue"
          label="Total Revenue"
          value={loading ? "…" : totalRevenue}
          growth="12% vs last week" growthDir="up" />
        <StatCard icon="bi-check-circle" iconVariant="active"
          label="Active Subscriptions"
          value={loading ? "…" : activeSubs}
          growth="7% vs last week" growthDir="up" />
        <StatCard icon="bi-clock" iconVariant="expired"
          label="Expired Subscriptions"
          value={loading ? "…" : expiredSubs}
          growth="5% vs last week" growthDir="down" />
        <StatCard icon="bi-person" iconVariant="vendors"
          label="Total Vendors"
          value={loading ? "…" : (vendors || "—")}
          growth="8% vs last week" growthDir="up" />
      </div>

      {/* Toolbar — matches design exactly */}
      <div className="pay-toolbar">
        <div className="pay-search-box">
          <i className="bi bi-search" />
          <input
            type="text"
            className="pay-search-input"
            placeholder="Search by vendor name"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select className="pay-select">
          <option>Select date</option>
        </select>

        <select className="pay-select">
          <option>Location</option>
        </select>

        <select
          className="pay-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="All">Status all</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
          <option value="Pending">Pending</option>
        </select>

        <button className="pay-reset-btn" onClick={resetFilters}>
          <i className="bi bi-arrow-clockwise" /> Reset Filter
        </button>
      </div>

      {/* Table — matches design columns exactly */}
      <div className="pay-table-wrap">
        <table className="pay-table">
          <thead>
            <tr>
              <th>VND-ID</th>
              <th>VENDOR NAME</th>
              <th>LOCATION</th>
              <th>AMOUNT</th>
              <th>PAYMENT MODE</th>
              <th>CREATION DATE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="pay-state-row">
                <td colSpan={7}><span className="pay-spinner" /></td>
              </tr>
            ) : error ? (
              <tr className="pay-state-row">
                <td colSpan={7}>
                  <i className="bi bi-exclamation-circle" />
                  <span>{error}</span>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr className="pay-state-row">
                <td colSpan={7}>
                  <i className="bi bi-search" />
                  <span>No records match your search.</span>
                </td>
              </tr>
            ) : (
              <>
                {paginated.map((row) => (
                  <tr key={row._id}>
                    <td className="pay-td-id">{row.vndId}</td>
                    <td className="pay-td-vendor-name">{row.vendorName}</td>
                    <td className="pay-td-loc">{row.location}</td>
                    <td className="pay-td-amount">{row.amount}</td>
                    <td className="pay-td-mode">{row.paymentMode}</td>
                    <td className="pay-td-date">{row.date}</td>
                    <td><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
                {/* Ghost rows to maintain table height */}
                {Array.from({ length: PAGE_SIZE - paginated.length }).map((_, i) => (
                  <tr key={`ghost-${i}`} className="pay-ghost-row">
                    <td colSpan={7} />
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="pay-table-footer">
        <span className="pay-showing-label">
          Showing {filtered.length} of {rows.length} record{rows.length !== 1 ? "s" : ""}
        </span>
        <div className="pay-pagination">
          <button className="pay-page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}>
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p}
              className={`pay-page-btn${p === page ? " pay-page-btn--active" : ""}`}
              onClick={() => setPage(p)}>
              {p}
            </button>
          ))}
          <button className="pay-page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}