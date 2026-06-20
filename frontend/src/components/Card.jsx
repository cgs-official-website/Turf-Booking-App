import React from 'react';
import '../assets/styles/Card.css';

export default function Card({ vendor, onClick }) {
  const handleButtonClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(vendor);
    }
  };
 
  return (
    <div className="vendor-card" onClick={handleButtonClick}>
      <img src={vendor.image} alt={vendor.name} className="vendor-image" />
      <div className="vendor-content">
        <div className="vendor-id">{vendor.vendorId}</div>
        <h3 className="vendor-name">{vendor.name}</h3>
        <div className="vendor-email">
          <span className="email-icon">✉</span>
          <span>{vendor.email}</span>
        </div>
        <button className="view-details-btn" onClick={handleButtonClick}>
          View details
        </button>
      </div>
    </div>
  );
}
 