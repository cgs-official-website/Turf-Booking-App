import { createSlice } from '@reduxjs/toolkit';

const vendorSlice = createSlice({
  name: 'vendor',
  initialState: {
    turfs: [],
    bookings: [],
  },
  reducers: {
    setTurfs: (state, action) => {
      state.turfs = action.payload;
    },
    setBookings: (state, action) => {
      state.bookings = action.payload;
    },
  },
});

export const { setTurfs, setBookings } = vendorSlice.actions;
export default vendorSlice.reducer;
