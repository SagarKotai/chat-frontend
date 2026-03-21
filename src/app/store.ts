import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '@/services/baseApi';
import authReducer from '@/features/auth/authSlice';
import chatUiReducer from '@/features/chat/chatUiSlice';
import messageUiReducer from '@/features/message/messageUiSlice';
import preferencesReducer from '@/features/user/preferencesSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: authReducer,
    chatUi: chatUiReducer,
    messageUi: messageUiReducer,
    preferences: preferencesReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
