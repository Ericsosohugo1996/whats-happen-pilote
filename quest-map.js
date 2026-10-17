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
        return '<div class="wz-q-row" data-i="' + i + '"><button type="button" class="wz-q-go" data-i="' + i + '" style="display:flex;align-items:center;gap:10px;width:100%;background:none;border:0;padding:0;text-align:left;cursor:pointer;color:#14213D;font:600 13px system-ui,sans-serif">' +
          '<span style="width:24px;height:24px;border-radius:50%;background:#E85D3D;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px;flex-shrink:0">' + (i + 1) + "</span>" +
          '<span style="flex:1;min-width:0">' + esc(s.title) + '</span><span class="wz-q-lbl" style="color:#E85D3D;font-size:12px;white-space:nowrap">Itinéraire ›</span></button>' +
          '<div class="wz-q-info" style="display:none;margin:4px 0 0 34px;font:500 12px system-ui,sans-serif;color:#6B7280"></div></div>';
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
      var routeLayer = null;
      function clearRoute() { if (routeLayer) { try { map.removeLayer(routeLayer); } catch (e) {} routeLayer = null; } }
      block.querySelectorAll(".wz-q-go").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var i = +btn.getAttribute("data-i"), s = list[i];
          var from = null;
          if (ref && ref.lat && ref.lng) from = [ref.lat, ref.lng];
          if (i > 0) from = [list[i - 1].lat, list[i - 1].lng];
          if (!from) from = null;
          var info = btn.parentNode.querySelector(".wz-q-info");
          block.querySelectorAll(".wz-q-info").forEach(function (n) { n.style.display = "none"; });
          info.style.display = "block"; info.textContent = "Calcul du trajet…";
          try { block.querySelector("#quest-map").scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
          clearRoute();
          var to = [s.lat, s.lng];
          function showLine(coords, txt) {
            clearRoute();
            routeLayer = L.polyline(coords, { color: "#2563EB", weight: 6, opacity: .9 }).addTo(map);
            try { map.fitBounds(routeLayer.getBounds(), { padding: [30, 30], maxZoom: 17 }); } catch (e) {}
            info.textContent = txt;
          }
          if (!from) { map.setView(to, 16); info.textContent = "Active ta position pour voir le trajet à pied."; return; }
          var url = "https://router.project-osrm.org/route/v1/foot/" + from[1] + "," + from[0] + ";" + to[1] + "," + to[0] + "?overview=full&geometries=geojson";
          fetch(url).then(function (r) { return r.json(); }).then(function (d) {
            var rt = d && d.routes && d.routes[0];
            if (!rt) throw new Error("no route");
            var coords = rt.geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
            var km = (rt.distance / 1000).toFixed(1).replace(".", ","), min = Math.max(1, Math.round(rt.distance / 80));
            showLine(coords, "🚶 " + min + " min à pied · " + km + " km");
          }).catch(function () {
            var dist = map.distance(from, to);
            showLine([from, to], "🚶 environ " + Math.max(1, Math.round(dist * 1.3 / 80)) + " min à pied (trajet à vol d’oiseau)");
          });
        });
      });
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
