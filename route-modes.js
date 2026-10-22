// Distances honnêtes + itinéraire à pied / à vélo / en transports.
// - « À 2,3 km de toi » si la position est connue, sinon « du centre de <ville> ».
// - Fenêtre Itinéraire : onglets 🚶 À pied · 🚲 Vélo (tracé réel sur la carte pour pied et vélo,
//   pas de métro pour le moment).
// Pour tout annuler : retirer la ligne <script src="route-modes.js"> dans index.html.
(function () {
  "use strict";
  var MODES = {
    foot: { ico: "🚶", label: "À pied", srv: "routed-foot", speed: 5, color: "#E85D3D" },
    bike: { ico: "🚲", label: "Vélo", srv: "routed-bike", speed: 15, color: "#2A9D8F" }
  };
  var cur = "foot", ev = null, from = null, token = 0;

  function fmtMin(m) {
    m = Math.max(1, Math.round(m));
    if (m < 60) return m + " min";
    var h = Math.floor(m / 60), r = m % 60;
    return h + " h" + (r ? " " + (r < 10 ? "0" : "") + r : "");
  }
  function fmtKm(k) { return k < 1 ? Math.round(k * 1000) + " m" : (Math.round(k * 10) / 10).toString().replace(".", ",") + " km"; }
  // à vol d'oiseau × 1,3 = distance réelle moyenne par les rues
  function est(distKm, mode) { return (distKm * 1.3 / MODES[mode].speed) * 60; }

  // texte de la fiche : distance + temps adaptés à la distance
  window.__wzDistLine = function (e) {
    var d = distanceToEvent(e);
    var who = state.userPos ? "de toi" : "du centre-ville";
    var s = "📍 À " + fmtKm(d) + " " + who;
    if (d <= 3) s += " · 🚶 " + fmtMin(est(d, "foot")) + " · 🚲 " + fmtMin(est(d, "bike"));
    else if (d <= 25) s += " · 🚲 " + fmtMin(est(d, "bike"));
    return s;
  };

  function el(id) { return document.getElementById(id); }
  function status(t) { var s = el("itinerary-status"); if (s) s.textContent = t; }

  function buildUI() {
    var modal = el("itinerary-modal");
    if (!modal || el("wz-rt-tabs")) return;
    var h = modal.querySelector("h3"); if (h) h.textContent = "🧭 Comment y aller";
    var tabs = document.createElement("div");
    tabs.id = "wz-rt-tabs";
    tabs.innerHTML = '<button type="button" data-m="foot" class="on">🚶 À pied</button><button type="button" data-m="bike">🚲 Vélo</button>';
    var map = el("itinerary-map"); map.parentNode.insertBefore(tabs, map);
    var loc = document.createElement("button");
    loc.type = "button"; loc.id = "wz-rt-loc"; loc.hidden = true;
    loc.textContent = "📍 Me localiser";
    loc.addEventListener("click", locate);
    map.parentNode.insertBefore(loc, map);
    var css = document.createElement("style");
    css.textContent = "#wz-rt-tabs{display:flex;gap:6px;margin:0 0 10px}#wz-rt-tabs button{flex:1;padding:10px 4px;border-radius:12px;border:1.5px solid #D5DAE6;background:#fff;color:#14213D;font:700 13px/1.2 inherit;cursor:pointer}#wz-rt-tabs button.on{background:#E85D3D;border-color:#E85D3D;color:#fff}" +
      "";
    css.textContent += "#wz-rt-loc{display:block;width:100%;margin:0 0 10px;padding:12px;border-radius:14px;border:0;background:#E8655A;color:#fff;font:700 14px/1.2 inherit;cursor:pointer}#wz-rt-loc[disabled]{opacity:.6}#wz-rt-loc[hidden]{display:none}";
    css.textContent += "#itinerary-gmaps-btn{display:none!important}";
    css.textContent += "#wz-rt-full{position:absolute;top:10px;right:10px;z-index:1000;width:40px;height:40px;border-radius:12px;border:0;background:#fff;color:#14213D;font-size:20px;line-height:1;box-shadow:0 2px 8px rgba(0,0,0,.28);cursor:pointer}#itinerary-map{position:relative}#itinerary-map.wz-full{position:fixed!important;top:0;left:0;right:0;bottom:0;width:100%!important;height:100%!important;max-height:none!important;margin:0!important;border-radius:0!important;z-index:2147483000}#itinerary-map.wz-full #wz-rt-full{top:calc(env(safe-area-inset-top,0px) + 12px);right:12px;width:auto;padding:0 14px;font:700 14px/40px inherit}";
    document.head.appendChild(css);
    var fb = document.createElement("button");
    fb.type = "button"; fb.id = "wz-rt-full"; fb.setAttribute("aria-label", "Agrandir la carte"); fb.textContent = "⤢";
    function fixFs() { setTimeout(function () { if (typeof __itineraryMap !== "undefined" && __itineraryMap) __itineraryMap.invalidateSize(); }, 120); }
    function setFull(on) {
      map.classList.toggle("wz-full", on);
      fb.textContent = on ? "✕ Réduire" : "⤢";
      fb.setAttribute("aria-label", on ? "Réduire la carte" : "Agrandir la carte");
      fixFs();
    }
    fb.addEventListener("click", function (e) { e.stopPropagation(); setFull(!map.classList.contains("wz-full")); });
    ["mousedown","dblclick","touchstart"].forEach(function (t) { fb.addEventListener(t, function (e) { e.stopPropagation(); }); });
    map.appendChild(fb);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && map.classList.contains("wz-full")) { setFull(false); e.stopPropagation(); } }, true);
    new MutationObserver(function () { if (modal.classList.contains("hidden") && map.classList.contains("wz-full")) setFull(false); }).observe(modal, { attributes: true, attributeFilter: ["class"] });
    tabs.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-m]"); if (!b) return;
      select(b.getAttribute("data-m"));
    });
  }

  function select(m) {
    cur = m;
    [].forEach.call(document.querySelectorAll("#wz-rt-tabs button"), function (b) { b.classList.toggle("on", b.getAttribute("data-m") === m); });
    el("itinerary-map").style.display = "";
    var gm = el("itinerary-gmaps-btn"); if (gm) gm.style.display = "none";
    draw(m);
  }

  function lineFallback(m, why) {
    var map = ensureItineraryMap(); if (!map) return;
    __itineraryMarkers.clearLayers();
    var ref = from || referencePoint();
    L.marker([ref.lat, ref.lng], { icon: userLocationIcon() }).addTo(__itineraryMarkers);
    L.marker([ev.lat, ev.lng]).addTo(__itineraryMarkers);
    var line = L.polyline([[ref.lat, ref.lng], [ev.lat, ev.lng]], { color: MODES[m].color, weight: 3, dashArray: "6 6" }).addTo(__itineraryMarkers);
    map.fitBounds(line.getBounds(), { padding: [30, 30] });
    setTimeout(function () { if (__itineraryMap) __itineraryMap.invalidateSize(); }, 80);
    var d = distanceToEvent(ev);
    status((why ? why + " " : "") + "À vol d'oiseau : " + fmtKm(d) + " (~" + fmtMin(est(d, m)) + " " + (m === "bike" ? "à vélo" : "à pied") + ").");
  }

  function showLoc() { var b = el("wz-rt-loc"); if (b) b.hidden = !!from; }
  function locate() {
    var b = el("wz-rt-loc");
    if (!navigator.geolocation) { status("Ton appareil ne permet pas la localisation."); return; }
    if (b) { b.disabled = true; b.textContent = "📍 Localisation…"; }
    navigator.geolocation.getCurrentPosition(function (p) {
      state.userPos = { lat: p.coords.latitude, lng: p.coords.longitude };
      from = state.userPos;
      if (b) { b.disabled = false; b.textContent = "📍 Me localiser"; }
      select(cur);
    }, function (err) {
      if (b) { b.disabled = false; b.textContent = "📍 Me localiser"; }
      status(err && err.code === 1
        ? "Localisation refusée. Sur iPhone : Réglages > Confidentialité et sécurité > Service de localisation > Safari, puis réessaie."
        : "Position introuvable pour le moment. Réessaie dans un endroit dégagé.");
    }, { timeout: 10000, enableHighAccuracy: true });
  }

  function draw(m) {
    var my = ++token;
    showLoc();
    if (!from) { lineFallback(m, "Active ta position pour voir le trajet exact."); return; }
    status("Calcul de l'itinéraire…");
    var u = "https://routing.openstreetmap.de/" + MODES[m].srv + "/route/v1/driving/" + from.lng + "," + from.lat + ";" + ev.lng + "," + ev.lat + "?overview=full&geometries=geojson";
    fetch(u).then(function (r) { return r.json(); }).then(function (j) {
      if (my !== token) return;
      var rt = j && j.routes && j.routes[0];
      if (!rt || !rt.geometry) throw new Error("none");
      var map = ensureItineraryMap(); if (!map) return;
      __itineraryMarkers.clearLayers();
      var ll = rt.geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
      L.marker([from.lat, from.lng], { icon: userLocationIcon() }).addTo(__itineraryMarkers);
      L.marker([ev.lat, ev.lng]).addTo(__itineraryMarkers);
      var line = L.polyline(ll, { color: MODES[m].color, weight: 4 }).addTo(__itineraryMarkers);
      map.fitBounds(line.getBounds(), { padding: [30, 30] });
      setTimeout(function () { if (__itineraryMap) __itineraryMap.invalidateSize(); }, 80);
      // la vitesse du serveur est celle d'une voiture sur certains profils : on recalcule le temps avec la distance réelle
      var km = rt.distance / 1000;
      status(MODES[m].ico + " " + fmtKm(km) + " · ~" + fmtMin((km / MODES[m].speed) * 60) + (m === "bike" ? " à vélo" : " à pied"));
    }).catch(function () {
      if (my !== token) return;
      lineFallback(m, "Tracé indisponible pour le moment.");
    });
  }

  window.__wzOpenRoute = function () {
    var e = allEvents().find(function (x) { return x.id === state.currentEventId; });
    if (!e || !e.lat || !e.lng) return;
    ev = e; buildUI();
    var modal = el("itinerary-modal"); modal.classList.remove("hidden");
    from = state.userPos || null;
    cur = "foot"; if (distanceToEvent(e) > 6) cur = "bike";
    var go = function () { select(cur); };
    if (from) { go(); return; }
    status("Localisation en cours…");
    el("itinerary-map").style.display = "";
    ensureItineraryMap();
    if (!navigator.geolocation) { go(); return; }
    navigator.geolocation.getCurrentPosition(function (p) {
      state.userPos = { lat: p.coords.latitude, lng: p.coords.longitude };
      from = state.userPos; go();
    }, function () { go(); }, { timeout: 8000 });
  };
})();
