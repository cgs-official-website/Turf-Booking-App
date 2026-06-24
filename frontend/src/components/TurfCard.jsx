// components/TurfCard.jsx
import React from 'react';
import '../assets/styles/TurfCard.css';

export default function TurfCard({ 
  turfId, 
  status, 
  title, 
  price, 
  startDate, 
  endDate, 
  location, 
  planDuration, 
  turfImage, 
  logoImage 
}) {
  const getStatusColor = (status) => {
    const statusMap = {
      'Active': '#22c55e',
      'active': '#22c55e',
      'Approved': '#22c55e',
      'approved': '#22c55e',
      'Inactive': '#f59e0b',
      'inactive': '#f59e0b',
      'Expired': '#ef4444',
      'expired': '#ef4444',
      'Pending': '#f59e0b',
      'pending': '#f59e0b',
    };
    return statusMap[status] || '#6b7280';
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'Active': 'active',
      'active': 'active',
      'Approved': 'active',
      'approved': 'active',
      'Inactive': 'inactive',
      'inactive': 'inactive',
      'Expired': 'expired',
      'expired': 'expired',
      'Pending': 'pending',
      'pending': 'pending',
    };
    return statusMap[status] || '';
  };

  return (
    <div className="turf-card">
      <div className="turf-card__image-container">
        {turfImage ? (
          <img 
            src={turfImage} 
            alt={title} 
            className="turf-card__image" 
          />
        ) : (
          <div className="turf-card__image-placeholder">
            <span>{title?.charAt(0) || 'T'}</span>
          </div>
        )}
        <div className={`turf-card__status ${getStatusClass(status)}`}>
          {status || 'Active'}
        </div>
      </div>

      <div className="turf-card__content">
        <div className="turf-card__header">
          <h3 className="turf-card__title">{title || 'Turf'}</h3>
          <span className="turf-card__id">ID: {turfId || 'N/A'}</span>
        </div>

        <div className="turf-card__details">
          <div className="turf-card__detail">
            <span className="turf-card__detail-label">Location</span>
            <span className="turf-card__detail-value">{location || 'N/A'}</span>
          </div>
          <div className="turf-card__detail">
            <span className="turf-card__detail-label">Price</span>
            <span className="turf-card__detail-value">£{price || 0} / hr</span>
          </div>
          <div className="turf-card__detail">
            <span className="turf-card__detail-label">Plan</span>
            <span className="turf-card__detail-value">{planDuration || 'N/A'}</span>
          </div>
          <div className="turf-card__detail">
            <span className="turf-card__detail-label">Start Date</span>
            <span className="turf-card__detail-value">{startDate || 'N/A'}</span>
          </div>
          <div className="turf-card__detail">
            <span className="turf-card__detail-label">End Date</span>
            <span className="turf-card__detail-value">{endDate || 'N/A'}</span>
          </div>
        </div>

        <div className="turf-card__footer">
          <span className="turf-card__availability">Available now</span>
        </div>
      </div>
    </div>
  );
}

// // components/TurfCard.jsx
// import { HiOutlinePhotograph } from "react-icons/hi";
// import { HiOutlineOfficeBuilding } from "react-icons/hi";
// import '../assets/styles/TurfCard.css';

// export default function TurfCard({
//   // Backend fields
//   _id,
//   name,
//   location,
//   address,
//   sportType,
//   pricePerHour,
//   mainImage,
//   isAvailable,
//   approvalStatus,
//   averageRating,
//   totalReviews,
  
//   // Display fields
//   turfId = _id || "N/A",
//   status = approvalStatus || "pending",
//   title = name || "Turf",
//   price = pricePerHour?.basePrice || 0,
//   startDate = "N/A",
//   endDate = "N/A",
//   locationDisplay = typeof location === 'string' ? location : address?.city || "N/A",
//   planDuration = "N/A",
//   turfImage = mainImage || null,
//   logoImage = null,
// }) {
//   const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
//   const formattedPrice = price ? price.toLocaleString("en-IN") : "0";

//   return (
//     <div className="turf-card">

//       {/* Image Section */}
//       <div className="turf-card__image-wrapper">
//         {turfImage ? (
//           <img src={turfImage} alt={title} className="turf-card__image" />
//         ) : (
//           <div className="turf-card__image-placeholder">
//             <HiOutlinePhotograph className="turf-card__image-placeholder-icon" />
//           </div>
//         )}

//         {/* Logo Circle */}
//         <div className="turf-card__logo-circle">
//           {logoImage ? (
//             <img src={logoImage} alt={`${title} logo`} className="turf-card__logo-img" />
//           ) : (
//             <div className="turf-card__logo-placeholder">
//               <HiOutlineOfficeBuilding className="turf-card__logo-placeholder-icon" />
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Content Section */}
//       <div className="turf-card__content">
//         <div className="turf-card__meta-row">
//           <span className="turf-card__turf-id">Turf ID : {turfId}</span>
//           <span className={`turf-card__status turf-card__status--${status.toLowerCase()}`}>
//             {displayStatus}
//           </span>
//         </div>

//         <h2 className="turf-card__title">{title}</h2>

//         <p className="turf-card__price">
//           ₹ {formattedPrice}
//           <span className="turf-card__price-unit"> / hr</span>
//         </p>

//         {averageRating > 0 && (
//           <p className="turf-card__rating">
//             ⭐ {averageRating.toFixed(1)} ({totalReviews || 0} reviews)
//           </p>
//         )}

//         <p className="turf-card__dates">
//           {startDate !== "N/A" ? `Start: ${startDate} — End: ${endDate}` : 'Available now'}
//         </p>

//         <div className="turf-card__footer">
//           <div className="turf-card__footer-item">
//             <span className="turf-card__footer-label">Location</span>
//             <span className="turf-card__footer-value">{locationDisplay}</span>
//           </div>
//           <div className="turf-card__footer-divider" />
//           <div className="turf-card__footer-item">
//             <span className="turf-card__footer-label turf-card__footer-label--blue">
//               Plan Duration
//             </span>
//             <span className="turf-card__footer-value">{planDuration}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }