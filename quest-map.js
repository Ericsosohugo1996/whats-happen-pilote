// Whazup — « Surprends-moi » : carte du parcours proposé (dans la page, comme le reste du site).
// Pour retirer cette carte : supprimer ce fichier sur GitHub.
(function () {
  "use strict";
  var map = null;
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function destroy() { if (map) { try { map.remove(); } catch (e) {} map = null; } }
  function icon(n) {
    return L.divIcon({ className: "wz-q-pin", iconSize: [32, 32], iconAnchor: [16, 16],
      html: '<div style="width:32px;height:32px;border-radius:50%;background:#E85D3D;color:#fff;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font:800 15px system-ui,sans-serif">' + n + "</div>" });
  }
  function stops(ov) {
    var out = [];
    ov.querySelectorAll(".quest-step-btn").forEach(function (b) {
      var id = b.getAttribute("data-id"), ev = null;
      try { ev = allEvents().find(function (e) { return String(e.id) === String(id); }); } catch (e) {}
      if (ev && ev.lat && ev.lng) out.push({ ev: ev, title: ev.title, lat: +ev.lat, lng: +ev.lng });
    });
    return out;
  }
  function build(ov) {
    if (ov.querySelector("#quest-map-block")) return;
    var list = stops(ov);
    var anchor = ov.querySelector("#quest-ai-btn");
    if (!list.length || !anchor) return;
    var block = document.createElement("div");
    block.id = "quest-map-block";
    block.style.cssText = "margin-top:14px;border-radius:18px;overflow:hidden;border:1px solid #E5E7EB;background:#fff;box-shadow:0 8px 20px -16px rgba(20,33,61,.4)";
    block.innerHTML =
      '<div style="padding:12px 14px 8px;font:700 13px system-ui,sans-serif;color:#14213D">🗺️ Ton parcours sur la carte</div>' +
      '<div id="quest-map" style="height:240px;background:#EEF0F4"></div>' +
      '<div style="padding:8px 14px 12px;display:flex;flex-direction:column;gap:6px">' +
      list.map(function (s, i) {
        var url = "https://www.google.com/maps/dir/?api=1&destination=" + s.lat + "," + s.lng + "&travelmode=walking";
        return '<a href="' + url + '" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:10px;text-decoration:none;color:#14213D;font:600 13px system-ui,sans-serif">' +
          '<span style="width:24px;height:24px;border-radius:50%;background:#E85D3D;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0">' + (i + 1) + "</span>" +
          '<span style="flex:1;min-width:0">' + esc(s.title) + '</span><span style="color:#E85D3D;font-size:12px;white-space:nowrap">Itinéraire ↗</span></a>';
      }).join("") + "</div>";
    anchor.parentNode.insertBefore(block, anchor);
    var box = block.querySelector("#quest-map");
    if (typeof L === "undefined" || !L.map) { box.innerHTML = '<div style="padding:18px;font:13px system-ui;color:#6B7280">La carte n’a pas pu se charger. Vérifie ta connexion.</div>'; return; }
    destroy();
    try {
      map = L.map(box, { zoomControl: true, attributionControl: false, scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
      var pts = list.map(function (s) { return [s.lat, s.lng]; });
      var ref = null;
      try { ref = referencePoint(); } catch (e) {}
      var all = pts.slice();
      if (ref && ref.lat && ref.lng) {
        L.circleMarker([ref.lat, ref.lng], { radius: 7, color: "#fff", weight: 3, fillColor: "#2563EB", fillOpacity: 1 }).addTo(map);
        all.unshift([ref.lat, ref.lng]);
      }
      if (all.length > 1) L.polyline(all, { color: "#E85D3D", weight: 4, opacity: .85, dashArray: "2 8", lineCap: "round" }).addTo(map);
      list.forEach(function (s, i) { L.marker([s.lat, s.lng], { icon: icon(i + 1), title: s.title }).addTo(map); });
      if (all.length === 1) map.setView(all[0], 15); else map.fitBounds(all, { padding: [30, 30], maxZoom: 16 });
      setTimeout(function () { try { map.invalidateSize(); } catch (e) {} }, 250);
    } catch (e) { box.innerHTML = '<div style="padding:18px;font:13px system-ui;color:#6B7280">La carte n’a pas pu se charger.</div>'; }
  }
  var pend = false;
  new MutationObserver(function () {
    if (pend) return; pend = true;
    setTimeout(function () {
      pend = false;
      var ov = document.getElementById("quest-overlay");
      if (!ov) { destroy(); return; }
      if (ov.querySelector(".quest-step-btn")) build(ov);
    }, 120);
  }).observe(document.documentElement, { childList: true, subtree: true });
})();
