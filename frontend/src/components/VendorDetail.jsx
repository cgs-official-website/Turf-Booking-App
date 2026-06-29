import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import '../assets/styles/VendorDetail.css';
import VenueCard from '../components/VenueCard';
import SuspendModal from '../context/SuspendModal';
import { suspendVendor, getVendorSubscriptionHistory, getVendorBookingsStats, getVendorRecentBookings } from '../services/vendors.service';

// React Icons
import {
  MdArrowBack,
  MdEmail,
  MdPhone,
  MdCalendarToday,
  MdBadge,
  MdAccountBalance,
  MdStar,
  MdRemoveRedEye,
  MdSportsSoccer,
} from 'react-icons/md';

// Document preview popup images (placeholder)
const DOC_IMAGES = {
  pan: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=600&h=400&fit=crop',
  aadhar: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=600&h=400&fit=crop',
};

export default function VendorDetail({ vendor, onBack, onVendorSuspended }) {
  const navigate = useNavigate();
  const [vendorData, setVendorData] = useState(null);
  const [vendorStats, setVendorStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0
  });
  const [subscriptionHistory, setSubscriptionHistory] = useState([]);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentBookingsLoading, setRecentBookingsLoading] = useState(true);
  const [selectedTurf, setSelectedTurf] = useState(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [suspendLoading, setSuspendLoading] = useState(false);
  const [suspendError, setSuspendError] = useState(null);

  // Freeze background scrolling when any popup is open
  useEffect(() => {
    if (selectedTurf || previewDoc || showSuspendModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedTurf, previewDoc, showSuspendModal]);

  // Transform vendor prop data into the format needed for display
  useEffect(() => {
    if (vendor) {
      console.log("Vendor Detail Received:", vendor);
      console.log("Mongo ID:", vendor._id);
      console.log("Table ID:", vendor.id);
    }

    if (vendor && vendor._id) {
      getVendorBookingsStats(vendor._id)
        .then(res => {
          if (res && res.data) {
            setVendorStats(res.data);
          }
        })
        .catch(err => console.error("Error fetching vendor stats", err));
    }

    if (vendor) {
      console.log("🔍 Vendor Data Received:", vendor);

      try {
        // Transform turfs data
        const transformedTurfs = (vendor.turfs || []).map((turf, index) => {
          console.log("Turf data:", turf);
          return {
            id: index + 1,
            name: turf.turfName || turf.name || 'Unknown Turf',
            location: turf.location || 'Unknown Location',
            hourlyRate: `₹${(turf.pricePerHour || turf.price || 0).toLocaleString('en-IN')}`,
            status: turf.approvalStatus || turf.status || 'Pending',
            image: turf.mainImage || (turf.images && turf.images[0]) || (turf.photos && turf.photos[0]) || 'https://images.unsplash.com/photo-1624880357913-a8539238245b?w=48&h=48&fit=crop',
            venueCardData: {
              name: turf.turfName || turf.name || 'Unnamed Turf',
              location: turf.location || turf.address?.city || turf.city || 'Unknown Location',
              rating: turf.rating || 0,
              reviewCount: turf.reviewCount || turf.totalReviews || 0,
              pricePerHour: turf.pricePerHour?.basePrice || turf.pricePerHour || turf.price || 0,
              facilities: turf.facilities || turf.amenities || [],
              sports: turf.sports || turf.sportTypes || (turf.sportType ? [turf.sportType] : []),
              photos: turf.secondaryImages || turf.images || turf.photos || [turf.mainImage].filter(Boolean) || [],
              verified: (turf.approvalStatus || turf.status || '').toLowerCase() === 'approved',
            },
          };
        });

        // Get current date formatted with fallback
        let registrationDate = 'Not Available';
        try {
          const dateObj = vendor.createdAt ? new Date(vendor.createdAt) : new Date();
          registrationDate = dateObj.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        } catch (e) {
          console.error("Date parsing error:", e);
        }

        // Determine subscription status
        let isSubscriptionActive = false;
        let subscriptionPlan = 'Unknown Plan';
        let subscriptionDaysRemaining = 0;
        let subscriptionEndDate = 'N/A';
        let subscriptionAmountPaid = 0;
        let subscription = 'Inactive';

        // Check if vendor has subscription data
        if (vendor.subscription) {
          const sub = vendor.subscription;
          isSubscriptionActive = sub.status === 'active' || sub.status === 'Active';
          subscriptionPlan = sub.plan?.name || sub.planName || 'Unknown Plan';
          subscriptionDaysRemaining = sub.daysRemaining || 0;
          subscriptionAmountPaid = sub.amountPaid || 0;
          
          if (sub.endDate) {
            try {
              const endDateObj = new Date(sub.endDate);
              subscriptionEndDate = endDateObj.toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
            } catch (e) {
              subscriptionEndDate = 'N/A';
            }
          }
          
          subscription = isSubscriptionActive ? 'Active' : 'Expired';
        } else if (vendor.subscriptionStatus) {
          // Fallback if subscription is stored differently
          isSubscriptionActive = vendor.subscriptionStatus === 'active' || vendor.subscriptionStatus === 'Active';
          subscription = isSubscriptionActive ? 'Active' : 'Expired';
          subscriptionPlan = vendor.subscriptionPlan || 'Unknown Plan';  // ← FIXED
          subscriptionDaysRemaining = vendor.subscriptionDaysRemaining || 0;
          subscriptionAmountPaid = vendor.subscriptionAmountPaid || 0;
          subscriptionEndDate = vendor.subscriptionEndDate || 'N/A';
        }

        const newData = {
          id: vendor.id || 1,
          name: vendor.name || vendor.vendorName || 'Unknown Vendor',
          vendorId: vendor.vendorId || 'VND-0000',
          description: 'Multi-turf Facility Management & Booking Partner',
          logo: vendor.profileImage || vendor.logoImage || vendor.logo || vendor.image || 'https://images.unsplash.com/photo-1516399653135-68efc5e5cf13?w=100&h=100&fit=crop',
          totalTurfs: transformedTurfs.length.toString(), 
          newTurfs: '+0 New',
          subscription: subscription,
          email: vendor.email || 'Not Available',
          phone: vendor.phone || 'Not Available',
          location: vendor.location || 'Not Available',
          registrationDate: registrationDate,
          turfs: transformedTurfs,
          _id: vendor._id || vendor.id,
          isSubscriptionActive: isSubscriptionActive,
          subscriptionPlan: subscriptionPlan,
          subscriptionDaysRemaining: subscriptionDaysRemaining,
          subscriptionEndDate: subscriptionEndDate,
          subscriptionAmountPaid: subscriptionAmountPaid,
        };

        console.log("✅ Transformed Vendor Data:", newData);
        setVendorData(newData);
      } catch (error) {
        console.error("❌ Error transforming vendor data:", error);
        setVendorData(null);
      }
    }
  }, [vendor]);

  // Fetch subscription history from backend
  useEffect(() => {
    const fetchSubscriptionHistory = async () => {
      if (!vendor || !vendor._id) {
        console.log("⚠️ No vendor ID for subscription history fetch");
        setSubscriptionHistory([]);
        setSubscriptionLoading(false);
        return;
      }

      setSubscriptionLoading(true);
      setSubscriptionError(null);

      try {
        console.log("📡 Fetching subscription history for vendor:", vendor._id);
        const response = await getVendorSubscriptionHistory(vendor._id);

        console.log("📦 Subscription history response:", response);

        // Transform subscription data from backend format
        const transformedSubscriptions = response.data.map((subscription) => {
          const plan = subscription.plan || {};

          // Format dates
          const startDate = new Date(subscription.startDate);
          const endDate = new Date(subscription.endDate);

          const startDateFormatted = startDate.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

          const endDateFormatted = endDate.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });

          console.log("📋 Processing subscription:", {
            planName: plan.name,
            status: subscription.status,
            startDate: startDateFormatted,
            endDate: endDateFormatted,
          });

          return {
            _id: subscription._id,
            plan: plan.name || 'Unknown Plan',
            status: subscription.status || 'unknown',
            startDate: startDateFormatted,
            endDate: endDateFormatted,
            duration: `${startDateFormatted} - ${endDateFormatted}`,
            renewedDate: startDateFormatted,
            nextBillingDate: endDateFormatted,
            amountPaid: subscription.amountPaid || 0,
            paymentStatus: subscription.paymentStatus || 'pending',
            isTrial: subscription.isTrial || false,
          };
        });

        console.log("✅ Transformed subscriptions:", transformedSubscriptions);
        setSubscriptionHistory(transformedSubscriptions);
      } catch (err) {
        console.error("❌ Failed to fetch subscription history:", err);
        setSubscriptionError("Failed to load subscription history");
        setSubscriptionHistory([]);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchSubscriptionHistory();
  }, [vendor]);

  // Fetch recent bookings from backend
  useEffect(() => {
    const fetchRecentBookings = async () => {
      if (!vendor || !vendor._id) {
        setRecentBookings([]);
        setRecentBookingsLoading(false);
        return;
      }
      setRecentBookingsLoading(true);
      try {
        const response = await getVendorRecentBookings(vendor._id);
        if (response && response.data) {
          setRecentBookings(response.data);
        } else {
          setRecentBookings([]);
        }
      } catch (err) {
        console.error("Failed to fetch recent bookings:", err);
        setRecentBookings([]);
      } finally {
        setRecentBookingsLoading(false);
      }
    };
    fetchRecentBookings();
  }, [vendor]);

  const handleSuspendConfirm = async () => {
    setSuspendLoading(true);
    setSuspendError(null);

    console.log("Suspending Vendor:", vendor);
    console.log("Vendor Mongo ID:", vendor._id);

    try {
      await suspendVendor(vendor._id);
      toast.success("Vendor suspended successfully");
      if (onVendorSuspended) {
        onVendorSuspended(vendor._id);
      }
      navigate("/admin/vendors");
    } catch (err) {
      console.error("Failed to suspend vendor:", err);
      const errMsg = err.response?.data?.message || "Failed to suspend vendor";
      setSuspendError(errMsg);
      toast.error(errMsg);
    } finally {
      setSuspendLoading(false);
      setShowSuspendModal(false);
    }
  };

  if (!vendor) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>❌ No vendor data received</p>
        <button onClick={onBack} style={{ padding: '10px 20px', marginTop: '10px' }}>
          Go Back
        </button>
      </div>
    );
  }

  if (!vendorData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading vendor details...</p>
        <p style={{ fontSize: '12px', color: '#666' }}>
          Vendor: {vendor.name || 'Unknown'}
        </p>
      </div>
    );
  }

  return (
    <div className="vendor-detail-container">

      {/* ── Turf VenueCard Popup ── */}
      {selectedTurf && (
        <div className="vd-popup-backdrop" onClick={() => setSelectedTurf(null)}>
          <div className="vd-popup-box" onClick={(e) => e.stopPropagation()}>
            <button className="vd-popup-close" onClick={() => setSelectedTurf(null)}>✕</button>
            <VenueCard {...selectedTurf.venueCardData} />
          </div>
        </div>
      )}

      {/* ── Document Preview Popup ── */}
      {previewDoc && (
        <div className="vd-popup-backdrop" onClick={() => setPreviewDoc(null)}>
          <div className="vd-doc-popup" onClick={(e) => e.stopPropagation()}>
            <div className="vd-doc-popup-header">
              <span>{previewDoc.title}</span>
              <button className="vd-popup-close" onClick={() => setPreviewDoc(null)}>✕</button>
            </div>
            <img src={previewDoc.src} alt={previewDoc.title} className="vd-doc-img" />
          </div>
        </div>
      )}

      {/* ── Suspend Modal ── */}
      <SuspendModal
        isOpen={showSuspendModal}
        onClose={() => setShowSuspendModal(false)}
        onConfirm={handleSuspendConfirm}
        title="Confirm suspend account?"
        message={`Are you sure? Do you want to suspend ${vendorData.name}'s account?`}
        loading={suspendLoading}
        error={suspendError}
      />

      {/* Back Navigation */}
      <div className="back-navigation">
        <button className="back-btn" onClick={onBack}>
          <MdArrowBack size={20} />
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
        <button
          className="suspend-btn"
          onClick={() => setShowSuspendModal(true)}
          disabled={suspendLoading}
        >
          <span className="suspend-icon">⋯</span>
          <span className="suspend-text">{suspendLoading ? 'Suspending...' : 'Suspend account'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-circle green">
            <MdSportsSoccer size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">TOTAL TURFS</div>
            <div className="stat-value">{vendorData.totalTurfs}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-circle green">
            <MdCalendarToday size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">ACTIVE BOOKINGS</div>
            <div className="stat-value">{vendorStats.activeBookings ?? 0}</div>
          </div>
        </div>
        {/* Subscription - Dynamic based on status */}
        <div className={`subscription-card ${vendorData.isSubscriptionActive ? 'active' : 'expired'}`}>
          <div className="stat-icon-circle white">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <foreignObject x="-12" y="-12" width="64" height="64">
        <div xmlns="http://www.w3.org/1999/xhtml" style={{ backdropFilter: 'blur(6px)', clipPath: 'url(#bgblur_0_2815_6569_clip_path)', height: '100%', width: '100%' }} />
      </foreignObject>
      <g data-figma-bg-blur-radius="12">
        <rect width="40" height="40" rx="20" fill="white" fillOpacity="0.2" />
        <path d="M16.6 30.5L14.7 27.3L11.1 26.5L11.45 22.8L9 20L11.45 17.2L11.1 13.5L14.7 12.7L16.6 9.5L20 10.95L23.4 9.5L25.3 12.7L28.9 13.5L28.55 17.2L31 20L28.55 22.8L28.9 26.5L25.3 27.3L23.4 30.5L20 29.05L16.6 30.5ZM18.95 23.55L24.6 17.9L23.2 16.45L18.95 20.7L16.8 18.6L15.4 20L18.95 23.55Z" fill="#22c55e" />
      </g>
      <defs>
        <clipPath id="bgblur_0_2815_6569_clip_path" transform="translate(12 12)">
          <rect width="40" height="40" rx="20" />
        </clipPath>
      </defs>
    </svg>
          </div>
          <div className="subscription-content">
            <div className="subscription-label">SUBSCRIPTION</div>
            <div className="subscription-value">{vendorData.subscription}</div>
            {vendorData.isSubscriptionActive && (
              <>
                {vendorData.subscriptionPlan && vendorData.subscriptionPlan !== 'Unknown Plan' && (
                  <div className="subscription-plan" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', marginTop: '2px' }}>
                    {vendorData.subscriptionPlan}
                  </div>
                )}
                {vendorData.subscriptionDaysRemaining > 0 && (
                  <div className="subscription-days">
                    ● {vendorData.subscriptionDaysRemaining} days remaining
                  </div>
                )}
                {vendorData.subscriptionEndDate && vendorData.subscriptionEndDate !== 'N/A' && (
                  <div className="subscription-end-date" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', marginTop: '2px' }}>
                    Valid till: {vendorData.subscriptionEndDate}
                  </div>
                )}
                {vendorData.subscriptionAmountPaid > 0 && (
                  <div className="subscription-amount" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', marginTop: '2px' }}>
                    Amount: ₹{vendorData.subscriptionAmountPaid.toLocaleString('en-IN')}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Information Sections */}
      <div className="info-sections">
        {/* Vendor Information */}
        <div className="info-card">
          <h3 className="info-title">
            <span className="info-icon-circle gray"><MdBadge size={18} /></span>
            Vendor Information
          </h3>
          <div className="info-content">
            <div className="info-row">
              <div className="info-row-left">
                <span className="info-row-icon"><MdEmail size={20} /></span>
                <div className="info-stacked">
                  <span className="info-label">Email Address</span>
                  <span className="info-value">{vendorData.email}</span>
                </div>
              </div>
            </div>
            <div className="info-row">
              <div className="info-row-left">
                <span className="info-row-icon"><MdPhone size={20} /></span>
                <div className="info-stacked">
                  <span className="info-label">Phone Number</span>
                  <span className="info-value">{vendorData.phone}</span>
                </div>
              </div>
            </div>
            <div className="info-row last">
              <div className="info-row-left">
                <span className="info-row-icon"><MdCalendarToday size={20} /></span>
                <div className="info-stacked">
                  <span className="info-label">Registration Date</span>
                  <span className="info-value">{vendorData.registrationDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Document Information */}
        <div className="info-card">
          <h3 className="info-title">
            <span className="info-icon-circle gray"><MdAccountBalance size={18} /></span>
            Document information
          </h3>
          <div className="info-content">
            <div className="info-row">
              <div className="info-row-left">
                <span className="info-row-icon"><MdBadge size={20} /></span>
                <span className="info-label-standalone">PAN Card</span>
              </div>
              <button
                className="preview-btn"
                onClick={() => setPreviewDoc({ 
                  title: 'PAN Card', 
                  src: vendor.panCard || vendor.panImage || vendor.kycDocuments?.pan || vendor.documents?.pan || DOC_IMAGES.pan 
                })}
              >
                Preview <MdRemoveRedEye size={16} />
              </button>
            </div>
            <div className="info-row last">
              <div className="info-row-left">
                <span className="info-row-icon"><MdBadge size={20} /></span>
                <span className="info-label-standalone">Aadhar card</span>
              </div>
              <button
                className="preview-btn"
                onClick={() => setPreviewDoc({ 
                  title: 'Aadhar Card', 
                  src: vendor.aadharCard || vendor.aadharImage || vendor.kycDocuments?.aadhar || vendor.documents?.aadhar || DOC_IMAGES.aadhar 
                })}
              >
                Preview <MdRemoveRedEye size={16} />
              </button>
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
            {vendorData.turfs && vendorData.turfs.length > 0 ? (
              vendorData.turfs.map((turf) => (
                <tr key={turf.id}>
                  <td>
                    <div className="turf-name-cell">
                      <img src={turf.image} alt={turf.name} className="turf-thumb" />
                      <span className="turf-name-text">{turf.name}</span>
                    </div>
                  </td>
                  <td>{turf.location}</td>
                  <td>{turf.hourlyRate}</td>
                  <td>
                    <span className={`status-badge ${turf.status.toLowerCase().replace(' ', '-')}`}>
                      • {turf.status}
                    </span>
                  </td>
                  <td>
                    <button className="view-btn" onClick={() => setSelectedTurf(turf)}>
                      VIEW
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  No turfs found for this vendor
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recent Bookings & Subscription History */}
      <div className="bottom-sections">
        <div className="recent-bookings">
          <h3 className="section-title">
            <span className="section-icon-circle"><MdCalendarToday size={16} /></span>
            Recent Bookings
          </h3>
          <div className="bookings-list">
            {recentBookingsLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                Loading recent bookings...
              </div>
            ) : recentBookings && recentBookings.length > 0 ? (
              recentBookings.slice(0, 3).map((booking, index) => {
                const date = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric'
                });
                const time = `${booking.startTime} - ${booking.endTime}`;
                const statusColor =
                  booking.status === 'confirmed' ? 'green' :
                    booking.status === 'pending' ? '#f39c12' :
                      booking.status === 'cancelled' || booking.status === 'rejected' ? 'red' :
                        booking.status === 'completed' ? 'blue' : 'gray';

                return (
                  <div key={booking._id || index} className="booking-item">
                    <div className="booking-date">{date}</div>
                    <div className="booking-info">
                      <div className="booking-name">{booking.userName}</div>
                      <div className="booking-time">{time}</div>
                    </div>
                    <span
                      className="booking-status"
                      style={{
                        backgroundColor: `${statusColor}20`,
                        color: statusColor,
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}
                    >{booking.status}</span>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                No recent bookings found
              </div>
            )}
          </div>
          <button className="view-all-btn" onClick={() => navigate(`/admin/bookings?vendorId=${vendor._id}`)}>View all bookings</button>
        </div>

        {/* Subscription History */}
        <div className="subscription-history">
          <h3 className="section-title">
            <span className="section-icon-circle star"><MdStar size={16} /></span>
            Subscription History
          </h3>

          {subscriptionLoading ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
              Loading subscription history...
            </div>
          ) : subscriptionError ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#d9534f' }}>
              ⚠️ {subscriptionError}
            </div>
          ) : subscriptionHistory.length > 0 ? (
            <div className="subscriptions-scroll">
              {subscriptionHistory.map((sub, index) => (
                <div key={sub._id || index} className={`subscription-item ${sub.status.toLowerCase()}`}>
                  <div className="sub-top-row">
                    <div className="sub-plan">{sub.plan}</div>
                    <span className={`sub-status-badge ${sub.status.toLowerCase()}`}>
                      {sub.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="sub-date">{sub.duration}</div>
                  {sub.amountPaid > 0 && (
                    <div className="sub-date" style={{ fontSize: '12px', color: '#666' }}>
                      Amount: ₹{sub.amountPaid.toLocaleString('en-IN')}
                    </div>
                  )}
                  {sub.isTrial && (
                    <div className="sub-date" style={{ fontSize: '12px', color: '#27ae60' }}>
                      ⭐ Trial Period
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
              No subscription history found
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-hot-toast';
// import '../assets/styles/VendorDetail.css';
// import VenueCard from '../components/VenueCard';
// import SuspendModal from '../context/SuspendModal';
// import { suspendVendor, getVendorSubscriptionHistory, getVendorBookingsStats, getVendorRecentBookings } from '../services/vendors.service';

// // React Icons
// import {
//   MdArrowBack,
//   MdEmail,
//   MdPhone,
//   MdCalendarToday,
//   MdBadge,
//   MdAccountBalance,
//   MdStar,
//   MdRemoveRedEye,
//   MdSportsSoccer,
// } from 'react-icons/md';

// // Document preview popup images (placeholder)
// const DOC_IMAGES = {
//   pan: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=600&h=400&fit=crop',
//   aadhar: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=600&h=400&fit=crop',
// };

// export default function VendorDetail({ vendor, onBack, onVendorSuspended }) {
//   const navigate = useNavigate();
//   const [vendorData, setVendorData] = useState(null);
//   const [vendorStats, setVendorStats] = useState({
//     totalBookings: 0,
//     activeBookings: 0,
//     confirmedBookings: 0,
//     pendingBookings: 0,
//     cancelledBookings: 0
//   });
//   const [subscriptionHistory, setSubscriptionHistory] = useState([]);
//   const [subscriptionLoading, setSubscriptionLoading] = useState(true);
//   const [subscriptionError, setSubscriptionError] = useState(null);
//   const [recentBookings, setRecentBookings] = useState([]);
//   const [recentBookingsLoading, setRecentBookingsLoading] = useState(true);
//   const [selectedTurf, setSelectedTurf] = useState(null);
//   const [showSuspendModal, setShowSuspendModal] = useState(false);
//   const [previewDoc, setPreviewDoc] = useState(null);
//   const [suspendLoading, setSuspendLoading] = useState(false);
//   const [suspendError, setSuspendError] = useState(null);

//   // Freeze background scrolling when any popup is open
//   useEffect(() => {
//     if (selectedTurf || previewDoc || showSuspendModal) {
//       document.body.style.overflow = 'hidden';
//     } else {
//       document.body.style.overflow = 'auto';
//     }
    
//     // Cleanup on unmount
//     return () => {
//       document.body.style.overflow = 'auto';
//     };
//   }, [selectedTurf, previewDoc, showSuspendModal]);

//   // Transform vendor prop data into the format needed for display
//   useEffect(() => {
//     if (vendor) {
//       console.log("Vendor Detail Received:", vendor);
//       console.log("Mongo ID:", vendor._id);
//       console.log("Table ID:", vendor.id);
//     }

//     if (vendor && vendor._id) {
//       getVendorBookingsStats(vendor._id)
//         .then(res => {
//           if (res && res.data) {
//             setVendorStats(res.data);
//           }
//         })
//         .catch(err => console.error("Error fetching vendor stats", err));
//     }

//     if (vendor) {
//       console.log("🔍 Vendor Data Received:", vendor);

//       try {
//         // Transform turfs data
//         const transformedTurfs = (vendor.turfs || []).map((turf, index) => {
//           console.log("Turf data:", turf);
//           return {
//             id: index + 1,
//             name: turf.turfName || turf.name || 'Unknown Turf',
//             location: turf.location || 'Unknown Location',
//             hourlyRate: `₹${(turf.pricePerHour || turf.price || 0).toLocaleString('en-IN')}`,
//             status: turf.approvalStatus || turf.status || 'Pending',
//             image: turf.mainImage || (turf.images && turf.images[0]) || (turf.photos && turf.photos[0]) || 'https://images.unsplash.com/photo-1624880357913-a8539238245b?w=48&h=48&fit=crop',
//             venueCardData: {
//               name: turf.turfName || turf.name || 'Unnamed Turf',
//               location: turf.location || turf.address?.city || turf.city || 'Unknown Location',
//               rating: turf.rating || 0,
//               reviewCount: turf.reviewCount || turf.totalReviews || 0,
//               pricePerHour: turf.pricePerHour?.basePrice || turf.pricePerHour || turf.price || 0,
//               facilities: turf.facilities || turf.amenities || [],
//               sports: turf.sports || turf.sportTypes || (turf.sportType ? [turf.sportType] : []),
//               photos: turf.secondaryImages || turf.images || turf.photos || [turf.mainImage].filter(Boolean) || [],
//               verified: (turf.approvalStatus || turf.status || '').toLowerCase() === 'approved',
//             },
//           };
//         });

//         // Get current date formatted with fallback
//         let registrationDate = 'Not Available';
//         try {
//           const dateObj = vendor.createdAt ? new Date(vendor.createdAt) : new Date();
//           registrationDate = dateObj.toLocaleDateString('en-IN', {
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric',
//           });
//         } catch (e) {
//           console.error("Date parsing error:", e);
//         }

//         // Determine subscription status
//         let isSubscriptionActive = false;
//         let subscriptionPlan = 'Unknown Plan';
//         let subscriptionDaysRemaining = 0;
//         let subscriptionEndDate = 'N/A';
//         let subscriptionAmountPaid = 0;
//         let subscription = 'Inactive';

//         // Check if vendor has subscription data
//         if (vendor.subscription) {
//           const sub = vendor.subscription;
//           isSubscriptionActive = sub.status === 'active' || sub.status === 'Active';
//           subscriptionPlan = sub.plan?.name || sub.planName || 'Unknown Plan';
//           subscriptionDaysRemaining = sub.daysRemaining || 0;
//           subscriptionAmountPaid = sub.amountPaid || 0;
          
//           if (sub.endDate) {
//             try {
//               const endDateObj = new Date(sub.endDate);
//               subscriptionEndDate = endDateObj.toLocaleDateString('en-IN', {
//                 year: 'numeric',
//                 month: 'short',
//                 day: 'numeric',
//               });
//             } catch (e) {
//               subscriptionEndDate = 'N/A';
//             }
//           }
          
//           subscription = isSubscriptionActive ? 'Active' : 'Expired';
//         } else if (vendor.subscriptionStatus) {
//           // Fallback if subscription is stored differently
//           isSubscriptionActive = vendor.subscriptionStatus === 'active' || vendor.subscriptionStatus === 'Active';
//           subscription = isSubscriptionActive ? 'Active' : 'Expired';
//           subscriptionPlan = vendor.subscriptio
//           nPlan || 'Unknown Plan';
//           subscriptionDaysRemaining = vendor.subscriptionDaysRemaining || 0;
//           subscriptionAmountPaid = vendor.subscriptionAmountPaid || 0;
//           subscriptionEndDate = vendor.subscriptionEndDate || 'N/A';
//         }

//         const newData = {
//           id: vendor.id || 1,
//           name: vendor.name || vendor.vendorName || 'Unknown Vendor',
//           vendorId: vendor.vendorId || 'VND-0000',
//           description: 'Multi-turf Facility Management & Booking Partner',
//           logo: vendor.profileImage || vendor.logoImage || vendor.logo || vendor.image || 'https://images.unsplash.com/photo-1516399653135-68efc5e5cf13?w=100&h=100&fit=crop',
//           totalTurfs: transformedTurfs.length.toString(), 
//           newTurfs: '+0 New',
//           subscription: subscription,
//           email: vendor.email || 'Not Available',
//           phone: vendor.phone || 'Not Available',
//           location: vendor.location || 'Not Available',
//           registrationDate: registrationDate,
//           turfs: transformedTurfs,
//           _id: vendor._id || vendor.id,
//           isSubscriptionActive: isSubscriptionActive,
//           subscriptionPlan: subscriptionPlan,
//           subscriptionDaysRemaining: subscriptionDaysRemaining,
//           subscriptionEndDate: subscriptionEndDate,
//           subscriptionAmountPaid: subscriptionAmountPaid,
//         };

//         console.log("✅ Transformed Vendor Data:", newData);
//         setVendorData(newData);
//       } catch (error) {
//         console.error("❌ Error transforming vendor data:", error);
//         setVendorData(null);
//       }
//     }
//   }, [vendor]);

//   // Fetch subscription history from backend
//   useEffect(() => {
//     const fetchSubscriptionHistory = async () => {
//       if (!vendor || !vendor._id) {
//         console.log("⚠️ No vendor ID for subscription history fetch");
//         setSubscriptionHistory([]);
//         setSubscriptionLoading(false);
//         return;
//       }

//       setSubscriptionLoading(true);
//       setSubscriptionError(null);

//       try {
//         console.log("📡 Fetching subscription history for vendor:", vendor._id);
//         const response = await getVendorSubscriptionHistory(vendor._id);

//         console.log("📦 Subscription history response:", response);

//         // Transform subscription data from backend format
//         const transformedSubscriptions = response.data.map((subscription) => {
//           const plan = subscription.plan || {};

//           // Format dates
//           const startDate = new Date(subscription.startDate);
//           const endDate = new Date(subscription.endDate);

//           const startDateFormatted = startDate.toLocaleDateString('en-IN', {
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric',
//           });

//           const endDateFormatted = endDate.toLocaleDateString('en-IN', {
//             year: 'numeric',
//             month: 'short',
//             day: 'numeric',
//           });

//           console.log("📋 Processing subscription:", {
//             planName: plan.name,
//             status: subscription.status,
//             startDate: startDateFormatted,
//             endDate: endDateFormatted,
//           });

//           return {
//             _id: subscription._id,
//             plan: plan.name || 'Unknown Plan',
//             status: subscription.status || 'unknown',
//             startDate: startDateFormatted,
//             endDate: endDateFormatted,
//             duration: `${startDateFormatted} - ${endDateFormatted}`,
//             renewedDate: startDateFormatted,
//             nextBillingDate: endDateFormatted,
//             amountPaid: subscription.amountPaid || 0,
//             paymentStatus: subscription.paymentStatus || 'pending',
//             isTrial: subscription.isTrial || false,
//           };
//         });

//         console.log("✅ Transformed subscriptions:", transformedSubscriptions);
//         setSubscriptionHistory(transformedSubscriptions);
//       } catch (err) {
//         console.error("❌ Failed to fetch subscription history:", err);
//         setSubscriptionError("Failed to load subscription history");
//         setSubscriptionHistory([]);
//       } finally {
//         setSubscriptionLoading(false);
//       }
//     };

//     fetchSubscriptionHistory();
//   }, [vendor]);

//   // Fetch recent bookings from backend
//   useEffect(() => {
//     const fetchRecentBookings = async () => {
//       if (!vendor || !vendor._id) {
//         setRecentBookings([]);
//         setRecentBookingsLoading(false);
//         return;
//       }
//       setRecentBookingsLoading(true);
//       try {
//         const response = await getVendorRecentBookings(vendor._id);
//         if (response && response.data) {
//           setRecentBookings(response.data);
//         } else {
//           setRecentBookings([]);
//         }
//       } catch (err) {
//         console.error("Failed to fetch recent bookings:", err);
//         setRecentBookings([]);
//       } finally {
//         setRecentBookingsLoading(false);
//       }
//     };
//     fetchRecentBookings();
//   }, [vendor]);

//   const handleSuspendConfirm = async () => {
//     setSuspendLoading(true);
//     setSuspendError(null);

//     console.log("Suspending Vendor:", vendor);
//     console.log("Vendor Mongo ID:", vendor._id);

//     try {
//       await suspendVendor(vendor._id);
//       toast.success("Vendor suspended successfully");
//       if (onVendorSuspended) {
//         onVendorSuspended(vendor._id);
//       }
//       navigate("/admin/vendors");
//     } catch (err) {
//       console.error("Failed to suspend vendor:", err);
//       const errMsg = err.response?.data?.message || "Failed to suspend vendor";
//       setSuspendError(errMsg);
//       toast.error(errMsg);
//     } finally {
//       setSuspendLoading(false);
//       setShowSuspendModal(false);
//     }
//   };

//   if (!vendor) {
//     return (
//       <div style={{ padding: '20px', textAlign: 'center' }}>
//         <p>❌ No vendor data received</p>
//         <button onClick={onBack} style={{ padding: '10px 20px', marginTop: '10px' }}>
//           Go Back
//         </button>
//       </div>
//     );
//   }

//   if (!vendorData) {
//     return (
//       <div style={{ padding: '20px', textAlign: 'center' }}>
//         <p>Loading vendor details...</p>
//         <p style={{ fontSize: '12px', color: '#666' }}>
//           Vendor: {vendor.name || 'Unknown'}
//         </p>
//       </div>
//     );
//   }

//   return (
//     <div className="vendor-detail-container">

//       {/* ── Turf VenueCard Popup ── */}
//       {selectedTurf && (
//         <div className="vd-popup-backdrop" onClick={() => setSelectedTurf(null)}>
//           <div className="vd-popup-box" onClick={(e) => e.stopPropagation()}>
//             <button className="vd-popup-close" onClick={() => setSelectedTurf(null)}>✕</button>
//             <VenueCard {...selectedTurf.venueCardData} />
//           </div>
//         </div>
//       )}

//       {/* ── Document Preview Popup ── */}
//       {previewDoc && (
//         <div className="vd-popup-backdrop" onClick={() => setPreviewDoc(null)}>
//           <div className="vd-doc-popup" onClick={(e) => e.stopPropagation()}>
//             <div className="vd-doc-popup-header">
//               <span>{previewDoc.title}</span>
//               <button className="vd-popup-close" onClick={() => setPreviewDoc(null)}>✕</button>
//             </div>
//             <img src={previewDoc.src} alt={previewDoc.title} className="vd-doc-img" />
//           </div>
//         </div>
//       )}

//       {/* ── Suspend Modal ── */}
//       <SuspendModal
//         isOpen={showSuspendModal}
//         onClose={() => setShowSuspendModal(false)}
//         onConfirm={handleSuspendConfirm}
//         title="Confirm suspend account?"
//         message={`Are you sure? Do you want to suspend ${vendorData.name}'s account?`}
//         loading={suspendLoading}
//         error={suspendError}
//       />

//       {/* Back Navigation */}
//       <div className="back-navigation">
//         <button className="back-btn" onClick={onBack}>
//           <MdArrowBack size={20} />
//           <span>Vendor Management</span>
//           <span className="breadcrumb-separator">/</span>
//           <span className="vendor-name-breadcrumb">{vendorData.name}</span>
//         </button>
//       </div>

//       {/* Vendor Header */}
//       <div className="vendor-header">
//         <div className="vendor-header-left">
//           <img src={vendorData.logo} alt={vendorData.name} className="vendor-logo" />
//           <div className="vendor-header-info">
//             <h1 className="vendor-header-name">{vendorData.name}</h1>
//             <div className="vendor-meta">
//               <span className="vendor-id-badge">{vendorData.vendorId}</span>
//               <p className="vendor-description">{vendorData.description}</p>
//             </div>
//           </div>
//         </div>
//         <button
//           className="suspend-btn"
//           onClick={() => setShowSuspendModal(true)}
//           disabled={suspendLoading}
//         >
//           <span className="suspend-icon">⋯</span>
//           <span className="suspend-text">{suspendLoading ? 'Suspending...' : 'Suspend account'}</span>
//         </button>
//       </div>

//       {/* Stats Cards */}
//       <div className="stats-grid">
//         <div className="stat-card">
//           <div className="stat-icon-circle green">
//             <MdSportsSoccer size={20} />
//           </div>
//           <div className="stat-content">
//             <div className="stat-label">TOTAL TURFS</div>
//             <div className="stat-value">{vendorData.totalTurfs}</div>
//           </div>
//         </div>
//         <div className="stat-card">
//           <div className="stat-icon-circle green">
//             <MdCalendarToday size={20} />
//           </div>
//           <div className="stat-content">
//             <div className="stat-label">ACTIVE BOOKINGS</div>
//             <div className="stat-value">{vendorStats.activeBookings ?? 0}</div>
//           </div>
//         </div>
//         {/* Subscription - Dynamic based on status */}
//         <div className={`subscription-card ${vendorData.isSubscriptionActive ? 'active' : 'expired'}`}>
//           <div className="stat-icon-circle white">
//             <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
//       <foreignObject x="-12" y="-12" width="64" height="64">
//         <div xmlns="http://www.w3.org/1999/xhtml" style={{ backdropFilter: 'blur(6px)', clipPath: 'url(#bgblur_0_2815_6569_clip_path)', height: '100%', width: '100%' }} />
//       </foreignObject>
//       <g data-figma-bg-blur-radius="12">
//         <rect width="40" height="40" rx="20" fill="white" fillOpacity="0.2" />
//         <path d="M16.6 30.5L14.7 27.3L11.1 26.5L11.45 22.8L9 20L11.45 17.2L11.1 13.5L14.7 12.7L16.6 9.5L20 10.95L23.4 9.5L25.3 12.7L28.9 13.5L28.55 17.2L31 20L28.55 22.8L28.9 26.5L25.3 27.3L23.4 30.5L20 29.05L16.6 30.5ZM18.95 23.55L24.6 17.9L23.2 16.45L18.95 20.7L16.8 18.6L15.4 20L18.95 23.55Z" fill="#22c55e" />
//       </g>
//       <defs>
//         <clipPath id="bgblur_0_2815_6569_clip_path" transform="translate(12 12)">
//           <rect width="40" height="40" rx="20" />
//         </clipPath>
//       </defs>
//     </svg>
//           </div>
//           <div className="subscription-content">
//             <div className="subscription-label">SUBSCRIPTION</div>
//             <div className="subscription-value">{vendorData.subscription}</div>
//             {vendorData.isSubscriptionActive && (
//               <>
//                 {vendorData.subscriptionPlan && vendorData.subscriptionPlan !== 'Unknown Plan' && (
//                   <div className="subscription-plan" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', marginTop: '2px' }}>
//                     {vendorData.subscriptionPlan}
//                   </div>
//                 )}
//                 {vendorData.subscriptionDaysRemaining > 0 && (
//                   <div className="subscription-days">
//                     ● {vendorData.subscriptionDaysRemaining} days remaining
//                   </div>
//                 )}
//                 {vendorData.subscriptionEndDate && vendorData.subscriptionEndDate !== 'N/A' && (
//                   <div className="subscription-end-date" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', marginTop: '2px' }}>
//                     Valid till: {vendorData.subscriptionEndDate}
//                   </div>
//                 )}
//                 {vendorData.subscriptionAmountPaid > 0 && (
//                   <div className="subscription-amount" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', marginTop: '2px' }}>
//                     Amount: ₹{vendorData.subscriptionAmountPaid.toLocaleString('en-IN')}
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Information Sections */}
//       <div className="info-sections">
//         {/* Vendor Information */}
//         <div className="info-card">
//           <h3 className="info-title">
//             <span className="info-icon-circle gray"><MdBadge size={18} /></span>
//             Vendor Information
//           </h3>
//           <div className="info-content">
//             <div className="info-row">
//               <div className="info-row-left">
//                 <span className="info-row-icon"><MdEmail size={20} /></span>
//                 <div className="info-stacked">
//                   <span className="info-label">Email Address</span>
//                   <span className="info-value">{vendorData.email}</span>
//                 </div>
//               </div>
//             </div>
//             <div className="info-row">
//               <div className="info-row-left">
//                 <span className="info-row-icon"><MdPhone size={20} /></span>
//                 <div className="info-stacked">
//                   <span className="info-label">Phone Number</span>
//                   <span className="info-value">{vendorData.phone}</span>
//                 </div>
//               </div>
//             </div>
//             <div className="info-row last">
//               <div className="info-row-left">
//                 <span className="info-row-icon"><MdCalendarToday size={20} /></span>
//                 <div className="info-stacked">
//                   <span className="info-label">Registration Date</span>
//                   <span className="info-value">{vendorData.registrationDate}</span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Document Information */}
//         <div className="info-card">
//           <h3 className="info-title">
//             <span className="info-icon-circle gray"><MdAccountBalance size={18} /></span>
//             Document information
//           </h3>
//           <div className="info-content">
//             <div className="info-row">
//               <div className="info-row-left">
//                 <span className="info-row-icon"><MdBadge size={20} /></span>
//                 <span className="info-label-standalone">PAN Card</span>
//               </div>
//               <button
//                 className="preview-btn"
//                 onClick={() => setPreviewDoc({ 
//                   title: 'PAN Card', 
//                   src: vendor.panCard || vendor.panImage || vendor.kycDocuments?.pan || vendor.documents?.pan || DOC_IMAGES.pan 
//                 })}
//               >
//                 Preview <MdRemoveRedEye size={16} />
//               </button>
//             </div>
//             <div className="info-row last">
//               <div className="info-row-left">
//                 <span className="info-row-icon"><MdBadge size={20} /></span>
//                 <span className="info-label-standalone">Aadhar card</span>
//               </div>
//               <button
//                 className="preview-btn"
//                 onClick={() => setPreviewDoc({ 
//                   title: 'Aadhar Card', 
//                   src: vendor.aadharCard || vendor.aadharImage || vendor.kycDocuments?.aadhar || vendor.documents?.aadhar || DOC_IMAGES.aadhar 
//                 })}
//               >
//                 Preview <MdRemoveRedEye size={16} />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Turfs Table */}
//       <div className="turfs-section">
//         <table className="turfs-table">
//           <thead>
//             <tr>
//               <th>TURF NAME</th>
//               <th>LOCATION</th>
//               <th>HOURLY RATE</th>
//               <th>STATUS</th>
//               <th>ACTIONS</th>
//             </tr>
//           </thead>
//           <tbody>
//             {vendorData.turfs && vendorData.turfs.length > 0 ? (
//               vendorData.turfs.map((turf) => (
//                 <tr key={turf.id}>
//                   <td>
//                     <div className="turf-name-cell">
//                       <img src={turf.image} alt={turf.name} className="turf-thumb" />
//                       <span className="turf-name-text">{turf.name}</span>
//                     </div>
//                   </td>
//                   <td>{turf.location}</td>
//                   <td>{turf.hourlyRate}</td>
//                   <td>
//                     <span className={`status-badge ${turf.status.toLowerCase().replace(' ', '-')}`}>
//                       • {turf.status}
//                     </span>
//                   </td>
//                   <td>
//                     <button className="view-btn" onClick={() => setSelectedTurf(turf)}>
//                       VIEW
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             ) : (
//               <tr>
//                 <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
//                   No turfs found for this vendor
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>

//       {/* Recent Bookings & Subscription History */}
//       <div className="bottom-sections">
//         <div className="recent-bookings">
//           <h3 className="section-title">
//             <span className="section-icon-circle"><MdCalendarToday size={16} /></span>
//             Recent Bookings
//           </h3>
//           <div className="bookings-list">
//             {recentBookingsLoading ? (
//               <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
//                 Loading recent bookings...
//               </div>
//             ) : recentBookings && recentBookings.length > 0 ? (
//               recentBookings.slice(0, 3).map((booking, index) => {
//                 const date = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
//                   month: 'short',
//                   day: 'numeric'
//                 });
//                 const time = `${booking.startTime} - ${booking.endTime}`;
//                 const statusColor =
//                   booking.status === 'confirmed' ? 'green' :
//                     booking.status === 'pending' ? '#f39c12' :
//                       booking.status === 'cancelled' || booking.status === 'rejected' ? 'red' :
//                         booking.status === 'completed' ? 'blue' : 'gray';

//                 return (
//                   <div key={booking._id || index} className="booking-item">
//                     <div className="booking-date">{date}</div>
//                     <div className="booking-info">
//                       <div className="booking-name">{booking.userName}</div>
//                       <div className="booking-time">{time}</div>
//                     </div>

//                     <span
//                       className="booking-status"
//                       style={{
//                         backgroundColor: `${statusColor}20`,
//                         color: statusColor,
//                         padding: '4px 8px',
//                         borderRadius: '4px',
//                         fontSize: '12px',
//                         fontWeight: '600',
//                         textTransform: 'uppercase'
//                       }}
//                     >{booking.status}</span>
//                   </div>
//                 );
//               })
//             ) : (
//               <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
//                 No recent bookings found
//               </div>
//             )}
//           </div>
//           <button className="view-all-btn" onClick={() => navigate(`/admin/bookings?vendorId=${vendor._id}`)}>View all bookings</button>
//         </div>

//         {/* Subscription History - NOW FROM BACKEND! */}
//         <div className="subscription-history">
//           <h3 className="section-title">
//             <span className="section-icon-circle star"><MdStar size={16} /></span>
//             Subscription History
//           </h3>

//           {subscriptionLoading ? (
//             <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
//               Loading subscription history...
//             </div>
//           ) : subscriptionError ? (
//             <div style={{ padding: '20px', textAlign: 'center', color: '#d9534f' }}>
//               ⚠️ {subscriptionError}
//             </div>
//           ) : subscriptionHistory.length > 0 ? (
//             <div className="subscriptions-scroll">
//               {subscriptionHistory.map((sub, index) => (
//                 <div key={sub._id || index} className={`subscription-item ${sub.status.toLowerCase()}`}>
//                   <div className="sub-top-row">
//                     <div className="sub-plan">{sub.plan}</div>
//                     <span className={`sub-status-badge ${sub.status.toLowerCase()}`}>
//                       {sub.status.toUpperCase()}
//                     </span>
//                   </div>
//                   <div className="sub-date">{sub.duration}</div>
//                   {sub.amountPaid > 0 && (
//                     <div className="sub-date" style={{ fontSize: '12px', color: '#666' }}>
//                       Amount: ₹{sub.amountPaid.toLocaleString('en-IN')}
//                     </div>
//                   )}
//                   {sub.isTrial && (
//                     <div className="sub-date" style={{ fontSize: '12px', color: '#27ae60' }}>
//                       ⭐ Trial Period
//                     </div>
//                   )}
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
//               No subscription history found
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }


// // import React, { useState, useEffect } from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import { toast } from 'react-hot-toast';
// // import '../assets/styles/VendorDetail.css';
// // import VenueCard from '../components/VenueCard';
// // import SuspendModal from '../context/SuspendModal';
// // import { suspendVendor, getVendorSubscriptionHistory, getVendorBookingsStats, getVendorRecentBookings } from '../services/vendors.service';

// // // React Icons
// // import {
// //   MdArrowBack,
// //   MdEmail,
// //   MdPhone,
// //   MdCalendarToday,
// //   MdBadge,
// //   MdAccountBalance,
// //   MdStar,
// //   MdRemoveRedEye,
// //   MdSportsSoccer,
// // } from 'react-icons/md';

// // // Document preview popup images (placeholder)
// // const DOC_IMAGES = {
// //   pan: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=600&h=400&fit=crop',
// //   aadhar: 'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=600&h=400&fit=crop',
// // };

// // export default function VendorDetail({ vendor, onBack, onVendorSuspended }) {
// //   const navigate = useNavigate();
// //   const [vendorData, setVendorData] = useState(null);
// //   const [vendorStats, setVendorStats] = useState({
// //     totalBookings: 0,
// //     activeBookings: 0,
// //     confirmedBookings: 0,
// //     pendingBookings: 0,
// //     cancelledBookings: 0
// //   });
// //   const [subscriptionHistory, setSubscriptionHistory] = useState([]);
// //   const [subscriptionLoading, setSubscriptionLoading] = useState(true);
// //   const [subscriptionError, setSubscriptionError] = useState(null);
// //   const [recentBookings, setRecentBookings] = useState([]);
// //   const [recentBookingsLoading, setRecentBookingsLoading] = useState(true);
// //   const [selectedTurf, setSelectedTurf] = useState(null);
// //   const [showSuspendModal, setShowSuspendModal] = useState(false);
// //   const [previewDoc, setPreviewDoc] = useState(null);
// //   const [suspendLoading, setSuspendLoading] = useState(false);
// //   const [suspendError, setSuspendError] = useState(null);

// //   // Freeze background scrolling when any popup is open
// //   useEffect(() => {
// //     if (selectedTurf || previewDoc || showSuspendModal) {
// //       document.body.style.overflow = 'hidden';
// //     } else {
// //       document.body.style.overflow = 'auto';
// //     }
    
// //     // Cleanup on unmount
// //     return () => {
// //       document.body.style.overflow = 'auto';
// //     };
// //   }, [selectedTurf, previewDoc, showSuspendModal]);
// //   // Transform vendor prop data into the format needed for display
// //   useEffect(() => {
// //     if (vendor) {
// //       console.log("Vendor Detail Received:", vendor);
// //       console.log("Mongo ID:", vendor._id);
// //       console.log("Table ID:", vendor.id);
// //     }

// //     if (vendor && vendor._id) {
// //       getVendorBookingsStats(vendor._id)
// //         .then(res => {
// //           if (res && res.data) {
// //             setVendorStats(res.data);
// //           }
// //         })
// //         .catch(err => console.error("Error fetching vendor stats", err));
// //     }

// //     if (vendor) {
// //       console.log("🔍 Vendor Data Received:", vendor);

// //       try {
// //         // Transform turfs data
// //         const transformedTurfs = (vendor.turfs || []).map((turf, index) => {
// //           console.log("Turf data:", turf);
// //           return {
// //             id: index + 1,
// //             name: turf.turfName || turf.name || 'Unknown Turf',
// //             location: turf.location || 'Unknown Location',
// //             hourlyRate: `₹${(turf.pricePerHour || turf.price || 0).toLocaleString('en-IN')}`,
// //             status: turf.approvalStatus || turf.status || 'Pending',
// //             image: turf.mainImage || (turf.images && turf.images[0]) || (turf.photos && turf.photos[0]) || 'https://images.unsplash.com/photo-1624880357913-a8539238245b?w=48&h=48&fit=crop',
// //             venueCardData: {
// //               name: turf.turfName || turf.name || 'Unnamed Turf',
// //               location: turf.location || turf.address?.city || turf.city || 'Unknown Location',
// //               rating: turf.rating || 0,
// //               reviewCount: turf.reviewCount || turf.totalReviews || 0,
// //               pricePerHour: turf.pricePerHour?.basePrice || turf.pricePerHour || turf.price || 0,
// //               facilities: turf.facilities || turf.amenities || [],
// //               sports: turf.sports || turf.sportTypes || (turf.sportType ? [turf.sportType] : []),
// //               photos: turf.secondaryImages || turf.images || turf.photos || [turf.mainImage].filter(Boolean) || [],
// //               verified: (turf.approvalStatus || turf.status || '').toLowerCase() === 'approved',
// //             },
// //           };
// //         });

// //         // Get current date formatted with fallback
// //         let registrationDate = 'Not Available';
// //         try {
// //           const dateObj = vendor.createdAt ? new Date(vendor.createdAt) : new Date();
// //           registrationDate = dateObj.toLocaleDateString('en-IN', {
// //             year: 'numeric',
// //             month: 'short',
// //             day: 'numeric',
// //           });
// //         } catch (e) {
// //           console.error("Date parsing error:", e);
// //         }

// //         const newData = {
// //           id: vendor.id || 1,
// //           name: vendor.name || vendor.vendorName || 'Unknown Vendor',
// //           vendorId: vendor.vendorId || 'VND-0000',
// //           description: 'Multi-turf Facility Management & Booking Partner',
// //           logo: vendor.profileImage || vendor.logoImage || vendor.logo || vendor.image || 'https://images.unsplash.com/photo-1516399653135-68efc5e5cf13?w=100&h=100&fit=crop',
// //           totalTurfs:  transformedTurfs.length.toString(), 
// //           newTurfs: '+0 New',
// //           subscription: 'Active',
// //           email: vendor.email || 'Not Available',
// //           phone: vendor.phone || 'Not Available',
// //           location: vendor.location || 'Not Available',
// //           registrationDate: registrationDate,
// //           turfs: transformedTurfs,
// //           _id: vendor._id || vendor.id,
// //         };

// //         console.log("✅ Transformed Vendor Data:", newData);
// //         setVendorData(newData);
// //       } catch (error) {
// //         console.error("❌ Error transforming vendor data:", error);
// //         setVendorData(null);
// //       }
// //     }
// //   }, [vendor]);

// //   // Fetch subscription history from backend
// //   useEffect(() => {
// //     const fetchSubscriptionHistory = async () => {
// //       if (!vendor || !vendor._id) {
// //         console.log("⚠️ No vendor ID for subscription history fetch");
// //         setSubscriptionHistory([]);
// //         setSubscriptionLoading(false);
// //         return;
// //       }

// //       setSubscriptionLoading(true);
// //       setSubscriptionError(null);

// //       try {
// //         console.log("📡 Fetching subscription history for vendor:", vendor._id);
// //         const response = await getVendorSubscriptionHistory(vendor._id);

// //         console.log("📦 Subscription history response:", response);

// //         // Transform subscription data from backend format
// //         const transformedSubscriptions = response.data.map((subscription) => {
// //           const plan = subscription.plan || {};

// //           // Format dates
// //           const startDate = new Date(subscription.startDate);
// //           const endDate = new Date(subscription.endDate);

// //           const startDateFormatted = startDate.toLocaleDateString('en-IN', {
// //             year: 'numeric',
// //             month: 'short',
// //             day: 'numeric',
// //           });

// //           const endDateFormatted = endDate.toLocaleDateString('en-IN', {
// //             year: 'numeric',
// //             month: 'short',
// //             day: 'numeric',
// //           });

// //           console.log("📋 Processing subscription:", {
// //             planName: plan.name,
// //             status: subscription.status,
// //             startDate: startDateFormatted,
// //             endDate: endDateFormatted,
// //           });

// //           return {
// //             _id: subscription._id,
// //             plan: plan.name || 'Unknown Plan',
// //             status: subscription.status || 'unknown',
// //             startDate: startDateFormatted,
// //             endDate: endDateFormatted,
// //             duration: `${startDateFormatted} - ${endDateFormatted}`,
// //             renewedDate: startDateFormatted,
// //             nextBillingDate: endDateFormatted,
// //             amountPaid: subscription.amountPaid || 0,
// //             paymentStatus: subscription.paymentStatus || 'pending',
// //             isTrial: subscription.isTrial || false,
// //           };
// //         });

// //         console.log("✅ Transformed subscriptions:", transformedSubscriptions);
// //         setSubscriptionHistory(transformedSubscriptions);
// //       } catch (err) {
// //         console.error("❌ Failed to fetch subscription history:", err);
// //         setSubscriptionError("Failed to load subscription history");
// //         setSubscriptionHistory([]);
// //       } finally {
// //         setSubscriptionLoading(false);
// //       }
// //     };

// //     fetchSubscriptionHistory();
// //   }, [vendor]);

// //   // Fetch recent bookings from backend
// //   useEffect(() => {
// //     const fetchRecentBookings = async () => {
// //       if (!vendor || !vendor._id) {
// //         setRecentBookings([]);
// //         setRecentBookingsLoading(false);
// //         return;
// //       }
// //       setRecentBookingsLoading(true);
// //       try {
// //         const response = await getVendorRecentBookings(vendor._id);
// //         if (response && response.data) {
// //           setRecentBookings(response.data);
// //         } else {
// //           setRecentBookings([]);
// //         }
// //       } catch (err) {
// //         console.error("Failed to fetch recent bookings:", err);
// //         setRecentBookings([]);
// //       } finally {
// //         setRecentBookingsLoading(false);
// //       }
// //     };
// //     fetchRecentBookings();
// //   }, [vendor]);

// //   const handleSuspendConfirm = async () => {
// //     setSuspendLoading(true);
// //     setSuspendError(null);

// //     console.log("Suspending Vendor:", vendor);
// //     console.log("Vendor Mongo ID:", vendor._id);

// //     try {
// //       await suspendVendor(vendor._id);
// //       toast.success("Vendor suspended successfully");
// //       if (onVendorSuspended) {
// //         onVendorSuspended(vendor._id);
// //       }
// //       navigate("/admin/vendors");
// //     } catch (err) {
// //       console.error("Failed to suspend vendor:", err);
// //       const errMsg = err.response?.data?.message || "Failed to suspend vendor";
// //       setSuspendError(errMsg);
// //       toast.error(errMsg);
// //     } finally {
// //       setSuspendLoading(false);
// //       setShowSuspendModal(false);
// //     }
// //   };

// //   if (!vendor) {
// //     return (
// //       <div style={{ padding: '20px', textAlign: 'center' }}>
// //         <p>❌ No vendor data received</p>
// //         <button onClick={onBack} style={{ padding: '10px 20px', marginTop: '10px' }}>
// //           Go Back
// //         </button>
// //       </div>
// //     );
// //   }

// //   if (!vendorData) {
// //     return (
// //       <div style={{ padding: '20px', textAlign: 'center' }}>
// //         <p>Loading vendor details...</p>
// //         <p style={{ fontSize: '12px', color: '#666' }}>
// //           Vendor: {vendor.name || 'Unknown'}
// //         </p>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div className="vendor-detail-container">

// //       {/* ── Turf VenueCard Popup ── */}
// //       {selectedTurf && (
// //         <div className="vd-popup-backdrop" onClick={() => setSelectedTurf(null)}>
// //           <div className="vd-popup-box" onClick={(e) => e.stopPropagation()}>
// //             <button className="vd-popup-close" onClick={() => setSelectedTurf(null)}>✕</button>
// //             <VenueCard {...selectedTurf.venueCardData} />
// //           </div>
// //         </div>
// //       )}

// //       {/* ── Document Preview Popup ── */}
// //       {previewDoc && (
// //         <div className="vd-popup-backdrop" onClick={() => setPreviewDoc(null)}>
// //           <div className="vd-doc-popup" onClick={(e) => e.stopPropagation()}>
// //             <div className="vd-doc-popup-header">
// //               <span>{previewDoc.title}</span>
// //               <button className="vd-popup-close" onClick={() => setPreviewDoc(null)}>✕</button>
// //             </div>
// //             <img src={previewDoc.src} alt={previewDoc.title} className="vd-doc-img" />
// //           </div>
// //         </div>
// //       )}

// //       {/* ── Suspend Modal ── */}
// //       <SuspendModal
// //         isOpen={showSuspendModal}
// //         onClose={() => setShowSuspendModal(false)}
// //         onConfirm={handleSuspendConfirm}
// //         title="Confirm suspend account?"
// //         message={`Are you sure? Do you want to suspend ${vendorData.name}'s account?`}
// //         loading={suspendLoading}
// //         error={suspendError}
// //       />

// //       {/* Back Navigation */}
// //       <div className="back-navigation">
// //         <button className="back-btn" onClick={onBack}>
// //           <MdArrowBack size={20} />
// //           <span>Vendor Management</span>
// //           <span className="breadcrumb-separator">/</span>
// //           <span className="vendor-name-breadcrumb">{vendorData.name}</span>
// //         </button>
// //       </div>

// //       {/* Vendor Header */}
// //       <div className="vendor-header">
// //         <div className="vendor-header-left">
// //           <img src={vendorData.logo} alt={vendorData.name} className="vendor-logo" />
// //           <div className="vendor-header-info">
// //             <h1 className="vendor-header-name">{vendorData.name}</h1>
// //             <div className="vendor-meta">
// //               <span className="vendor-id-badge">{vendorData.vendorId}</span>
// //               <p className="vendor-description">{vendorData.description}</p>
// //             </div>
// //           </div>
// //         </div>
// //         <button
// //           className="suspend-btn"
// //           onClick={() => setShowSuspendModal(true)}
// //           disabled={suspendLoading}
// //         >
// //           <span className="suspend-icon">⋯</span>
// //           <span className="suspend-text">{suspendLoading ? 'Suspending...' : 'Suspend account'}</span>
// //         </button>
// //       </div>

// //       {/* Stats Cards */}
// // <div className="stats-grid">
// //   <div className="stat-card">
// //     <div className="stat-icon-circle green">
// //       <MdSportsSoccer size={20} />
// //     </div>
// //     <div className="stat-content">
// //       <div className="stat-label">TOTAL TURFS</div>
// //       <div className="stat-value">{vendorData.totalTurfs}</div>
// //     </div>
// //   </div>
// //   <div className="stat-card">
// //     <div className="stat-icon-circle green">
// //       <MdCalendarToday size={20} />
// //     </div>
// //     <div className="stat-content">
// //       <div className="stat-label">ACTIVE BOOKINGS</div>
// //       <div className="stat-value">{vendorStats.activeBookings ?? 0}</div>
// //     </div>
// //   </div>
// //   {/* Subscription - Dynamic based on status */}
// //   <div className={`subscription-card ${vendorData.isSubscriptionActive ? 'active' : 'expired'}`}>
// //     <div className="stat-icon-circle white">
// //       <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
// //         <foreignObject x="-12" y="-12" width="64" height="64">
// //           <div xmlns="http://www.w3.org/1999/xhtml" style={{ backdropFilter: 'blur(6px)', clipPath: 'url(#bgblur_0_2815_6569_clip_path)', height: '100%', width: '100%' }} />
// //         </foreignObject>
// //         <g data-figma-bg-blur-radius="12">
// //           <rect width="40" height="40" rx="20" fill="white" fillOpacity="0.2" />
// //           <path d="M16.6 30.5L14.7 27.3L11.1 26.5L11.45 22.8L9 20L11.45 17.2L11.1 13.5L14.7 12.7L16.6 9.5L20 10.95L23.4 9.5L25.3 12.7L28.9 13.5L28.55 17.2L31 20L28.55 22.8L28.9 26.5L25.3 27.3L23.4 30.5L20 29.05L16.6 30.5ZM18.95 23.55L24.6 17.9L23.2 16.45L18.95 20.7L16.8 18.6L15.4 20L18.95 23.55Z" fill="currentColor" />
// //         </g>
// //         <defs>
// //           <clipPath id="bgblur_0_2815_6569_clip_path" transform="translate(12 12)">
// //             <rect width="40" height="40" rx="20" />
// //           </clipPath>
// //         </defs>
// //       </svg>
// //     </div>
// //     <div className="subscription-content">
// //       <div className="subscription-label">SUBSCRIPTION</div>
// //       <div className="subscription-value">{vendorData.subscription}</div>
// //       {vendorData.isSubscriptionActive && (
// //         <>
// //           {vendorData.subscriptionPlan && vendorData.subscriptionPlan !== 'Unknown Plan' && (
// //             <div className="subscription-plan" style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px', marginTop: '2px' }}>
// //               {vendorData.subscriptionPlan}
// //             </div>
// //           )}
// //           {vendorData.subscriptionDaysRemaining > 0 && (
// //             <div className="subscription-days">
// //               ● {vendorData.subscriptionDaysRemaining} days remaining
// //             </div>
// //           )}
// //           {vendorData.subscriptionEndDate && vendorData.subscriptionEndDate !== 'N/A' && (
// //             <div className="subscription-end-date" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', marginTop: '2px' }}>
// //               Valid till: {vendorData.subscriptionEndDate}
// //             </div>
// //           )}
// //           {vendorData.subscriptionAmountPaid > 0 && (
// //             <div className="subscription-amount" style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', marginTop: '2px' }}>
// //               Amount: ₹{vendorData.subscriptionAmountPaid.toLocaleString('en-IN')}
// //             </div>
// //           )}
// //         </>
// //       )}
// //     </div>
// //   </div>
// // </div>


// //       {/* Information Sections */}
// //       <div className="info-sections">
// //         {/* Vendor Information */}
// //         <div className="info-card">
// //           <h3 className="info-title">
// //             <span className="info-icon-circle gray"><MdBadge size={18} /></span>
// //             Vendor Information
// //           </h3>
// //           <div className="info-content">
// //             <div className="info-row">
// //               <div className="info-row-left">
// //                 <span className="info-row-icon"><MdEmail size={20} /></span>
// //                 <div className="info-stacked">
// //                   <span className="info-label">Email Address</span>
// //                   <span className="info-value">{vendorData.email}</span>
// //                 </div>
// //               </div>
// //             </div>
// //             <div className="info-row">
// //               <div className="info-row-left">
// //                 <span className="info-row-icon"><MdPhone size={20} /></span>
// //                 <div className="info-stacked">
// //                   <span className="info-label">Phone Number</span>
// //                   <span className="info-value">{vendorData.phone}</span>
// //                 </div>
// //               </div>
// //             </div>
// //             <div className="info-row last">
// //               <div className="info-row-left">
// //                 <span className="info-row-icon"><MdCalendarToday size={20} /></span>
// //                 <div className="info-stacked">
// //                   <span className="info-label">Registration Date</span>
// //                   <span className="info-value">{vendorData.registrationDate}</span>
// //                 </div>
// //               </div>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Document Information */}
// //         <div className="info-card">
// //           <h3 className="info-title">
// //             <span className="info-icon-circle gray"><MdAccountBalance size={18} /></span>
// //             Document information
// //           </h3>
// //           <div className="info-content">
// //             <div className="info-row">
// //               <div className="info-row-left">
// //                 <span className="info-row-icon"><MdBadge size={20} /></span>
// //                 <span className="info-label-standalone">PAN Card</span>
// //               </div>
// //               <button
// //                 className="preview-btn"
// //                 onClick={() => setPreviewDoc({ 
// //                   title: 'PAN Card', 
// //                   src: vendor.panCard || vendor.panImage || vendor.kycDocuments?.pan || vendor.documents?.pan || DOC_IMAGES.pan 
// //                 })}
// //               >
// //                 Preview <MdRemoveRedEye size={16} />
// //               </button>
// //             </div>
// //             <div className="info-row last">
// //               <div className="info-row-left">
// //                 <span className="info-row-icon"><MdBadge size={20} /></span>
// //                 <span className="info-label-standalone">Aadhar card</span>
// //               </div>
// //               <button
// //                 className="preview-btn"
// //                 onClick={() => setPreviewDoc({ 
// //                   title: 'Aadhar Card', 
// //                   src: vendor.aadharCard || vendor.aadharImage || vendor.kycDocuments?.aadhar || vendor.documents?.aadhar || DOC_IMAGES.aadhar 
// //                 })}
// //               >
// //                 Preview <MdRemoveRedEye size={16} />
// //               </button>
// //             </div>
// //           </div>
// //         </div>
// //       </div>

// //       {/* Turfs Table */}
// //       <div className="turfs-section">
// //         <table className="turfs-table">
// //           <thead>
// //             <tr>
// //               <th>TURF NAME</th>
// //               <th>LOCATION</th>
// //               <th>HOURLY RATE</th>
// //               <th>STATUS</th>
// //               <th>ACTIONS</th>
// //             </tr>
// //           </thead>
// //           <tbody>
// //             {vendorData.turfs && vendorData.turfs.length > 0 ? (
// //               vendorData.turfs.map((turf) => (
// //                 <tr key={turf.id}>
// //                   <td>
// //                     <div className="turf-name-cell">
// //                       <img src={turf.image} alt={turf.name} className="turf-thumb" />
// //                       <span className="turf-name-text">{turf.name}</span>
// //                     </div>
// //                   </td>
// //                   <td>{turf.location}</td>
// //                   <td>{turf.hourlyRate}</td>
// //                   <td>
// //                     <span className={`status-badge ${turf.status.toLowerCase().replace(' ', '-')}`}>
// //                       • {turf.status}
// //                     </span>
// //                   </td>
// //                   <td>
// //                     <button className="view-btn" onClick={() => setSelectedTurf(turf)}>
// //                       VIEW
// //                     </button>
// //                   </td>
// //                 </tr>
// //               ))
// //             ) : (
// //               <tr>
// //                 <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
// //                   No turfs found for this vendor
// //                 </td>
// //               </tr>
// //             )}
// //           </tbody>
// //         </table>
// //       </div>

// //       {/* Recent Bookings & Subscription History */}
// //       <div className="bottom-sections">
// //         <div className="recent-bookings">
// //           <h3 className="section-title">
// //             <span className="section-icon-circle"><MdCalendarToday size={16} /></span>
// //             Recent Bookings
// //           </h3>
// //           <div className="bookings-list">
// //             {recentBookingsLoading ? (
// //               <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
// //                 Loading recent bookings...
// //               </div>
// //             ) : recentBookings && recentBookings.length > 0 ? (
// //               recentBookings.slice(0, 3).map((booking, index) => {
// //                 const date = new Date(booking.bookingDate).toLocaleDateString('en-IN', {
// //                   month: 'short',
// //                   day: 'numeric'
// //                 });
// //                 const time = `${booking.startTime} - ${booking.endTime}`;
// //                 const statusColor =
// //                   booking.status === 'confirmed' ? 'green' :
// //                     booking.status === 'pending' ? '#f39c12' :
// //                       booking.status === 'cancelled' || booking.status === 'rejected' ? 'red' :
// //                         booking.status === 'completed' ? 'blue' : 'gray';

// //                 return (
// //                   <div key={booking._id || index} className="booking-item">
// //                     <div className="booking-date">{date}</div>
// //                     <div className="booking-info">
// //                       <div className="booking-name">{booking.userName}</div>
// //                       <div className="booking-time">{time}</div>
// //                     </div>

// //                     <span
// //                       className="booking-status"
// //                       style={{
// //                         backgroundColor: `${statusColor}20`,
// //                         color: statusColor,
// //                         padding: '4px 8px',
// //                         borderRadius: '4px',
// //                         fontSize: '12px',
// //                         fontWeight: '600',
// //                         textTransform: 'uppercase'
// //                       }}
// //                     >{booking.status}</span>
// //                   </div>
// //                 );
// //               })
// //             ) : (
// //               <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
// //                 No recent bookings found
// //               </div>
// //             )}
// //           </div>
// //           <button className="view-all-btn" onClick={() => navigate(`/admin/bookings?vendorId=${vendor._id}`)}>View all bookings</button>
// //         </div>

// //         {/* Subscription History - NOW FROM BACKEND! */}
// //         <div className="subscription-history">
// //           <h3 className="section-title">
// //             <span className="section-icon-circle star"><MdStar size={16} /></span>
// //             Subscription History
// //           </h3>

// //           {subscriptionLoading ? (
// //             <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
// //               Loading subscription history...
// //             </div>
// //           ) : subscriptionError ? (
// //             <div style={{ padding: '20px', textAlign: 'center', color: '#d9534f' }}>
// //               ⚠️ {subscriptionError}
// //             </div>
// //           ) : subscriptionHistory.length > 0 ? (
// //             <div className="subscriptions-scroll">
// //               {subscriptionHistory.map((sub, index) => (
// //                 <div key={sub._id || index} className={`subscription-item ${sub.status.toLowerCase()}`}>
// //                   <div className="sub-top-row">
// //                     <div className="sub-plan">{sub.plan}</div>
// //                     <span className={`sub-status-badge ${sub.status.toLowerCase()}`}>
// //                       {sub.status.toUpperCase()}
// //                     </span>
// //                   </div>
// //                   <div className="sub-date">{sub.duration}</div>
// //                   {sub.amountPaid > 0 && (
// //                     <div className="sub-date" style={{ fontSize: '12px', color: '#666' }}>
// //                       Amount: ₹{sub.amountPaid.toLocaleString('en-IN')}
// //                     </div>
// //                   )}
// //                   {sub.isTrial && (
// //                     <div className="sub-date" style={{ fontSize: '12px', color: '#27ae60' }}>
// //                       ⭐ Trial Period
// //                     </div>
// //                   )}
// //                 </div>
// //               ))}
// //             </div>
// //           ) : (
// //             <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
// //               No subscription history found
// //             </div>
// //           )}
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }
