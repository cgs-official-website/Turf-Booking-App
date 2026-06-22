// Payment.jsx — Payment History with real week-over-week growth
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import "../../assets/styles/payment.css";

const PAGE_SIZE = 8;

function extractData(res) {
  return res?.data?.data ?? res?.data ?? null;
}

function normalizeRow(sub, index) {
  const baseId = sub.vendor?._id || sub._id || "";
  const shortId = baseId.slice(-4).toUpperCase() || "????";
  return {
    _id:        sub._id,
    vndId:      "VND-" + shortId,
    vendorName: sub.vendor?.name  ?? "—",
    email:      sub.vendor?.email ?? "",
    phone:      sub.vendor?.phone ?? "",
    location:   sub.vendor?.city  ?? sub.location ?? "—",
    amount:     sub.amountPaid != null
      ? `₹${Number(sub.amountPaid).toLocaleString("en-IN")}`
      : "₹0",
    planName:    sub.plan?.name ?? "—",
    paymentMode: "Razor Pay",
    date: sub.createdAt
      ? new Date(sub.createdAt).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        }) + ", " + new Date(sub.createdAt).toLocaleTimeString("en-IN", {
          hour: "2-digit", minute: "2-digit", hour12: false,
        })
      : "—",
    status: sub.paymentStatus === "paid" ? "Success" : "Failed",
    subStatus: sub.status ?? "pending",
    rawDate: sub.createdAt ? new Date(sub.createdAt).toISOString().split("T")[0] : "",
  };
}

// ── Growth badge component ────────────────────────────────────────────────────
function GrowthTag({ pct }) {
  if (pct === undefined || pct === null) return null;
  const up  = pct >= 0;
  const abs = Math.abs(pct);
  return (
    <p className={`pay-stat-card__growth ${up ? "up" : "down"}`}>
      <i className={`bi bi-arrow-${up ? "up" : "down"}`} />
      {abs}% <span>vs last week</span>
    </p>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, iconVariant, label, value, growthPct }) {
  return (
    <div className="pay-stat-card">
      <div className={`pay-stat-card__icon pay-stat-card__icon--${iconVariant}`}>
        <i className={`bi ${icon}`} />
      </div>
      <div className="pay-stat-card__info">
        <p className="pay-stat-card__label">{label}</p>
        <p className="pay-stat-card__value">{value ?? "—"}</p>
        <GrowthTag pct={growthPct} />
      </div>
    </div>
  );
}

// ── Status Badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status === "Success") return (
    <span className="pay-badge pay-badge--success">
      <i className="bi bi-check-circle-fill" /> Success
    </span>
  );
  return (
    <span className="pay-badge pay-badge--failed">
      <i className="bi bi-dash-circle-fill" /> Failed
    </span>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function Payment() {
  const navigate = useNavigate();

  const [rows,    setRows]    = useState([]);
  const [stats,   setStats]   = useState(null);
  const [vendors, setVendors] = useState({ total: 0, growth: null });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter,   setDateFilter]   = useState("");
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

        // ── Subscriptions list ──
        if (subRes.status === "fulfilled") {
          const d    = extractData(subRes.value);
          const list = Array.isArray(d?.subscriptions) ? d.subscriptions
                     : Array.isArray(d)                ? d : [];
          setRows(list.map((sub, i) => normalizeRow(sub, i)));
        }

        // ── Stats (with growth from updated backend) ──
        if (statsRes.status === "fulfilled") {
          const s = extractData(statsRes.value);
          setStats(s);
          console.log("[Payment] Stats:", s);
        }

        // ── Vendor count + growth ──
        if (vendorRes.status === "fulfilled") {
          const d    = extractData(vendorRes.value);
          const list = Array.isArray(d) ? d : (d?.vendors ?? []);

          // Calculate vendor growth: vendors created this week vs last week
          const now           = new Date();
          const thisWeekStart = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
          const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

          const thisWeekVendors = list.filter((v) => {
            const d = new Date(v.createdAt);
            return d >= thisWeekStart;
          }).length;

          const lastWeekVendors = list.filter((v) => {
            const d = new Date(v.createdAt);
            return d >= lastWeekStart && d < thisWeekStart;
          }).length;

          let vendorGrowth = null;
          if (lastWeekVendors > 0) {
            vendorGrowth = Math.round(
              ((thisWeekVendors - lastWeekVendors) / lastWeekVendors) * 100
            );
          } else if (thisWeekVendors > 0) {
            vendorGrowth = 100;
          } else {
            vendorGrowth = 0;
          }

          setVendors({ total: list.length, growth: vendorGrowth });
        }

      } catch (err) {
        if (err?.name === "CanceledError" || err?.name === "AbortError") return;
        setError("Failed to load payment data.");
        console.error("[Payment]", err?.message);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }

    load();
    return () => ctrl.abort();
  }, [navigate]);

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filtered = rows.filter((r) => {
    const q   = search.toLowerCase();
    const ms  = !q
      || r.vendorName.toLowerCase().includes(q)
      || r.vndId.toLowerCase().includes(q);
    const mst = statusFilter === "All" || r.status === statusFilter;
    const md  = !dateFilter || r.rawDate === dateFilter;
    return ms && mst && md;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetFilters() {
    setSearch(""); setStatusFilter("All"); setDateFilter(""); setPage(1);
  }

  // ── Stats display ──────────────────────────────────────────────────────────
  const totalRevenue = stats?.totalRevenue != null
    ? `₹${Number(stats.totalRevenue).toLocaleString("en-IN")}`
    : "₹0";
  const activeSubs  = stats?.active  ?? 0;
  const expiredSubs = stats?.expired ?? 0;

  // Growth from updated backend — falls back to null if old backend
  const revenueGrowth = stats?.growth?.revenue ?? null;
  const activeGrowth  = stats?.growth?.active  ?? null;
  const expiredGrowth = stats?.growth?.expired != null
    ? -Math.abs(stats.growth.expired)   // expired going up is bad → show negative
    : null;

  return (
    <div className="pay-page">
      <h1 className="pay-page-title">Payment history</h1>

      {/* Stat Cards */}
      <div className="pay-stat-grid">
        <StatCard
          icon="bi-currency-rupee" iconVariant="revenue"
          label="Total Revenue"
          value={loading ? "…" : totalRevenue}
          growthPct={loading ? null : revenueGrowth}
        />
        <StatCard
          icon="bi-check-circle" iconVariant="active"
          label="Active Subscriptions"
          value={loading ? "…" : activeSubs}
          growthPct={loading ? null : activeGrowth}
        />
        <StatCard
          icon="bi-clock" iconVariant="expired"
          label="Expired Subscriptions"
          value={loading ? "…" : expiredSubs}
          growthPct={loading ? null : expiredGrowth}
        />
        <StatCard
          icon="bi-person" iconVariant="vendors"
          label="Total Vendors"
          value={loading ? "…" : vendors.total}
          growthPct={loading ? null : vendors.growth}
        />
      </div>

      {/* Toolbar */}
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

        <input 
          type="date"
          className="pay-select"
          style={{ width: '160px', paddingRight: '14px', backgroundImage: 'none' }}
          value={dateFilter}
          onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
        />

        <select className="pay-select" value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="All">Status all</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
        </select>

        <button className="pay-reset-btn" onClick={resetFilters}>
          <i className="bi bi-arrow-clockwise" /> Reset Filter
        </button>
      </div>

      {/* Table */}
      <div className="pay-table-wrap">
        <table className="pay-table">
          <thead>
            <tr>
              <th>VND-ID</th>
              <th>VENDOR NAME</th>
              <th>AMOUNT</th>
              <th>PAYMENT MODE</th>
              <th>CREATION DATE</th>
              <th>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className="pay-state-row">
                <td colSpan={6}><span className="pay-spinner" /></td>
              </tr>
            ) : error ? (
              <tr className="pay-state-row">
                <td colSpan={6}>
                  <i className="bi bi-exclamation-circle" />
                  <span>{error}</span>
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr className="pay-state-row">
                <td colSpan={6}>
                  <i className="bi bi-search" />
                  <span>
                    {rows.length === 0
                      ? "No subscriptions found. Vendors need to subscribe to a plan first."
                      : "No records match your search."}
                  </span>
                </td>
              </tr>
            ) : (
              <>
                {paginated.map((row) => (
                  <tr key={row._id}>
                    <td className="pay-td-id">{row.vndId}</td>
                    <td className="pay-td-vendor-name">{row.vendorName}</td>
                    <td className="pay-td-amount">{row.amount}</td>
                    <td className="pay-td-mode">{row.paymentMode}</td>
                    <td className="pay-td-date">{row.date}</td>
                    <td><StatusBadge status={row.status} /></td>
                  </tr>
                ))}
                {Array.from({ length: PAGE_SIZE - paginated.length }).map((_, i) => (
                  <tr key={`ghost-${i}`} className="pay-ghost-row">
                    <td colSpan={6} />
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
            disabled={page === 1}>Previous</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p}
              className={`pay-page-btn${p === page ? " pay-page-btn--active" : ""}`}
              onClick={() => setPage(p)}>{p}</button>
          ))}
          <button className="pay-page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}>Next</button>
        </div>
      </div>
    </div>
  );
}