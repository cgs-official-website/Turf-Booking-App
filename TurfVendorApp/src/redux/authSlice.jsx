import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null,
    vendor: null,
  },
  reducers: {
    setAuth: (state, action) => {
      state.token = action.payload.token;
      state.vendor = action.payload.vendor;
    },
    logout: (state) => {
      state.token = null;
      state.vendor = null;
    },
  },
});

export const { setAuth, logout } = authSlice.actions;
export default authSlice.reducer;
