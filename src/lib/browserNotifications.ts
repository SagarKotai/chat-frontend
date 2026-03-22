import { env } from '@/lib/env';

let serviceWorkerRegistrationPromise: Promise<ServiceWorkerRegistration | undefined> | null = null;

const supportsBrowserNotifications = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

const supportsServiceWorker = (): boolean => {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
};

const getServiceWorkerRegistration = async (): Promise<ServiceWorkerRegistration | undefined> => {
  if (!supportsServiceWorker()) return undefined;

  if (!serviceWorkerRegistrationPromise) {
    serviceWorkerRegistrationPromise = navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.getRegistration())
      .catch(() => undefined);
  }

  return serviceWorkerRegistrationPromise;
};

export const initBrowserNotifications = async (): Promise<void> => {
  if (!supportsBrowserNotifications()) return;

  await getServiceWorkerRegistration();

  if (Notification.permission === 'default') {
    try {
      await Notification.requestPermission();
    } catch {
      // Browser blocked the permission prompt.
    }
  }
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const padded = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`;
  const normalized = padded.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0))).buffer;
};

export const ensurePushSubscription = async (accessToken: string): Promise<void> => {
  if (!supportsBrowserNotifications()) return;
  if (!env.vapidPublicKey) return;

  await initBrowserNotifications();
  if (Notification.permission !== 'granted') return;

  const registration = await getServiceWorkerRegistration();
  if (!registration) return;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToArrayBuffer(env.vapidPublicKey),
    }));

  await fetch(`${env.apiBaseUrl}/notifications/push/subscribe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ subscription: subscription.toJSON() }),
  });
};

export const showBrowserNotification = async (
  title: string,
  options?: NotificationOptions,
): Promise<void> => {
  if (!supportsBrowserNotifications()) return;
  if (Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return;

  const registration = await getServiceWorkerRegistration();
  if (registration) {
    await registration.showNotification(title, {
      icon: '/vite.svg',
      badge: '/vite.svg',
      ...options,
    });
    return;
  }

  new Notification(title, options);
};
