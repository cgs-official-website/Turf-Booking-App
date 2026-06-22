// Payment.jsx — Payment History with real week-over-week growth
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../services/axiosInstance";
import "../../assets/styles/payment.css";

const PAGE_SIZE = 8;

function extractData(res) {
  return res?.data?.data ?? res?.data ?? null;
}

function normalizeRow(sub) {
  const baseId  = sub.vendor?._id || sub._id || "";
  const shortId = baseId.slice(-4).toUpperCase() || "????";
  return {
    _id:         sub._id,
    vndId:       "VND-" + shortId,
    vendorName:  sub.vendor?.name  ?? "—",
    email:       sub.vendor?.email ?? "",
    phone:       sub.vendor?.phone ?? "",
    location:    sub.vendor?.city  ?? sub.location ?? "—",
    amount:      sub.amountPaid != null
      ? `₹${Number(sub.amountPaid).toLocaleString("en-IN")}`
      : "₹0",
    rawAmount:   sub.amountPaid ?? 0,
    planName:    sub.plan?.name ?? "—",
    paymentMode: "Razor Pay",
    date: sub.createdAt
      ? new Date(sub.createdAt).toLocaleDateString("en-IN", {
          day: "numeric", month: "short", year: "numeric",
        }) + ", " + new Date(sub.createdAt).toLocaleTimeString("en-IN", {
          hour: "2-digit", minute: "2-digit", hour12: false,
        })
      : "—",
    status:    sub.paymentStatus === "paid" ? "Success" : "Failed",
    subStatus: sub.status ?? "pending",
    rawDate:   sub.createdAt
      ? new Date(sub.createdAt).toISOString().split("T")[0]
      : "",
    createdAt: sub.createdAt ?? null,
  };
}

// ── Week boundary helpers ─────────────────────────────────────────────────────
function weekBounds() {
  const now           = new Date();
  const thisWeekStart = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000);
  const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  return { now, thisWeekStart, lastWeekStart };
}

function isThisWeek(date, bounds) {
  const d = new Date(date);
  return d >= bounds.thisWeekStart && d <= bounds.now;
}

function isLastWeek(date, bounds) {
  const d = new Date(date);
  return d >= bounds.lastWeekStart && d < bounds.thisWeekStart;
}

// ── Growth %: (this - last) / last * 100; null if no lastWeek data ────────────
function calcGrowth(thisVal, lastVal) {
  if (lastVal === 0 && thisVal === 0) return 0;
  if (lastVal === 0) return 100;            // went from 0 → something
  return Math.round(((thisVal - lastVal) / lastVal) * 100);
}

// ── Growth badge
// invertColor=true (Expired): positive → RED + DOWN arrow, negative → GREEN + UP arrow
// invertColor=false (others): positive → GREEN + UP arrow, negative → RED + DOWN arrow
function GrowthTag({ pct, invertColor }) {
  if (pct === null || pct === undefined) return null;

  const isPositive = pct >= 0;

  // For expired: invert both arrow and colour
  const showUp   = invertColor ? !isPositive : isPositive;
  const isGood   = invertColor ? !isPositive : isPositive;

  return (
    <p className={`pay-stat-card__growth ${isGood ? "up" : "down"}`}>
      <i className={`bi bi-arrow-${showUp ? "up" : "down"}`} />
      {Math.abs(pct)}% <span>vs last week</span>
    </p>
  );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, iconVariant, label, value, growthPct, invertGrowthColor }) {
  return (
    <div className="pay-stat-card">
      <div className={`pay-stat-card__icon pay-stat-card__icon--${iconVariant}`}>
        <i className={`bi ${icon}`} />
      </div>
      <div className="pay-stat-card__info">
        <p className="pay-stat-card__label">{label}</p>
        <p className="pay-stat-card__value">{value ?? "—"}</p>
        <GrowthTag pct={growthPct} invertColor={invertGrowthColor} />
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
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  // ── Computed stats (all derived from raw rows + vendor list) ────────────────
  const [computed, setComputed] = useState({
    totalRevenue:    "₹0",
    revenueGrowth:   null,
    activeSubs:      0,
    activeGrowth:    null,
    expiredSubs:     0,
    expiredGrowth:   null,
    totalVendors:    0,
    vendorGrowth:    null,
  });

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
        const [subRes, vendorRes] = await Promise.allSettled([
          axiosInstance.get("/subscriptions/admin/all", { signal: ctrl.signal }),
          axiosInstance.get("/admin/vendors",           { signal: ctrl.signal }),
        ]);

        if (ctrl.signal.aborted) return;

        // ── Subscription rows ──────────────────────────────────────────────
        let allSubs = [];
        if (subRes.status === "fulfilled") {
          const d = extractData(subRes.value);
          allSubs = Array.isArray(d?.subscriptions) ? d.subscriptions
                  : Array.isArray(d)                ? d : [];
        }

        const normalizedRows = allSubs.map(normalizeRow);
        setRows(normalizedRows);

        // ── Vendor list ────────────────────────────────────────────────────
        let allVendors = [];
        if (vendorRes.status === "fulfilled") {
          const d = extractData(vendorRes.value);
          allVendors = Array.isArray(d) ? d : (d?.vendors ?? []);
        }

        // ── Derive all stats + growth from raw data ────────────────────────
        const bounds = weekBounds();

        // 1. Total Revenue — sum of amountPaid across all paid subs
        const totalRev = allSubs.reduce(
          (acc, s) => acc + (s.paymentStatus === "paid" ? (s.amountPaid ?? 0) : 0), 0
        );

        // Revenue this week vs last week
        const revThisWeek = allSubs
          .filter((s) => s.paymentStatus === "paid" && s.createdAt && isThisWeek(s.createdAt, bounds))
          .reduce((acc, s) => acc + (s.amountPaid ?? 0), 0);
        const revLastWeek = allSubs
          .filter((s) => s.paymentStatus === "paid" && s.createdAt && isLastWeek(s.createdAt, bounds))
          .reduce((acc, s) => acc + (s.amountPaid ?? 0), 0);

        // 2. Active subscriptions
        const activeSubs  = allSubs.filter((s) => s.status === "active").length;
        const activeThisW = allSubs.filter(
          (s) => s.status === "active" && s.createdAt && isThisWeek(s.createdAt, bounds)
        ).length;
        const activeLastW = allSubs.filter(
          (s) => s.status === "active" && s.createdAt && isLastWeek(s.createdAt, bounds)
        ).length;

        // 3. Expired subscriptions
        const expiredSubs  = allSubs.filter((s) => s.status === "expired").length;
        const expiredThisW = allSubs.filter(
          (s) => s.status === "expired" && s.createdAt && isThisWeek(s.createdAt, bounds)
        ).length;
        const expiredLastW = allSubs.filter(
          (s) => s.status === "expired" && s.createdAt && isLastWeek(s.createdAt, bounds)
        ).length;

        // 4. Total vendors — compare total count now vs total at start of this week
        //    (cumulative, vendors never decrease)
        const vendorsUpToNow      = allVendors.length;
        const vendorsUpToLastWeek = allVendors.filter(
          (v) => v.createdAt && new Date(v.createdAt) < bounds.thisWeekStart
        ).length;
        // New vendors added this week
        const newVendorsThisWeek = vendorsUpToNow - vendorsUpToLastWeek;

        setComputed({
          totalRevenue:  `₹${Number(totalRev).toLocaleString("en-IN")}`,
          revenueGrowth: calcGrowth(revThisWeek,  revLastWeek),
          activeSubs,
          activeGrowth:  calcGrowth(activeThisW,  activeLastW),
          expiredSubs,
          // Expired: raw % so GrowthTag can invert colour correctly
          expiredGrowth: calcGrowth(expiredThisW, expiredLastW),
          totalVendors:  vendorsUpToNow,
          // Vendor growth: % of new vendors this week vs base (cumulative up to last week)
          vendorGrowth:  vendorsUpToLastWeek > 0
            ? Math.round((newVendorsThisWeek / vendorsUpToLastWeek) * 100)
            : newVendorsThisWeek > 0 ? 100 : 0,
        });

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

  const c = computed;

  return (
    <div className="pay-page">
      <h1 className="pay-page-title">Payment history</h1>

      {/* Stat Cards */}
      <div className="pay-stat-grid">
        <StatCard
          icon="bi-currency-rupee" iconVariant="revenue"
          label="Total Revenue"
          value={loading ? "…" : c.totalRevenue}
          growthPct={loading ? null : c.revenueGrowth}
        />
        <StatCard
          icon="bi-check-circle" iconVariant="active"
          label="Active Subscriptions"
          value={loading ? "…" : c.activeSubs}
          growthPct={loading ? null : c.activeGrowth}
        />
        <StatCard
          icon="bi-clock" iconVariant="expired"
          label="Expired Subscriptions"
          value={loading ? "…" : c.expiredSubs}
          growthPct={loading ? null : c.expiredGrowth}
          invertGrowthColor={true}
        />
        <StatCard
          icon="bi-person" iconVariant="vendors"
          label="Total Vendors"
          value={loading ? "…" : c.totalVendors}
          growthPct={loading ? null : c.vendorGrowth}
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
          style={{ width: "160px", paddingRight: "14px", backgroundImage: "none" }}
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
                      ? "No subscriptions found."
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