// Static mock data
export const vendors = [
  { id: 'V001', name: 'Rahul Sharma', phone: '+91 98765 43210', email: 'rahul@turf.com',
    location: 'Mumbai, MH', status: 'Active',
    business: { type: 'Sole Proprietor', registration: 'GST29ABCDE1234F1Z5', docs: ['PAN Card', 'GST Cert'] },
    subscription: { plan: 'Pro', start: '2025-01-15', expiry: '2026-01-15', status: 'Active' } },
  { id: 'V002', name: 'Priya Verma', phone: '+91 99887 12345', email: 'priya@play.in',
    location: 'Pune, MH', status: 'Active',
    business: { type: 'Pvt Ltd', registration: 'CIN U74999PN2020', docs: ['Incorporation', 'PAN'] },
    subscription: { plan: 'Basic', start: '2025-03-01', expiry: '2026-03-01', status: 'Active' } },
  { id: 'V003', name: 'Arjun Mehta', phone: '+91 90909 11223', email: 'arjun@kicks.in',
    location: 'Bangalore, KA', status: 'Inactive',
    business: { type: 'LLP', registration: 'AAB-1234', docs: ['LLP Deed'] },
    subscription: { plan: 'Pro', start: '2024-08-10', expiry: '2025-08-10', status: 'Expired' } },
  { id: 'V004', name: 'Sneha Iyer', phone: '+91 88776 55443', email: 'sneha@turfx.com',
    location: 'Chennai, TN', status: 'Active',
    business: { type: 'Sole Proprietor', registration: 'GST33XYZAB9876C2Y4', docs: ['PAN', 'Aadhar'] },
    subscription: { plan: 'Enterprise', start: '2025-05-20', expiry: '2026-05-20', status: 'Active' } },
];

export const turfs = [
  { id: 'T001', name: 'Greenfield Arena', sport: 'Football', location: 'Andheri, Mumbai',
    specs: '5-a-side, Artificial turf, Floodlights', status: 'Pending', vendorId: 'V001',
    docs: [{ name: 'Ownership Proof.pdf' }, { name: 'Trade License.pdf' }] },
  { id: 'T002', name: 'Smash Court', sport: 'Cricket', location: 'Baner, Pune',
    specs: 'Box cricket, Net pitch, 6 players', status: 'Approved', vendorId: 'V002',
    docs: [{ name: 'Lease Agreement.pdf' }, { name: 'ID Proof.pdf' }] },
  { id: 'T003', name: 'Slam Dunk Court', sport: 'Basketball', location: 'Indiranagar, Bangalore',
    specs: 'Full court, Wooden flooring', status: 'Rejected', vendorId: 'V003',
    docs: [{ name: 'Ownership.pdf' }] },
  { id: 'T004', name: 'Ace Badminton Hub', sport: 'Badminton', location: 'Anna Nagar, Chennai',
    specs: '4 courts, Wooden, AC', status: 'Pending', vendorId: 'V004',
    docs: [{ name: 'Rent Agreement.pdf' }, { name: 'GST Cert.pdf' }] },
  { id: 'T005', name: 'Kick Off Turf', sport: 'Football', location: 'Powai, Mumbai',
    specs: '7-a-side, FIFA approved', status: 'Approved', vendorId: 'V001',
    docs: [{ name: 'Docs.pdf' }] },
];

export const bookings = [
  { id: 'B1001', turf: 'Greenfield Arena', player: 'Vikas P.', time: '2026-06-12 18:00', status: 'Active' },
  { id: 'B1002', turf: 'Smash Court', player: 'Ananya R.', time: '2026-06-12 19:00', status: 'Active' },
  { id: 'B1003', turf: 'Ace Badminton Hub', player: 'Karan S.', time: '2026-06-13 07:00', status: 'Pending' },
  { id: 'B1004', turf: 'Kick Off Turf', player: 'Meera T.', time: '2026-06-11 20:00', status: 'Rejected' },
  { id: 'B1005', turf: 'Greenfield Arena', player: 'Rohit M.', time: '2026-06-14 17:00', status: 'Pending' },
];

export const plans = [
  { id: 'P1', name: 'Basic', price: 999, duration: '1 month', features: 'Up to 1 turf\nEmail support\nBasic analytics' },
  { id: 'P2', name: 'Pro', price: 4999, duration: '6 months', features: 'Up to 5 turfs\nPriority support\nAdvanced analytics' },
  { id: 'P3', name: 'Enterprise', price: 14999, duration: '1 year', features: 'Unlimited turfs\n24/7 support\nDedicated manager' },
];

export const activeSubscriptions = vendors
  .filter(v => v.subscription.status === 'Active')
  .map(v => ({ id: v.id, plan: v.subscription.plan, start: v.subscription.start,
    expiry: v.subscription.expiry, paymentStatus: 'Success', vendor: v.name }));

export const reports = [
  { id: 'R001', reporter: 'Rohit M.', contact: '+91 98000 11111',
    description: 'Booking not confirmed despite payment.', status: 'Pending', resolution: '' },
  { id: 'R002', reporter: 'Sara K.', contact: '+91 98000 22222',
    description: 'Turf was unavailable on arrival.', status: 'Resolved', resolution: 'Refund issued.' },
  { id: 'R003', reporter: 'Imran A.', contact: '+91 98000 33333',
    description: 'Pricing mismatch with the listing.', status: 'Pending', resolution: '' },
];

export const revenue = {
  monthly: [
    { plan: 'Basic', amount: 24000 },
    { plan: 'Pro', amount: 89000 },
    { plan: 'Enterprise', amount: 145000 },
  ],
  yearly: [
    { plan: 'Basic', amount: 280000 },
    { plan: 'Pro', amount: 1050000 },
    { plan: 'Enterprise', amount: 1740000 },
  ],
  payments: [
    { txnId: 'TXN10001', vendor: 'Rahul Sharma', amount: 4999, date: '2025-01-15', status: 'Success' },
    { txnId: 'TXN10002', vendor: 'Priya Verma', amount: 999, date: '2025-03-01', status: 'Success' },
    { txnId: 'TXN10003', vendor: 'Arjun Mehta', amount: 4999, date: '2024-08-10', status: 'Failed' },
    { txnId: 'TXN10004', vendor: 'Sneha Iyer', amount: 14999, date: '2025-05-20', status: 'Success' },
  ],
};

export const loginHistory = [
  { id: 'L1', time: '2026-06-10 09:14', device: 'iPhone 15 · Safari', ip: '49.36.182.10' },
  { id: 'L2', time: '2026-06-09 18:42', device: 'MacBook · Chrome', ip: '49.36.182.10' },
  { id: 'L3', time: '2026-06-08 08:01', device: 'iPhone 15 · Safari', ip: '103.21.58.4' },
];
