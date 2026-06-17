import * as D from './data';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const api = {
  login: async (email, password) => {
    await delay(600);
    if (!email || !password) throw new Error('Email and password are required');
    return { token: 'mock-token-' + Date.now(), vendor: D.vendors[0] };
  },
  
  getDashboard: async () => {
    await delay();
    return {
      totalTurfs: D.turfs.length,
      upcomingBookings: D.bookings.filter(b => b.status === 'Pending').length,
      revenueThisMonth: 12500
    };
  },

  getMyTurfs: async () => { await delay(); return [...D.turfs]; },
  getTurf: async (id) => { await delay(); return D.turfs.find(t => t.id === id); },
  addTurf: async (turf) => {
    await delay();
    const newTurf = { ...turf, id: 'T' + Date.now(), status: 'Pending', vendorId: 'V001' };
    D.turfs.push(newTurf);
    return newTurf;
  },
  
  getBookings: async () => { await delay(); return [...D.bookings]; },
  acceptBooking: async (id) => {
    await delay();
    const b = D.bookings.find(x => x.id === id);
    if (b) { b.status = 'Active'; }
    return b;
  },
  rejectBooking: async (id) => {
    await delay();
    const b = D.bookings.find(x => x.id === id);
    if (b) { b.status = 'Rejected'; }
    return b;
  },

  getPlans: async () => { await delay(); return [...D.plans]; },
  subscribeToPlan: async (planId) => {
    await delay(1000); // Simulate payment delay
    const p = D.plans.find(x => x.id === planId);
    if (!p) throw new Error('Plan not found');
    return { success: true, plan: p.name, expiry: '2027-01-01' };
  }
};
