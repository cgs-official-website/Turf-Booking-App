import React from 'react';
import '../assets/styles/VendorDetail.css';

export default function VendorDetail({ vendor, onBack }) {
  const vendorData = {
    id: vendor?.id || 1,
    name: 'Karthikeyan',
    vendorId: 'VND-1001',
    description: 'Multi-turf Facility Management & Booking Partner',
    logo: 'https://images.unsplash.com/photo-1516399653135-68efc5e5cf13?w=100&h=100&fit=crop',
    totalTurfs: '03',
    newTurfs: '+2 New',
    activeBookings: '15',
    subscription: 'Active',
    email: 'contact@sporthub.ventures',
    phone: '+91 98765 43210',
    registrationDate: '12 Oct 2023',
    turfs: [
      {
        id: 1,
        name: 'Green Valley Arena',
        location: 'Indranagar',
        hourlyRate: '₹1,200',
        status: 'Approved',
      },
      {
        id: 2,
        name: 'Skyline Multisport',
        location: 'Whitefield',
        hourlyRate: '₹1,500',
        status: 'Pending',
      },
    ],
    recentBookings: [
      {
        date: 'Oct 24',
        name: 'Rahul Sharma',
        time: '05:00 PM - 06:00 PM',
        amount: '₹1,200',
        status: 'PAID',
      },
      {
        date: 'Oct 24',
        name: 'Prestige FC',
        time: '08:00 PM - 10:00 PM',
        amount: '₹2,400',
        status: 'PAID',
      },
      {
        date: 'Oct 24',
        name: 'Rahul Sharma',
        time: '05:00 PM - 06:00 PM',
        amount: '₹1,200',
        status: 'PAID',
      },
    ],
    subscriptionHistory: [
      {
        plan: 'Premium Enterprise Plan',
        renewedDate: 'Oct 01, 2023',
        nextBillingDate: 'Nov 01, 2023',
        status: 'ACTIVE',
      },
      {
        plan: 'Growth Plan',
        duration: 'Sep 01, 2023 - Sep 30, 2023',
        status: 'EXPIRED',
      },
    ],
  };

  return (
    <div className="vendor-detail-container">
      {/* Back Navigation */}
      <div className="back-navigation">
        <button className="back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            <path d="M19 12H5M12 19l-7-7 7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
          </svg>
          <span>Vendor Management</span>
          <span className="breadcrumb-separator">/</span>
          <span className="vendor-name-breadcrumb">{vendorData.name}</span>
        </button>
      </div>

      {/* Vendor Header */}
      <div className="vendor-header">
        <div className="vendor-header-left">
          <img src={vendorData.logo} alt={vendorData.name} className="vendor-logo" />
          <div className="vendor-header-info">
            <h1 className="vendor-header-name">{vendorData.name}</h1>
            <div className="vendor-meta">
              <span className="vendor-id-badge">{vendorData.vendorId}</span>
              <p className="vendor-description">{vendorData.description}</p>
            </div>
          </div>
        </div>
        <button className="suspend-btn">Suspend account</button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🏟️</div>
          <div className="stat-content">
            <div className="stat-label">TOTAL TURFS</div>
            <div className="stat-value">{vendorData.totalTurfs}</div>
            <div className="stat-badge">{vendorData.newTurfs}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-label">ACTIVE BOOKINGS</div>
            <div className="stat-value">{vendorData.activeBookings}</div>
          </div>
        </div>

        <div className="subscription-card active">
          <div className="subscription-icon">⚙️</div>
          <div className="subscription-content">
            <div className="subscription-label">SUBSCRIPTION</div>
            <div className="subscription-value">{vendorData.subscription}</div>
          </div>
        </div>
      </div>

      {/* Information Sections */}
      <div className="info-sections">
        <div className="info-card">
          <h3 className="info-title">
            <span className="info-icon">📋</span> Vendor Information
          </h3>
          <div className="info-content">
            <div className="info-row">
              <span className="info-label">
                <span className="info-row-icon">✉️</span> Email Address
              </span>
              <span className="info-value">{vendorData.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">
                <span className="info-row-icon">📞</span> Phone Number
              </span>
              <span className="info-value">{vendorData.phone}</span>
            </div>
            <div className="info-row">
              <span className="info-label">
                <span className="info-row-icon">📅</span> Registration Date
              </span>
              <span className="info-value">{vendorData.registrationDate}</span>
            </div>
          </div>
        </div>

        <div className="info-card">
          <h3 className="info-title">
            <span className="info-icon">📄</span> Document Information
          </h3>
          <div className="info-content">
            <div className="info-row">
              <span className="info-label">
                <span className="info-row-icon">🏦</span> PAN Card
              </span>
              <span className="preview-link">Preview 👁️</span>
            </div>
            <div className="info-row">
              <span className="info-label">
                <span className="info-row-icon">🪪</span> Aadhar card
              </span>
              <span className="preview-link">Preview 👁️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Turfs Table */}
      <div className="turfs-section">
        <table className="turfs-table">
          <thead>
            <tr>
              <th>TURF NAME</th>
              <th>LOCATION</th>
              <th>HOURLY RATE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {vendorData.turfs.map((turf) => (
              <tr key={turf.id}>
                <td>
                  <div className="turf-name">
                    <span className="turf-icon">🏟️</span>
                    {turf.name}
                  </div>
                </td>
                <td>{turf.location}</td>
                <td>{turf.hourlyRate}</td>
                <td>
                  <span className={`status-badge ${turf.status.toLowerCase()}`}>
                    • {turf.status}
                  </span>
                </td>
                <td>
                  <button className="view-btn">VIEW</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Bookings & Subscription History */}
      <div className="bottom-sections">
        <div className="recent-bookings">
          <h3 className="section-title">
            <span className="section-icon">🕐</span> Recent Bookings
          </h3>
          <div className="bookings-list">
            {vendorData.recentBookings.map((booking, index) => (
              <div key={index} className="booking-item">
                <div className="booking-date">{booking.date}</div>
                <div className="booking-info">
                  <div className="booking-name">{booking.name}</div>
                  <div className="booking-time">{booking.time}</div>
                </div>
                <div className="booking-amount">{booking.amount}</div>
                <span className="booking-status">{booking.status}</span>
              </div>
            ))}
          </div>
          <button className="view-all-btn">View all bookings</button>
        </div>

        <div className="subscription-history">
          <h3 className="section-title">
            <span className="section-icon">⭐</span> Subscription History
          </h3>
          <div className="subscriptions-list">
            {vendorData.subscriptionHistory.map((sub, index) => (
              <div
                key={index}
                className={`subscription-item ${sub.status.toLowerCase()}`}
              >
                <div className="sub-plan">{sub.plan}</div>
                {sub.status === 'ACTIVE' ? (
                  <>
                    <div className="sub-date">Renewed on {sub.renewedDate}</div>
                    <div className="sub-date">Next Billing: {sub.nextBillingDate}</div>
                  </>
                ) : (
                  <div className="sub-date">{sub.duration}</div>
                )}
                <span className={`sub-status-badge ${sub.status.toLowerCase()}`}>
                  {sub.status}
                </span>
              </div>
            ))}
          </div>
          <button className="scroll-previous-btn">Scroll previous Plans</button>
        </div>
      </div>
    </div>
  );
}