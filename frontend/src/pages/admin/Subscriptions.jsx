// pages/admin/Subscriptions.jsx - Complete clean version

import { useState, useEffect, useCallback } from "react";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { PiWalletDuotone } from "react-icons/pi";
import { HiOutlineLocationMarker } from "react-icons/hi";
import { HiOutlineBadgeCheck } from "react-icons/hi";
import PricingCard from "../../components/PricingCard";
import EditPlans from '../../components/EditPlans';
import * as subscriptionApi from '../../services/subscription.service';
import "../../assets/styles/dashboard.css";
import "../../assets/styles/Subscription.css";

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────

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

// Reorders a window of plans (max 3) so that, if one of them is the
// "Most Popular" plan, it always lands in the center slot. Order of the
// remaining plans is preserved around it.
const arrangeWithPopularCenter = (windowPlans) => {
  if (windowPlans.length < 3) return windowPlans;

  const popularIndex = windowPlans.findIndex((p) => p.isMostPopular);
  if (popularIndex === -1 || popularIndex === 1) return windowPlans;

  const others = windowPlans.filter((_, i) => i !== popularIndex);
  return [others[0], windowPlans[popularIndex], others[1]];
};

// ─────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────

export default function Subscriptions() {
  // ── Plan States ──
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [planTabIndex, setPlanTabIndex] = useState(0);
  const [planPage, setPlanPage] = useState(0);
  const [showEditPlans, setShowEditPlans] = useState(false);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key to force reload

  // ── Load Plans ──
  const loadPlans = useCallback(async () => {
    setPlansLoading(true);
    setError(null);
    try {
      console.log('Loading plans...');
      const plansResponse = await subscriptionApi.getAllPlans(true);
      console.log('Plans response:', plansResponse);
      
      const planData = plansResponse.data?.plans || [];
      const displayPlans = planData.map(toDisplayPlanShape);
      console.log('Display plans:', displayPlans);
      
      setPlans(displayPlans);

      // Reset pagination if plans changed
      const totalPlanPages = Math.max(1, Math.ceil(displayPlans.length / 3));
      setPlanPage(0);
      setPlanTabIndex(0);
      
      return displayPlans;
    } catch (planErr) {
      console.error('Could not load plans from backend:', planErr);
      setError('Failed to load plans. Please try again.');
      return [];
    } finally {
      setPlansLoading(false);
    }
  }, []);

  // ── Load Data on Mount and when refreshKey changes ──
  useEffect(() => {
    loadPlans();
  }, [loadPlans, refreshKey]);

  // ── Plan windowed pagination: 3 cards per page ──
  const PLANS_PER_PAGE = 3;
  const totalPlanPages = Math.max(1, Math.ceil(plans.length / PLANS_PER_PAGE));
  const safePlanPage = Math.min(planPage, totalPlanPages - 1);
  const visiblePlans = arrangeWithPopularCenter(
    plans.slice(
      safePlanPage * PLANS_PER_PAGE,
      safePlanPage * PLANS_PER_PAGE + PLANS_PER_PAGE
    )
  );

  const handlePlanTabClick = (i) => {
    setPlanTabIndex(i);
    setPlanPage(Math.floor(i / PLANS_PER_PAGE));
  };

  // ── Keyboard nav for plan tab ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;

      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setPlanPage((p) => Math.min(totalPlanPages - 1, p + 1));
      } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
        e.preventDefault();
        setPlanPage((p) => Math.max(0, p - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [totalPlanPages]);

  // ── Handle EditPlans save ──
  const handleEditPlansSave = useCallback(() => {
    console.log('EditPlans save triggered - refreshing plans');
    
    // Close the modal first
    setShowEditPlans(false);
    
    // Force a reload by updating refreshKey
    // This will trigger the useEffect to reload plans
    setRefreshKey(prev => prev + 1);
    
    // Also directly reload plans for immediate update
    loadPlans();
  }, [loadPlans]);

  if (showEditPlans) {
    return (
      <EditPlans
        onSave={handleEditPlansSave}
        onBack={() => setShowEditPlans(false)}
      />
    );
  }

  return (
    <>
      <div className="dashboard-wrapper">
        <div className="dashboard-content">
          {/* ── PLAN MANAGEMENT ── */}
          <div className="sub-plan-management">
            <div className="sub-plan-management__header">
              <h1 className="dashboard-title" style={{ margin: 0 }}>Plan Management</h1>
              <button
                className="sub-edit-plans-btn"
                onClick={() => setShowEditPlans(true)}
              >
                ✎ Edit plans
              </button>
            </div>

            <div className="sub-plan-management__mobile-edit">
              <button className="sub-edit-plans-btn" onClick={() => setShowEditPlans(true)}>
                ✎ Edit plans
              </button>
            </div>

            {/* Mobile plan selector tabs */}
            <div className="sub-plan-tabs">
              {plans.map((p, i) => (
                <button
                  key={p.id}
                  className={`sub-plan-tab-btn ${planTabIndex === i ? "sub-plan-tab-btn--active" : ""}`}
                  onClick={() => handlePlanTabClick(i)}
                >
                  <span className="sub-plan-tab-btn__dot" />
                  {p.title.replace(/\s*plan\s*/i, "").trim() || p.title}
                </button>
              ))}
            </div>

            {plansLoading ? (
              <p style={{ padding: "2rem", color: "#888" }}>Loading plans...</p>
            ) : error ? (
              <p style={{ padding: "2rem", color: "#e74c3c" }}>{error}</p>
            ) : plans.length === 0 ? (
              <p style={{ padding: "2rem", color: "#888" }}>
                No plans available. Click "Edit plans" to create one.
              </p>
            ) : (
              <>
                {/* DESKTOP / TABLET: windowed 3-card view */}
                <div className="sub-plan-management__windowed">
                  <button
                    className="sub-plan-nav-btn"
                    disabled={safePlanPage === 0}
                    onClick={() => setPlanPage((p) => Math.max(0, p - 1))}
                    aria-label="Previous plans"
                  >
                    &#8249;
                  </button>

                  <div className="sub-plan-management__cards-grid">
                    {visiblePlans.map((p) => {
                      const globalIndex = plans.findIndex((plan) => plan.id === p.id);
                      return (
                        <div
                          key={p.id}
                          className={[
                            "plan-card-wrapper",
                            planTabIndex === globalIndex ? "plan-card--visible" : "",
                            p.isMostPopular ? "plan-card--popular-wrapper" : "",
                          ].join(" ")}
                        >
                          <PricingCard plan={p} showAdminControls={false} />
                        </div>
                      );
                    })}
                  </div>

                  <button
                    className="sub-plan-nav-btn"
                    disabled={safePlanPage >= totalPlanPages - 1}
                    onClick={() => setPlanPage((p) => Math.min(totalPlanPages - 1, p + 1))}
                    aria-label="Next plans"
                  >
                    &#8250;
                  </button>
                </div>

                {/* MOBILE ONLY: render ALL plans, show only active tab card */}
                <div className="sub-plan-management__mobile-cards">
                  {plans.map((p, i) => (
                    <div
                      key={p.id}
                      className={[
                        "plan-card-wrapper",
                        planTabIndex === i ? "plan-card--visible" : "",
                        p.isMostPopular ? "plan-card--popular-wrapper" : "",
                      ].join(" ")}
                    >
                      <PricingCard plan={p} showAdminControls={false} />
                    </div>
                  ))}
                </div>

                {totalPlanPages > 1 && (
                  <div className="sub-plan-page-dots">
                    {Array.from({ length: totalPlanPages }, (_, i) => (
                      <button
                        key={i}
                        className={`sub-plan-dot ${safePlanPage === i ? "sub-plan-dot--active" : ""}`}
                        onClick={() => setPlanPage(i)}
                        aria-label={`Go to plan page ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// // pages/admin/Subscriptions.jsx - Complete clean version

// import { useState, useEffect, useCallback } from "react";
// import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
// import { PiWalletDuotone } from "react-icons/pi";
// import { HiOutlineLocationMarker } from "react-icons/hi";
// import { HiOutlineBadgeCheck } from "react-icons/hi";
// import PricingCard from "../../components/PricingCard";
// import EditPlans from '../../components/EditPlans';
// import * as subscriptionApi from '../../services/subscription.service';
// import "../../assets/styles/dashboard.css";
// import "../../assets/styles/Subscription.css";

// // ─────────────────────────────────────────────
// // HELPER FUNCTIONS
// // ─────────────────────────────────────────────

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
//   // ── Plan States ──
//   const [plans, setPlans] = useState([]);
//   const [plansLoading, setPlansLoading] = useState(true);
//   const [planTabIndex, setPlanTabIndex] = useState(0);
//   const [planPage, setPlanPage] = useState(0);
//   const [showEditPlans, setShowEditPlans] = useState(false);
//   const [error, setError] = useState(null);
//   const [refreshKey, setRefreshKey] = useState(0); // Add refresh key to force reload

//   // ── Load Plans ──
//   const loadPlans = useCallback(async () => {
//     setPlansLoading(true);
//     setError(null);
//     try {
//       console.log('Loading plans...');
//       const plansResponse = await subscriptionApi.getAllPlans(true);
//       console.log('Plans response:', plansResponse);
      
//       const planData = plansResponse.data?.plans || [];
//       const displayPlans = planData.map(toDisplayPlanShape);
//       console.log('Display plans:', displayPlans);
      
//       setPlans(displayPlans);

//       // Reset pagination if plans changed
//       const totalPlanPages = Math.max(1, Math.ceil(displayPlans.length / 3));
//       setPlanPage(0);
//       setPlanTabIndex(0);
      
//       return displayPlans;
//     } catch (planErr) {
//       console.error('Could not load plans from backend:', planErr);
//       setError('Failed to load plans. Please try again.');
//       return [];
//     } finally {
//       setPlansLoading(false);
//     }
//   }, []);

//   // ── Load Data on Mount and when refreshKey changes ──
//   useEffect(() => {
//     loadPlans();
//   }, [loadPlans, refreshKey]);

//   // ── Plan windowed pagination: 3 cards per page ──
//   const PLANS_PER_PAGE = 3;
//   const totalPlanPages = Math.max(1, Math.ceil(plans.length / PLANS_PER_PAGE));
//   const safePlanPage = Math.min(planPage, totalPlanPages - 1);
//   const visiblePlans = plans.slice(
//     safePlanPage * PLANS_PER_PAGE,
//     safePlanPage * PLANS_PER_PAGE + PLANS_PER_PAGE
//   );

//   const handlePlanTabClick = (i) => {
//     setPlanTabIndex(i);
//     setPlanPage(Math.floor(i / PLANS_PER_PAGE));
//   };

//   // ── Keyboard nav for plan tab ──
//   useEffect(() => {
//     const handleKeyDown = (e) => {
//       const tag = e.target.tagName;
//       if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;

//       if (e.key === "ArrowRight" || e.key === " ") {
//         e.preventDefault();
//         setPlanPage((p) => Math.min(totalPlanPages - 1, p + 1));
//       } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
//         e.preventDefault();
//         setPlanPage((p) => Math.max(0, p - 1));
//       }
//     };

//     window.addEventListener("keydown", handleKeyDown);
//     return () => window.removeEventListener("keydown", handleKeyDown);
//   }, [totalPlanPages]);

//   // ── Handle EditPlans save ──
//   const handleEditPlansSave = useCallback(() => {
//     console.log('EditPlans save triggered - refreshing plans');
    
//     // Close the modal first
//     setShowEditPlans(false);
    
//     // Force a reload by updating refreshKey
//     // This will trigger the useEffect to reload plans
//     setRefreshKey(prev => prev + 1);
    
//     // Also directly reload plans for immediate update
//     loadPlans();
//   }, [loadPlans]);

//   if (showEditPlans) {
//     return (
//       <EditPlans
//         onSave={handleEditPlansSave}
//         onBack={() => setShowEditPlans(false)}
//       />
//     );
//   }

//   return (
//     <>
//       <div className="dashboard-wrapper">
//         <div className="dashboard-content">
//           {/* ── PLAN MANAGEMENT ── */}
//           <div className="sub-plan-management">
//             <div className="sub-plan-management__header">
//               <h1 className="dashboard-title" style={{ margin: 0 }}>Plan Management</h1>
//               <button
//                 className="sub-edit-plans-btn"
//                 onClick={() => setShowEditPlans(true)}
//               >
//                 ✎ Edit plans
//               </button>
//             </div>

//             <div className="sub-plan-management__mobile-edit">
//               <button className="sub-edit-plans-btn" onClick={() => setShowEditPlans(true)}>
//                 ✎ Edit plans
//               </button>
//             </div>

//             {/* Mobile plan selector tabs */}
//             <div className="sub-plan-tabs">
//               {plans.map((p, i) => (
//                 <button
//                   key={p.id}
//                   className={`sub-plan-tab-btn ${planTabIndex === i ? "sub-plan-tab-btn--active" : ""}`}
//                   onClick={() => handlePlanTabClick(i)}
//                 >
//                   <span className="sub-plan-tab-btn__dot" />
//                   {p.title.replace(/\s*plan\s*/i, "").trim() || p.title}
//                 </button>
//               ))}
//             </div>

//             {plansLoading ? (
//               <p style={{ padding: "2rem", color: "#888" }}>Loading plans...</p>
//             ) : error ? (
//               <p style={{ padding: "2rem", color: "#e74c3c" }}>{error}</p>
//             ) : plans.length === 0 ? (
//               <p style={{ padding: "2rem", color: "#888" }}>
//                 No plans available. Click "Edit plans" to create one.
//               </p>
//             ) : (
//               <>
//                 {/* DESKTOP / TABLET: windowed 3-card view */}
//                 <div className="sub-plan-management__windowed">
//                   <button
//                     className="sub-plan-nav-btn"
//                     disabled={safePlanPage === 0}
//                     onClick={() => setPlanPage((p) => Math.max(0, p - 1))}
//                     aria-label="Previous plans"
//                   >
//                     &#8249;
//                   </button>

//                   <div className="sub-plan-management__cards-grid">
//                     {visiblePlans.map((p, i) => {
//                       const globalIndex = safePlanPage * PLANS_PER_PAGE + i;
//                       return (
//                         <div
//                           key={p.id}
//                           className={[
//                             "plan-card-wrapper",
//                             planTabIndex === globalIndex ? "plan-card--visible" : "",
//                             p.isMostPopular ? "plan-card--popular-wrapper" : "",
//                           ].join(" ")}
//                         >
//                           <PricingCard plan={p} showAdminControls={false} />
//                         </div>
//                       );
//                     })}
//                   </div>

//                   <button
//                     className="sub-plan-nav-btn"
//                     disabled={safePlanPage >= totalPlanPages - 1}
//                     onClick={() => setPlanPage((p) => Math.min(totalPlanPages - 1, p + 1))}
//                     aria-label="Next plans"
//                   >
//                     &#8250;
//                   </button>
//                 </div>

//                 {/* MOBILE ONLY: render ALL plans, show only active tab card */}
//                 <div className="sub-plan-management__mobile-cards">
//                   {plans.map((p, i) => (
//                     <div
//                       key={p.id}
//                       className={[
//                         "plan-card-wrapper",
//                         planTabIndex === i ? "plan-card--visible" : "",
//                         p.isMostPopular ? "plan-card--popular-wrapper" : "",
//                       ].join(" ")}
//                     >
//                       <PricingCard plan={p} showAdminControls={false} />
//                     </div>
//                   ))}
//                 </div>

//                 {totalPlanPages > 1 && (
//                   <div className="sub-plan-page-dots">
//                     {Array.from({ length: totalPlanPages }, (_, i) => (
//                       <button
//                         key={i}
//                         className={`sub-plan-dot ${safePlanPage === i ? "sub-plan-dot--active" : ""}`}
//                         onClick={() => setPlanPage(i)}
//                         aria-label={`Go to plan page ${i + 1}`}
//                       />
//                     ))}
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }


// // // pages/admin/Subscriptions.jsx - Complete clean version

// // import { useState, useEffect, useCallback } from "react";
// // import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
// // import { PiWalletDuotone } from "react-icons/pi";
// // import { HiOutlineLocationMarker } from "react-icons/hi";
// // import { HiOutlineBadgeCheck } from "react-icons/hi";
// // import PricingCard from "../../components/PricingCard";
// // import EditPlans from '../../components/EditPlans';
// // import * as subscriptionApi from '../../services/subscription.service';
// // import "../../assets/styles/dashboard.css";
// // import "../../assets/styles/Subscription.css";

// // // ─────────────────────────────────────────────
// // // HELPER FUNCTIONS
// // // ─────────────────────────────────────────────

// // const toDisplayPlanShape = (p) => ({
// //   id: p._id,
// //   title: p.name,
// //   billingLabel: p.description || "Billed every month",
// //   price: p.price,
// //   perLabel: `${p.durationDays} Days`,
// //   isMostPopular: !!p.isMostPopular,
// //   features: Array.isArray(p.featureList) && p.featureList.length > 0
// //     ? p.featureList
// //     : ["Manage your turf"],
// // });

// // // ─────────────────────────────────────────────
// // // MAIN COMPONENT
// // // ─────────────────────────────────────────────

// // export default function Subscriptions() {
// //   // ── Plan States ──
// //   const [plans, setPlans] = useState([]);
// //   const [plansLoading, setPlansLoading] = useState(true);
// //   const [planTabIndex, setPlanTabIndex] = useState(0);
// //   const [planPage, setPlanPage] = useState(0);
// //   const [showEditPlans, setShowEditPlans] = useState(false);
// //   const [error, setError] = useState(null);
// //   const [stats, setStats] = useState({
// //     total: 0,
// //     active: 0,
// //     expiringSoon: 0,
// //     expired: 0
// //   });

// //   // ── Load Plans ──
// //   const loadPlans = useCallback(async () => {
// //     setPlansLoading(true);
// //     try {
// //       const plansResponse = await subscriptionApi.getAllPlans(true);
// //       const planData = plansResponse.data?.plans || [];
// //       const displayPlans = planData.map(toDisplayPlanShape);
// //       setPlans(displayPlans);

// //       const totalPlanPages = Math.max(1, Math.ceil(displayPlans.length / 3));
// //       setPlanPage(prev => Math.min(prev, totalPlanPages - 1));
// //       setPlanTabIndex(prev => Math.min(prev, Math.max(0, displayPlans.length - 1)));

// //       return displayPlans;
// //     } catch (planErr) {
// //       console.error('Could not load plans from backend:', planErr);
// //       setError('Failed to load plans. Please try again.');
// //       return [];
// //     } finally {
// //       setPlansLoading(false);
// //     }
// //   }, []);

// //   // ── Load All Data ──
// //   useEffect(() => {
// //     const loadData = async () => {
// //       setError(null);
// //       await loadPlans();
// //     };

// //     loadData();
// //   }, [loadPlans]);

// //   // ── Plan windowed pagination: 3 cards per page ──
// //   const PLANS_PER_PAGE = 3;
// //   const totalPlanPages = Math.max(1, Math.ceil(plans.length / PLANS_PER_PAGE));
// //   const safePlanPage = Math.min(planPage, totalPlanPages - 1);
// //   const visiblePlans = plans.slice(
// //     safePlanPage * PLANS_PER_PAGE,
// //     safePlanPage * PLANS_PER_PAGE + PLANS_PER_PAGE
// //   );

// //   const handlePlanTabClick = (i) => {
// //     setPlanTabIndex(i);
// //     setPlanPage(Math.floor(i / PLANS_PER_PAGE));
// //   };

// //   // ── Keyboard nav for plan tab ──
// //   useEffect(() => {
// //     const handleKeyDown = (e) => {
// //       const tag = e.target.tagName;
// //       if (tag === "INPUT" || tag === "TEXTAREA" || e.target.isContentEditable) return;

// //       if (e.key === "ArrowRight" || e.key === " ") {
// //         e.preventDefault();
// //         setPlanPage((p) => Math.min(totalPlanPages - 1, p + 1));
// //       } else if (e.key === "ArrowLeft" || e.key === "Backspace") {
// //         e.preventDefault();
// //         setPlanPage((p) => Math.max(0, p - 1));
// //       }
// //     };

// //     window.addEventListener("keydown", handleKeyDown);
// //     return () => window.removeEventListener("keydown", handleKeyDown);
// //   }, [totalPlanPages]);

// //   // ── Handle EditPlans save ──
// //   const handleEditPlansSave = useCallback(async () => {
// //     const updatedPlans = await loadPlans();
// //     if (updatedPlans && updatedPlans.length > 0) {
// //       setPlanTabIndex(0);
// //       setPlanPage(0);
// //     }
// //   }, [loadPlans]);

// //   if (showEditPlans) {
// //     return (
// //       <EditPlans
// //         onSave={handleEditPlansSave}
// //         onBack={() => setShowEditPlans(false)}
// //       />
// //     );
// //   }

// //   return (
// //     <>
// //       <div className="dashboard-wrapper">
// //         <div className="dashboard-content">
// //           {/* ── PLAN MANAGEMENT ── */}
// //           <div className="sub-plan-management">
// //             <div className="sub-plan-management__header">
// //               <h1 className="dashboard-title" style={{ margin: 0 }}>Plan Management</h1>
// //               <button
// //                 className="sub-edit-plans-btn"
// //                 onClick={() => setShowEditPlans(true)}
// //               >
// //                 ✎ Edit plans
// //               </button>
// //             </div>

// //             <div className="sub-plan-management__mobile-edit">
// //               <button className="sub-edit-plans-btn" onClick={() => setShowEditPlans(true)}>
// //                 ✎ Edit plans
// //               </button>
// //             </div>

// //             {/* Mobile plan selector tabs */}
// //             <div className="sub-plan-tabs">
// //               {plans.map((p, i) => (
// //                 <button
// //                   key={p.id}
// //                   className={`sub-plan-tab-btn ${planTabIndex === i ? "sub-plan-tab-btn--active" : ""}`}
// //                   onClick={() => handlePlanTabClick(i)}
// //                 >
// //                   <span className="sub-plan-tab-btn__dot" />
// //                   {p.title.replace(/\s*plan\s*/i, "").trim() || p.title}
// //                 </button>
// //               ))}
// //             </div>

// //             {plansLoading ? (
// //               <p style={{ padding: "2rem", color: "#888" }}>Loading plans...</p>
// //             ) : error ? (
// //               <p style={{ padding: "2rem", color: "#e74c3c" }}>{error}</p>
// //             ) : plans.length === 0 ? (
// //               <p style={{ padding: "2rem", color: "#888" }}>
// //                 No plans available. Click "Edit plans" to create one.
// //               </p>
// //             ) : (
// //               <>
// //                 {/* DESKTOP / TABLET: windowed 3-card view */}
// //                 <div className="sub-plan-management__windowed">
// //                   <button
// //                     className="sub-plan-nav-btn"
// //                     disabled={safePlanPage === 0}
// //                     onClick={() => setPlanPage((p) => Math.max(0, p - 1))}
// //                     aria-label="Previous plans"
// //                   >
// //                     &#8249;
// //                   </button>

// //                   <div className="sub-plan-management__cards-grid">
// //                     {visiblePlans.map((p, i) => {
// //                       const globalIndex = safePlanPage * PLANS_PER_PAGE + i;
// //                       return (
// //                         <div
// //                           key={p.id}
// //                           className={[
// //                             "plan-card-wrapper",
// //                             planTabIndex === globalIndex ? "plan-card--visible" : "",
// //                             p.isMostPopular ? "plan-card--popular-wrapper" : "",
// //                           ].join(" ")}
// //                         >
// //                           <PricingCard plan={p} showAdminControls={false} />
// //                         </div>
// //                       );
// //                     })}
// //                   </div>

// //                   <button
// //                     className="sub-plan-nav-btn"
// //                     disabled={safePlanPage >= totalPlanPages - 1}
// //                     onClick={() => setPlanPage((p) => Math.min(totalPlanPages - 1, p + 1))}
// //                     aria-label="Next plans"
// //                   >
// //                     &#8250;
// //                   </button>
// //                 </div>

// //                 {/* MOBILE ONLY: render ALL plans, show only active tab card */}
// //                 <div className="sub-plan-management__mobile-cards">
// //                   {plans.map((p, i) => (
// //                     <div
// //                       key={p.id}
// //                       className={[
// //                         "plan-card-wrapper",
// //                         planTabIndex === i ? "plan-card--visible" : "",
// //                         p.isMostPopular ? "plan-card--popular-wrapper" : "",
// //                       ].join(" ")}
// //                     >
// //                       <PricingCard plan={p} showAdminControls={false} />
// //                     </div>
// //                   ))}
// //                 </div>

// //                 {totalPlanPages > 1 && (
// //                   <div className="sub-plan-page-dots">
// //                     {Array.from({ length: totalPlanPages }, (_, i) => (
// //                       <button
// //                         key={i}
// //                         className={`sub-plan-dot ${safePlanPage === i ? "sub-plan-dot--active" : ""}`}
// //                         onClick={() => setPlanPage(i)}
// //                         aria-label={`Go to plan page ${i + 1}`}
// //                       />
// //                     ))}
// //                   </div>
// //                 )}
// //               </>
// //             )}
// //           </div>
// //         </div>
// //       </div>
// //     </>
// //   );
// // }

// // // // pages/admin/Subscriptions.jsx - Complete clean version

// // // import { useState, useEffect, useCallback } from "react";
// // // import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
// // // import { PiWalletDuotone } from "react-icons/pi";
// // // import { HiOutlineLocationMarker } from "react-icons/hi";
// // // import { HiOutlineBadgeCheck } from "react-icons/hi";
// // // import { HiOutlineSearch } from "react-icons/hi";
// // // import TurfCard from "../../components/TurfCard";
// // // import PricingCard from "../../components/PricingCard";
// // // import EditPlans from '../../components/EditPlans';
// // // import * as subscriptionApi from '../../services/subscription.service';
// // // import * as turfApi from '../../services/turf.service';
// // // import "../../assets/styles/dashboard.css";
// // // import "../../assets/styles/Subscription.css";

// // // // ─────────────────────────────────────────────
// // // // STATIC DATA
// // // // ─────────────────────────────────────────────



// // // // const FALLBACK_TURFS = [
// // // //   { turfId: "Erd-456", status: "Active", title: "Enjoy Turf Game", price: 585, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Erode", planDuration: "1 Year", turfImage: null, logoImage: null },
// // // //   { turfId: "Erd-457", status: "Active", title: "SB Landscape Turf", price: 445, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Coimbatore", planDuration: "Free trial", turfImage: null, logoImage: null },
// // // //   { turfId: "Erd-458", status: "Active", title: "Sports Hub Ventures", price: 245, startDate: "12 / 12 / 2026", endDate: "01 / 01 / 2027", location: "Sathiyamangalam", planDuration: "3 months", turfImage: null, logoImage: null },
// // // //   { turfId: "Erd-459", status: "Active", title: "Sports Men Turf", price: 845, startDate: "12 / 01 / 2027", endDate: "12 / 03 / 2027", location: "Gobi", planDuration: "1 Year", turfImage: null, logoImage: null },
// // // //   { turfId: "Erd-460", status: "Expired", title: "Green Valley Turf", price: 399, startDate: "01 / 02 / 2027", endDate: "01 / 05 / 2027", location: "Erode", planDuration: "3 months", turfImage: null, logoImage: null },
// // // //   { turfId: "Erd-461", status: "Active", title: "Royal Sports Arena", price: 699, startDate: "15 / 03 / 2027", endDate: "15 / 04 / 2027", location: "Coimbatore", planDuration: "1 Year", turfImage: null, logoImage: null },
// // // //   { turfId: "Erd-462", status: "Expired", title: "City Premier Turf", price: 525, startDate: "20 / 01 / 2027", endDate: "20 / 02 / 2027", location: "Gobi", planDuration: "Free trial", turfImage: null, logoImage: null },
// // // //   { turfId: "Erd-463", status: "Active", title: "Victory Sports Ground", price: 750, startDate: "05 / 02 / 2027", endDate: "05 / 03 / 2027", location: "Sathiyamangalam", planDuration: "1 Year", turfImage: null, logoImage: null },
// // // // ];

// // // const PLAN_OPTIONS = ["All plans", "1 Year", "3 months", "Free trial"];
// // // const STATUS_OPTIONS = ["Status", "Active", "Expired"];
// // // const LOCATION_OPTIONS = ["Location", "Erode", "Coimbatore", "Sathiyamangalam", "Gobi"];

// // // // ─────────────────────────────────────────────
// // // // HELPER FUNCTIONS
// // // // ─────────────────────────────────────────────

// // // // Convert backend turf to TurfCard props
// // // const toTurfCardProps = (turf) => ({
// // //   turfId: turf._id ? `ERD-${turf._id.slice(-4).toUpperCase()}` : turf.turfId || turf.id || 'N/A',
// // //   status: turf.subscriptionStatus || turf.status || (turf.isAvailable ? 'Active' : 'Expired'),
// // //   title: turf.name || turf.title || turf.turfName || 'Turf',
// // //   price: turf.pricePerHour?.basePrice || turf.pricePerHour || turf.price || 0,
// // //   startDate: turf.startDate || turf.subscriptionStartDate || 'N/A',
// // //   endDate: turf.endDate || turf.subscriptionEndDate || 'N/A',
// // //   location: turf.location || turf.address?.city || turf.city || 'N/A',
// // //   planDuration: turf.planDuration || turf.subscriptionPlan || 'N/A',
// // //   turfImage: turf.mainImage || turf.turfImage || turf.image || null,
// // //   logoImage: turf.logoImage || null,
// // // });

// // // // Convert backend plan -> read-only PricingCard display shape
// // // const toDisplayPlanShape = (p) => ({
// // //   id: p._id,
// // //   title: p.name,
// // //   billingLabel: p.description || "Billed every month",
// // //   price: p.price,
// // //   perLabel: `${p.durationDays} Days`,
// // //   isMostPopular: !!p.isMostPopular,
// // //   features: Array.isArray(p.featureList) && p.featureList.length > 0
// // //     ? p.featureList
// // //     : ["Manage your turf"],
// // // });

// // // // Fallback data
// // // const FALLBACK_TURFS = [];

// // // // ─────────────────────────────────────────────
// // // // MAIN COMPONENT
// // // // ─────────────────────────────────────────────

// // // export default function Subscriptions() {
// // //   const [search, setSearch] = useState("");
// // //   const [plan, setPlan] = useState("All plans");
// // //   const [status, setStatus] = useState("Status");
// // //   const [location, setLocation] = useState("Location");
// // //   const [page, setPage] = useState(1);

// // //   // ── Plan States ──
// // //   const [plans, setPlans] = useState([]);
// // //   const [plansLoading, setPlansLoading] = useState(true);
// // //   const [planTabIndex, setPlanTabIndex] = useState(0);
// // //   const [planStartIndex, setPlanStartIndex] = useState(0);

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

// // //   // ── Load Plans Function ──
// // //   // Always includes inactive plans so the admin "Plan Management" tab shows
// // //   // every plan that exists in the database, not only currently-active ones.
// // //   const loadPlans = useCallback(async () => {
// // //     setPlansLoading(true);
// // //     try {
// // //       const plansResponse = await subscriptionApi.getAllPlans(true);
// // //       const planData = plansResponse.data?.plans || [];
// // //       const displayPlans = planData.map(toDisplayPlanShape);
// // //       setPlans(displayPlans);
// // //       setPlanStartIndex(0);
// // //     } catch (planErr) {
// // //       console.error('Could not load plans from backend:', planErr);
// // //     } finally {
// // //       setPlansLoading(false);
// // //     }
// // //   }, []);

// // //   // ── Load All Data ──
// // //   useEffect(() => {
// // //     const loadData = async () => {
// // //       setLoading(true);
// // //       setError(null);

// // //       try {
// // //         // 1. Load Plans
// // //         await loadPlans();

// // //         // 2. Load Turfs and Subscriptions (Admin only)
// // //         let mappedTurfs = [];
// // //         try {
// // //           const token = localStorage.getItem('token');
// // //           if (token) {
// // //             // Fetch all turfs
// // //             let turfData = [];
// // //             try {
// // //               const turfsResponse = await turfApi.getAllTurfs();
// // //               if (turfsResponse?.data?.turfs) {
// // //                 turfData = turfsResponse.data.turfs;
// // //               } else if (turfsResponse?.data) {
// // //                 turfData = turfsResponse.data;
// // //               } else if (Array.isArray(turfsResponse)) {
// // //                 turfData = turfsResponse;
// // //               }
// // //             } catch (turfErr) {
// // //               console.error('Failed to load turfs:', turfErr);
// // //             }

// // //             // Fetch all subscriptions
// // //             const subsResponse = await subscriptionApi.getAllSubscriptions({ page: 1, limit: 100 });
// // //             const subsData = subsResponse.data?.subscriptions || [];

// // //             if (subsData.length > 0) {
// // //               const active = subsData.filter(s => s.status === 'active' || s.status === 'trial').length;
// // //               const expired = subsData.filter(s => s.status === 'expired').length;
// // //               const expiringSoon = subsData.filter(s => {
// // //                 if (!s.endDate) return false;
// // //                 const daysRemaining = Math.ceil((new Date(s.endDate) - new Date()) / (1000 * 60 * 60 * 24));
// // //                 return daysRemaining <= 7 && daysRemaining > 0;
// // //               }).length;

// // //               setStats({
// // //                 total: subsData.length,
// // //                 active,
// // //                 expiringSoon,
// // //                 expired
// // //               });
// // //             }

// // //             const subMap = {};
// // //             subsData.forEach(s => {
// // //               const turfIdStr = s.turfId?._id || s.turfId || s.turf;
// // //               if (!turfIdStr) return;
// // //               const id = typeof turfIdStr === 'object' ? turfIdStr.toString() : turfIdStr;
// // //               if (!subMap[id] || s.status === 'active' || s.status === 'trial') {
// // //                   subMap[id] = s;
// // //               }
// // //             });

// // //             if (turfData && turfData.length > 0) {
// // //               mappedTurfs = turfData.map(t => {
// // //                 const s = subMap[t._id];
                
// // //                 // Only turfs with an active/trial subscription are Active. All others are Expired.
// // //                 const isActive = s && (s.status === 'active' || s.status === 'trial');
                
// // //                 let daysLeft = null;
// // //                 if (isActive && s.endDate) {
// // //                   const remaining = Math.ceil((new Date(s.endDate) - new Date()) / (1000 * 60 * 60 * 24));
// // //                   daysLeft = remaining > 0 ? remaining : 0;
// // //                 }

// // //                 return {
// // //                   turfId: t._id ? `ERD-${t._id.slice(-4).toUpperCase()}` : 'N/A',
// // //                   status: isActive ? 'Active' : 'Expired',
// // //                   title: t.name || t.turfName || t.title || 'Turf',
// // //                   price: t.pricePerHour?.basePrice || t.pricePerHour || s?.price || 0,
// // //                   startDate: s?.startDate ? new Date(s.startDate).toLocaleDateString() : 'N/A',
// // //                   endDate: s?.endDate ? new Date(s.endDate).toLocaleDateString() : 'N/A',
// // //                   daysLeft,
// // //                   location: t.location || t.address?.city || t.city || 'N/A',
// // //                   planDuration: s?.planId?.name || s?.planDuration || 'N/A',
// // //                   turfImage: t.mainImage || t.turfImage || t.image || null,
// // //                   logoImage: t.logoImage || null,
// // //                 };
// // //               });
// // //             } else if (subsData.length > 0) {
// // //               mappedTurfs = subsData.map(s => {
// // //                 const t = s.turfId || {};
// // //                 const isActive = (s.status === 'active' || s.status === 'trial');
                
// // //                 let daysLeft = null;
// // //                 if (isActive && s.endDate) {
// // //                   const remaining = Math.ceil((new Date(s.endDate) - new Date()) / (1000 * 60 * 60 * 24));
// // //                   daysLeft = remaining > 0 ? remaining : 0;
// // //                 }

// // //                 return {
// // //                   turfId: s._id ? `ERD-${s._id.slice(-4).toUpperCase()}` : t._id ? `ERD-${t._id.slice(-4).toUpperCase()}` : 'N/A',
// // //                   status: isActive ? 'Active' : 'Expired',
// // //                   title: t.name || s.turfName || t.title || 'Turf',
// // //                   price: t.pricePerHour?.basePrice || t.pricePerHour || s.price || 0,
// // //                   startDate: s.startDate ? new Date(s.startDate).toLocaleDateString() : 'N/A',
// // //                   endDate: s.endDate ? new Date(s.endDate).toLocaleDateString() : 'N/A',
// // //                   daysLeft,
// // //                   location: t.location || t.address?.city || t.city || 'N/A',
// // //                   planDuration: s.planId?.name || s.planDuration || 'N/A',
// // //                   turfImage: t.mainImage || t.turfImage || t.image || null,
// // //                   logoImage: t.logoImage || null,
// // //                 };
// // //               });
// // //             }
// // //           }
// // //         } catch (err) {
// // //           console.error('Could not load subscriptions or turfs:', err);
// // //         }

// // //         if (mappedTurfs.length > 0) {
// // //           setTurfs(mappedTurfs);
// // //           setFilteredTurfs(mappedTurfs);
// // //         } else {
// // //           setTurfs(FALLBACK_TURFS);
// // //           setFilteredTurfs(FALLBACK_TURFS);
// // //         }

// // //       } catch (err) {
// // //         console.error('Failed to load data:', err);
// // //         setError('Failed to load some data. Using fallback data.');
// // //       } finally {
// // //         setLoading(false);
// // //       }
// // //     };

// // //     loadData();
// // //   }, [loadPlans]);

// // //   // ── Filter Turfs ──
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

// // //   // ── Handle Search ──
// // //   const handleSearchChange = (e) => {
// // //     const value = e.target.value;
// // //     setSearch(value);
// // //     setPage(1);
// // //   };

// // //   // ── Reset Filters ──
// // //   const resetFilters = () => {
// // //     setSearch("");
// // //     setPlan("All plans");
// // //     setStatus("Status");
// // //     setLocation("Location");
// // //     setPage(1);
// // //   };





// // //   // ── Show EditPlans if active ──
// // //   if (showEditPlans) {
// // //     return (
// // //       <EditPlans
// // //         onSave={loadPlans}
// // //         onBack={() => setShowEditPlans(false)}
// // //       />
// // //     );
// // //   }

// // //   // ── Render ──
// // //   return (
// // //     <>
// // //       <div className="dashboard-wrapper">
// // //         <div className="dashboard-content">
// // //           <div className="sub-plan-management">
// // //             <div className="sub-plan-management__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
// // //               <h1 className="dashboard-title" style={{ margin: 0 }}>Plan Management</h1>
// // //             <button
// // //               className="sub-edit-plans-btn"
// // //               onClick={() => setShowEditPlans(true)}
// // //             >
// // //               SUBSCRIPTION
// // //             </button>
// // //           </div>

// // //           {/* Scrollable plan cards */}
// // //           <div className="sub-plan-management__scroll-wrapper">
// // //             <div className="sub-plan-management__cards">
// // //               {plansLoading ? (
// // //                 <p>Loading plans...</p>
// // //               ) : plans.length > 0 ? (
// // //                 plans.map((p, i) => (
// // //                   <div key={p.id} className="plan-card-wrapper">
// // //                     <PricingCard
// // //                       plan={p}
// // //                       showAdminControls={false}
// // //                     />
// // //                   </div>
// // //                 ))
// // //               ) : (
// // //                 <p>No plans available. Click "Edit plans" to create one.</p>
// // //               )}
// // //             </div>
// // //           </div>
// // //         </div>
// // //       </div>
// // //     </div>
// // //     </>
// // //   );
// // // }
