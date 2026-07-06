// components/TurfCard.jsx
import { HiOutlinePhotograph } from "react-icons/hi";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import '../assets/styles/TurfCard.css';

export default function TurfCard({
  // Backend fields
  _id,
  name,
  location,
  address,
  sportType,
  pricePerHour,
  mainImage,
  isAvailable,
  approvalStatus,
  averageRating,
  totalReviews,
  
  // Display fields
  turfId = _id ? `ERD-${_id.slice(-4).toUpperCase()}` : "N/A",
  status = isAvailable ? "Active" : "Inactive",
  title = name || "Turf",
  price = pricePerHour?.basePrice || 0,
  startDate = "N/A",
  endDate = "N/A",
  locationDisplay = typeof location === 'string' ? location : address?.city || "N/A",
  planDuration = "N/A",
  daysLeft = null,
  turfImage = mainImage || null,
  logoImage = null,
}) {
  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);
  const statusLabel = status === 'Active' && daysLeft !== null ? `${displayStatus} (${daysLeft} Days Left)` : displayStatus;
  const formattedPrice = price ? price.toLocaleString("en-IN") : "0";

  const defaultTurf = "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&w=800&q=80"; // A nice sports turf
  const defaultLogo = "https://ui-avatars.com/api/?name=Ace+TURF&background=ffffff&color=10B981&bold=true&size=128";

  return (
    <div className="turf-card">

      {/* Image Section */}
      <div className="turf-card__image-wrapper">
        <img src={turfImage || defaultTurf} alt={title} className="turf-card__image" />

        {/* Logo Circle */}
        <div className="turf-card__logo-circle">
          <img src={logoImage || defaultLogo} alt={`${title} logo`} className="turf-card__logo-img" />
        </div>
      </div>

      {/* Content Section */}
      <div className="turf-card__content">
        <div className="turf-card__meta-row">
          <span className="turf-card__turf-id">Turf ID : {turfId}</span>
          <span className={`turf-card__status turf-card__status--${status.toLowerCase()}`}>
            {statusLabel}
          </span>
        </div>

        <h2 className="turf-card__title">{title}</h2>

        <p className="turf-card__price">
          ₹ {formattedPrice}
          <span className="turf-card__price-unit"> / hrs</span>
        </p>

        {averageRating > 0 && (
          <p className="turf-card__rating">
            ⭐ {averageRating.toFixed(1)} ({totalReviews || 0} reviews)
          </p>
        )}

        <p className="turf-card__dates">
          {startDate !== "N/A" ? `Start : ${startDate} — End : ${endDate}` : 'Available now'}
        </p>

        <div className="turf-card__footer">
          <div className="turf-card__footer-item">
            <span className="turf-card__footer-label">Location</span>
            <span className="turf-card__footer-value">{locationDisplay}</span>
          </div>
          <div className="turf-card__footer-divider" />
          <div className="turf-card__footer-item">
            <span className="turf-card__footer-label turf-card__footer-label--blue">
              Plan Duration
            </span>
            <span className="turf-card__footer-value">{planDuration}</span>
          </div>
        </div>
      </div>
    </div>
  );
}