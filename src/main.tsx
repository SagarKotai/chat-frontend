import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { store } from '@/app/store';
import { router } from '@/app/router';
import { ThemeProvider } from '@/components/theme-provider';
import { initBrowserNotifications } from '@/lib/browserNotifications';
import '@/styles/globals.css';

void initBrowserNotifications();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
);
