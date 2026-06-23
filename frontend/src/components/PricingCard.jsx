import '../assets/styles/PricingCard.css';

export default function PricingCard({
  plan,
  onSetMostPopular,
  onRemoveMostPopular,
  showAdminControls = false,
}) {
  const {
    title,
    billingLabel,
    price,
    perLabel,
    features,
    isMostPopular = false,
  } = plan;

  // ✅ Deduplicate billing label in case backend stored it multiple times
  const cleanBillingLabel = (() => {
    if (!billingLabel) return "Billed every month";
    // Split on any repeated phrase and take only the first occurrence
    const trimmed = billingLabel.trim();
    // Find if a substring repeats itself (e.g. "Billed every month Billed every month")
    const half = Math.ceil(trimmed.length / 2);
    for (let len = 1; len <= half; len++) {
      const chunk = trimmed.slice(0, len);
      const rest = trimmed.slice(len).trim();
      if (rest.startsWith(chunk)) {
        return chunk.trim();
      }
    }
    return trimmed;
  })();

  return (
    <div className={`pricing-card ${isMostPopular ? 'pricing-card--popular' : ''}`}>

      {/* Most Popular Badge */}
      {isMostPopular && (
        <span className="pricing-card-badge">Most popular</span>
      )}

      <h2 className={`pricing-card-title ${isMostPopular ? 'pricing-card-title--popular' : ''}`}>
        {title}
      </h2>
      <p className="pricing-card-billing">{cleanBillingLabel}</p>

      <div className="pricing-card-price">
        <span className="pricing-card-currency">₹</span>
        <span className={`pricing-card-amount ${isMostPopular ? 'pricing-card-amount--popular' : ''}`}>
          {price.toLocaleString('en-IN')}
        </span>
        <span className="pricing-card-per">/{perLabel}</span>
      </div>

      <ul className="pricing-card-features">
        {features.map((feature, index) => (
          <li key={index} className="pricing-card-feature-item">
            <svg
              className="pricing-card-check"
              width="16"
              height="16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="#22c55e"
              strokeWidth="3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Admin Toggle — only shown when explicitly editing */}
      {showAdminControls && (
        <button
          className={`pricing-card-toggle-btn ${isMostPopular ? 'pricing-card-toggle-btn--remove' : ''}`}
          onClick={isMostPopular ? onRemoveMostPopular : onSetMostPopular}
        >
          {isMostPopular ? '✕ Remove Most Popular' : '★ Set as Most Popular'}
        </button>
      )}

    </div>
  );
}


// import '../assets/styles/PricingCard.css';

// export default function PricingCard({
//   plan,
//   onSetMostPopular,
//   onRemoveMostPopular,
//   showAdminControls = false,
// }) {
//   const {
//     title,
//     billingLabel,
//     price,
//     perLabel,
//     features,
//     isMostPopular = false,
//   } = plan;

//   return (
//     <div className={`pricing-card ${isMostPopular ? 'pricing-card--popular' : ''}`}>

//       {/* Most Popular Badge */}
//       {isMostPopular && (
//         <span className="pricing-card-badge">Most popular</span>
//       )}

//       <h2 className={`pricing-card-title ${isMostPopular ? 'pricing-card-title--popular' : ''}`}>
//         {title}
//       </h2>
//       <p className="pricing-card-billing">{billingLabel}</p>

//       <div className="pricing-card-price">
//         <span className="pricing-card-currency">₹</span>
//         <span className={`pricing-card-amount ${isMostPopular ? 'pricing-card-amount--popular' : ''}`}>
//           {price.toLocaleString('en-IN')}
//         </span>
//         <span className="pricing-card-per">/{perLabel}</span>
//       </div>

//       <ul className="pricing-card-features">
//         {features.map((feature, index) => (
//           <li key={index} className="pricing-card-feature-item">
//             <svg
//               className="pricing-card-check"
//               width="16"
//               height="16"
//               fill="none"
//               viewBox="0 0 24 24"
//               stroke="#22c55e"
//               strokeWidth="3"
//             >
//               <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
//             </svg>
//             <span>{feature}</span>
//           </li>
//         ))}
//       </ul>

//       {/* Admin Toggle — only shown when explicitly editing */}
//       {showAdminControls && (
//         <button
//           className={`pricing-card-toggle-btn ${isMostPopular ? 'pricing-card-toggle-btn--remove' : ''}`}
//           onClick={isMostPopular ? onRemoveMostPopular : onSetMostPopular}
//         >
//           {isMostPopular ? '✕ Remove Most Popular' : '★ Set as Most Popular'}
//         </button>
//       )}

//     </div>
//   );
// }