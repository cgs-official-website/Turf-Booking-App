import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import vendorReducer from './vendorSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    vendor: vendorReducer,
  },
});
