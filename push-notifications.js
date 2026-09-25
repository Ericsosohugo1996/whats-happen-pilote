
// ---- notifications push (vraies notifications, même appli fermée) ----
// Portée volontairement limitée à un seul cas d'usage : le rappel avant un événement marqué
// "intéressé(e)". Les alertes de proximité restent locales (elles ont besoin de la position en
// temps réel, qu'un serveur ne peut pas connaître sans que le téléphone la lui envoie en continu
// en arrière-plan — ce qu'un site web ne peut pas faire). Les nouveaux événements dans la ville
// suivie restent aussi en local pour l'instant, pour la même raison de faisabilité (ça
// demanderait de dupliquer côté serveur toutes les sources d'événements du site).
//
// Pour activer : coller la clé VAPID (Firebase Console → Paramètres du projet → Cloud Messaging
// → Configuration Web Push → « Générer une paire de clés ») ci-dessous.
const FCM_VAPID_KEY = "BHZqP1TH4g9DUqHd4hIgzAcriAVmPYEQiusRUrdFed9ATQFHnQ_PAqepoQUQLWwOVduM0j4MtL6r06cKlhwSl1o";

async function __registerPushToken(){
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  if (!("serviceWorker" in navigator)) return;
  if (typeof firebase === "undefined" || !firebase.messaging) return;
  if (!FCM_VAPID_KEY || FCM_VAPID_KEY.indexOf("COLLE_ICI") === 0) {
    console.warn("Notifications push : clé VAPID non configurée (voir push-notifications.js).");
    return;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    const messaging = firebase.messaging();
    const token = await messaging.getToken({ vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: reg });
    if (!token) return;
    const user = auth.currentUser;
    if (!user) return;
    await db.collection("users").doc(user.uid).set(
      { fcmToken: token, fcmTokenAt: Date.now(), fcmLang: (typeof currentLang !== "undefined" ? currentLang.value : "fr") },
      { merge: true }
    );
  } catch (err) {
    console.error("Erreur enregistrement notification push :", err);
  }
}

// Enregistre/rafraîchit le token au chargement si la permission est déjà accordée (session
// précédente), après un court délai pour laisser la connexion Firebase (même anonyme) s'établir.
document.addEventListener("DOMContentLoaded", () => {
  if (("Notification" in window) && Notification.permission === "granted") {
    setTimeout(__registerPushToken, 1500);
  }
});

// La permission de notification peut être demandée depuis plusieurs endroits du site (bouton
// "Suivre cette ville", etc.) ; quel que soit l'endroit, dès qu'elle est accordée on enregistre
// le token push.
if ("Notification" in window) {
  const __origRequestPermission = Notification.requestPermission.bind(Notification);
  Notification.requestPermission = function () {
    return __origRequestPermission().then(function (perm) {
      if (perm === "granted") __registerPushToken();
      return perm;
    });
  };
}

// Si un push arrive alors que l'onglet est déjà ouvert au premier plan, Firebase ne l'affiche
// pas automatiquement (ça reste au navigateur/OS quand l'onglet est en arrière-plan ou fermé) :
// on l'affiche nous-mêmes dans ce cas, avec la même fonction que les notifications locales.
document.addEventListener("DOMContentLoaded", () => {
  if (typeof firebase === "undefined" || !firebase.messaging || !firebase.messaging.isSupported || !firebase.messaging.isSupported()) return;
  try {
    firebase.messaging().onMessage(function (payload) {
      const n = payload.notification || {};
      if (typeof showLocalNotification === "function") {
        showLocalNotification(n.title || "Whazup", n.body || "");
      }
    });
  } catch (e) {
    console.error("Erreur messagerie push (premier plan) :", e);
  }
});
