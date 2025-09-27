import { configureStore } from '@reduxjs/toolkit';
import userRoleReducer from './userRoleSlice';
import apiDataReducer from './apiDataSlice';
import { influencerReducer, scrollPositionReducer } from '@/components/manage-influencer-list';
import { campaignReducer, campaignScrollPositionReducer } from '@/components/manage-campaign-list';
import influencerCacheReducer from './influencerCacheSlice';

// Configure the Redux store
export const store = configureStore({
  reducer: {
    // Add userRole reducer to the store
    userRole: userRoleReducer,
    apiData: apiDataReducer,
    // New dedicated influencer management
    influencer: influencerReducer,
    scrollPosition: scrollPositionReducer,
    // New dedicated campaign management
    campaign: campaignReducer,
    campaignScrollPosition: campaignScrollPositionReducer,
    // Influencer cache for VirtualInfluencerList
    influencerCache: influencerCacheReducer,
  },
  // Enable Redux DevTools in development
  devTools: process.env.NODE_ENV !== 'production',
});

// Export types for TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 