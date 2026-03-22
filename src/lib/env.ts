export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5001/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5001',
  turnUrl: import.meta.env.VITE_TURN_URL ?? '',
  turnUsername: import.meta.env.VITE_TURN_USERNAME ?? '',
  turnCredential: import.meta.env.VITE_TURN_CREDENTIAL ?? '',
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '',
};
