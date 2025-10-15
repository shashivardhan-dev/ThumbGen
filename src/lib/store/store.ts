// lib/store/store.ts (Updated)
import "dotenv/config"
import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import channelsReducer from './features/channels/channelsSlice'
import { channelsApi } from './features/channels/channelsAPI'
import { designsApi } from "./features/designs/designsAPI"

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      channels: channelsReducer,
      channelsApi: channelsApi.reducer,
      designsApi: designsApi.reducer

    },
    middleware: (getDefaultMiddleware) => 
      getDefaultMiddleware().concat(channelsApi.middleware).concat(designsApi.middleware),
      devTools: process.env.NODE_ENV !== 'production', // ✅ enable only in dev
  })
  
  setupListeners(store.dispatch)
  return store
}

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
export type AppDispatch = AppStore['dispatch']