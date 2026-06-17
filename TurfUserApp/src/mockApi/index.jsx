import * as D from './data';

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const api = {
  login: async (email, password) => {
    await delay(600);
    if (!email || !password) throw new Error('Email and password are required');
    return { token: 'mock-token-' + Date.now(), user: { name: 'Player One', email } };
  },
  
  getTurfs: async () => { await delay(); return [...D.turfs]; },
  getTurf: async (id) => { await delay(); return D.turfs.find(t => t.id === id); },
  
  getBookings: async () => { await delay(); return [...D.bookings]; },
  bookSlot: async (turfId, date, time) => {
    await delay();
    const newBooking = {
      id: 'B' + (1000 + D.bookings.length + 1),
      turf: D.turfs.find(t => t.id === turfId)?.name || 'Unknown Turf',
      player: 'Player One',
      time: `${date} ${time}`,
      status: 'Active'
    };
    D.bookings.push(newBooking);
    return newBooking;
  },
  cancelBooking: async (id) => {
    await delay();
    const b = D.bookings.find(x => x.id === id);
    if (b) { b.status = 'Cancelled'; }
    return b;
  }
};
