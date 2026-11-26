// ---- Temps fort Noël : un bandeau sur l'accueil qui regroupe les marchés et sorties de Noël de la ville ----
// - s'affiche seulement du 27 novembre au 26 décembre, et s'il y a au moins 3 sorties de Noël autour de la ville choisie
// - aucune nouvelle donnée : on regroupe les événements déjà présents dans Whazup (titre contenant « Noël »)
// - disparaît tout seul après le 26 décembre (rien à retirer). Pour l'enlever avant : retirer la ligne noel.js dans index.html.
(function () {
  "use strict";
  var RE = /no[eë]l/i;
  var CANC = /(^|[^a-z])(annule[es]?|cancel(l)?ed)([^a-z]|$)/; // événement annulé : on ne le montre pas
  var DAYS = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function track(n) { try { if (typeof analytics !== "undefined" && analytics && analytics.logEvent) analytics.logEvent(n, { city: state.city }); } catch (e) {} }

  function season() {
    var d = new Date(), m = d.getMonth() + 1, day = d.getDate();
    return (m === 11 && day >= 27) || (m === 12 && day <= 26);
  }
  function lastDay() { var y = new Date().getFullYear(); return y + "-12-26"; }
  function whereName() {
    try { if (state.userPos && window.__wzLocal && window.__wzLocal.lat === state.userPos.lat && window.__wzLocal.lng === state.userPos.lng) return window.__wzLocal.label; } catch (e) {}
    try { return CITIES[state.city].name; } catch (e) { return ""; }
  }
  function prep(n) { if (/^Le /.test(n)) return "au " + n.slice(3); if (/^Les /.test(n)) return "aux " + n.slice(4); return "à " + n; }

  function items() {
    try {
      var list = (typeof baseVisibleEvents === "function" ? baseVisibleEvents() : allEvents()) || [];
      var from = iso(new Date()), to = lastDay(), seen = {};
      return list.filter(function (e) {
        if (!e || e.isPlace || !e.date || e.date < from || e.date > to || !RE.test(String(e.title || "")) || CANC.test(String(e.title || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase())) return false;
        if (!state.userPos && e.city && e.city !== state.city) return false;
        var k = String(e.title).toLowerCase().replace(/[^a-z0-9]+/g, "") + "|" + e.date;
        if (seen[k]) return false; seen[k] = 1; return true;
      }).sort(function (a, b) {
        function real(e) { return e.photo && !e.photoGeneric ? 0 : 1; }
        return (real(a) - real(b)) || (a.date + (a.time || "99")).localeCompare(b.date + (b.time || "99"));
      });
    } catch (e) { return []; }
  }

  function css() {
    if (document.getElementById("wz-nl-css")) return;
    var st = document.createElement("style"); st.id = "wz-nl-css";
    st.textContent = [
      "html body.wz-v2:not(.wz-nocity) #view-discover > #wz-nl{order:2}",
      "body.wz-nocity #wz-nl{display:none !important}",
      "#wz-nl{display:flex;align-items:center;gap:12px;margin:0 16px 14px;width:calc(100% - 32px);box-sizing:border-box;padding:13px 16px;border:none;border-radius:16px;cursor:pointer;text-align:left;font-family:inherit;color:#fff;background:linear-gradient(120deg,#0F2E24 0%,#1F5A3F 55%,#C0392B 135%);box-shadow:0 10px 24px -14px rgba(15,46,36,.8);position:relative;overflow:hidden}",
      "#wz-nl .nl-p{font-size:30px;line-height:1;flex:0 0 auto;filter:drop-shadow(0 2px 6px rgba(232,116,44,.6))}",
      "#wz-nl b{display:block;font-size:15px;font-weight:800;letter-spacing:.01em}",
      "#wz-nl small{display:block;font-size:12.5px;color:#D5EBDD;margin-top:2px}",
      "#wz-nl .nl-go{margin-left:auto;font-size:20px;color:#F2C879;flex:0 0 auto}",
      "#wz-nl-ov{position:fixed;inset:0;z-index:2147483000;background:#EEF3FA;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:var(--font-body,inherit);color:#14213D}",
      "#wz-nl-ov .nl-in{max-width:760px;margin:0 auto;padding:14px 16px 40px}",
      "#wz-nl-ov .nl-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}",
      "#wz-nl-ov .nl-back{border:none;background:#fff;border-radius:12px;padding:9px 13px;font-weight:700;font-size:13px;color:#6B7280;cursor:pointer;box-shadow:0 2px 6px -3px rgba(20,33,61,.2)}",
      "#wz-nl-ov .nl-hero{border-radius:20px;padding:20px;color:#fff;background:linear-gradient(120deg,#0F2E24 0%,#1F5A3F 60%,#C0392B 140%);margin-bottom:12px}",
      "#wz-nl-ov .nl-hero h2{font-family:var(--font-display,Georgia,serif);font-size:26px;margin:0 0 4px;color:#fff}",
      "#wz-nl-ov .nl-hero p{margin:0;font-size:13.5px;color:#D5EBDD}",
      "#wz-nl-ov .nl-chips{display:flex;gap:6px;overflow-x:auto;padding:2px 0 12px;scrollbar-width:none}",
      "#wz-nl-ov .nl-chip{flex:0 0 auto;background:#fff;border:1.5px solid #E3E8F0;border-radius:10px;padding:8px 12px;font-size:13px;font-weight:700;color:#14213D;cursor:pointer;font-family:inherit}",
      "#wz-nl-ov .nl-chip.on{background:#1F5A3F;border-color:#1F5A3F;color:#fff}",
      "#wz-nl-ov .nl-day{font-family:var(--font-display,Georgia,serif);font-size:18px;margin:14px 2px 8px}",
      "#wz-nl-ov .nl-list .event-card{width:100%;margin-bottom:10px}"
    ].join("");
    document.head.appendChild(st);
  }

  function dayLabel(d) {
    var t = iso(new Date()), tm = new Date(); tm.setDate(tm.getDate() + 1);
    if (d === t) return "Aujourd'hui";
    if (d === iso(tm)) return "Demain";
    var x = new Date(d + "T12:00:00");
    return DAYS[x.getDay()] + " " + x.getDate() + (x.getDate() === 1 ? "er" : "") + " " + ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."][x.getMonth()];
  }

  var current = "all", kind = "all";
  // type de sortie : marchés de Noël / en famille (ateliers, enfants, contes…) / spectacles et concerts
  var FAM_RE = /stage|atelier|enfant|kids|tout.petits|petits|conte|maquillage|famille|go[ûu]ter|parents|ludoth|biblioth|m[ée]diath|jeunesse|p[èe]re no[eë]l|patinoire|[0-9]+ ?(?:-|à) ?[0-9]+ ?ans/i;
  var MARCHE_RE = /march[ée]|village de no[eë]l|chalets?|f[ée]erie|illuminations?/i;
  function kindOf(e) {
    var t = String(e.title || "") + " " + String(e.place || "");
    if (e.category === "Marché" || MARCHE_RE.test(t)) return "marche";
    if (e.category === "Famille" || FAM_RE.test(t)) return "fam";
    return "autre";
  }
  function renderList(list) {
    var box = document.getElementById("nl-list"); if (!box) return;
    var shown = list.filter(function (e) { return (current === "all" || e.date === current) && (kind === "all" || kindOf(e) === kind); });
    var h = "", last = "";
    shown.forEach(function (e) {
      if (e.date !== last) { last = e.date; h += '<div class="nl-day">' + esc(dayLabel(e.date)) + "</div>"; }
      try { if (state.userPos || CITIES[state.city]) { var r = referencePoint(); e.distance = haversineKm(r.lat, r.lng, e.lat, e.lng); } } catch (x) {}
      h += eventCardHTML(e);
    });
    box.innerHTML = h || '<p style="color:#6B7280">Rien ce jour-là.</p>';
  }

  function open() {
    css(); track("noel_open");
    var list = items(), where = whereName();
    var ov = document.getElementById("wz-nl-ov");
    if (!ov) { ov = document.createElement("div"); ov.id = "wz-nl-ov"; document.body.appendChild(ov); }
    var days = []; list.forEach(function (e) { if (days.indexOf(e.date) < 0) days.push(e.date); });
    var nMar = list.filter(function (e) { return kindOf(e) === "marche"; }).length, nAut = list.filter(function (e) { return kindOf(e) === "autre"; }).length, nFam = list.filter(function (e) { return kindOf(e) === "fam"; }).length;
    current = "all"; kind = nMar >= 3 ? "marche" : "all";
    function kchip(k, label, n) { return n ? '<button type="button" class="nl-chip nl-k' + (kind === k ? " on" : "") + '" data-kind="' + k + '">' + label + (k === "all" ? "" : " · " + n) + "</button>" : ""; }
    ov.innerHTML = '<div class="nl-in"><div class="nl-top"><button type="button" class="nl-back" data-nl="close">← Retour</button></div>' +
      '<div class="nl-hero"><h2>🎄 Noël ' + esc(prep(where)) + "</h2><p>" + list.length + " marchés et sorties jusqu'au 26 décembre</p></div>" +
      '<div class="nl-chips">' + kchip("marche", "🎄 Marchés", nMar) + kchip("fam", "🎁 En famille", nFam) + kchip("autre", "✨ Spectacles et concerts", nAut) + kchip("all", "Tout", list.length) + "</div>" +
      '<div class="nl-chips"><button type="button" class="nl-chip on" data-day="all">Tous les jours</button>' +
      days.map(function (d) { return '<button type="button" class="nl-chip" data-day="' + d + '">' + esc(dayLabel(d)) + "</button>"; }).join("") +
      '</div><div class="nl-list" id="nl-list"></div></div>';
    ov.style.display = "block"; ov.scrollTop = 0;
    document.documentElement.style.overflow = "hidden";
    ov.__list = list;
    renderList(list);
  }
  function close() {
    var ov = document.getElementById("wz-nl-ov"); if (ov) { ov.style.display = "none"; ov.innerHTML = ""; }
    document.documentElement.style.overflow = "";
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("#wz-nl, #wz-nl-ov [data-nl], #wz-nl-ov .nl-chip, #wz-nl-ov .event-card");
    if (!t) return;
    e.preventDefault(); e.stopPropagation();
    if (t.id === "wz-nl") return open();
    if (t.getAttribute("data-nl") === "close") return close();
    if (t.classList.contains("nl-chip")) {
      if (t.hasAttribute("data-kind")) kind = t.getAttribute("data-kind"); else current = t.getAttribute("data-day");
      t.parentNode.querySelectorAll(".nl-chip").forEach(function (c) { c.classList.toggle("on", c === t); });
      var ov = document.getElementById("wz-nl-ov"); renderList(ov.__list || []); return;
    }
    if (t.classList.contains("event-card")) { var id = t.getAttribute("data-id"); close(); track("noel_go"); if (typeof openDetail === "function") openDetail(id); }
  }, true);

  function paint() {
    try {
      var host = document.getElementById("view-discover");
      var band = document.getElementById("wz-nl");
      if (!season() || !host || document.body.classList.contains("wz-nocity")) { if (band) band.remove(); return; }
      var n = items().length, where = whereName();
      if (n < 3 || !where) { if (band) band.style.display = "none"; return; }
      css();
      if (!band) {
        band = document.createElement("button"); band.type = "button"; band.id = "wz-nl";
        var anchor = document.getElementById("sc-surprise") || document.getElementById("wz-chips") || document.getElementById("wz-count");
        if (!anchor || anchor.parentNode !== host) return;
        host.insertBefore(band, anchor.nextSibling);
      }
      band.style.display = "";
      var html = '<span class="nl-p">🎄</span><span><b>Noël ' + esc(prep(where)) + "</b><small>" + n + " marché" + (n > 1 ? "s et sorties" : "") + " jusqu'au 26 décembre</small></span><span class=\"nl-go\">→</span>";
      if (band.__h !== html) { band.innerHTML = html; band.__h = html; }
      var sc = document.getElementById("sc-surprise");
      if (sc && sc.parentNode === host && band.previousElementSibling !== sc) host.insertBefore(band, sc.nextSibling);
    } catch (e) {}
  }
  function start() { paint(); setInterval(paint, 2000); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(start, 1500); });
  else setTimeout(start, 1500);
})();
