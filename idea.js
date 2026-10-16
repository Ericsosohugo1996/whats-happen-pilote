// « Je ne sais pas quoi faire » : 2 questions (quand ? quoi ?) -> 3 idées classées (pas tirées au hasard).
(function () {
  var WHEN = [["now", "Maintenant"], ["tonight", "Ce soir"], ["tomorrow", "Demain"], ["weekend", "Ce week-end"]];
  var WANT = [
    ["verre", "🍻 Boire un verre", ["Bar", "Soirée"]],
    ["musique", "🎵 Musique", ["Musique", "Festival"]],
    ["spectacle", "🎭 Spectacle", ["Spectacles"]],
    ["famille", "👨‍👩‍👧 En famille", ["Famille"]],
    ["lieu", "🏛️ Découvrir un lieu", ["À voir", "Expo"]],
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
    return S.want.some(function (k) { var w = WANT.filter(function (x) { return x[0] === k; })[0]; return w && w[2] && w[2].indexOf(ev.category) !== -1; });
  }
  // renvoie { label, score } ou null si la sortie ne convient pas au moment choisi
  function timing(ev) {
    var n = nowMin(), t = today();
    if (ev.isPlace || !ev.date) {
      // lieux ouverts (bars, sites à visiter) : seulement pour maintenant / ce soir
      if (S.when === "now" || S.when === "tonight") return { label: "Toujours ouvert", score: 200 };
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
    res.sort(function (a, b) { return a.score - b.score; });
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
      '<div class="wz-i-bd"><div class="wz-i-t">' + esc(ev.title) + '</div><div class="wz-i-v">' + esc(venue) + (venue ? " · " : "") + dist + '</div><div class="wz-i-why">' + esc(x.label) + "</div></div></button>";
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

  function openIdea() {
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
    if (a === "close") return close();
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
})();
