
// ---- notifications simples : alerte quand de nouveaux événements apparaissent dans la ville suivie ----
function getFollowedCity(){
  return localStorage.getItem("wh_followed_city");
}
function setFollowedCity(cityKey){
  if (cityKey) localStorage.setItem("wh_followed_city", cityKey);
  else localStorage.removeItem("wh_followed_city");
  updateNotifBtn();
}
function seenEventsKey(cityKey){ return "wh_seen_events_" + cityKey; }
function loadSeenEvents(cityKey){
  try { return new Set(JSON.parse(localStorage.getItem(seenEventsKey(cityKey)) || "[]")); }
  catch(e){ return new Set(); }
}
function saveSeenEvents(cityKey, idsSet){
  localStorage.setItem(seenEventsKey(cityKey), JSON.stringify([...idsSet]));
}
function followedCityEvents(cityKey){
  return allEvents().filter(ev => ev.city === cityKey && !ev.isPlace);
}
function showLocalNotification(title, body){
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.ready.then(reg => {
    reg.showNotification(title, {
      body: body,
      icon: "/logo-192.png",
      badge: "/logo-192.png",
    });
  }).catch(err => console.error("Erreur notification :", err));
}
function checkFollowedCityForNewEvents(){
  const cityKey = getFollowedCity();
  if (!cityKey) return;
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const events = followedCityEvents(cityKey);
  const currentIds = new Set(events.map(ev => ev.id));
  const seen = loadSeenEvents(cityKey);
  const isFirstCheck = seen.size === 0;
  const newOnes = events.filter(ev => !seen.has(ev.id));
  if (!isFirstCheck && newOnes.length > 0){
    const cityName = (CITIES[cityKey] && CITIES[cityKey].name) || cityKey;
    const title = newOnes.length === 1
      ? "1 nouvel événement à " + cityName
      : newOnes.length + " nouveaux événements à " + cityName;
    const body = newOnes.slice(0, 3).map(ev => ev.title).join(" · ");
    showLocalNotification(title, body);
  }
  saveSeenEvents(cityKey, currentIds);
}
function updateNotifBtn(){
  const btn = document.getElementById("btn-notif-follow");
  if (!btn) return;
  const followed = getFollowedCity();
  const isCurrentCityFollowed = followed && followed === state.city;
  btn.textContent = isCurrentCityFollowed ? "🔔 Ville suivie" : "🔕 Suivre cette ville";
  btn.classList.toggle("chip-btn--primary", !!isCurrentCityFollowed);
}
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btn-notif-follow");
  if (!btn) return;
  btn.onclick = () => {
    if (!("Notification" in window)){
      alert("Les notifications ne sont pas prises en charge par ce navigateur.");
      return;
    }
    const followed = getFollowedCity();
    if (followed === state.city){
      setFollowedCity(null);
      return;
    }
    Notification.requestPermission().then(perm => {
      if (perm === "granted"){
        setFollowedCity(state.city);
        saveSeenEvents(state.city, new Set(followedCityEvents(state.city).map(ev => ev.id)));
      } else {
        alert("Notifications refusées. Vous pouvez les autoriser dans les réglages du navigateur.");
      }
    });
  };
});
const __renderDiscoverBase = renderDiscover;
renderDiscover = function(){
  __renderDiscoverBase();
  updateNotifBtn();
};
setTimeout(checkFollowedCityForNewEvents, 5000);
setInterval(checkFollowedCityForNewEvents, 5 * 60 * 1000);
