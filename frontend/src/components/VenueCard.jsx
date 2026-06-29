import { useState } from "react";
import {
  MdLocalParking,
  MdSportsSoccer,
  MdSportsCricket,
  MdSportsTennis,
  MdSportsBasketball,
  MdSports,
  MdChair
} from "react-icons/md";
import { GiShuttlecock, GiCctvCamera } from "react-icons/gi";
import { FaSwimmer, FaVolleyballBall, FaTableTennis, FaRestroom, FaFirstAid, FaRegLightbulb } from "react-icons/fa";
import { FaGlassWater } from "react-icons/fa6";
import { PiLockersFill } from "react-icons/pi";
import '../assets/styles/VenueCard.css';

const FACILITY_ICON = {
  Parking:         MdLocalParking,
  parking:         MdLocalParking,
  Water:           FaGlassWater,
  water:           FaGlassWater,
  "Drinking Water": FaGlassWater,
  "drinking water": FaGlassWater,
  Floodlights:     FaRegLightbulb,
  floodlights:     FaRegLightbulb,
  "CCTV Security": GiCctvCamera,
  CCTV:            GiCctvCamera,
  cctv:            GiCctvCamera,
  "cctv camera":   GiCctvCamera,
  Restroom:        FaRestroom,
  restroom:        FaRestroom,
  Washroom:        FaRestroom,
  washroom:        FaRestroom,
  "First Aid":     FaFirstAid,
  "first aid":     FaFirstAid,
  Lockers:         PiLockersFill,
  lockers:         PiLockersFill,
  locker:          PiLockersFill,
  "Locker Room":   PiLockersFill,
  "locker room":   PiLockersFill,
  Seating:         MdChair,
  seating:         MdChair,
};
const SPORT_ICON = {
  football:      MdSportsSoccer,
  cricket:       MdSportsCricket,
  badminton:     GiShuttlecock,
  basketball:    MdSportsBasketball,
  tennis:        MdSportsTennis,
  swimming:      FaSwimmer,
  volleyball:    FaVolleyballBall,
  "table tennis": FaTableTennis,
  "table-tennis": FaTableTennis,
  "multi-sport": MdSports,
};

export default function VenueCard({
  name = "Qube Sportz Arena",
  location = "Perundurai TamilNadu India",
  rating = 4.8,
  reviewCount = 234,
  pricePerHour = 1200,
  facilities = [],
  sports = [],
  photoCount = 4,
  verified = true,
  photos = [],
}) {

  return (
    <div className="vc-card">
      {verified && (
        <div className="vc-verified-badge">✓ Verified</div>
      )}

      <h2 className="vc-name">{name}</h2>

      <div className="vc-location">
        <span>📍</span>
        <span>{location}</span>
        <a 
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${location}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="vc-map-link"
        >
          View on map ›
        </a>
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
        {facilities.map((f) => {
          const Icon = FACILITY_ICON[f] || FACILITY_ICON[f.toLowerCase()] || MdChair;
          return (
            <span key={f} className="vc-tag vc-tag-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icon size={14} /> {f}
            </span>
          );
        })}
      </div>

      <div className="vc-section-title">Sports</div>
      <div className="vc-tags-row">
        {sports.map((s, idx) => {
          const Icon = SPORT_ICON[s] || SPORT_ICON[s.toLowerCase()] || MdSports;
          return (
            <span key={`${s}-${idx}`} className="vc-tag vc-tag-outline" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icon size={14} /> {s}
            </span>
          );
        })}
      </div>

      <div className="vc-divider" />
      <div className="vc-photos-header">
        <div className="vc-photos-label">🖼 Uploaded Photos</div>
        <div className="vc-photos-count">{(photos || []).length} Images Provided</div>
      </div>
      <div className="vc-photos-grid">
        {Array.from({ length: 4 }).map((_, i) => {
          const photoArray = photos || [];
          return (
            <div key={i} className={`vc-photo-cell ${!photoArray[i] ? `vc-bg${(i % 4) + 1}` : ''}`}>
              {photoArray[i] ? (
                <img src={photoArray[i]} alt={`Venue photo ${i+1}`} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                  <span style={{ fontSize: '24px' }}>📷</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}