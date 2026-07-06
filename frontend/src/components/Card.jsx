import React from 'react';
import '../assets/styles/Card.css';

export default function Card({ vendor, onClick }) {
  const handleButtonClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(vendor);
    }
  };

  // Determine subscription badge
  const getSubscriptionBadge = () => {
    if (vendor.subscriptionStatus === 'active' || vendor.subscriptionStatus === 'trial') {
      if (vendor.daysLeft !== null && vendor.daysLeft !== undefined) {
        return (
          <span className="subscription-badge subscription-badge--active">
            End in {vendor.daysLeft} days
          </span>
        );
      }
      return (
        <span className="subscription-badge subscription-badge--active">
          Active
        </span>
      );
    }
    return (
      <span className="subscription-badge subscription-badge--expired">
        Expired
      </span>
    );
  };

  return (
    <div className="vendor-card" onClick={handleButtonClick}>
      <div className="vendor-image-wrapper">
        <img src={vendor.image || vendor.bannerImage} alt={vendor.name} className="vendor-image" />
        {vendor.logoImage && (
          <img src={vendor.logoImage} alt="logo" className="vendor-logo-overlay" />
        )}
      </div>
      <div className="vendor-content">
        <div className="vendor-id-row">
          <span className="vendor-id">{vendor.vendorId}</span>
        </div>
        <div className="vendor-name-row">
          <h3 className="vendor-name">{vendor.name}</h3>
          {getSubscriptionBadge()}
        </div>
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