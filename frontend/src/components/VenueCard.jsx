import { useState } from "react";
import '../assets/styles/Card.css';

export default function VenueCard({
  name = "Qube Sportz Arena",
  location = "Perundurai TamilNadu India",
  rating = 4.8,
  reviewCount = 234,
  pricePerHour = 1200,
  facilities = ["Floodlights", "Parking", "Water", "CCTV Security", "Restroom"],
  sports = ["Football", "Cricket", "Badminton", "Volleyball"],
  photoCount = 4,
  verified = true,
}) {
  const facilityIcons = {
    Floodlights: "💡",
    Parking: "🅿️",
    Water: "💧",
    "CCTV Security": "📷",
    Restroom: "🚻",
  };

  const sportIcons = {
    Football: "⚽",
    Cricket: "🏏",
    Badminton: "🏸",
    Volleyball: "🏐",
  };

  const photoBgs = ["vc-bg1", "vc-bg2", "vc-bg3", "vc-bg4"];

  return (
    <div className="vc-card">
      {verified && (
        <div className="vc-verified-badge">✓ Verified</div>
      )}

      <h2 className="vc-name">{name}</h2>

      <div className="vc-location">
        <span>📍</span>
        <span>{location}</span>
        <a href="#" className="vc-map-link">View on map ›</a>
      </div>

      <div className="vc-meta">
        <div className="vc-rating">
          <span className="vc-star">★</span>
          <span className="vc-rating-value">{rating}</span>
          <span className="vc-reviews">({reviewCount} reviews)</span>
        </div>
        <div className="vc-price">
          ₹{pricePerHour.toLocaleString()}
          <span className="vc-price-unit">/hour</span>
        </div>
      </div>

      <div className="vc-divider" />

      <div className="vc-section-title">Facilities</div>
      <div className="vc-tags-row">
        {facilities.map((f) => (
          <span key={f} className="vc-tag vc-tag-green">
            {facilityIcons[f] ?? "•"} {f}
          </span>
        ))}
      </div>

      <div className="vc-section-title">Sports</div>
      <div className="vc-tags-row">
        {sports.map((s) => (
          <span key={s} className="vc-tag vc-tag-outline">
            {sportIcons[s] ?? "🎯"} {s}
          </span>
        ))}
      </div>

      <div className="vc-divider" />

      <div className="vc-photos-header">
        <div className="vc-photos-label">🖼 Uploaded Photos</div>
        <div className="vc-photos-count">{photoCount} Images Provided</div>
      </div>
      <div className="vc-photos-grid">
        {Array.from({ length: photoCount }).map((_, i) => (
          <div key={i} className={`vc-photo-cell ${photoBgs[i % photoBgs.length]}`} />
        ))}
      </div>
    </div>
  );
}