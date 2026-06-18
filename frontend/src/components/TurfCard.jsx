import { useState, useRef } from "react";
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
  defaultImage = null,
  defaultLogo = null,
}) {
  const [turfImage, setTurfImage] = useState(defaultImage);
  const [logoImage, setLogoImage] = useState(defaultLogo);
  const turfInputRef = useRef(null);
  const logoInputRef = useRef(null);

  const handleFileChange = (e, setter) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setter(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="turf-card">

      {/* Image Section */}
      <div className="turf-card__image-wrapper">
        <input
          ref={turfInputRef}
          type="file"
          accept="image/*"
          className="turf-card__file-input"
          onChange={(e) => handleFileChange(e, setTurfImage)}
        />
        {turfImage ? (
          <img
            src={turfImage}
            alt="Turf"
            className="turf-card__image"
            onClick={() => turfInputRef.current.click()}
          />
        ) : (
          <div
            className="turf-card__image-placeholder"
            onClick={() => turfInputRef.current.click()}
          >
            <span className="turf-card__upload-icon">⬆</span>
            <span className="turf-card__upload-label">Upload turf image</span>
          </div>
        )}

        {/* Logo Circle */}
        <div
          className="turf-card__logo-circle"
          onClick={() => logoInputRef.current.click()}
        >
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="turf-card__file-input"
            onChange={(e) => handleFileChange(e, setLogoImage)}
          />
          {logoImage ? (
            <img src={logoImage} alt="Logo" className="turf-card__logo-img" />
          ) : (
            <span className="turf-card__logo-placeholder">Logo</span>
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