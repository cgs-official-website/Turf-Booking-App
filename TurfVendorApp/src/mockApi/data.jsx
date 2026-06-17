// Static mock data
export const vendors = [
  { id: 'V001', name: 'Rahul Sharma', phone: '+91 98765 43210', email: 'rahul@turf.com',
    location: 'Mumbai, MH', status: 'Active',
    business: { type: 'Sole Proprietor', registration: 'GST29ABCDE1234F1Z5', docs: ['PAN Card', 'GST Cert'] },
    subscription: { plan: 'Pro', start: '2025-01-15', expiry: '2026-01-15', status: 'Active' } },
];

export const turfs = [
  { id: 'T001', name: 'Greenfield Arena', sport: 'Football', location: 'Andheri, Mumbai',
    specs: '5-a-side, Artificial turf, Floodlights', status: 'Pending', vendorId: 'V001',
    docs: [{ name: 'Ownership Proof.pdf' }, { name: 'Trade License.pdf' }] },
  { id: 'T005', name: 'Kick Off Turf', sport: 'Football', location: 'Powai, Mumbai',
    specs: '7-a-side, FIFA approved', status: 'Approved', vendorId: 'V001',
    docs: [{ name: 'Docs.pdf' }] },
];

export const bookings = [
  { id: 'B1001', turf: 'Greenfield Arena', player: 'Vikas P.', time: '2026-06-12 18:00', status: 'Active' },
  { id: 'B1005', turf: 'Greenfield Arena', player: 'Rohit M.', time: '2026-06-14 17:00', status: 'Pending' },
  { id: 'B1004', turf: 'Kick Off Turf', player: 'Meera T.', time: '2026-06-11 20:00', status: 'Rejected' },
];

export const plans = [
  { id: 'P1', name: 'Basic', price: 999, duration: '1 month', features: 'Up to 1 turf\nEmail support\nBasic analytics' },
  { id: 'P2', name: 'Pro', price: 4999, duration: '6 months', features: 'Up to 5 turfs\nPriority support\nAdvanced analytics' },
  { id: 'P3', name: 'Enterprise', price: 14999, duration: '1 year', features: 'Unlimited turfs\n24/7 support\nDedicated manager' },
];
