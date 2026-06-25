// VendorDetail.jsx - Clean version with fixed subscription display

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import '../assets/styles/VendorDetail.css';
import VenueCard from '../components/VenueCard';
import SuspendModal from '../context/SuspendModal';

import { suspendVendor, getVendorById, getVendorSubscriptionHistory, getVendorBookingsStats, getVendorRecentBookings, getVendorDocuments } from '../services/vendors.service';

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
  MdLocationOn,
  MdStore,
  MdVerified,
  MdWarning,
  MdCheckCircle,
  MdCancel,
  MdAccessTime,
} from 'react-icons/md';

// ── Document Preview Popup ──
const DocumentPreview = ({ doc, onClose }) => {
  if (!doc) return null;
  
  return (
    <div className="vd-popup-backdrop" onClick={onClose}>
      <div className="vd-doc-popup" onClick={(e) => e.stopPropagation()}>
        <div className="vd-doc-popup-header">
          <span>{doc.name || doc.title || 'Document'}</span>
          <button className="vd-popup-close" onClick={onClose}>✕</button>
        </div>
        {doc.url ? (
          <img 
            src={doc.url} 
            alt={doc.name || 'Document'} 
            className="vd-doc-img" 
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #666;">
                  <p>📄 ${doc.name || 'Document'}</p>
                  <p style="font-size: 14px; color: #999;">Preview not available</p>
                </div>
              `;
            }}
          />
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <p>📄 {doc.name || 'Document'}</p>
            <p style={{ fontSize: '14px', color: '#999' }}>No preview available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function VendorDetail({ vendor: initialVendor, onBack, onVendorSuspended }) {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(initialVendor);
  const [vendorData, setVendorData] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
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
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [turfs, setTurfs] = useState([]);
  const [turfsLoading, setTurfsLoading] = useState(true);


  // Freeze background scrolling when any popup is open
  useEffect(() => {
    if (selectedTurf || previewDoc || showSuspendModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedTurf, previewDoc, showSuspendModal]);

  // ── Fetch Vendor Details from Backend ──
  useEffect(() => {
    const fetchVendorDetails = async () => {
      if (!initialVendor?._id) {
        console.log("⚠️ No vendor ID provided");
        return;
      }

      try {
        const response = await getVendorById(initialVendor._id);
        if (response && response.data) {
          console.log('📦 Vendor Details Response:', response.data);
          setVendor(response.data);
        }
      } catch (err) {
        console.error("❌ Failed to fetch vendor details:", err);
      }
    };

    fetchVendorDetails();
  }, [initialVendor]);

  // ── Load Current Subscription ──
  useEffect(() => {
    const loadCurrentSubscription = async () => {
      if (!vendor?._id) {
        setCurrentSubscription(null);
        return;
      }

      const subscriptionData = vendor.subscription || null;
      console.log('🔍 Checking vendor.subscription:', subscriptionData);

      if (subscriptionData && subscriptionData.status && ['active', 'trial'].includes(subscriptionData.status.toLowerCase())) {
        console.log('✅ Found subscription in vendor object:', subscriptionData);
        setCurrentSubscription(subscriptionData);
        return;
      }

      try {
        const response = await getVendorSubscriptionHistory(vendor._id);
        const history = Array.isArray(response.data) ? response.data : [];
        const activeSubscription = history.find((sub) => sub.status && ['active', 'trial'].includes(sub.status.toLowerCase()));

        if (activeSubscription) {
          console.log('✅ Found active subscription in history:', activeSubscription);
          setCurrentSubscription(activeSubscription);
        } else {
          setCurrentSubscription(null);
        }
      } catch (err) {
        console.error('❌ Failed to load current subscription history:', err);
        setCurrentSubscription(null);
      }
    };

    loadCurrentSubscription();
  }, [vendor]);

  // ── Transform Vendor Data ──
  useEffect(() => {
    if (!vendor) return;

    const transformVendorData = async () => {
      try {
        // Get current subscription status
        const subscriptionData = currentSubscription || vendor.subscription || null;
        console.log('📊 Processing Subscription Data:', subscriptionData);

        const subscriptionStatusRaw = subscriptionData?.status || 'expired';
        const subscriptionStatus = ['active', 'trial'].includes(subscriptionStatusRaw.toLowerCase()) ? 'Active' : 'Expired';
        const isActive = ['active', 'trial'].includes(subscriptionStatusRaw.toLowerCase());

        let daysRemaining = 0;
        let subscriptionEndDate = 'N/A';
        if (subscriptionData?.endDate) {
          const endDateObj = new Date(subscriptionData.endDate);
          if (!Number.isNaN(endDateObj.getTime())) {
            subscriptionEndDate = endDateObj.toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            if (isActive) {
              daysRemaining = Math.max(0, Math.ceil((endDateObj - new Date()) / (1000 * 60 * 60 * 24)));
            }
          }
        }

        const subscriptionPlan = subscriptionData?.plan?.name || subscriptionData?.plan || 'Unknown Plan';
        const subscriptionAmountPaid = subscriptionData?.amountPaid || subscriptionData?.amount || 0;
        console.log('✅ Final Subscription Status:', { subscriptionStatus, isActive, daysRemaining });

        // Format registration date
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

        const newData = {
          id: vendor._id,
          name: vendor.name || vendor.vendorName || 'Unknown Vendor',
          vendorId: vendor.vendorId || `VND-${vendor._id?.slice(-6).toUpperCase() || '0000'}`,
          description: vendor.description || 'Sports facility vendor',
          logo: vendor.logo || vendor.profileImage || vendor.image || 'https://images.unsplash.com/photo-1516399653135-68efc5e5cf13?w=100&h=100&fit=crop',
          totalTurfs: vendor.totalTurfs || 0,
          subscription: subscriptionStatus,
          subscriptionPlan,
          subscriptionEndDate,
          subscriptionAmountPaid,
          subscriptionDaysRemaining: daysRemaining,
          isSubscriptionActive: isActive,
          email: vendor.email || 'Not Available',
          phone: vendor.phone || 'Not Available',
          location: vendor.location || vendor.address || 'Not Available',
          registrationDate: registrationDate,
          _id: vendor._id,
        };

        setVendorData(newData);
      } catch (error) {
        console.error("❌ Error transforming vendor data:", error);
      }
    };

    transformVendorData();
  }, [vendor, currentSubscription]);

  // ── Fetch Vendor Stats ──
  useEffect(() => {
    if (!vendor?._id) return;

    const fetchStats = async () => {
      try {
        const response = await getVendorBookingsStats(vendor._id);
        if (response && response.data) {
          setVendorStats(response.data);
        }
      } catch (err) {
        console.error("❌ Error fetching vendor stats:", err);
      }
    };

    fetchStats();
  }, [vendor]);

  // ── Fetch Vendor Documents ──
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!vendor?._id) {
        setDocuments([]);
        setDocumentsLoading(false);
        return;
      }

      setDocumentsLoading(true);
      try {
        const response = await getVendorDocuments(vendor._id);
        if (response && response.data) {
          setDocuments(response.data);
        } else {
          setDocuments([]);
        }
      } catch (err) {
        console.error("❌ Failed to fetch documents:", err);
        setDocuments([]);
      } finally {
        setDocumentsLoading(false);
      }
    };

    fetchDocuments();
  }, [vendor]);

  // ── Fetch Vendor Turfs ──
  useEffect(() => {
    const fetchTurfs = async () => {
      if (!vendor?._id) {
        setTurfs([]);
        setTurfsLoading(false);
        return;
      }

      setTurfsLoading(true);
      try {
        const response = await getTurfsByVendor(vendor._id);
        if (response && response.data) {
          const transformedTurfs = response.data.map((turf) => ({
            id: turf._id,
            name: turf.name || turf.turfName || 'Unknown Turf',
            location: turf.location || turf.address?.city || 'Unknown Location',
            hourlyRate: `₹${(turf.pricePerHour?.basePrice || turf.pricePerHour || turf.price || 0).toLocaleString('en-IN')}`,
            status: turf.approvalStatus || turf.status || 'Pending',
            image: turf.mainImage || (turf.images && turf.images[0]) || (turf.photos && turf.photos[0]) || 'https://images.unsplash.com/photo-1624880357913-a8539238245b?w=48&h=48&fit=crop',
            venueCardData: {
              name: turf.name || turf.turfName || 'Unnamed Turf',
              location: turf.location || turf.address?.city || 'Unknown Location',
              rating: turf.rating || 0,
              reviewCount: turf.reviewCount || turf.totalReviews || 0,
              pricePerHour: turf.pricePerHour?.basePrice || turf.pricePerHour || turf.price || 0,
              facilities: turf.facilities || turf.amenities || [],
              sports: turf.sports || turf.sportTypes || (turf.sportType ? [turf.sportType] : []),
              photos: turf.images || turf.photos || [turf.mainImage].filter(Boolean) || [],
              verified: (turf.approvalStatus || turf.status || '').toLowerCase() === 'approved',
            },
          }));
          setTurfs(transformedTurfs);
        } else {
          setTurfs([]);
        }
      } catch (err) {
        console.error("❌ Failed to fetch turfs:", err);
        setTurfs([]);
      } finally {
        setTurfsLoading(false);
      }
    };

    fetchTurfs();
  }, [vendor]);

  // ── Fetch Subscription History ──
  useEffect(() => {
    const fetchSubscriptionHistory = async () => {
      if (!vendor?._id) {
        setSubscriptionHistory([]);
        setSubscriptionLoading(false);
        return;
      }

      setSubscriptionLoading(true);
      setSubscriptionError(null);

      try {
        const response = await getVendorSubscriptionHistory(vendor._id);
        const transformedSubscriptions = (response.data || []).map((subscription) => {
          const plan = subscription.plan || {};
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

  // ── Fetch Recent Bookings ──
  useEffect(() => {
    const fetchRecentBookings = async () => {
      if (!vendor?._id) {
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
        console.error("❌ Failed to fetch recent bookings:", err);
        setRecentBookings([]);
      } finally {
        setRecentBookingsLoading(false);
      }
    };

    fetchRecentBookings();
  }, [vendor]);

  // ── Handle Suspend ──
  const handleSuspendConfirm = async () => {
    setSuspendLoading(true);
    setSuspendError(null);

    try {
      await suspendVendor(vendor._id);
      toast.success("Vendor suspended successfully");
      if (onVendorSuspended) {
        onVendorSuspended(vendor._id);
      }
      navigate("/admin/vendors");
    } catch (err) {
      console.error("❌ Failed to suspend vendor:", err);
      const errMsg = err.response?.data?.message || "Failed to suspend vendor";
      setSuspendError(errMsg);
      toast.error(errMsg);
    } finally {
      setSuspendLoading(false);
      setShowSuspendModal(false);
    }
  };

  // ── Loading State ──
  if (!vendor || !vendorData) {
    return (
      <div className="vendor-detail-container">
        <div className="back-navigation">
          <button className="back-btn" onClick={onBack}>
            <MdArrowBack size={20} /> Back
          </button>
        </div>
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <p>Loading vendor details...</p>
        </div>
      </div>
    );
  }

  // ── Render ──
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
        <DocumentPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} />
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

      {/* ── Back Navigation ── */}
      <div className="back-navigation">
        <button className="back-btn" onClick={onBack}>
          <MdArrowBack size={20} />
          <span>Vendor Management</span>
          <span className="breadcrumb-separator">/</span>
          <span className="vendor-name-breadcrumb">{vendorData.name}</span>
        </button>
      </div>

      {/* ── Vendor Header ── */}
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
          <span className="suspend-icon">⛔</span>
          <span className="suspend-text">{suspendLoading ? 'Suspending...' : 'Suspend Account'}</span>
        </button>
      </div>

      {/* ── Stats Cards ── */}
      <div className="stats-grid">
        {/* Total Turfs */}
        <div className="stat-card">
          <div className="stat-icon-circle green">
            <MdSportsSoccer size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-label">TOTAL TURFS</div>
            <div className="stat-value">{vendorData.totalTurfs}</div>
          </div>
        </div>

        {/* Active Bookings */}
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
                <path d="M16.6 30.5L14.7 27.3L11.1 26.5L11.45 22.8L9 20L11.45 17.2L11.1 13.5L14.7 12.7L16.6 9.5L20 10.95L23.4 9.5L25.3 12.7L28.9 13.5L28.55 17.2L31 20L28.55 22.8L28.9 26.5L25.3 27.3L23.4 30.5L20 29.05L16.6 30.5ZM18.95 23.55L24.6 17.9L23.2 16.45L18.95 20.7L16.8 18.6L15.4 20L18.95 23.55Z" fill="currentColor" />
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
          </div>
        </div>
      </div>

      {/* ── Information Sections ── */}
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
            <div className="info-row">
              <div className="info-row-left">
                <span className="info-row-icon"><MdLocationOn size={20} /></span>
                <div className="info-stacked">
                  <span className="info-label">Location</span>
                  <span className="info-value">{vendorData.location}</span>
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

        {/* Documents Information - From Backend */}
        <div className="info-card">
          <h3 className="info-title">
            <span className="info-icon-circle gray"><MdAccountBalance size={18} /></span>
            Document Information
          </h3>
          <div className="info-content">
            {documentsLoading ? (
              <div style={{ padding: '10px', textAlign: 'center', color: '#666' }}>
                Loading documents...
              </div>
            ) : documents.length > 0 ? (
              documents.map((doc, index) => (
                <div key={doc._id || index} className={`info-row ${index === documents.length - 1 ? 'last' : ''}`}>
                  <div className="info-row-left">
                    <span className="info-row-icon">
                      {doc.status === 'verified' ? (
                        <MdCheckCircle size={20} color="#22c55e" />
                      ) : doc.status === 'rejected' ? (
                        <MdCancel size={20} color="#ef4444" />
                      ) : (
                        <MdAccessTime size={20} color="#f59e0b" />
                      )}
                    </span>
                    <div className="info-stacked">
                      <span className="info-label">{doc.type || 'Document'}</span>
                      <span className="info-value" style={{ fontSize: '13px' }}>
                        {doc.name || doc.title || '—'}
                        {doc.status && (
                          <span style={{ 
                            marginLeft: '8px', 
                            fontSize: '11px',
                            color: doc.status === 'verified' ? '#22c55e' : 
                                   doc.status === 'rejected' ? '#ef4444' : '#f59e0b'
                          }}>
                            ({doc.status})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  {doc.url && (
                    <button
                      className="preview-btn"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      Preview <MdRemoveRedEye size={16} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div style={{ padding: '10px', textAlign: 'center', color: '#999' }}>
                No documents available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Turfs Table ── */}
      <div className="turfs-section">
        <div className="section-header">
          <h3 className="section-title">
            <span className="section-icon-circle"><MdStore size={16} /></span>
            Turfs
          </h3>
          <span className="section-count">{turfs.length} turfs</span>
        </div>
        
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
            {turfsLoading ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  Loading turfs...
                </td>
              </tr>
            ) : turfs.length > 0 ? (
              turfs.map((turf) => (
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
                      <span className="status-dot" />
                      {turf.status}
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

      {/* ── Recent Bookings & Subscription History ── */}
      <div className="bottom-sections">
        {/* Recent Bookings */}
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
            ) : recentBookings.length > 0 ? (
              recentBookings.slice(0, 5).map((booking, index) => {
                const date = booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString('en-IN', {
                  month: 'short',
                  day: 'numeric'
                }) : 'N/A';
                
                const getStatusColor = (status) => {
                  const s = status?.toLowerCase() || '';
                  if (s === 'confirmed' || s === 'completed') return '#22c55e';
                  if (s === 'pending') return '#f59e0b';
                  if (s === 'cancelled' || s === 'rejected') return '#ef4444';
                  return '#6b7280';
                };

                const statusColor = getStatusColor(booking.status);

                return (
                  <div key={booking._id || index} className="booking-item">
                    <div className="booking-date">{date}</div>
                    <div className="booking-info">
                      <div className="booking-name">{booking.userName || 'User'}</div>
                      <div className="booking-time">
                        {booking.startTime || '—'} - {booking.endTime || '—'}
                      </div>
                    </div>
                    <span
                      className="booking-status"
                      style={{
                        color: statusColor,
                        fontWeight: '600',
                        fontSize: '12px',
                        textTransform: 'uppercase',
                      }}
                    >
                      ● {booking.status || 'Unknown'}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                No recent bookings found
              </div>
            )}
          </div>
          <button 
            className="view-all-btn" 
            onClick={() => navigate(`/admin/bookings?vendorId=${vendor._id}`)}
          >
            View all bookings
          </button>
        </div>

        {/* Subscription History - From Backend */}
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
              {subscriptionHistory.map((sub, index) => {
                const isActive = sub.status?.toLowerCase() === 'active';
                return (
                  <div key={sub._id || index} className={`subscription-item ${isActive ? 'active' : 'expired'}`}>
                    <div className="sub-top-row">
                      <div>
                        <div className="sub-plan">{sub.plan}</div>
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
                      <span className={`sub-status-badge ${isActive ? 'active' : 'expired'}`}>
                        {isActive ? '● ACTIVE' : '● EXPIRED'}
                      </span>
                    </div>
                  </div>
                );
              })}
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