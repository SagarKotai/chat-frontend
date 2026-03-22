self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || 'New Notification';
  const body = payload.body || 'Open chat to view';
  const chatId = payload.chatId;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/vite.svg',
      badge: '/vite.svg',
      data: { chatId },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const chatId = event.notification.data?.chatId;
  const targetUrl = chatId ? `/chat?chatId=${chatId}` : '/chat';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }

      return self.clients.openWindow(targetUrl);
    }),
  );
});
