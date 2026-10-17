// « Je ne sais pas quoi faire » : 2 questions (quand ? quoi ?) -> 3 idées classées (pas tirées au hasard).
(function () {
  var WHEN = [["now", "Maintenant"], ["tonight", "Ce soir"], ["tomorrow", "Demain"], ["weekend", "Ce week-end"]];
  // mêmes catégories que « Que se passe-t-il ? » sur l'accueil, Musées en premier
  var WANT = [
    ["musee", "🏛️ Musées", ["À voir"]],
    ["musique", "🎵 Musique", ["Musique"]],
    ["soiree", "🎟️ Soirées", ["Soirée"]],
    ["spectacle", "🎭 Spectacles", ["Spectacles"]],
    ["famille", "👨‍👩‍👧 Famille", ["Famille"]],
    ["marche", "🛍️ Marché", ["Marché"]],
    ["brocante", "🧺 Brocante", ["Brocante"]],
    ["festival", "🎪 Festival", ["Festival"]],
    ["sport", "⚽ Sport", ["Sport"]],
    ["bar", "🍸 Bar", ["Bar"]],
    ["expo", "🖼️ Expos & visites", ["Expo"]],
    ["autres", "✨ Autres sorties", ["Divers"]],
    ["bons", "🏷️ Bons plans", ["Bons plans"]],
    ["any", "🎲 Peu importe", null]
  ];
  var S = { when: null, want: [], zone: "city", offset: 0, ranked: [] };

  function iso(d) { return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); }
  function today() { return iso(new Date()); }
  function plus(n) { return iso(new Date(Date.now() + n * 86400000)); }
  function mins(t) { var p = String(t || "").split(":"); var h = parseInt(p[0], 10); if (isNaN(h)) return null; return h * 60 + (parseInt(p[1], 10) || 0); }
  function nowMin() { var n = new Date(); return n.getHours() * 60 + n.getMinutes(); }
  function hh(t) { var m = mins(t); if (m == null) return ""; return String(Math.floor(m / 60)).padStart(2, "0") + " h " + String(m % 60).padStart(2, "0"); }
  function weekendDates() {
    var out = [];
    for (var i = 0; i <= 7; i++) { var d = plus(i), w = new Date(d + "T12:00:00").getDay(); if (w === 6 || w === 0) out.push(d); if (out.length === 2 || (w === 0 && out.length >= 1)) break; }
    return out;
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function pool() {
    var ref = referencePoint(), out = [];
    allEvents().forEach(function (ev) {
      if (!ev.lat || !ev.lng) return;
      if (state.userPos ? false : ev.city !== state.city) return;
      var d = haversineKm(ref.lat, ref.lng, ev.lat, ev.lng);
      if (state.userPos && d > Math.max(state.radiusKm || 20, 20)) return;
      if (S.zone === "near" && d > 2) return;
      var o = {}; for (var k in ev) o[k] = ev[k]; o.distance = d; out.push(o);
    });
    return out;
  }
  function wantOk(ev) {
    if (!S.want.length || S.want.indexOf("any") !== -1) return ev.category !== "Divers" && ev.category !== "Brocante";
    return S.want.some(function (k) { var w = WANT.filter(function (x) { return x[0] === k; })[0]; if (!(w && w[2] && w[2].indexOf(ev.category) !== -1)) return false; if (k === "musee") return isMuseum(ev); return true; });
  }
  // « Musées » = vrais musées et grands monuments (pas les églises, salles de sport, boutiques…)
  var MUSEUM_RE = /(mus[eé]e|museum|mus[eé]um|galerie|fondation|centre d.art|ch[aâ]teau|panth[eé]on|catacombes|tour eiffel|arc de triomphe|sainte.chapelle|cath[eé]drale|basilique|abbaye|conciergerie|invalides|op[eé]ra garnier)/i;
  var FAMOUS_RE = /(louvre|orsay|pompidou|orangerie|rodin|quai branly|picasso|carnavalet|cluny|grand palais|notre.dame|tour eiffel|arc de triomphe|sainte.chapelle|panth[eé]on|invalides|conciergerie|catacombes|versailles|op[eé]ra garnier)/i;
  var NOT_MUSEUM_RE = /(librairie|boutique|caf[eé]|restaurant|parking|h[oô]tel|office de tourisme)/i;
  function isMuseum(ev) {
    var t = String(ev.title || "");
    return MUSEUM_RE.test(t) && !NOT_MUSEUM_RE.test(t);
  }
  // renvoie { label, score } ou null si la sortie ne convient pas au moment choisi
  function timing(ev) {
    var n = nowMin(), t = today();
    if (ev.isPlace || !ev.date) {
      // lieux ouverts (bars, sites à visiter) : seulement pour maintenant / ce soir
      if (S.when === "now" || S.when === "tonight") return { label: "Toujours ouvert", score: 200 };
      if (ev.category === "À voir") return { label: "À visiter · vérifie les horaires", score: 350 };   // musées : proposés aussi demain et ce week-end
      return null;
    }
    var m = mins(ev.time);
    if (S.when === "now") {
      if (ev.date !== t || m == null) return null;
      if (m < n - 30 || m > n + 180) return null;
      var d = m - n;
      return { label: d > 5 ? "Commence dans " + d + " min · " + hh(ev.time) : "En ce moment · depuis " + hh(ev.time), score: Math.max(0, d) };
    }
    if (S.when === "tonight") {
      if (ev.date !== t || m == null) return null;
      if (m < Math.max(n - 30, 17 * 60)) return null;
      return { label: "Ce soir · " + hh(ev.time), score: Math.max(0, m - n) };
    }
    if (S.when === "tomorrow") {
      if (ev.date !== plus(1) || m == null) return null;
      if (m < 9 * 60) return null;
      return { label: "Demain · " + hh(ev.time), score: 300 + m / 10 };
    }
    if (S.when === "weekend") {
      var wk = weekendDates(); if (wk.indexOf(ev.date) === -1 || m == null || m < 9 * 60) return null;
      var day = new Date(ev.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long" });
      return { label: day.charAt(0).toUpperCase() + day.slice(1) + " · " + hh(ev.time), score: 300 + wk.indexOf(ev.date) * 100 + m / 10 };
    }
    return null;
  }
  function rank() {
    var res = [];
    pool().forEach(function (ev) {
      if (!wantOk(ev)) return;
      var tm = timing(ev); if (!tm) return;
      var real = ev.photo && !ev.photoGeneric && !ev.photoVenue;
      var sc = tm.score * 0.6 + ev.distance * 12 - (real ? 60 : ev.photoVenue ? 30 : 0) - (ev.isPlace ? 0 : 25);
      res.push({ ev: ev, label: tm.label, score: sc });
    });
    // lieux très connus : ils passent devant (Louvre, Orsay, Notre-Dame…)
    res.forEach(function (r) { if (r.ev.isPlace && FAMOUS_RE.test(String(r.ev.title || ""))) r.score -= 90; });
    res.sort(function (a, b) { return a.score - b.score; });
    // pas deux fois le même endroit ni la même photo (ex. « Musée X » et « Jardin du musée X »)
    var locSeen = {}, phSeen = {};
    res = res.filter(function (r) {
      var e = r.ev, lk = e.lat && e.lng ? (+e.lat).toFixed(3) + "," + (+e.lng).toFixed(3) : "t:" + String(e.title || "").toLowerCase().slice(0, 30);
      var pk = e.photo ? String(e.photo).split("?")[0] : "";
      if (locSeen[lk] || (pk && phSeen[pk])) return false;
      locSeen[lk] = 1; if (pk) phSeen[pk] = 1; return true;
    });
    // variété : on évite 3 fois la même catégorie quand on peut
    var out = [], seen = {};
    res.forEach(function (r) { var c = r.ev.category; if ((seen[c] || 0) < 2) { out.push(r); seen[c] = (seen[c] || 0) + 1; } });
    res.forEach(function (r) { if (out.indexOf(r) === -1) out.push(r); });
    return out;
  }

  function root() {
    var r = document.getElementById("wz-idea");
    if (!r) { r = document.createElement("div"); r.id = "wz-idea"; r.setAttribute("role", "dialog"); r.setAttribute("aria-label", "Je ne sais pas quoi faire"); document.body.appendChild(r); }
    return r;
  }
  function close() { var r = document.getElementById("wz-idea"); if (r) r.remove(); document.body.classList.remove("wz-idea-open"); }
  function steps(n) { return '<div class="wz-i-steps">' + [1, 2, 3].map(function (i) { return '<i class="' + (i <= n ? "on" : "") + '"></i>'; }).join("") + "</div>"; }
  function head(n) { return '<button type="button" class="wz-i-x" data-i="close" aria-label="Fermer">✕</button>' + steps(n); }

  function screenAsk() {
    var r = root();
    var h = head(S.when ? 2 : 1) + '<div class="wz-i-k">Je ne sais pas quoi faire</div><h1>Quand es-tu libre ?</h1><div class="wz-i-sub">On ne te propose que ce qui se passe vraiment.</div><div class="wz-i-row">';
    WHEN.forEach(function (w) { h += '<button type="button" class="wz-i-c' + (S.when === w[0] ? " on" : "") + '" data-i="when" data-v="' + w[0] + '">' + w[1] + "</button>"; });
    h += '</div><div class="wz-i-lab">Plutôt quoi ? <small>(plusieurs choix possibles)</small></div><div class="wz-i-row">';
    WANT.forEach(function (w) { h += '<button type="button" class="wz-i-c' + (S.want.indexOf(w[0]) !== -1 ? " on" : "") + '" data-i="want" data-v="' + w[0] + '">' + w[1] + "</button>"; });
    h += '</div><div class="wz-i-lab">Autour de moi</div><div class="wz-i-row"><button type="button" class="wz-i-c' + (S.zone === "near" ? " on" : "") + '" data-i="zone" data-v="near">Dans mon quartier</button><button type="button" class="wz-i-c' + (S.zone === "city" ? " on" : "") + '" data-i="zone" data-v="city">Dans la ville</button></div>';
    h += '<div class="wz-i-spacer"></div><button type="button" class="wz-i-go" data-i="go"' + (S.when ? "" : " disabled") + ">Trouve-moi une idée ✨</button>";
    r.innerHTML = h;
  }

  function card(x, big) {
    var ev = x.ev, color = (typeof CATEGORY_COLORS !== "undefined" && CATEGORY_COLORS[ev.category]) || "#6C757D", icon = (typeof CATEGORY_ICONS !== "undefined" && CATEGORY_ICONS[ev.category]) || "📍";
    var price = typeof eventPriceType === "function" ? eventPriceType(ev) : "";
    var dist = ev.distance <= 3 ? Math.max(2, Math.round(ev.distance * 12 / 5) * 5) + " min à pied" : ev.distance.toFixed(1).replace(".", ",") + " km";
    var venue = ev.place ? String(ev.place).split(",")[0] : "";
    return '<button type="button" class="wz-i-card' + (big ? " big" : "") + '" data-i="open" data-id="' + esc(ev.id) + '"><div class="wz-i-ph">' + eventPhotoHTML(ev) +
      '<span class="wz-i-pill" style="--c:' + color + '">' + icon + " " + esc(String(ev.category).toUpperCase()) + (price === "free" ? " · Gratuit" : "") + '</span></div>' +
      '<div class="wz-i-bd"><div class="wz-i-t">' + esc(ev.title) + '</div><div class="wz-i-v">' + esc(venue) + (venue ? " · " : "") + dist + '</div><div class="wz-i-why">' + esc(x.label) + '</div>' + (ev.lat && ev.lng ? '<span role="button" tabindex="0" class="wz-i-route" data-i="route" data-id="' + esc(ev.id) + '" style="display:inline-block;margin-top:10px;padding:8px 14px;border-radius:999px;background:#E85D3D;color:#fff;font:800 13px inherit;font-family:inherit;cursor:pointer">🚶 Itinéraire</span>' : "") + "</div></button>";
  }
  function screenResult() {
    var r = root(), lst = S.ranked.slice(S.offset, S.offset + 3);
    var wl = (WHEN.filter(function (w) { return w[0] === S.when; })[0] || [0, ""])[1].toLowerCase();
    if (!lst.length) {
      var nextW = { now: ["tonight", "Voir ce soir"], tonight: ["tomorrow", "Voir demain"], tomorrow: ["weekend", "Voir ce week-end"] }[S.when];
      r.innerHTML = head(3) + '<div class="wz-i-k">Aucune sortie pour ce moment</div><h1>' + (S.offset ? "Plus d’autres idées" : "Rien de prévu " + (S.when === "now" ? "maintenant" : S.when === "tonight" ? "ce soir" : S.when === "tomorrow" ? "demain" : "ce week-end")) + '</h1><div class="wz-i-sub">' + (nextW ? "Mais on peut regarder plus tard : il y a sûrement de quoi faire." : "Essaie d’autres envies ou une autre zone.") + '</div><div class="wz-i-col">' +
        (nextW ? '<button type="button" class="wz-i-go" data-i="when2" data-v="' + nextW[0] + '">' + nextW[1] + "</button>" : "") +
        '<button type="button" class="wz-i-alt" data-i="again">Changer mes envies</button></div>';
      return;
    }
    r.innerHTML = head(3) + '<div class="wz-i-k">Tes idées · ' + esc(wl) + "</div><h1>" + (lst.length > 1 ? "On a trouvé " + lst.length + " sorties pour toi" : "On a trouvé une sortie pour toi") + "</h1>" +
      lst.map(function (x, i) { return card(x, i === 0); }).join("") +
      (S.ranked.length > S.offset + 3 ? '<button type="button" class="wz-i-alt" data-i="more">🔄 Voir 3 autres idées</button>' : "") +
      '<button type="button" class="wz-i-alt ghost" data-i="again">Changer mes réponses</button>';
    r.scrollTop = 0;
  }
  function go() { S.ranked = rank(); S.offset = 0; screenResult(); }

  // ---- itinéraire à pied, affiché dans le site (carte Leaflet + tracé) ----
  var rmap = null;
  function killMap() { if (rmap) { try { rmap.remove(); } catch (e) {} rmap = null; } }
  function findEv(id) { try { return allEvents().filter(function (e) { return String(e.id) === String(id); })[0]; } catch (e) { return null; } }
  function screenRoute(id) {
    var ev = findEv(id), r = root();
    if (!ev || !ev.lat || !ev.lng) return screenResult();
    killMap();
    r.innerHTML = head(3) + '<div class="wz-i-k">Itinéraire à pied</div><h1 style="font-size:22px">' + esc(ev.title) + '</h1>' +
      '<div id="wz-i-map" style="height:300px;border-radius:18px;overflow:hidden;background:#EEF0F4;margin:8px 0 10px"></div>' +
      '<div id="wz-i-rinfo" class="wz-i-sub" style="font-weight:700">Calcul du trajet…</div>' +
      '<button type="button" class="wz-i-alt ghost" data-i="back">← Retour aux idées</button>';
    r.scrollTop = 0;
    var box = document.getElementById("wz-i-map"), info = document.getElementById("wz-i-rinfo");
    if (typeof L === "undefined" || !L.map) { box.innerHTML = '<div style="padding:18px;font:13px system-ui;color:#6B7280">La carte n’a pas pu se charger. Vérifie ta connexion.</div>'; info.textContent = ""; return; }
    var to = [+ev.lat, +ev.lng], from = null;
    try { var ref = referencePoint(); if (ref && ref.lat && ref.lng) from = [+ref.lat, +ref.lng]; } catch (e) {}
    try {
      rmap = L.map(box, { zoomControl: true, attributionControl: false, scrollWheelZoom: false });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(rmap);
      L.marker(to, { icon: L.divIcon({ className: "", iconSize: [32, 32], iconAnchor: [16, 16], html: '<div style="width:32px;height:32px;border-radius:50%;background:#E85D3D;color:#fff;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.4);display:flex;align-items:center;justify-content:center;font-size:15px">📍</div>' }) }).addTo(rmap);
      if (from) L.circleMarker(from, { radius: 8, color: "#fff", weight: 3, fillColor: "#2563EB", fillOpacity: 1 }).addTo(rmap);
      rmap.setView(to, 15);
      setTimeout(function () { try { rmap.invalidateSize(); } catch (e) {} }, 250);
    } catch (e) { box.innerHTML = '<div style="padding:18px;font:13px system-ui;color:#6B7280">La carte n’a pas pu se charger.</div>'; return; }
    if (!from) { info.textContent = "Active ta position pour voir le trajet à pied."; return; }
    function draw(coords, txt) {
      try { var pl = L.polyline(coords, { color: "#2563EB", weight: 6, opacity: .9 }).addTo(rmap); rmap.fitBounds(pl.getBounds(), { padding: [30, 30], maxZoom: 17 }); } catch (e) {}
      info.textContent = txt;
    }
    fetch("https://router.project-osrm.org/route/v1/foot/" + from[1] + "," + from[0] + ";" + to[1] + "," + to[0] + "?overview=full&geometries=geojson")
      .then(function (x) { return x.json(); })
      .then(function (d) {
        var rt = d && d.routes && d.routes[0]; if (!rt) throw new Error("no route");
        draw(rt.geometry.coordinates.map(function (c) { return [c[1], c[0]]; }), "🚶 " + Math.max(1, Math.round(rt.distance / 80)) + " min à pied · " + (rt.distance / 1000).toFixed(1).replace(".", ",") + " km");
      })
      .catch(function () {
        var R = Math.PI / 180, dl = (to[0] - from[0]) * R, dn = (to[1] - from[1]) * R, aa = Math.sin(dl / 2) * Math.sin(dl / 2) + Math.cos(from[0] * R) * Math.cos(to[0] * R) * Math.sin(dn / 2) * Math.sin(dn / 2), m = 12742000 * Math.asin(Math.sqrt(aa));
        draw([from, to], "🚶 environ " + Math.max(1, Math.round(m * 1.3 / 80)) + " min à pied (à vol d’oiseau)");
      });
  }

  function openIdea() {
    try { var av = document.getElementById("arrival-screen-overlay"); if (av) av.remove(); } catch (e) {}
    var h = new Date().getHours();
    S = { when: h >= 18 ? "tonight" : "now", want: [], zone: "city", offset: 0, ranked: [] };
    try { showView("discover"); } catch (e) {}
    document.body.classList.add("wz-idea-open"); screenAsk();
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("#sc-surprise, #nav-idea");
    if (t) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); return openIdea(); }
    var b = e.target.closest("#wz-idea [data-i]"); if (!b) return;
    var a = b.dataset.i, v = b.dataset.v;
    if (a === "close") { killMap(); return close(); }
    if (a === "route") { e.preventDefault(); return screenRoute(b.dataset.id); }
    if (a === "back") { killMap(); return screenResult(); }
    if (a === "when") { S.when = v; return screenAsk(); }
    if (a === "when2") { S.when = v; return go(); }
    if (a === "zone") { S.zone = v; return screenAsk(); }
    if (a === "want") {
      if (v === "any") S.want = S.want.indexOf("any") !== -1 ? [] : ["any"];
      else { S.want = S.want.filter(function (x) { return x !== "any"; }); var i = S.want.indexOf(v); if (i === -1) S.want.push(v); else S.want.splice(i, 1); }
      return screenAsk();
    }
    if (a === "go") return go();
    if (a === "more") { S.offset += 3; return screenResult(); }
    if (a === "again") return screenAsk();
    if (a === "open") { var id = b.dataset.id; close(); try { openDetail(id); } catch (x) {} }
  }, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  window.__wzIdeaOpen = openIdea;
  // l'ancien parcours « Étape 1/2 » (guided-quest.js) est remplacé : ses accès ouvrent maintenant celui-ci
  try { Object.defineProperty(window, "__questOpen", { configurable: true, get: function () { return openIdea; }, set: function () {} }); } catch (e) {}
})();
