import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import '../assets/styles/VendorDetail.css';
import '../assets/styles/turfDetails.css';
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

          const vendorName = vendor.name || vendor.vendorName || 'Unknown Vendor';
          const logoFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(vendorName)}&background=0D8B41&color=fff`;
          const profileImageUrl = vendor.profileImage 
            ? (vendor.profileImage.startsWith('http') ? vendor.profileImage : `http://localhost:5000${vendor.profileImage}`)
            : null;

          const newData = {
          id: vendor.id || 1,
          name: vendorName,
          vendorId: vendor.vendorId || 'VND-0000',
          description: 'Multi-turf Facility Management & Booking Partner',
          logo: profileImageUrl || vendor.logoImage || vendor.logo || vendor.image || logoFallback,
          totalTurfs: String(transformedTurfs.length).padStart(2, '0'),
          newTurfs: '+2 New',
          subscription: 'Active',
          email: vendor.email || 'Not Available',
          phone: vendor.phone || 'Not Available',
          location: vendor.location || 'Not Available',
          registrationDate: registrationDate,
          turfs: transformedTurfs,
          _id: vendor._id || vendor.id,
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
        <div 
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.9)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'zoom-out'
          }}
          onClick={() => setPreviewDoc(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ color: 'white', padding: '10px', background: 'rgba(0,0,0,0.5)', textAlign: 'center', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}>
              <span>{previewDoc.title}</span>
              <button 
                style={{ background: 'transparent', border: 'none', color: 'white', float: 'right', cursor: 'pointer', fontSize: '18px' }} 
                onClick={() => setPreviewDoc(null)}
              >✕</button>
            </div>
            <img 
              src={previewDoc.src} 
              alt={previewDoc.title} 
              style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
              onClick={(e) => e.stopPropagation()} 
            />
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
        <div className="subscription-card active">
          <div className="stat-icon-circle white">
            <MdCalendarToday size={20} />
          </div>
          <div className="subscription-content">
            <div className="subscription-label">SUBSCRIPTION</div>
            <div className="subscription-value">{vendorData.subscription}</div>
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
        <div className="td-card td-card--full" style={{ marginTop: '24px' }}>
          <div className="td-card-header">
            <span className="td-card-title">
              <i className="bi bi-file-earmark-text" /> Document Information
            </span>
          </div>
          <div className="td-docs">
            <div className="td-doc-row">
              <div className="td-doc-icon-wrap">
                <i className="bi bi-person-badge" />
              </div>
              <div className="td-doc-info">
                <p className="td-doc-title">PAN Card</p>
                <p className="td-doc-sub">Tax ID</p>
              </div>
              <div className="td-doc-right">
                <a
                  href="#preview"
                  className="td-preview-link"
                  onClick={(e) => { 
                    e.preventDefault();
                    let src = vendor.panCard || vendor.panImage || vendor.kycDocuments?.pan?.url || vendor.documents?.pan;
                    if (src) {
                      src = src.startsWith('http') ? src : `http://localhost:5000${src}`;
                      setPreviewDoc({ title: 'PAN Card', src });
                    } else {
                      toast.error("PAN Card not uploaded by vendor");
                    }
                  }}
                  aria-label="Preview PAN Card"
                >
                  Preview <i className="bi bi-eye" />
                </a>
              </div>
            </div>

            <div className="td-doc-row">
              <div className="td-doc-icon-wrap">
                <i className="bi bi-fingerprint" />
              </div>
              <div className="td-doc-info">
                <p className="td-doc-title">Aadhar Card</p>
                <p className="td-doc-sub">ID Proof</p>
              </div>
              <div className="td-doc-right">
                <a
                  href="#preview"
                  className="td-preview-link"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    let src = vendor.aadharCard || vendor.aadharImage || vendor.kycDocuments?.aadhar?.url || vendor.documents?.aadhar;
                    if (src) {
                      src = src.startsWith('http') ? src : `http://localhost:5000${src}`;
                      setPreviewDoc({ title: 'Aadhar Card', src });
                    } else {
                      toast.error("Aadhar Card not uploaded by vendor");
                    }
                  }}
                  aria-label="Preview Aadhar Card"
                >
                  Preview <i className="bi bi-eye" />
                </a>
              </div>
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

        {/* Subscription History - NOW FROM BACKEND! */}
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
