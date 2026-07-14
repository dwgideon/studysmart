/* global clients */
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  event.waitUntil(self.registration.showNotification(
    payload.title || "StudySmart safety alert",
    {
      body: payload.body || "A secure safety alert needs your attention.",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: "studysmart-safety",
      renotify: true,
      data: { url: payload.url || "/community" },
    }
  ));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/community";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true })
    .then((windows) => {
      const existing = windows.find((client) => client.url.includes("/community"));
      return existing ? existing.focus() : clients.openWindow(target);
    }));
});
