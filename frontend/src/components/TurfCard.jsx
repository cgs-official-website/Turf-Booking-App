import { HiOutlinePhotograph } from "react-icons/hi";
import { HiOutlineOfficeBuilding } from "react-icons/hi";
import '../assets/styles/TurfCard.css';

export default function TurfCard({
  turfId = "Erd-456",
  status = "Active",
  title = "Enjoy Truf Game",
  price = 585,
  startDate = "12 / 12 / 2026",
  endDate = "01 / 01 / 2027",
  location = "Erode",
  planDuration = "1 Year",
  turfImage = null,
  logoImage = null,
}) {
  return (
    <div className="turf-card">

      {/* Image Section */}
      <div className="turf-card__image-wrapper">
        {turfImage ? (
          <img src={turfImage} alt={title} className="turf-card__image" />
        ) : (
          <div className="turf-card__image-placeholder">
            <HiOutlinePhotograph className="turf-card__image-placeholder-icon" />
          </div>
        )}

        {/* Logo Circle */}
        <div className="turf-card__logo-circle">
          {logoImage ? (
            <img src={logoImage} alt={`${title} logo`} className="turf-card__logo-img" />
          ) : (
            <div className="turf-card__logo-placeholder">
              <HiOutlineOfficeBuilding className="turf-card__logo-placeholder-icon" />
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="turf-card__content">
        <div className="turf-card__meta-row">
          <span className="turf-card__turf-id">Turf ID : {turfId}</span>
          <span className={`turf-card__status turf-card__status--${status.toLowerCase()}`}>
            {status}
          </span>
        </div>

        <h2 className="turf-card__title">{title}</h2>

        <p className="turf-card__price">
          ₹ {price.toLocaleString("en-IN")}
          <span className="turf-card__price-unit"> / hrs</span>
        </p>

        <p className="turf-card__dates">
          Start : {startDate} &nbsp;—&nbsp; End : {endDate}
        </p>

        <div className="turf-card__footer">
          <div className="turf-card__footer-item">
            <span className="turf-card__footer-label">Location</span>
            <span className="turf-card__footer-value">{location}</span>
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