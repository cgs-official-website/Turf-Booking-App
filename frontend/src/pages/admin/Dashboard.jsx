import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getDashboardStats } from "../../services/dashboard.js";
import { getAllPlans } from "../../services/subscription.service.js";
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
import RecentBookings from "../../components/admin/RecentBookings.jsx";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-label">{label}</p>
        <p className="tooltip-value">
          <span className="tooltip-dot"></span>₹{payload[0].value.toLocaleString("en-IN")}
        </p>
      </div>
    );
  }
  return null;
};

const ExpiringSubscriptionCard = ({ subscriptions = [] }) => {
  return (
    <div className="rb-card" style={{ height: '100%', boxSizing: 'border-box' }}>
      <div className="rb-card-header">
        <h2 className="rb-card-title">Expiring Subscriptions</h2>
        <Link to="/admin/vendors" className="rb-view-all">View All &rarr;</Link>
      </div>
      <div>
        {subscriptions.length === 0 ? (
          <p className="rb-empty">No expiring subscriptions</p>
        ) : (
          <div className="rb-table-wrap">
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
                        <span style={{ color: '#ea580c', fontWeight: 600 }}>{sub.daysLeft}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState("");

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const data = await getDashboardStats(dashboardPeriod, selectedPlan);
        setStats(data.data);
      } catch (error) {
        console.log("Error fetching dashboard stats:", error);
      }
    };
    fetchDashboardStats();
  }, [dashboardPeriod, selectedPlan]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await getAllPlans(true);
        if (response?.data?.plans) {
          setPlans(response.data.plans);
        }
      } catch (error) {
        console.error("Error fetching plans for dashboard:", error);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-content">
        <h1 className="dashboard-title">Dashboard</h1>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <h3>Total Vendors</h3>
              <h2>{stats.totalVendors}</h2>
              <p className={`stat-growth ${stats.vendorGrowth?.count < 0 ? "negative-growth" : ""}`}>
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
                {stats.totalRevenue?.toLocaleString("en-IN") || stats.totalRevenue}
              </h2>
              <p className={`stat-growth ${stats.revenueGrowth?.percentage < 0 ? "negative-growth" : ""}`}>
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
              <p className={`stat-growth ${stats.subscriptionGrowth?.count < 0 ? "negative-growth" : ""}`}>
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
              <p className={`stat-growth ${stats.turfGrowth?.count < 0 ? "negative-growth" : ""}`}>
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
              <select
                className="action-btn"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                style={{ appearance: 'auto', WebkitAppearance: 'auto', backgroundColor: '#fff', border: '1px solid #e2e8f0', paddingRight: '20px' }}
              >
                <option value="">Choose plan</option>
                {plans.map((plan) => (
                  <option key={plan._id} value={plan._id}>{plan.name}</option>
                ))}
              </select>
              <button className="action-btn" onClick={() => {
                const now = new Date();
                let isYear = dashboardPeriod.includes('year');
                const planName = selectedPlan
                  ? plans.find(p => p._id === selectedPlan)?.name || "All Plans"
                  : "All Plans";
                const safePlanName = planName.toLowerCase().replace(/\s+/g, '_');
                let monthName = "", yearString = "", fileName = "", periodValue = "";
                if (dashboardPeriod === 'current-month') {
                  monthName = now.toLocaleString('default', { month: 'long' });
                  yearString = now.getFullYear().toString();
                  periodValue = monthName;
                  fileName = `revenue_summary_of_${monthName.toLowerCase()}_month_${yearString}_year_${safePlanName}.csv`;
                } else if (dashboardPeriod === 'last-month') {
                  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                  monthName = lastMonth.toLocaleString('default', { month: 'long' });
                  yearString = lastMonth.getFullYear().toString();
                  periodValue = monthName;
                  fileName = `revenue_summary_of_${monthName.toLowerCase()}_month_${yearString}_year_${safePlanName}.csv`;
                } else if (dashboardPeriod === 'current-year') {
                  yearString = now.getFullYear().toString();
                  periodValue = yearString;
                  fileName = `revenue_summary_of_year_${yearString}_${safePlanName}.csv`;
                } else if (dashboardPeriod === 'last-year') {
                  yearString = (now.getFullYear() - 1).toString();
                  periodValue = yearString;
                  fileName = `revenue_summary_of_year_${yearString}_${safePlanName}.csv`;
                }
                let csvRows = [];
                const totalRevenue = stats.chartTotalRevenue !== undefined ? stats.chartTotalRevenue : (stats.totalRevenue || 0);
                if (!isYear) {
                  csvRows.push("Month,Plan,Revenue");
                  csvRows.push(`"${periodValue}","${planName}",${totalRevenue}`);
                } else {
                  csvRows.push("Year,Month,Plan,Revenue");
                  if (stats.monthlyRevenue && stats.monthlyRevenue.length > 0) {
                    stats.monthlyRevenue.forEach(row => {
                      csvRows.push(`"${yearString}","${row.month}","${planName}",${row.revenue}`);
                    });
                  }
                  csvRows.push("");
                  csvRows.push(`"Total Revenue of Year",,,${totalRevenue}`);
                }
                const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", fileName);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}>
                <FiDownload /> Export
              </button>
            </div>
          </div>

          <div className="revenue-summary">
            <div>
              <span>TOTAL REVENUE</span>
              <div className="revenue-total">
                <h2>
                  ₹{stats.chartTotalRevenue !== undefined
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
                  strokeDasharray="4 4"
                  vertical={false}
                  stroke="#D0D5DD"
                  strokeWidth={1.5}
                />
                {/* FIX: backend already sends correct labels ("1-5","6-10"..."Jan","Feb"...)
                    so just render dataKey as-is. No tickFormatter or minTickGap needed. */}
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#98A2B3", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                  padding={{ left: 10, right: 30 }}
                  interval={(() => {
                    const isYearView = dashboardPeriod === 'current-year' || dashboardPeriod === 'last-year';
                    // yearly: show all 12 months; monthly: show every 5th day (1,5,10,15,20,25,30)
                    return isYearView ? 0 : 4;
                  })()}
                  tickFormatter={(value) => {
                    const isYearView = dashboardPeriod === 'current-year' || dashboardPeriod === 'last-year';
                    if (isYearView) {
                      // backend sends "Jan","Feb"... append short year
                      const year = dashboardPeriod === 'last-year'
                        ? new Date().getFullYear() - 1
                        : new Date().getFullYear();
                      return `${value} '${String(year).slice(2)}`;
                    }
                    // monthly: backend sends "1 Jun","2 Jun"... show as-is
                    return value;
                  }}
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
                    stroke: "#98A2B3",
                    strokeWidth: 1.5,
                    strokeDasharray: "4 4",
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
          <RecentTurfApprovals />
        </div>

        <div className="dashboard-bottom-row">
          <div className="dashboard-recent-bookings">
            <RecentBookings />
          </div>
          <div className="dashboard-future-space">
            <ExpiringSubscriptionCard subscriptions={stats.expiringSubscriptions || []} />
          </div>
        </div>
      </div>
    </div>
  );
}

// import React, { useState, useEffect } from "react";
// import { Link } from "react-router-dom";
// import { getDashboardStats } from "../../services/dashboard.js";
// import { getAllPlans } from "../../services/subscription.service.js";
// import "../../assets/styles/dashboard.css";
// import {
//   FiUser,
//   FiCreditCard,
//   FiChevronDown,
//   FiDownload,
// } from "react-icons/fi";
// import { FaIndianRupeeSign } from "react-icons/fa6";
// import { HiOutlineLocationMarker } from "react-icons/hi";
// import RecentTurfApprovals from "../../components/admin/RecentTurfApprovals";
// import RecentBookings from "../../components/admin/RecentBookings.jsx";

// const CustomTooltip = ({ active, payload, label }) => {
//   if (active && payload && payload.length) {
//     let displayLabel = label;
//     const date = new Date(label);
//     if (!isNaN(date.getTime()) && String(label).length >= 8) {
//       displayLabel = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
//     }
//     return (
//       <div className="custom-tooltip">
//         <p className="tooltip-label">{displayLabel}</p>
//         <p className="tooltip-value">
//           <span className="tooltip-dot"></span>₹
//           {payload[0].value.toLocaleString("en-IN")}
//         </p>
//       </div>
//     );
//   }
//   return null;
// };

// const ExpiringSubscriptionCard = ({ subscriptions = [] }) => {
//   return (
//     <div className="rb-card" style={{ height: '100%', boxSizing: 'border-box' }}>
//       <div className="rb-card-header">
//         <h2 className="rb-card-title">Expiring Subscriptions</h2>
//         <Link to="/admin/vendors" className="rb-view-all">View All &rarr;</Link>
//       </div>
//       <div>
//         {subscriptions.length === 0 ? (
//           <p className="rb-empty">No expiring subscriptions</p>
//         ) : (
//           <div className="rb-table-wrap">
//             <table className="rb-table">
//               <thead>
//                 <tr>
//                   <th>Vendor</th>
//                   <th>Plan</th>
//                   <th>Expiry Date</th>
//                   <th>Days Left</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {subscriptions.map((sub, i) => {
//                   let dateStr = sub.expiryDate;
//                   if (dateStr) {
//                     const d = new Date(dateStr);
//                     if (!isNaN(d.valueOf())) {
//                       dateStr = d.toLocaleDateString("en-IN", {
//                         day: "numeric", month: "short", year: "numeric",
//                       });
//                     }
//                   }
//                   return (
//                     <tr key={i}>
//                       <td className="rb-td-turf">{sub.vendorName || "Vendor"}</td>
//                       <td className="rb-td-user">{sub.plan || "base plan"}</td>
//                       <td className="rb-td-date">{dateStr}</td>
//                       <td>
//                         <span style={{ color: '#ea580c', fontWeight: 600 }}>{sub.daysLeft}</span>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };
// import {
//   AreaChart,
//   Area,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   ResponsiveContainer,
// } from "recharts";
// export default function Dashboard() {
//   const [dashboardPeriod, setDashboardPeriod] = useState("current-month");
//   const [stats, setStats] = useState({
//     totalVendors: 0,
//     totalTurfs: 0,
//     totalRevenue: 0,
//     activeSubscriptions: 0,
//     revenueGrowth: { percentage: 0, type: "month" },
//     vendorGrowth: { count: 0, type: "month" },
//     subscriptionGrowth: { count: 0, type: "month" },
//     turfGrowth: { count: 0, type: "month" },
//     monthlyRevenue: [],
//     expiringSubscriptions: [],
//   });
//   const [plans, setPlans] = useState([]);
//   const [selectedPlan, setSelectedPlan] = useState("");
//   const fetchDashboardStats = async () => {
//     try {
//       const data = await getDashboardStats(dashboardPeriod, selectedPlan);
//       setStats(data.data);
//     } catch (error) {
//       console.log("Error fetching dashboard stats:", error);
//     }
//   };

//   const fetchPlans = async () => {
//     try {
//       const response = await getAllPlans(true);
//       if (response?.data?.plans) {
//         setPlans(response.data.plans);
//       }
//     } catch (error) {
//       console.error("Error fetching plans for dashboard:", error);
//     }
//   };

//   useEffect(() => {
//     fetchPlans();
//   }, []);

//   useEffect(() => {
//     fetchDashboardStats();
//   }, [dashboardPeriod, selectedPlan]); // Note: you might need to pass selectedPlan to getDashboardStats if backend supports it.
//   return (
//     <div className="dashboard-wrapper">
//       <div className="dashboard-content">
//         <h1 className="dashboard-title">Dashboard</h1>
//         <div className="stats-grid">
//           <div className="stat-card">
//             <div className="stat-content">
//               <h3>Total Vendors</h3>
//               <h2>{stats.totalVendors}</h2>
//               <p className={`stat-growth ${stats.vendorGrowth?.count < 0 ? "negative-growth" : ""}`}>
//                 {stats.vendorGrowth?.count >= 0 ? "+" : ""}{" "}
//                 {stats.vendorGrowth?.count} this month
//               </p>
//             </div>

//             <div className="stat-icon vendor-icon">
//               <FiUser />
//             </div>
//           </div>

//           <div className="stat-card">
//             <div className="stat-content">
//               <h3>Total Revenue</h3>
//               <h2>
//                 {stats.totalRevenue?.toLocaleString("en-IN") ||
//                   stats.totalRevenue}
//               </h2>
//               <p className={`stat-growth ${stats.revenueGrowth?.percentage < 0 ? "negative-growth" : ""}`}>
//                 {stats.revenueGrowth?.percentage >= 0 ? "↑" : "↓"}{" "}
//                 {Math.abs(stats.revenueGrowth?.percentage || 0)}% vs last month
//               </p>
//             </div>

//             <div className="stat-icon revenue-icon">
//               <FaIndianRupeeSign />
//             </div>
//           </div>

//           <div className="stat-card">
//             <div className="stat-content">
//               <h3>Active Subscription</h3>
//               <h2>{stats.activeSubscriptions}</h2>
//               <p className={`stat-growth ${stats.subscriptionGrowth?.count < 0 ? "negative-growth" : ""}`}>
//                 {stats.subscriptionGrowth?.count >= 0 ? "+" : ""}{" "}
//                 {stats.subscriptionGrowth?.count} this month
//               </p>
//             </div>

//             <div className="stat-icon subscription-icon">
//               <FiCreditCard />
//             </div>
//           </div>

//           <div className="stat-card">
//             <div className="stat-content">
//               <h3>Active Turfs</h3>
//               <h2>{stats.totalTurfs}</h2>
//               <p className={`stat-growth ${stats.turfGrowth?.count < 0 ? "negative-growth" : ""}`}>
//                 {stats.turfGrowth?.count >= 0 ? "+" : ""}{" "}
//                 {stats.turfGrowth?.count} this month
//               </p>
//             </div>

//             <div className="stat-icon turf-icon">
//               <HiOutlineLocationMarker />
//             </div>
//           </div>
//         </div>

//         <div className="revenue-section">
//           <div className="revenue-header">
//             <div>
//               <h3>Revenue Overview</h3>
//               <p>Track your platform revenue over time.</p>
//             </div>
//             <div className="revenue-actions">
//               <div className="segmented-control">
//                 <button
//                   className={`filter-btn ${dashboardPeriod === 'last-month' ? 'active' : ''}`}
//                   onClick={() => setDashboardPeriod('last-month')}
//                 >Last Month</button>
//                 <button
//                   className={`filter-btn ${dashboardPeriod === 'current-month' ? 'active' : ''}`}
//                   onClick={() => setDashboardPeriod('current-month')}
//                 >Current Month</button>
//                 <button
//                   className={`filter-btn ${dashboardPeriod === 'last-year' ? 'active' : ''}`}
//                   onClick={() => setDashboardPeriod('last-year')}
//                 >Last Year</button>
//                 <button
//                   className={`filter-btn ${dashboardPeriod === 'current-year' ? 'active' : ''}`}
//                   onClick={() => setDashboardPeriod('current-year')}
//                 >Current Year</button>
//               </div>
//               <select 
//                 className="action-btn" 
//                 value={selectedPlan} 
//                 onChange={(e) => setSelectedPlan(e.target.value)}
//                 style={{ appearance: 'auto', WebkitAppearance: 'auto', backgroundColor: '#fff', border: '1px solid #e2e8f0', paddingRight: '20px' }}
//               >
//                 <option value="">Choose plan</option>
//                 {plans.map((plan) => (
//                   <option key={plan._id} value={plan._id}>{plan.name}</option>
//                 ))}
//               </select>
//               <button className="action-btn" onClick={() => {
//                 const now = new Date();
//                 let isYear = dashboardPeriod.includes('year');
                
//                 const planName = selectedPlan 
//                   ? plans.find(p => p._id === selectedPlan)?.name || "All Plans"
//                   : "All Plans";
                
//                 const safePlanName = planName.toLowerCase().replace(/\s+/g, '_');
                
//                 let monthName = "";
//                 let yearString = "";
//                 let fileName = "";
//                 let periodValue = "";
                
//                 if (dashboardPeriod === 'current-month') {
//                   monthName = now.toLocaleString('default', { month: 'long' });
//                   yearString = now.getFullYear().toString();
//                   periodValue = monthName;
//                   fileName = `revenue_summary_of_${monthName.toLowerCase()}_month_${yearString}_year_${safePlanName}.csv`;
//                 } else if (dashboardPeriod === 'last-month') {
//                   const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
//                   monthName = lastMonth.toLocaleString('default', { month: 'long' });
//                   yearString = lastMonth.getFullYear().toString();
//                   periodValue = monthName;
//                   fileName = `revenue_summary_of_${monthName.toLowerCase()}_month_${yearString}_year_${safePlanName}.csv`;
//                 } else if (dashboardPeriod === 'current-year') {
//                   yearString = now.getFullYear().toString();
//                   periodValue = yearString;
//                   fileName = `revenue_summary_of_year_${yearString}_${safePlanName}.csv`;
//                 } else if (dashboardPeriod === 'last-year') {
//                   yearString = (now.getFullYear() - 1).toString();
//                   periodValue = yearString;
//                   fileName = `revenue_summary_of_year_${yearString}_${safePlanName}.csv`;
//                 }

//                 let csvRows = [];
//                 const totalRevenue = stats.chartTotalRevenue !== undefined ? stats.chartTotalRevenue : (stats.totalRevenue || 0);

//                 if (!isYear) {
//                   // Month export: Single row
//                   csvRows.push("Month,Plan,Revenue");
//                   csvRows.push(`"${periodValue}","${planName}",${totalRevenue}`);
//                 } else {
//                   // Year export: Month breakdown + Total
//                   csvRows.push("Year,Month,Plan,Revenue");
                  
//                   if (stats.monthlyRevenue && stats.monthlyRevenue.length > 0) {
//                     stats.monthlyRevenue.forEach(row => {
//                       csvRows.push(`"${yearString}","${row.month}","${planName}",${row.revenue}`);
//                     });
//                   }
                  
//                   // Total row at the end
//                   csvRows.push(""); // Empty line for separation
//                   csvRows.push(`"Total Revenue of Year",,,${totalRevenue}`);
//                 }
                
//                 const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
//                 const encodedUri = encodeURI(csvContent);
//                 const link = document.createElement("a");
//                 link.setAttribute("href", encodedUri);
//                 link.setAttribute("download", fileName);
//                 document.body.appendChild(link);
//                 link.click();
//                 document.body.removeChild(link);
//               }}>
//                 <FiDownload /> Export
//               </button>
//             </div>
//           </div>

//           <div className="revenue-summary">
//             <div>
//               <span>TOTAL REVENUE</span>
//               <div className="revenue-total">
//                 <h2>
//                   ₹
//                   {stats.chartTotalRevenue !== undefined
//                     ? stats.chartTotalRevenue.toLocaleString("en-IN")
//                     : 0}
//                 </h2>

//                 <p>
//                   {stats.chartRevenueGrowth?.percentage >= 0 ? "↑" : "↓"}{" "}
//                   {Math.abs(stats.chartRevenueGrowth?.percentage || 0)}%
//                 </p>
//               </div>
//             </div>
//           </div>

//           <div className="chart-container">
//             <ResponsiveContainer width="100%" height="100%">
//               <AreaChart data={stats.monthlyRevenue}>
//                 <defs>
//                   <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
//                     <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
//                     <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
//                   </linearGradient>
//                 </defs>
//                 <CartesianGrid
//                   strokeDasharray="4 4"
//                   vertical={false}
//                   stroke="#D0D5DD"
//                   strokeWidth={1.5}
//                 />
//                 <XAxis
//                   dataKey="month"
//                   tickFormatter={(value) => {
//                     // Try parsing as date to format as "1 Apr"
//                     const date = new Date(value);
//                     if (!isNaN(date.getTime()) && value.length >= 8) {
//                       return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
//                     }
//                     return value;
//                   }}
//                   minTickGap={30}
//                   tick={{ fill: "#98A2B3", fontSize: 12 }}
//                   axisLine={false}
//                   tickLine={false}
//                   dy={10}
//                 />
//                 <YAxis
//                   tickFormatter={(value) =>
//                     value === 0 ? "₹0" : `₹${value / 1000}K`
//                   }
//                   domain={[0, 'auto']}
//                   tick={{ fill: "#98A2B3", fontSize: 12 }}
//                   axisLine={false}
//                   tickLine={false}
//                   dx={-10}
//                 />
//                 <Tooltip
//                   content={<CustomTooltip />}
//                   cursor={{
//                     stroke: "#98A2B3",
//                     strokeWidth: 1.5,
//                     strokeDasharray: "4 4",
//                   }}
//                 />
//                 <Area
//                   type="monotone"
//                   dataKey="revenue"
//                   stroke="#10B981"
//                   strokeWidth={2}
//                   fillOpacity={1}
//                   fill="url(#colorRevenue)"
//                   activeDot={{ r: 4, strokeWidth: 0, fill: "#10B981" }}
//                   dot={{ r: 0 }}
//                 />
//               </AreaChart>
//             </ResponsiveContainer>
//           </div>
//         </div>


//         <div className="dashboard-turf-approvals">
//           <RecentTurfApprovals />
//         </div>

//         <div className="dashboard-bottom-row">
//           <div className="dashboard-recent-bookings">
//             <RecentBookings />
//           </div>

//           <div className="dashboard-future-space">
//             <ExpiringSubscriptionCard subscriptions={stats.expiringSubscriptions || []} />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
