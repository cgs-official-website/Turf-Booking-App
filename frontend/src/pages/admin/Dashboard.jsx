import React, { useState, useEffect } from "react";
import { getDashboardStats } from "../../services/dashboard.js";
import "../../assets/styles/dashboard.css";
import {
  FiUser,
  FiCreditCard,
  FiChevronDown,
  FiDownload,
} from "react-icons/fi";
import { FaIndianRupeeSign } from "react-icons/fa6";
import { HiOutlineLocationMarker } from "react-icons/hi";
import RecentTurfApprovals from "../../components/admin/RecentTurfApprovals";
import RecentBookings from "../../components/admin/RecentBookings";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">
          <span className="tooltip-dot"></span>₹
          {payload[0].value.toLocaleString("en-IN")}
        </p>
      </div>
    );
  }
  return null;
};

const ExpiringSubscriptionCard = ({ subscriptions = [] }) => {
  return (
    <div className="rb-card" style={{height: '100%', boxSizing: 'border-box'}}>
      <div className="rb-card-header">
        <h2 className="rb-card-title">Expiring Subscriptions</h2>
        <a href="#" className="rb-view-all" onClick={(e) => e.preventDefault()}>View All &rarr;</a>
      </div>
      <div>
        {subscriptions.length === 0 ? (
          <p className="rb-empty">No expiring subscriptions</p>
        ) : (
          <table className="rb-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Plan</th>
                <th>Expiry Date</th>
                <th>Days Left</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub, i) => {
                let dateStr = sub.expiryDate;
                if (dateStr) {
                  const d = new Date(dateStr);
                  if (!isNaN(d.valueOf())) {
                    dateStr = d.toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    });
                  }
                }
                return (
                  <tr key={i}>
                    <td className="rb-td-turf">{sub.vendorName || "Vendor"}</td>
                    <td className="rb-td-user">{sub.plan || "base plan"}</td>
                    <td className="rb-td-date">{dateStr}</td>
                    <td>
                      <span className="rb-badge rb-badge--rejected">{sub.daysLeft}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
export default function Dashboard() {
  const [dashboardPeriod, setDashboardPeriod] = useState("current-month");
  const [stats, setStats] = useState({
    totalVendors: 0,
    totalTurfs: 0,
    totalRevenue: 0,
    activeSubscriptions: 0,
    revenueGrowth: { percentage: 0, type: "month" },
    vendorGrowth: { count: 0, type: "month" },
    subscriptionGrowth: { count: 0, type: "month" },
    turfGrowth: { count: 0, type: "month" },
    monthlyRevenue: [],
    expiringSubscriptions: [],
  });
  const fetchDashboardStats = async () => {
    try {
      const data = await getDashboardStats(dashboardPeriod);

      console.log(data);

      setStats(data.data);
    } catch (error) {
      console.log("Error fetching dashboard stats:", error);
    }
  };
  useEffect(() => {
    fetchDashboardStats();
  }, [dashboardPeriod]);
  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Dashboard</h1>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <h3>Total Vendors</h3>
              <h2>{stats.totalVendors}</h2>
              <p className="stat-growth">
                {stats.vendorGrowth?.count >= 0 ? "+" : ""}{" "}
                {stats.vendorGrowth?.count} this month
              </p>
            </div>

            <div className="stat-icon vendor-icon">
              <FiUser />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <h3>Total Revenue</h3>
              <h2>
                {stats.totalRevenue?.toLocaleString("en-IN") ||
                  stats.totalRevenue}
              </h2>
              <p className="stat-growth">
                {stats.revenueGrowth?.percentage >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(stats.revenueGrowth?.percentage || 0)}% vs last month
              </p>
            </div>

            <div className="stat-icon revenue-icon">
              <FaIndianRupeeSign />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <h3>Active Subscription</h3>
              <h2>{stats.activeSubscriptions}</h2>
              <p className="stat-growth">
                {stats.subscriptionGrowth?.count >= 0 ? "+" : ""}{" "}
                {stats.subscriptionGrowth?.count} this month
              </p>
            </div>

            <div className="stat-icon subscription-icon">
              <FiCreditCard />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <h3>Active Turfs</h3>
              <h2>{stats.totalTurfs}</h2>
              <p className="stat-growth">
                {stats.turfGrowth?.count >= 0 ? "+" : ""}{" "}
                {stats.turfGrowth?.count} this month
              </p>
            </div>

            <div className="stat-icon turf-icon">
              <HiOutlineLocationMarker />
            </div>
          </div>
        </div>

        <div className="revenue-section">
          <div className="revenue-header">
            <div>
              <h3>Revenue Overview</h3>
              <p>Track your platform revenue over time.</p>
            </div>
            <div className="revenue-actions">
              <div className="segmented-control">
                <button 
                  className={`filter-btn ${dashboardPeriod === 'last-month' ? 'active' : ''}`}
                  onClick={() => setDashboardPeriod('last-month')}
                >Last Month</button>
                <button 
                  className={`filter-btn ${dashboardPeriod === 'current-month' ? 'active' : ''}`}
                  onClick={() => setDashboardPeriod('current-month')}
                >Current Month</button>
                <button 
                  className={`filter-btn ${dashboardPeriod === 'last-year' ? 'active' : ''}`}
                  onClick={() => setDashboardPeriod('last-year')}
                >Last Year</button>
                <button 
                  className={`filter-btn ${dashboardPeriod === 'current-year' ? 'active' : ''}`}
                  onClick={() => setDashboardPeriod('current-year')}
                >Current Year</button>
              </div>
              <button className="action-btn">
                Choose plan <FiChevronDown />
              </button>
              <button className="action-btn">
                <FiDownload /> Export
              </button>
            </div>
          </div>

          <div className="revenue-summary">
            <div>
              <span>TOTAL REVENUE</span>
              <div className="revenue-total">
                <h2>
                  ₹
                  {stats.chartTotalRevenue !== undefined 
                    ? stats.chartTotalRevenue.toLocaleString("en-IN") 
                    : 0}
                </h2>
                <p>
                  {stats.chartRevenueGrowth?.percentage >= 0 ? "↑" : "↓"}{" "}
                  {Math.abs(stats.chartRevenueGrowth?.percentage || 0)}%
                </p>
              </div>
            </div>
          </div>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.monthlyRevenue}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#EAECF0"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#98A2B3", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tickFormatter={(value) =>
                    value === 0 ? "₹0" : `₹${value / 1000}K`
                  }
                  domain={[0, 'auto']}
                  tick={{ fill: "#98A2B3", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{
                    stroke: "#EAECF0",
                    strokeWidth: 1,
                    strokeDasharray: "3 3",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  activeDot={{ r: 4, strokeWidth: 0, fill: "#10B981" }}
                  dot={{ r: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="dashboard-turf-approvals">
          <div className="card">
            <RecentTurfApprovals />
          </div>
        </div>

        <div className="dashboard-bottom-row">
          <div className="dashboard-recent-bookings">
            <div className="card">
              <RecentBookings />
            </div>
          </div>

          <div className="dashboard-future-space">
            <ExpiringSubscriptionCard subscriptions={stats.expiringSubscriptions || []} />
          </div>
        </div>
      </div>
    </div>
  );
}
