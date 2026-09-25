// ---- notifications push (Firebase Cloud Messaging) ----
// Le SDK Messaging a besoin d'un contexte Firebase dans le service worker pour afficher les
// notifications reçues quand l'appli est en arrière-plan ou fermée. On réutilise ce service
// worker existant plutôt que d'en enregistrer un second (firebase-messaging-sw.js), pour éviter
// deux service workers qui se disputent le même scope.
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCBF51BEU354GbcIAcDVoTSwQHrZ7xHCWQ",
  authDomain: "whazup-46bb4.firebaseapp.com",
  projectId: "whazup-46bb4",
  storageBucket: "whazup-46bb4.firebasestorage.app",
  messagingSenderId: "371962234007",
  appId: "1:371962234007:web:037414d1d756c6b66c15d2"
});

try {
  const messaging = firebase.messaging();
  messaging.onBackgroundMessage(function (payload) {
    const n = payload.notification || {};
    self.registration.showNotification(n.title || "Whazup", {
      body: n.body || "",
      icon: "/logo-192.png",
      badge: "/logo-192.png",
    });
  });
} catch (e) {
  console.error("Erreur messagerie push (arrière-plan) :", e);
}

const CACHE_NAME = "whazup-cache-v18";

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/logo.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// Stratégie "réseau d'abord, cache en secours" :
// on va toujours chercher la dernière version en ligne, et on ne se
// rabat sur le cache que si la requête réseau échoue (hors connexion).
// Ça évite d'avoir à lister chaque nouveau fichier ou à changer de
// version à chaque mise à jour.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
        fetch(event.request, { cache: "no-cache" })
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});
