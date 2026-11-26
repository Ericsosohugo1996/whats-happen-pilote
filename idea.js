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
    ["resto", "🍽️ Adresses de caractère", ["Resto"]],
    ["social", "🤝 Rencontrer du monde", []],
    ["expo", "🖼️ Expos & visites", ["Expo"]],
    ["autres", "✨ Autres sorties", ["Divers"]],
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

  // ---- « Adresses de caractère » : une sélection (pas un annuaire), lue dans data/restos-caractere.json ----
  var restosPromise = null;
  function restosLoad() {
    if (restosPromise) return restosPromise;
    var get = function (u) { return fetch(u, { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : []; }).then(function (a) { return Array.isArray(a) ? a : []; }).catch(function () { return []; }); };
    // les « perles » choisies à la main passent avant la sélection automatique
    restosPromise = Promise.all([get("data/perles-paris.json"), get("data/restos-caractere.json"), get("data/bars-caractere.json"), get("data/bars-paris.json"), get("data/perles-france.json")])
      .then(function (r) { window.__wzRestos = r[0].concat(r[4] || [], r[1]); window.__wzBars = (r[2] || []).concat(r[3] || []); return window.__wzRestos; })
      .catch(function () { window.__wzRestos = window.__wzRestos || []; window.__wzBars = window.__wzBars || []; return window.__wzRestos; });
    return restosPromise;
  }
  // « Bars de caractère » : bars à cocktails, caves à vins, bars cachés, péniches, rooftops (sélection lue dans data/bars-caractere.json)
  function barById(id) { return (window.__wzBars || []).filter(function (x) { return x.id === id; })[0]; }
  function barEv(r) {
    return { id: r.id, isPlace: true, category: "Bar", kind: r.k || "Bar de caractère", title: r.t, place: r.c, city: r.c, lat: r.la, lng: r.lo, photo: r.p || "", description: r.d, time: "", date: null,
      credit: r.p ? "Photo : office de tourisme (DATAtourisme)" : "", creditUrl: "", envies: null, sc: r.sc || 0, caractere: true };
  }
  function isRestoId(id) { return /^(resto|perle)-/.test(String(id)); }
  var ENVIE_LABEL = { brunch: "Brunch", dejeuner: "Déjeuner", gouter: "Goûter", diner: "Dîner" };
  // quelles envies correspondent au moment choisi (brunch seulement le week-end)
  function envieSlots(when) {
    var d = new Date(), dow = d.getDay(), h = d.getHours() + d.getMinutes() / 60, wk = dow === 0 || dow === 6, all = ["brunch", "dejeuner", "gouter", "diner"];
    if (when === "now") { if (h < 11.5) return wk ? ["brunch", "dejeuner"] : ["dejeuner"]; if (h < 14.5) return wk ? ["dejeuner", "brunch"] : ["dejeuner"]; if (h < 18) return ["gouter"]; return ["diner"]; }
    if (when === "tonight") return ["diner"];
    if (when === "tomorrow") { var t = (dow + 1) % 7; return t === 0 || t === 6 ? all : ["dejeuner", "gouter", "diner"]; }
    if (when === "weekend") return all;
    return wk ? all : ["dejeuner", "gouter", "diner"];
  }
  function shortDesc(s) {
    s = String(s || "").trim(); var m = s.match(/[^.!?]+[.!?]+/g), o = m ? m.slice(0, 2).join(" ").trim() : "";
    if (!o || o.length > 200) { o = s.slice(0, 180); o = o.replace(/\s+\S*$/, "").replace(/[\s,;:]+$/, "") + "…"; }
    return o;
  }
  function restoEv(r) {
    var perle = /^perle-/.test(String(r.id || ""));
    return { id: r.id, isPlace: true, category: "Resto", kind: r.k || "Adresse de caractère", title: r.t, place: r.c, city: r.c, lat: r.la, lng: r.lo, photo: r.p || "", description: r.d, time: "", date: null,
      credit: r.p ? (r.cr || "Photo : office de tourisme (DATAtourisme)") : "", creditUrl: r.cu || "", envies: perle ? (r.e || []) : null, perle: perle, mystery: !r.p, sc: r.sc || 0 };
  }
  // adresse surprise (perle sans photo, volontaire) : carte typographique au lieu d'une photo
  function phHTML(ev) {
    if (!(ev && ev.mystery)) return eventPhotoHTML(ev);
    return '<div class="wz-mys"><span class="wz-mys-a">ADRESSE CACHÉE</span><span class="wz-mys-k">' + esc(ev.kind || "Adresse de caractère") + '</span><span class="wz-mys-c">' + esc(ev.city || "") + '</span></div>';
  }
  (function () { if (document.getElementById("wz-mys-css")) return; var st = document.createElement("style"); st.id = "wz-mys-css";
    st.textContent = "#wz-idea .wz-mys{width:100%;height:100%;min-height:120px;box-sizing:border-box;display:flex;flex-direction:column;justify-content:center;gap:4px;padding:14px 18px;background:linear-gradient(135deg,#14213D 0%,#1c2f5a 55%,#E85D3D 140%);color:#fff;text-align:left}#wz-idea .wz-mys-a{font:800 10px/1 system-ui,sans-serif;letter-spacing:.14em;color:#f3b4a4}#wz-idea .wz-mys-k{font:italic 600 24px/1.1 Georgia,serif}#wz-idea .wz-mys-c{font:600 13px/1 system-ui,sans-serif;opacity:.75}";
    document.head.appendChild(st); })();
  function pool() {
    var ref = referencePoint(), out = [];
    if (S.want && S.want.indexOf("resto") !== -1 && window.__wzRestos) {
      window.__wzRestos.forEach(function (r) {
        var d = haversineKm(ref.lat, ref.lng, r.la, r.lo);
        if (d > Math.max(state.userPos ? (state.radiusKm || 20) : 25, 25)) return;
        // pas de photo : adresse quand même proposée (« à découvrir », volontairement sans photo)
        var mo = new Date().getMonth(); // guinguettes, cabanes et péniches : saison d'avril à septembre
        if ((r.k === "Guinguette" || r.k === "Cabane" || r.k === "Sur l'eau") && (mo < 3 || mo > 8)) return;
        var o = restoEv(r); o.distance = d; out.push(o);
      });
      return out;
    }
    if (S.want && S.want.indexOf("bar") !== -1 && window.__wzBars) {
      var mb = new Date().getMonth();
      window.__wzBars.forEach(function (r) {
        if (!r.p) return;
        if (r.id === "bar-paris-le-balzac" || /privateaser\.com/i.test(String(r.cu || ""))) return; // photo douteuse (mauvais lieu) ou site tiers de réservation : écartée
        if ((r.k === "Guinguette" || r.k === "Bar sur l'eau" || r.k === "Sur les toits") && (mb < 3 || mb > 8)) return; // lieux d'été
        var d = haversineKm(ref.lat, ref.lng, r.la, r.lo);
        if (d > Math.max(state.userPos ? (state.radiusKm || 20) : 25, 25)) return;
        var o = barEv(r); o.distance = d; out.push(o);
      });
    }
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
    if (!S.want.length || S.want.indexOf("any") !== -1) { if (ev.category === "Divers" || ev.category === "Brocante") return false; try { if (window.__wzCatOk && !window.__wzCatOk(ev, ev.category)) return false; } catch (e) {} return true; }
    if (S.want.indexOf("social") !== -1) { if (ev.isPlace || !isSocial(ev)) return false; try { if (window.__wzCatOk && !window.__wzCatOk(ev, ev.category)) return false; } catch (e) {} return true; }
    return S.want.some(function (k) { var w = WANT.filter(function (x) { return x[0] === k; })[0]; if (!(w && w[2] && w[2].indexOf(ev.category) !== -1)) return false; if (k === "musee") return isMuseum(ev); try { if (window.__wzCatOk && !window.__wzCatOk(ev, ev.category)) return false; } catch (e) {} return true; });
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
    if (ev.category === "Resto") {
      if (!ev.envies) return { label: "Table à découvrir · vérifie les horaires", score: 250 - (ev.sc || 0) * 8 };
      var slots = envieSlots(S.when), hit = slots.filter(function (x) { return ev.envies.indexOf(x) !== -1; });
      if (!hit.length) return null;
      return { label: ENVIE_LABEL[hit[0]] + " · vérifie les horaires", score: 180 };
    }
    if (ev.isPlace || !ev.date) {
      // lieux ouverts (bars, sites à visiter) : seulement pour maintenant / ce soir
      if (S.when === "now" || S.when === "tonight") {
        // un monument n'est pas une idée de soirée ; et on ne peut pas promettre qu'un lieu est ouvert : on dit « vérifie les horaires »
        if (ev.category === "À voir") return S.when === "now" ? { label: "À visiter · vérifie les horaires", score: 200 } : null;
        return { label: (ev.category === "Bar" ? "Bar" : "Lieu") + " · vérifie les horaires", score: S.when === "tonight" ? 650 : 200 };   // ce soir : les vrais événements d'abord, les bars ensuite
      }
      if (ev.category === "À voir") return { label: "À visiter · vérifie les horaires", score: 470 };
      if (ev.category === "Bar") return { label: "Ouvert en soirée · vérifie les horaires", score: 480 };   // musées : proposés aussi demain et ce week-end
      return null;
    }
    var m = mins(ev.time);
    if (S.when === "now") {
      if (ev.date !== t || m == null) return null;
      if (m < n - 30 || m > n + 180) return null;
      var d = m - n;
      return { label: d > 5 ? "Commence dans " + d + " min · " + hh(ev.time) : "En ce moment · depuis " + hh(ev.time), score: Math.max(0, d) };
    }
    if (S.when === "today") {   // pour composer un programme : tout le reste de la journée
      if (ev.date !== t || m == null || m < n - 30 || m > 23 * 60 + 30) return null;
      return { label: "Aujourd’hui · " + hh(ev.time), score: Math.max(0, m - n) };
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
 // Règles de qualité des surprises (ajout) : rien avant 10 h (sauf marché / brocante / vide-grenier), pas d'ateliers d'agences pour l'emploi
  var JOB_RE = /(agence|candidature|emploi|carri[eè]re|recrut|inclusion|france travail|p[ôo]le emploi|handicap|employeur|qualifi)/i;
  var EARLY_OK_RE = /(vide[- ]?grenier|brocante|marché)/i;
  var JUNK_PLACE_RE = /(g[îi]tes?\b|appart.?city|apparth[oô]tel|camping|auberge de jeunesse|chambres? d.h[oô]tes?|piscine|parking)/i;
  var DATING_RE = /c[ée]libataires?|speed.?dating/i;
  var STAGE_RE = /\b(stages?|formations?)\b/i;
  // activités du quotidien (yoga, bébés, bricolage, débats…) : pas des « top, on y va » : elles passent après
  var PRATIQUE_RE = /(yoga|m[ée]ditati|pilates|gym douce|baby.?gym|reprise des? s[ée]ances?|portage|b[ée]b[ée]s?\b|0.3 ans|\bpapas?\b|\bmamans?\b|parentalit|r[ée]par|jardinage|disco.?soupe|cyclofficine|permanence|d[ée]bat|groupe de parole|m[ée]diation|lutte contre|seniors?)/i;
  // complet / annulé / reporté : on ne propose pas une sortie qu'on ne peut pas faire
  var CLOSED_START_RE = /^\s*\W*(complet|annul[ée]e?|report[ée]e?|sold.?out)\b/i, CLOSED_CAPS_RE = /\b(COMPLET|ANNUL[ÉE]E?|REPORT[ÉE]E?)\b/;
  function isClosed(t) { t = String(t || ""); return CLOSED_START_RE.test(t) || CLOSED_CAPS_RE.test(t); }
  var BENEV_RE = /(b[ée]n[ée]vol|cherche (son|ses) |recherche de volontaires|\bstaff\b)/i;
  // liste à compléter : mots du titre qu'on ne veut jamais voir dans « Surprends-moi » (ils restent visibles dans la liste complète)
  var SKIP_RE = /(\bagenda\s+20\d\d\b|visite\s+coquine|maisons?\s+closes)/i;
  var SLOW_RE = /\b(ateliers?|cours|conf[eé]rences?|initiation|assembl[eé]e|r[eé]union|cycle)\b/i;
  function surpriseOk(ev) {
    if (ev.isPlace) return !JUNK_PLACE_RE.test(String(ev.title || ""));
    if (ev.category === "Divers" && JOB_RE.test(String(ev.title || "") + " " + String(ev.place || ""))) return false;
    if (BENEV_RE.test(String(ev.title || "")) || isClosed(ev.title)) return false;
    if (STAGE_RE.test(String(ev.title || ""))) return false;
    if (DATING_RE.test(String(ev.title || ""))) return false;
    var m = mins(ev.time);
    if (m != null && m < 10 * 60 && ev.category !== "Marché" && ev.category !== "Brocante" && !EARLY_OK_RE.test(String(ev.title || ""))) return false;
    return true;
  }

  // ---- mémoire : on ne reproposera pas ce qui a déjà été fait, vu ou écarté ; la météo oriente (pluie → à l'abri) ----
  var MEM_KEY = "wz-idea-memory", WX_KEY = "wz-idea-wx";
  function memLoad() { try { return JSON.parse(localStorage.getItem(MEM_KEY) || "{}") || {}; } catch (e) { return {}; } }
  function memSave(m) {
    try {
      var cut = Date.now() - 14 * 86400000, k, n = 0;
      for (k in m) { if (!m[k] || m[k].t < cut) delete m[k]; else n++; }
      if (n > 300) { Object.keys(m).sort(function (a, b) { return m[a].t - m[b].t; }).slice(0, n - 300).forEach(function (x) { delete m[x]; }); }
      localStorage.setItem(MEM_KEY, JSON.stringify(m));
    } catch (e) {}
  }
  function memMark(ev, kind) { if (!ev || ev.id == null) return; var m = memLoad(); var old = m[ev.id]; if (kind === "shown" && old && old.k === "skip") return; m[ev.id] = { t: Date.now(), k: kind }; memSave(m); }
  function normT(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
  function visitedSet() {
    var out = [];
    try { (window.__souvenirsList || []).forEach(function (s) { var n = normT(s && s.placeName); if (n.length >= 4) out.push(n); }); } catch (e) {}
    return out;
  }
  function wxLoad() { try { var w = JSON.parse(localStorage.getItem(WX_KEY) || "null"); if (w && Date.now() - w.t < 45 * 60000) return w; } catch (e) {} return null; }
  function wxPrefetch() {
    try {
      if (wxLoad()) return;
      var ref = referencePoint(); if (!ref || !ref.lat) return;
      fetch("https://api.open-meteo.com/v1/forecast?latitude=" + ref.lat + "&longitude=" + ref.lng + "&current=temperature_2m,weather_code&timezone=auto")
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var c = d && d.current; if (!c) return;
          var code = c.weather_code, rain = (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95 || (code >= 71 && code <= 77);
          localStorage.setItem(WX_KEY, JSON.stringify({ t: Date.now(), rain: !!rain, temp: c.temperature_2m }));
        }).catch(function () {});
    } catch (e) {}
  }
  var OUTDOOR_RE = /(jardin|parc\b|plage|promenade|balade|randonn|\bquai|march[eé] de no[eë]l|bords? de)/i;
  function memAdjust(ev, ctx) {
    var d = 0, e = ctx.mem[ev.id];
    if (e) { var age = Date.now() - e.t; if (e.k === "skip" && age < 7 * 86400000) d += 200; else if (e.k === "shown" && age < 3 * 86400000) d += 100; }
    if (ev.isPlace || ev.category === "À voir") {
      var tn = normT(ev.title);
      if (tn.length >= 4 && ctx.visited.some(function (v) { return tn.indexOf(v) !== -1 || v.indexOf(tn) !== -1; })) d += 250;
    }
    if (ctx.wx && ctx.wx.rain && S.when === "now") {
      var outdoor = ev.category === "Marché" || ev.category === "Brocante" || OUTDOOR_RE.test(String(ev.title || "")) || (ev.isPlace && !isMuseum(ev));
      var indoor = ev.category === "Expo" || ev.category === "Spectacles" || (ev.isPlace && isMuseum(ev));
      if (outdoor) d += 90; else if (indoor) d -= 30;
    }
    return d;
  }
  function rank() {
    var res = [], ctx = { mem: memLoad(), visited: visitedSet(), wx: wxLoad() };
    pool().forEach(function (ev) {
      if (!wantOk(ev) || !surpriseOk(ev)) return;
      if (SKIP_RE.test(String(ev.title || ""))) return; // annonces qui ne sont pas des sorties précises, et sujets sensibles : jamais proposés dans « Surprends-moi »
      var tm = timing(ev); if (!tm) return;
            // une expo « ouvre » plutôt qu'elle ne « commence » : on le dit honnêtement
      if (ev.category === "Expo" && !ev.isPlace && mins(ev.time) != null) tm = { label: (S.when === "now" ? "" : String(tm.label).split(" · ")[0] + " · ") + "Ouverte dès " + hh(ev.time).replace(/ h 00$/, " h"), score: tm.score };
      var real = ev.photo && !ev.photoGeneric && !ev.photoVenue;
      var sc = tm.score * 0.6 + ev.distance * 12 - (real ? 60 : ev.photoVenue ? 30 : 0) - (ev.isPlace ? 0 : 25) + (!ev.isPlace && SLOW_RE.test(String(ev.title || "")) ? 70 : 0) + (ev.category === "Famille" && S.want.indexOf("famille") === -1 ? 80 : 0) + (!ev.isPlace && PRATIQUE_RE.test(String(ev.title || "")) && S.want.indexOf("any") !== -1 ? 90 : 0) + memAdjust(ev, ctx);
      res.push({ ev: ev, label: tm.label, score: sc });
    });
    // lieux très connus : ils passent devant (Louvre, Orsay, Notre-Dame…)
    res.forEach(function (r) { if (r.ev.isPlace && S.when === "now" && FAMOUS_RE.test(String(r.ev.title || ""))) r.score -= 90; });
    res.sort(function (a, b) { return a.score - b.score; });
    // pas deux fois le même endroit ni la même photo (ex. « Musée X » et « Jardin du musée X »)
    var locSeen = {}, phSeen = {};
    res = res.filter(function (r) {
      var e = r.ev, lk = e.lat && e.lng ? (+e.lat).toFixed(3) + "," + (+e.lng).toFixed(3) : "t:" + String(e.title || "").toLowerCase().slice(0, 30);
      var pk = e.photo ? String(e.photo).split("?")[0] : "";
      var fm = e.isPlace ? String(e.title || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(FAMOUS_RE) : null;
      if (fm) { if (locSeen["F:" + fm[0]]) return false; locSeen["F:" + fm[0]] = 1; }
      if (locSeen[lk] || (pk && phSeen[pk])) return false;
      locSeen[lk] = 1; if (pk) phSeen[pk] = 1; return true;
    });
    // variété : on évite 3 fois la même catégorie quand on peut
    var out = [], seen = {};
    res.forEach(function (r) { var c = r.ev.category; if ((seen[c] || 0) < 2) { out.push(r); seen[c] = (seen[c] || 0) + 1; } });
    res.forEach(function (r) { if (out.indexOf(r) === -1) out.push(r); });
    return out;
  }

  // ---- « Voir ma soirée / journée complète » : on enchaîne, à pied, ce qui suit la première idée ----
  var PLAN_MAX_STOPS = 4, PLAN_MAX_KM = 2.0, PLAN_LAST_START = 23 * 60 + 30;
  function durOf(ev) { var c = ev.category; return c === "Expo" ? 60 : (c === "Musique" || c === "Spectacles" || c === "Soirée" || c === "Festival") ? 120 : 90; }
  function walkMin(km) { return Math.max(2, Math.round(km * 1.3 / 0.08)); }
  // une « soirée » avant 18 h s'appelle plutôt un événement de l'après-midi
  function catLabel(ev) {
    var c = String(ev.category || ""), m = mins(ev.time);
    if (c === "Resto") return ev.kind || "Adresse de caractère";
    if (c === "Soirée" && m != null && m < 18 * 60) return m < 12 * 60 ? "Matinée" : "Après-midi";
    return c;
  }
  // « Maintenant » ne regarde que les 3 prochaines heures ; un programme, lui, peut piocher dans tout le reste de la journée
  function planPool() {
    if (S.when !== "now") return S.ranked;
    var w = S.when, res; S.when = "today";
    try { res = rank(); } catch (e) { res = S.ranked; }
    S.when = w; return res;
  }
  // en soirée : on termine par un verre dans un bar tout proche (horaires à vérifier : on ne les connaît pas)
  function withDrink(st, pool) {
    var last = st[st.length - 1], lm = mins(last.ev.time);
    if (!last || last.ev.isPlace || lm == null || lm < 19 * 60 || lm > 21 * 60 + 30 || last.ev.category === "Soirée") return st;   // pas après une soirée en club : le verre, c'est après un concert, un spectacle, une expo…
    var skip = S.planSkip || [], pick = null, km = 0;
    for (var i = 0; i < pool.length; i++) {
      var c = pool[i].ev;
      if (!c.isPlace || c.category !== "Bar" || !c.lat || !c.lng || skip.indexOf(c.id) !== -1) continue;
      if (JUNK_PLACE_RE.test(String(c.title || ""))) continue;
      km = haversineKm(last.ev.lat, last.ev.lng, c.lat, c.lng);
      if (km > 0.8 || km < 0.02) continue;
      pick = c; break;
    }
    if (!pick) return st;
    return st.concat([{ ev: pick, label: "Un verre pour finir", walk: walkMin(km), drink: true }]);
  }
  // repas : déjeuner dès 12 h (sortie suivante à 14 h ou plus), dîner dès 19 h (sortie suivante à 20 h 45 ou plus), dans une adresse de caractère à moins de 10 min à pied
  function withMeal(st) {
    var first = st[0]; if (!first || first.ev.isPlace || !first.ev.date) return st;
    var m = mins(first.ev.time); if (m == null) return st;
    var slot = null, at = "";
    if (m >= 14 * 60 && m < 17 * 60) { slot = "dejeuner"; at = "12:00"; }
    else if (m >= 20 * 60 + 45) { slot = "diner"; at = "19:00"; }
    if (!slot || !first.ev.lat || !first.ev.lng) return st;
    var skip = S.planSkip || [], best = null;
    (window.__wzRestos || []).forEach(function (r) {
      if (!r || skip.indexOf(r.id) !== -1 || typeof r.la !== "number" || typeof r.lo !== "number") return;
      var perle = /^perle-/.test(String(r.id || ""));
      if (perle && (!r.e || r.e.indexOf(slot) === -1)) return;
      var km = haversineKm(first.ev.lat, first.ev.lng, r.la, r.lo);
      if (km > 0.62 || km < 0.005) return;
      var sc = km + (perle ? 0 : 0.25);   // les adresses choisies à la main passent d'abord
      if (!best || sc < best.sc) best = { r: r, km: km, sc: sc };
    });
    if (!best) return st;
    var ev = restoEv(best.r); ev.date = first.ev.date; ev.time = at;
    first.walk = walkMin(best.km);
    return [{ ev: ev, label: MEALS[slot], walk: 0, meal: slot }].concat(st);
  }
  function hh2(n) { return (n < 10 ? "0" : "") + n; }
  var MEALS = { dejeuner: "Déjeuner", diner: "Dîner", gouter: "Goûter" };
  // repas ou goûter ENTRE deux sorties : si l'écart est d'au moins 1 h 40, une adresse de caractère à moins de 10 min à pied (déjeuner 11 h 30-14 h, goûter 15 h-17 h 30, dîner 19 h-21 h)
  function withGapMeal(st) {
    if (st.some(function (z) { return z.meal; }) && st.length >= 4) return st;
    var skip = S.planSkip || [];
    for (var i = 0; i + 1 < st.length; i++) {
      var a = st[i].ev, b = st[i + 1].ev;
      if (st[i].drink || st[i + 1].drink || a.isPlace || b.isPlace || !a.lat || !b.lat) continue;
      var am = mins(a.time), bm = mins(b.time); if (am == null || bm == null) continue;
      var endA = am + durOf(a), gap = bm - endA; if (gap < 100) continue;
      var best = null;
      (window.__wzRestos || []).forEach(function (r) {
        if (!r || skip.indexOf(r.id) !== -1 || typeof r.la !== "number" || typeof r.lo !== "number" || !/^perle-/.test(String(r.id || ""))) return;
        var k1 = haversineKm(a.lat, a.lng, r.la, r.lo), k2 = haversineKm(r.la, r.lo, b.lat, b.lng);
        if (k1 > 0.62 || k2 > 0.9 || k1 < 0.005) return;
        var t0 = endA + walkMin(k1), W = { dejeuner: [690, 840], gouter: [900, 1050], diner: [1140, 1260] }, found = null;
        ["dejeuner", "gouter", "diner"].forEach(function (sl) {
          if (found || !r.e || r.e.indexOf(sl) === -1) return;
          var tc = Math.max(t0, W[sl][0]);
          if (tc <= W[sl][1] && tc + 45 + walkMin(k2) <= bm) found = { slot: sl, t: tc };
        });
        if (!found) return;
        var sc = k1 + k2;
        if (!best || sc < best.sc) best = { r: r, k1: k1, k2: k2, t: found.t, slot: found.slot, sc: sc };
      });
      if (!best) continue;
      var ev = restoEv(best.r), tt = Math.ceil(best.t / 5) * 5; ev.date = a.date; ev.time = hh2(Math.floor(tt / 60)) + ":" + hh2(tt % 60);
      st[i + 1].walk = walkMin(best.k2);
      st.splice(i + 1, 0, { ev: ev, label: MEALS[best.slot], walk: walkMin(best.k1), meal: best.slot });
      return st;
    }
    return st;
  }
  function planStops(x) { var pool = planPool(), st = planFrom(x, pool); if (st.length >= 2) { st = withGapMeal(st); st = withDrink(st, pool); } return withMeal(st); }
  function planFrom(first, ranked) {
    var stops = [{ ev: first.ev, label: first.label, walk: 0 }];
    var seen = {}; seen[first.ev.category] = 1;
    var nt = function (t) { return String(t || "").toLowerCase().replace(/[^a-z0-9àâçéèêëîïôûù]+/g, " ").trim(); };
    var skipTitles = {}; skipTitles[nt(first.ev.title)] = 1;
    (S.planSkip || []).forEach(function (id) { ranked.forEach(function (r) { if (r.ev.id === id) skipTitles[nt(r.ev.title)] = 1; }); });
    while (stops.length < PLAN_MAX_STOPS) {
      var prev = stops[stops.length - 1].ev, pm = mins(prev.time), pick = null;
      if (pm == null) break;
      var endPrev = pm + durOf(prev);
      for (var i = 0; i < ranked.length; i++) {
        var c = ranked[i].ev;
        if (c.isPlace || c.id === prev.id || stops.some(function (s) { return s.ev.id === c.id; })) continue;
        if (c.date !== prev.date || c.category === prev.category || (seen[c.category] || 0) >= 2) continue;
        if ((S.planSkip || []).indexOf(c.id) !== -1) continue;
        if (PRATIQUE_RE.test(String(c.title || "")) || skipTitles[nt(c.title)]) continue;   // pas d'étape « yoga / séniors / bébés » dans un programme
        var cm = mins(c.time); if (cm == null || cm > PLAN_LAST_START) continue;
        var km = haversineKm(prev.lat, prev.lng, c.lat, c.lng);
        if (km > PLAN_MAX_KM || km < 0.02) continue;
        var w = walkMin(km);
        if (cm < endPrev + w) continue;
        if (!pick || cm < pick.cm || (cm === pick.cm && ranked[i].score < pick.r.score)) pick = { r: ranked[i], cm: cm, w: w };
      }
      if (!pick) break;
      stops.push({ ev: pick.r.ev, label: pick.r.label, walk: pick.w }); seen[pick.r.ev.category] = (seen[pick.r.ev.category] || 0) + 1;
    }
    return stops;
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
// « Pourquoi cette idée » : une phrase courte, seulement avec des faits sûrs (distance, prix, moment, lieu connu)
  function whyText(x, price) {
    var ev = x.ev, p = [], l = String(x.label || "");
    if (ev.distance != null && ev.distance <= 1) p.push("tout près de toi");
    if (price === "free") p.push("gratuit");
    if (ev.isPlace && FAMOUS_RE.test(String(ev.title || ""))) p.push("un incontournable de la ville");
    var mm = l.match(/^Commence dans (\d+) min/);
    if (mm && +mm[1] <= 90) p.push("ça commence bientôt");
    else if (/^En ce moment/.test(l)) p.push("c'est en cours");
    if (!p.length) return "";
    return p.join(", ").replace(/^./, function (c) { return c.toUpperCase(); }) + ".";
  }
  function card(x, big) {
    var ev = x.ev, color = (typeof CATEGORY_COLORS !== "undefined" && CATEGORY_COLORS[ev.category]) || "#6C757D", icon = ev.category === "Resto" ? "🍽️" : (typeof CATEGORY_ICONS !== "undefined" && CATEGORY_ICONS[ev.category]) || "📍";
    var price = typeof eventPriceType === "function" ? eventPriceType(ev) : "";
    var dist = ev.distance <= 3 ? Math.max(2, Math.round(ev.distance * 12 / 5) * 5) + " min à pied" : ev.distance.toFixed(1).replace(".", ",") + " km";
    var venue = ev.place ? String(ev.place).split(",")[0] : "";
    return '<button type="button" class="wz-i-card' + (big ? " big" : "") + '" data-i="open" data-id="' + esc(ev.id) + '"><div class="wz-i-ph">' + phHTML(ev) +
      '<span class="wz-i-pill" style="--c:' + color + '">' + icon + " " + esc(catLabel(ev).toUpperCase()) + (price === "free" ? " · Gratuit" : "") + '</span></div>' +
      '<div class="wz-i-bd"><div class="wz-i-t">' + esc(ev.title) + '</div><div class="wz-i-v">' + esc(venue) + (venue ? " · " : "") + dist + '</div>' + (ev.category === "Resto" && ev.description ? '<div style="margin:6px 0 0;font-size:13px;line-height:1.4;opacity:.8">' + esc(shortDesc(ev.description)) + '</div>' : '') + (isSocial(ev) ? '<div class="wz-i-soc" style="display:inline-block;margin:6px 0 0;padding:4px 10px;border-radius:999px;background:#E6F4F2;color:#13655F;font:800 12px inherit;font-family:inherit">🤝 Facile d’y aller seul(e)</div>' : '') + '<div class="wz-i-why">' + esc(x.label) + '</div>' + (big && whyText(x, price) ? '<div class="wz-i-why2" style="margin-top:6px;font-size:12.5px;font-weight:600;line-height:1.4;opacity:.85">Pourquoi cette idée : ' + esc(whyText(x, price)) + '</div>' : '') + (ev.lat && ev.lng ? '<span role="button" tabindex="0" class="wz-i-route" data-i="route" data-id="' + esc(ev.id) + '" style="display:inline-block;margin-top:10px;padding:8px 14px;border-radius:999px;background:#E85D3D;color:#fff;font:800 13px inherit;font-family:inherit;cursor:pointer">🚶 Itinéraire</span>' : "") + "</div></button>";
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
  function findEv(id) { var bb = barById(id); if (bb) return barEv(bb); if (isRestoId(id)) { var rr = (window.__wzRestos || []).filter(function (x) { return x.id === id; })[0]; return rr ? restoEv(rr) : null; } try { return allEvents().filter(function (e) { return String(e.id) === String(id); })[0]; } catch (e) { return null; } }
  function screenRoute(id) {
    var ev = findEv(id), r = root();
    if (!ev || !ev.lat || !ev.lng) return screenResult();
    killMap();
    r.innerHTML = head(3) + '<div class="wz-i-k">Itinéraire à pied</div><h1 style="font-size:22px">' + esc(ev.title) + '</h1>' +
      '<div id="wz-i-map" style="height:300px;border-radius:18px;overflow:hidden;background:#EEF0F4;margin:8px 0 10px"></div>' +
      '<div id="wz-i-rinfo" class="wz-i-sub" style="font-weight:700">Calcul du trajet…</div>' + (ev.credit || ev.category === "Resto" ? '<div class="wz-i-sub" style="font-size:12px;opacity:.6">' + (ev.credit ? esc(ev.credit) + ' · ' : '') + 'vérifie les horaires avant de partir</div>' : '') +
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

  // ---- « Surprends-moi » : 1 toucher = 1 sortie, qu'on peut affiner par envie et par moment ----
  var SW = [["now", "Maintenant"], ["tonight", "Ce soir"], ["tomorrow", "Demain"], ["weekend", "Ce week-end"]];
  var SWANT = ["any", "social", "musique", "soiree", "spectacle", "bar", "resto", "expo", "musee", "sport", "marche", "famille", "festival"];
  function track(n, p) { try { if (typeof analytics !== "undefined" && analytics && analytics.logEvent) analytics.logEvent(n, p || {}); } catch (e) {} }
  function loadWant() { try { var v = localStorage.getItem("wz-surprise-want"); if (v && SWANT.indexOf(v) !== -1) return v; } catch (e) {} return "any"; }
  function saveWant(v) { try { localStorage.setItem("wz-surprise-want", v); } catch (e) {} }
  function surpriseCss() {
    if (document.getElementById("wz-s-css")) return;
    var st = document.createElement("style"); st.id = "wz-s-css";
    st.textContent = '#wz-idea .wz-s-row{display:flex;gap:8px;overflow-x:auto;margin:0 0 10px;padding-bottom:4px;-webkit-overflow-scrolling:touch;scrollbar-width:none}#wz-idea .wz-s-row::-webkit-scrollbar{display:none}#wz-idea .wz-s-row .wz-i-c{flex:none;padding:9px 13px;font-size:13px;white-space:nowrap}' +
      '#wz-idea .wz-s-btns{display:flex;gap:10px;margin-top:2px}#wz-idea .wz-s-btns .wz-i-go,#wz-idea .wz-s-btns .wz-i-alt{flex:1;width:auto;margin:0;padding:15px 8px}' +
      '#wz-idea .wz-s-send{margin-top:10px}' +
      '#wz-idea .wz-t-row{display:flex;gap:8px;margin:0 46px 14px 0}#wz-idea .wz-t{flex:1;padding:10px 8px;border-radius:14px;border:1.5px solid #D5D9E1;background:#fff;color:#14213D;font:800 14px inherit;font-family:inherit;cursor:pointer}#wz-idea .wz-t.on{background:#14213D;border-color:#14213D;color:#fff}' +
      '#wz-idea .wz-q-h{margin:2px 0 4px;font-family:Georgia,"Times New Roman",serif;font-size:28px;line-height:1.15;font-weight:700;color:#14213D;text-wrap:balance}#wz-idea .wz-q-sub{font-size:14px;color:#5B6786;margin:0 0 16px}' +
      '#wz-idea .wz-q-stop{display:flex;gap:10px}#wz-idea .wz-q-when{width:50px;flex:none;text-align:right;padding-top:12px}#wz-idea .wz-q-when b{display:block;font-size:17px;color:#14213D;font-variant-numeric:tabular-nums}#wz-idea .wz-q-when i{display:block;font-style:normal;font-size:11px;color:#6B7280}' +
      '#wz-idea .wz-q-bar{width:3px;border-radius:2px;flex:none;margin:6px 0}' +
      '#wz-idea .wz-q-body{flex:1;min-width:0;border:1px solid #E5E7EB;border-radius:16px;background:#fff;overflow:hidden;box-shadow:0 8px 20px -16px rgba(20,33,61,.4);padding:0 0 12px}' +
      '#wz-idea .wz-q-ph{height:104px;background:#EEF2F9;overflow:hidden}#wz-idea .wz-q-ph img,#wz-idea .wz-q-ph svg{width:100%;height:100%;object-fit:cover;display:block}' +
      '#wz-idea .wz-q-kind{font-size:11.5px;letter-spacing:.06em;font-weight:800;margin:10px 14px 0}#wz-idea .wz-q-ttl{font-family:Georgia,"Times New Roman",serif;font-size:17px;font-weight:700;line-height:1.25;color:#14213D;margin:3px 14px}#wz-idea .wz-q-v{font-size:13px;color:#4B5563;margin:0 14px;line-height:1.35}' +
      '#wz-idea .wz-q-acts{display:flex;gap:14px;margin:8px 14px 0;flex-wrap:wrap}#wz-idea .wz-q-lnk{border:0;background:none;padding:2px 0;color:#E85D3D;font:800 13px inherit;font-family:inherit;cursor:pointer}#wz-idea .wz-q-lnk.dim{color:#6B7280;font-weight:700}' +
      '#wz-idea .wz-q-none{margin:8px 14px 0;font-size:12.5px;color:#C2492F;font-weight:700}' +
      '#wz-idea .wz-q-hop{margin:-2px 0 8px 60px;font-size:12px;color:#6B7280}' +
      '#wz-idea .wz-q-exp{display:flex;gap:10px;margin:14px 0 10px}#wz-idea .wz-q-exp button{flex:1;border-radius:14px;padding:14px 6px;font-size:14.5px;font-weight:800;cursor:pointer;font-family:inherit}#wz-idea .wz-q-b1{border:0;background:#1f6f78;color:#fff}#wz-idea .wz-q-b2{border:1.5px solid #E85D3D;background:transparent;color:#E85D3D}' +
      '#wz-idea .wz-q-note{border-radius:14px;padding:12px 14px;background:#F1F3F7;font-size:13.5px;line-height:1.45;color:#4B5563;margin:0 0 6px}#wz-idea .wz-q-note b{display:block;font-size:12px;color:#6B7280;letter-spacing:.04em;margin-bottom:4px}' +
      '#wz-idea .wz-p-tl{margin:4px 0 12px}#wz-idea .wz-p-card{display:block;width:100%;margin:0;padding:12px;border:1px solid #DDE4F0;border-radius:18px;background:#fff;color:#14213D;text-align:left;font-family:inherit;cursor:pointer;box-shadow:0 10px 22px -18px rgba(20,33,61,.5)}' +
      '#wz-idea .wz-p-t{font-size:12px;font-weight:800;letter-spacing:.4px;color:#C2492F;margin:0 0 8px}' +
      '#wz-idea .wz-p-b{display:flex;gap:12px;align-items:center}#wz-idea .wz-p-ph{flex:none;width:84px;height:84px;border-radius:14px;overflow:hidden;background:#EEF2F9}#wz-idea .wz-p-ph img,#wz-idea .wz-p-ph svg{width:100%;height:100%;object-fit:cover;display:block}' +
      '#wz-idea .wz-p-x{min-width:0}#wz-idea .wz-p-cat{font-size:11px;font-weight:800;letter-spacing:1.1px;color:#1F8F86;margin:0 0 3px}#wz-idea .wz-p-n{font-size:16px;font-weight:700;line-height:1.25;margin:0 0 3px;overflow-wrap:anywhere}#wz-idea .wz-p-v{font-size:12.5px;color:#5B6786;line-height:1.35}' +
      '#wz-idea .wz-p-walk{margin:6px 0 6px 14px;padding-left:12px;border-left:2px dotted #B9C3D6;font-size:12.5px;font-weight:600;color:#5B6786;min-height:22px;display:flex;align-items:center}' +
      '#wz-idea .wz-p-sw{display:block;margin:8px 0 0 auto;padding:8px 14px;border:1px solid #F0C9BE;border-radius:999px;background:#FFF4F0;color:#C2492F;font:700 12.5px/1.2 inherit;font-family:inherit;cursor:pointer}#wz-idea .wz-p-share{width:100%;margin:12px 0 6px}#wz-idea .wz-p-note{margin:12px 0 4px;padding:11px 13px;border-radius:14px;background:#EEF2F9;color:#5B6786;font-size:12.5px;line-height:1.45}' +
      '#wz-idea .wz-s-plan{margin-top:10px}' +
      'html body.wz-v2:not(.wz-nocity) #view-discover #sc-surprise .wz-l::before{content:"Surprends-moi" !important}html body.wz-v2:not(.wz-nocity) #view-discover #sc-surprise .wz-l::after{content:"Une sortie près de toi, en 1 clic" !important}';
    document.head.appendChild(st);
  }
  function surpriseRank() {
    S.want = S.sw === "any" ? ["any"] : [S.sw]; S.zone = "city";
    S.ranked = rank(); S.offset = 0;
  }
  function tabsHtml(cur) {
    return '<div class="wz-t-row"><button type="button" class="wz-t' + (cur === "idea" ? " on" : "") + '" data-i="tab" data-v="idea">🎲 Une idée</button><button type="button" class="wz-t' + (cur === "plan" ? " on" : "") + '" data-i="tab" data-v="plan">🎁 Un programme</button></div>';
  }

  // ---- « Dîner surprise près de toi » : une adresse cachée choisie à la main, à moins de 15 min à pied ----
  // dîner de 19 h à 22 h, déjeuner de 11 h 30 à 14 h ; on ne propose que les « perles » (sans photo, volontairement)
  function dinnerSlot() {
    var m = nowMin();
    if (m >= 19 * 60 && m < 22 * 60) return "diner";
    if (m >= 11 * 60 + 30 && m < 14 * 60) return "dejeuner";
    return "";
  }
  function dinnerList(slot, maxMin) {
    var ref = null; try { ref = referencePoint(); } catch (e) {}
    if (!ref || !ref.lat || !ref.lng) return [];
    var out = [];
    (window.__wzRestos || []).forEach(function (r) {
      if (!r || !/^perle-/.test(String(r.id || "")) || typeof r.la !== "number" || typeof r.lo !== "number") return;
      var ok = (r.e || []).indexOf(slot) !== -1 || (slot === "dejeuner" && (r.e || []).indexOf("brunch") !== -1);
      if (!ok) return;
      var km = haversineKm(ref.lat, ref.lng, r.la, r.lo);
      if (walkMin(km) > maxMin) return;
      out.push({ r: r, km: km });
    });
    out.sort(function (a, b) { return a.km - b.km; });
    return out;
  }
  function screenDinner() {
    var slot = S.dSlot || dinnerSlot(), name = slot === "dejeuner" ? "Déjeuner" : "Dîner", r = root();
    S.dSlot = slot;
    var maxMin = S.dMax || 15, list = dinnerList(slot, maxMin);
    var h = '<button type="button" class="wz-i-x" data-i="close" aria-label="Fermer">✕</button><div class="wz-i-k" style="margin:2px 0 14px">🍽️ ' + name.toUpperCase() + ' SURPRISE</div>';
    if (!list.length) {
      h += '<h1 style="font-size:24px">Pas d’adresse cachée à moins de ' + maxMin + ' min</h1><div class="wz-i-sub">On n’a pas encore d’adresse dans ce quartier.</div>';
      if (maxMin < 30) h += '<button type="button" class="wz-i-go" data-i="dfar">Chercher plus loin (30 min)</button>';
      h += '<button type="button" class="wz-i-alt" data-i="dback">Voir une autre idée de sortie</button>' +
        '<div class="wz-q-note" style="margin-top:12px">Plus loin, c’est à pied ou en transport : on te montre la distance avant de choisir.</div>';
      r.innerHTML = h; r.scrollTop = 0; return;
    }
    var x = list[(S.dOff || 0) % list.length], ev = restoEv(x.r);
    ev.distance = x.km;
    track("surprise_dinner_show", { slot: slot });
    h += '<h1 style="font-size:26px">Une adresse cachée t’attend</h1>' +
      '<div class="wz-i-ph" style="border-radius:18px;overflow:hidden;margin:8px 0 12px">' + phHTML(ev) + '</div>' +
      '<div class="wz-i-k" style="color:#1F8F86">' + name.toUpperCase() + ' · ADRESSE CACHÉE</div>' +
      '<div class="wz-i-t" style="font-size:22px;font-weight:800;margin:2px 0 4px">' + esc(ev.title) + '</div>' +
      '<div class="wz-i-sub" style="margin:0 0 6px">' + esc(ev.kind || "") + (ev.city ? " · " + esc(ev.city) : "") + '</div>' +
      (ev.description ? '<div class="wz-i-sub" style="margin:0 0 10px">' + esc(ev.description) + '</div>' : "") +
      '<div class="wz-i-sub" style="font-weight:700;margin:0 0 12px">🚶 ' + walkMin(x.km) + ' min à pied · ' + (x.km < 1 ? Math.round(x.km * 1000) + ' m' : x.km.toFixed(1) + ' km') + ' · vérifie les horaires</div>' +
      '<button type="button" class="wz-i-go" data-i="droute" data-id="' + esc(ev.id) + '">Y aller</button>' +
      (list.length > 1 ? '<button type="button" class="wz-i-alt" data-i="dnext">Une autre adresse</button>' : '') +
      '<div class="wz-q-note" style="margin-top:12px">Whazup ne dévoile pas de photo : la surprise fait partie du plaisir.</div>';
    r.innerHTML = h; r.scrollTop = 0;
  }

  function screenSurprise() {
    var r = root(), x = S.ranked[S.offset];
    var wl = (SW.filter(function (w) { return w[0] === S.when; })[0] || [0, ""])[1].toLowerCase();
    var wsel = S.sw && S.sw !== "any" ? (WANT.filter(function (y) { return y[0] === S.sw; })[0] || [0, ""])[1] : "";
    var showRows = S.refine || !x;
    var h = '<button type="button" class="wz-i-x" data-i="close" aria-label="Fermer">✕</button>' + (S.after ? "" : tabsHtml("idea")) + '<div class="wz-i-k" style="margin:2px 0 14px">' + (S.after ? "🎲 Et après · " + esc(String(S.after).slice(0, 40)) : "🎲 Ta surprise" + (wl ? " · " + esc(wl) : "")) + '</div>' +
      (!S.after && dinnerSlot() ? '<button type="button" class="wz-i-card wz-d-card" data-i="dinner" style="display:block;width:100%;text-align:left;margin:0 0 12px;padding:14px 16px;border:2px solid #E85D3D;border-radius:18px;background:#fff;font:inherit;cursor:pointer;color:inherit"><b style="display:block;font-size:16px">🍽️ ' + (dinnerSlot() === "diner" ? "Dîner" : "Déjeuner") + ' surprise près de toi</b><span style="display:block;font-size:13px;opacity:.75;margin-top:2px">Une adresse cachée à moins de 15 min à pied</span></button>' : "") +
      (S.planMsg ? '<div class="wz-q-note" style="margin:0 0 12px"><b>PAS ASSEZ DE SORTIES POUR UN PROGRAMME</b>Il n’y a pas assez de sorties proches et bien placées dans la journée. Voici une idée à la place.</div>' : "");
    S.planMsg = false;
    if (showRows) {
    h += '<div class="wz-s-row">';
    SWANT.forEach(function (k) { var w = WANT.filter(function (y) { return y[0] === k; })[0]; if (!w) return; if (k === "resto" && !(window.__wzRestos && window.__wzRestos.length)) return; h += '<button type="button" class="wz-i-c' + (S.sw === k ? " on" : "") + '" data-i="swant" data-v="' + k + '">' + (k === "any" ? "✨ Peu importe" : w[1]) + "</button>"; });
    h += '</div><div class="wz-s-row">';
    SW.forEach(function (w) { h += '<button type="button" class="wz-i-c' + (S.when === w[0] ? " on" : "") + '" data-i="swhen" data-v="' + w[0] + '">' + w[1] + "</button>"; });
    h += "</div>";
    }
    if (!x) {
      h += '<h1 style="font-size:24px">Rien de prévu pour ce choix</h1><div class="wz-i-sub">' + (S.sw === "social" ? "Rien de convivial de prévu pour ce moment. Essaie un autre moment (le soir ou le week-end, c’est plus animé) ou « Peu importe »." : "Essaie un autre moment ou « Peu importe » : on ne te propose que de vraies sorties.") + '</div>';
    } else {
      h += card(x, true); memMark(x.ev, "shown");
      h += '<div class="wz-s-btns"><button type="button" class="wz-i-go" data-i="open" data-id="' + esc(x.ev.id) + '">J’y vais</button><button type="button" class="wz-i-alt" data-i="snext">🎲 Une autre</button></div>' +
        '<button type="button" class="wz-i-alt wz-s-send" data-i="sshare" data-id="' + esc(x.ev.id) + '">✈ Envoyer à un ami</button>';
    }
    if (!showRows && !S.after) h += '<button type="button" class="wz-i-alt ghost" data-i="refine">Affiner ma surprise' + (wsel ? " (" + esc(wsel) + ")" : "") + '</button>';
    if (showRows) h += '<button type="button" class="wz-i-alt ghost" data-i="full">Voir toutes les idées →</button>';   // un seul lien à la fois : « Affiner », puis « Voir toutes les idées »
    h += '<a class="wz-i-alt ghost" href="adresses.html" style="display:block;text-align:center;text-decoration:none">📖 Cafés &amp; tables sympas<span style="display:block;font-weight:500;font-size:12px;opacity:.75">Où déjeuner, goûter ou dîner : tu choisis toi-même</span></a>';
    r.innerHTML = h; r.scrollTop = 0;
  }
  function planColor(cat) { return (typeof CATEGORY_COLORS !== "undefined" && CATEGORY_COLORS[cat]) || "#1F8F86"; }
  function dayTitle(iso) {
    try { var d = new Date(iso + "T12:00:00"), t = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }); return t.charAt(0).toUpperCase() + t.slice(1); } catch (e) { return ""; }
  }
  function planIcs(st) {
    var pad = function (n) { return String(n).padStart(2, "0"); };
    var out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Whazup//Surprise//FR", "CALSCALE:GREGORIAN"];
    st.forEach(function (s, i) {
      var ev = s.ev, m = mins(ev.time), e = Math.min(m + durOf(ev), 1439), ymd = String(ev.date).replace(/-/g, "");
      var esc2 = function (t) { return String(t || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); };
      out.push("BEGIN:VEVENT", "UID:wz-surprise-" + ymd + "-" + i + "@whazup.fr", "DTSTAMP:" + ymd + "T000000Z",
        "DTSTART:" + ymd + "T" + pad(Math.floor(m / 60)) + pad(m % 60) + "00", "DTEND:" + ymd + "T" + pad(Math.floor(e / 60)) + pad(e % 60) + "00",
        "SUMMARY:" + esc2(ev.title), "LOCATION:" + esc2(ev.place), "DESCRIPTION:" + esc2("Programme Whazup"), "END:VEVENT");
    });
    out.push("END:VCALENDAR");
    return out.join("\r\n");
  }
  function downloadPlanIcs() {
    var x = S.ranked[S.offset]; if (!x) return;
    var st = planFrom(x, planPool()); if (st.length < 2) return;
    try {
      var blob = new Blob([planIcs(st)], { type: "text/calendar;charset=utf-8" }), a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "ma-sortie-whazup.ics"; document.body.appendChild(a); a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
    } catch (e) {}
  }
  function screenPlan() {
    var r = root(), x = S.ranked[S.offset]; if (!x) return screenSurprise();
    var st = planStops(x); if (st.length < 2) return screenSurprise();
    var wl = (SW.filter(function (w) { return w[0] === S.when; })[0] || [0, ""])[1].toLowerCase();
    var f = mins(st[0].ev.time), word = (S.when === "tonight" || (f != null && f >= 17 * 60)) ? "soirée" : "journée";
    var h = '<button type="button" class="wz-i-x" data-i="close" aria-label="Fermer">✕</button>' + tabsHtml("plan") + '<div class="wz-i-k" style="margin:2px 0 6px">🎁 Ton programme · ' + word + (wl ? " · " + esc(wl) : "") + '</div>' +
      '<h1 class="wz-q-h">' + esc(dayTitle(st[0].ev.date)) + '</h1><div class="wz-q-sub">' + st.length + (st.some(function (s) { return s.meal; }) ? ' étapes au programme' : ' sorties au programme') + '</div><div class="wz-q-tl">';
    st.forEach(function (s, i) {
      var ev = s.ev, col = planColor(ev.category), venue = ev.place ? String(ev.place).split(",")[0] : "", m = mins(ev.time);
      var tm = m != null ? String(Math.floor(m / 60)).padStart(2, "0") + ":" + String(m % 60).padStart(2, "0") : "";
      if (s.drink) tm = "Après";
      if (i) h += '<div class="wz-q-hop">↓ à environ ' + s.walk + ' min à pied</div>';
      h += '<div class="wz-q-stop"><div class="wz-q-when"><b>' + esc(tm) + '</b><i>' + (s.meal ? "à partir de" : s.drink ? "à ta guise" : ev.category === "Expo" ? "ouverture" : "heure fixe") + '</i></div><div class="wz-q-bar" style="background:' + col + '"></div>' +
        '<div class="wz-q-body"><div class="wz-q-ph">' + phHTML(ev) + '</div><div class="wz-q-kind" style="color:' + col + '">' + (s.meal ? MEALS[s.meal].toUpperCase() + " · " + (ev.mystery || ev.perle ? "ADRESSE CACHÉE" : "ADRESSE DE CARACTÈRE") : s.drink ? "POUR FINIR · UN VERRE" : esc(catLabel(ev).toUpperCase())) + '</div>' +
        '<div class="wz-q-ttl">' + esc(ev.title) + '</div><div class="wz-q-v">' + ((s.drink || s.meal) ? (venue ? esc(venue) + " · " : "") + "vérifie les horaires" : esc(venue)) + '</div><div class="wz-q-acts">' +
        '<button type="button" class="wz-q-lnk" data-i="open" data-id="' + esc(ev.id) + '">Voir la fiche</button>' +
        (i ? '<button type="button" class="wz-q-lnk dim" data-i="pswap" data-id="' + esc(ev.id) + '">Autre idée</button>' : "") + '</div>' +
        (S.swapNone === ev.id ? '<div class="wz-q-none">Pas d’autre idée proche à cette heure. Essaie « Un autre programme ».</div>' : "") + '</div></div>';
    });
    h += '</div><div class="wz-q-exp"><button type="button" class="wz-q-b1" data-i="pics">Ajouter au calendrier</button><button type="button" class="wz-q-b2" data-i="pshare">Partager</button></div>' +
      '<div class="wz-q-note"><b>IL RESTE À PRÉVOIR DE TON CÔTÉ</b>' + (st.some(function (s) { return s.meal; }) ? 'Comment y aller, et réserver si besoin. Distances à vol d’oiseau, vérifie les horaires avant de partir.' : 'Comment y aller et où manger. Distances à vol d’oiseau, vérifie les horaires avant de partir.') + '</div>' +
      '<button type="button" class="wz-i-alt" data-i="pnext">🎲 Un autre programme</button>' +
      '<button type="button" class="wz-i-alt ghost" data-i="planback">← Retour à l’idée</button>';
    r.innerHTML = h; r.scrollTop = 0;
  }
  // « Et après ? » : depuis la fiche d'une sortie, une idée qui commence après elle, tout près
  function afterIdeas(ev) {
    var em = mins(ev.time); if (!ev.date || em == null || ev.isPlace) return [];
    var endM = em + durOf(ev), ref = null, out = [], t0 = String(ev.title || "").toLowerCase();
    try { ref = referencePoint(); } catch (e) {}
    allEvents().forEach(function (c) {
      if (!c.lat || !c.lng || c.isPlace || c.id === ev.id || c.date !== ev.date) return;
      if (String(c.title || "").toLowerCase() === t0) return;
      var cm = mins(c.time); if (cm == null || cm > PLAN_LAST_START) return;
      var km = haversineKm(ev.lat, ev.lng, c.lat, c.lng);
      if (km > PLAN_MAX_KM || km < 0.02 || cm < endM + walkMin(km)) return;
      if (!surpriseOk(c) || PRATIQUE_RE.test(String(c.title || "")) || c.category === "Divers" || c.category === "Brocante") return;
      var o = {}; for (var k in c) o[k] = c[k];
      o.distance = ref ? haversineKm(ref.lat, ref.lng, c.lat, c.lng) : km;
      var real = c.photo && !c.photoGeneric && !c.photoVenue;
      out.push({ ev: o, label: "Ensuite · " + hh(c.time), score: (cm - endM) / 10 + km * 12 - (real ? 60 : c.photoVenue ? 30 : 0) });
    });
    out.sort(function (a, b) { return a.score - b.score; });
    return out.slice(0, 12);
  }
  function openAfter(id) {
    var ev = findEv(id); if (!ev) return;
    var items = afterIdeas(ev); if (!items.length) return;
    track("surprise_after");
    surpriseCss();
    S = { when: "tonight", want: [], sw: "any", zone: "city", offset: 0, ranked: items, refine: false, after: ev.title };
    try { document.body.classList.add("wz-idea-open"); } catch (e) {}
    screenSurprise();
  }
  // repère « on y rencontre du monde » : soirées dansantes, quiz, jeux, conversation, impro… (aucun profil, aucun message : juste une indication)
  var SOCIAL_RE = /(after.?work|\bquiz+\b|blind.?test|\bbal\b|soir[ée]es? jeux|jeux de soci[ée]t[ée]|karaok[ée]|open.?mic|sc[eè]ne ouverte|jam session|\bap[ée]ro\b|caf[ée] (philo|langue|d[ée]bat|rencontre)|conversation|tandem|salsa|bachata|kizomba|tango|lindy|rock.?n.?roll|randonn[ée]e|run club|tournoi|impro\b)/i;
  var SOCIAL_EXC_RE = /(c[ée]libataires?|speed.?dating|enfants?|minots?|kids?|b[ée]b[ée]|seniors?|s[ée]ance|stage|formation|r[ée]union|assembl|complet)/i;
  var SOCIAL2_RE = /(march[ée]s? de nuit|night.?market|nocturne (du|de|des) march|guinguette|soir[ée]e (dansante|[ée]tudiante|latino|afro|disco|r[ée]tro)|dancehall|afrobeat|zouk)/i;
  var BARVENUE_RE = /(\bbar\b|\bpub\b|brasserie|guinguette|taverne|caf[ée]-concert|rooftop)/i;
  var SALLE_RE = /(caf[ée] de la danse|caf[ée] de la gare|caf[ée]-th[ée][âa]tre)/i;
  function isSocial(ev) {
    if (!ev || ev.isPlace || ev.category === "Famille" || ev.category === "Brocante") return false;
    var t = String(ev.title || ""), p = String(ev.place || "");
    if (SOCIAL_EXC_RE.test(t) || isClosed(t)) return false;
    if (SOCIAL_RE.test(t) || SOCIAL2_RE.test(t)) return true;
    // concert ou DJ set dans un bar, un pub ou une guinguette (pas dans une salle de spectacle)
    return (ev.category === "Musique" || ev.category === "Soirée") && ((BARVENUE_RE.test(p) && !SALLE_RE.test(p)) || /dj set/i.test(t));
  }
  function decorateAfter(id) {
    try {
      var old = document.getElementById("wz-after-btn"); if (old) old.remove();
      var oldS = document.getElementById("wz-social-tag"); if (oldS) oldS.remove();
      var ev0 = findEv(id);
      if (isSocial(ev0)) {
        var ttl = document.getElementById("detail-title");
        if (ttl && ttl.parentNode) {
          var sp = document.createElement("div"); sp.id = "wz-social-tag"; sp.innerHTML = '<b style="display:block;font-size:15px;color:#0E4F4A">🤝 Idéal pour venir seul(e)</b><span style="display:block;font-size:13px;line-height:1.45;color:#215B56;margin-top:3px">Ambiance conviviale : on discute facilement et on croise du monde.</span>';
          sp.style.cssText = "display:block;margin:10px 0 6px;padding:12px 14px;border-radius:16px;background:#E6F4F2;border:1.5px solid #13655F;font-family:inherit";
          ttl.parentNode.insertBefore(sp, ttl.nextSibling);
        }
      }
      var ev = ev0; if (!ev || !afterIdeas(ev).length) return;
      var card = document.querySelector("#view-detail .info-card"); if (!card || !card.parentNode) return;
      var b = document.createElement("button"); b.type = "button"; b.id = "wz-after-btn"; b.dataset.id = String(id);
      b.textContent = "🎲 Et après ? Une idée tout près";
      b.style.cssText = "display:block;width:100%;margin:12px 0 0;padding:13px 14px;border-radius:14px;border:1.5px solid #E85D3D;background:#fff;color:#E85D3D;font:800 14.5px inherit;font-family:inherit;cursor:pointer";
      card.parentNode.insertBefore(b, card.nextSibling);
    } catch (e) {}
  }
  function wrapDetail() {
    if (typeof window.openDetail !== "function" || window.openDetail.__wzAfter) return;
    var orig = window.openDetail;
    var w = function (id) { var r = orig.apply(this, arguments); setTimeout(function () { decorateAfter(id); }, 60); return r; };
    w.__wzAfter = true; window.openDetail = w;
  }
  wrapDetail(); document.addEventListener("DOMContentLoaded", wrapDetail); setTimeout(wrapDetail, 1600);
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#wz-after-btn"); if (!b) return;
    e.preventDefault(); e.stopPropagation(); openAfter(b.dataset.id);
  });
  function openSurprise() {
    try { var av = document.getElementById("arrival-screen-overlay"); if (av) av.remove(); } catch (e) {}
    surpriseCss(); wxPrefetch();
    restosLoad();
    var h = new Date().getHours();
    S = { when: (h >= 22 || h < 5) ? "tomorrow" : h >= 17 ? "tonight" : "now" , want: [], sw: loadWant(), zone: "city", offset: 0, ranked: [], refine: false };
    try { showView("discover"); } catch (e) {}
    document.body.classList.add("wz-idea-open");
    surpriseRank();
    // rien ce soir ? on regarde demain, puis le week-end
    var order = ["tonight", "tomorrow", "weekend"], i = order.indexOf(S.when);
    while (!S.ranked.length && i < order.length - 1) { i++; S.when = order[i]; surpriseRank(); }
    track("surprise_open", { when: S.when, want: S.sw });
    screenSurprise();
  }
  function sharePlan() {
    var x = S.ranked[S.offset]; if (!x) return;
    var st = planStops(x); if (st.length < 2) return;
    var f = mins(st[0].ev.time), word = (S.when === "tonight" || (f != null && f >= 17 * 60)) ? "soirée" : "journée";
    var lines = st.map(function (s) {
      var ev = s.ev, venue = ev.place ? String(ev.place).split(",")[0] : "";
      return (s.drink ? "Pour finir · " : s.meal ? (MEALS[s.meal] + " dès ") + hh(ev.time) + " · " : ev.time ? hh(ev.time) + " · " : "") + ev.title + (venue && !s.drink ? " (" + venue + ")" : "");
    });
    var txt = "Ma " + word + " avec Whazup, ça te dit ?\n" + lines.join("\n");
    var url = "https://whazup.fr";
    if (navigator.share) { navigator.share({ title: "Ma " + word + " avec Whazup", text: txt, url: url }).catch(function () {}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(txt + "\n" + url).then(function () { try { showShareToast("Programme copié"); } catch (e) {} }); }
  }
  function shareEv(id) {
    var ev = findEv(id); if (!ev) return;
    var url = typeof eventShareUrl === "function" ? eventShareUrl(ev) : "https://whazup.fr";
    var txt = ev.title + " : ça te dit ?";
    if (navigator.share) { navigator.share({ title: ev.title, text: txt, url: url }).catch(function () {}); }
    else if (navigator.clipboard) { navigator.clipboard.writeText(txt + " " + url).then(function () { try { showShareToast("Lien copié"); } catch (e) {} }); }
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
    if (t) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); return t.id === "sc-surprise" ? openSurprise() : openIdea(); }
    var b = e.target.closest("#wz-idea [data-i]"); if (!b) return;
    var a = b.dataset.i, v = b.dataset.v;
    if (a === "close") { killMap(); return close(); }
    if (a === "route") { e.preventDefault(); S.fromDinner = false; return screenRoute(b.dataset.id); }
    if (a === "back") { killMap(); return S.fromDinner ? screenDinner() : screenResult(); }
    if (a === "dinner") { track("surprise_dinner"); S.dMax = 15; S.dOff = 0; S.dSlot = dinnerSlot(); S.fromDinner = false; return restosLoad().then(screenDinner); }
    if (a === "dnext") { track("surprise_dinner_next"); S.dOff = (S.dOff || 0) + 1; return screenDinner(); }
    if (a === "dfar") { track("surprise_dinner_far"); S.dMax = 30; S.dOff = 0; return screenDinner(); }
    if (a === "dback") { S.fromDinner = false; return screenSurprise(); }
    if (a === "droute") { track("surprise_dinner_go"); S.fromDinner = true; e.preventDefault(); return screenRoute(b.dataset.id); }
    if (a === "when") { S.when = v; return screenAsk(); }
    if (a === "when2") { S.when = v; return go(); }
    if (a === "zone") { S.zone = v; return screenAsk(); }
    if (a === "want") {
      if (v === "any") S.want = S.want.indexOf("any") !== -1 ? [] : ["any"];
      else { S.want = S.want.filter(function (x) { return x !== "any"; }); var i = S.want.indexOf(v); if (i === -1) S.want.push(v); else S.want.splice(i, 1); }
      return screenAsk();
    }
    if (a === "tab") {
      S.swapNone = null;
      if (v === "idea") return screenSurprise();
      track("surprise_plan"); S.planSkip = []; var tx = S.ranked[S.offset];
      if (!tx || planFrom(tx, planPool()).length < 2) { S.planMsg = true; return screenSurprise(); }
      return screenPlan();
    }
    if (a === "pnext") {
      S.swapNone = null;
      track("surprise_plan_next"); var n0 = S.ranked.length, k;
      for (k = 1; k < n0; k++) { var o2 = (S.offset + k) % n0; if (planFrom(S.ranked[o2], planPool()).length > 1) { S.offset = o2; S.planSkip = []; break; } }
      return screenPlan();
    }
    if (a === "plan") { track("surprise_plan"); S.planSkip = []; return screenPlan(); }
    if (a === "pswap") {
      track("surprise_plan_swap"); var px = S.ranked[S.offset];
      S.swapNone = null;
      if (px && isRestoId(b.dataset.id)) { S.planSkip = (S.planSkip || []).concat([b.dataset.id]); var ns = planStops(px); if (!ns.some(function (z) { return z.meal; })) { S.planSkip.pop(); S.swapNone = b.dataset.id; } }
      else if (px) { S.planSkip = (S.planSkip || []).concat([b.dataset.id]); if (planFrom(px, planPool()).length < 2) { S.planSkip.pop(); S.swapNone = b.dataset.id; } }
      return screenPlan();
    }
    if (a === "pics") { track("surprise_plan_ics"); return downloadPlanIcs(); }
    if (a === "pshare") { track("surprise_plan_share"); return sharePlan(); }
    if (a === "planback") return screenSurprise();
    if (a === "refine") { track("surprise_refine"); S.refine = true; return screenSurprise(); }
    if (a === "swant") { track("surprise_filter", { want: v }); S.sw = v; saveWant(v); surpriseRank(); return screenSurprise(); }
    if (a === "swhen") { track("surprise_when", { when: v }); S.when = v; surpriseRank(); return screenSurprise(); }
    if (a === "snext") { track("surprise_next"); try { memMark(S.ranked[S.offset] && S.ranked[S.offset].ev, "skip"); } catch (x) {} S.offset = S.ranked.length ? (S.offset + 1) % S.ranked.length : 0; return screenSurprise(); }
    if (a === "sshare") { track("surprise_share"); return shareEv(b.dataset.id); }
    if (a === "full") { killMap(); return openIdea(); }
    if (a === "go") return go();
    if (a === "more") { S.offset += 3; return screenResult(); }
    if (a === "again") return screenAsk();
    if (a === "open") { var id = b.dataset.id; if (barById(id)) { track("surprise_bar"); return screenRoute(id); } if (isRestoId(id)) { track("surprise_resto"); return screenRoute(id); } if (root().querySelector(".wz-s-btns")) track("surprise_go"); close(); try { openDetail(id); } catch (x) {} }
  }, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  window.__wzIdeaOpen = openIdea; window.__wzSurpriseOpen = openSurprise; surpriseCss(); setTimeout(function () { wxPrefetch(); restosLoad(); }, 4000);
  // l'ancien parcours « Étape 1/2 » (guided-quest.js) est remplacé : ses accès ouvrent maintenant celui-ci
  try { Object.defineProperty(window, "__questOpen", { configurable: true, get: function () { return openIdea; }, set: function () {} }); } catch (e) {}

  // ---- ♥ sans compte : un nouveau visiteur garde ses favoris tout de suite ; le compte lui est proposé après le 3e ----
  function favNudge() {
    try {
      if (state.favorites.size < 3 || localStorage.getItem("wz-fav-nudge")) return;
      localStorage.setItem("wz-fav-nudge", "1");
    } catch (e) { return; }
    var old = document.getElementById("wz-fav-nudge"); if (old) old.remove();
    var d = document.createElement("div"); d.id = "wz-fav-nudge"; d.setAttribute("role", "status");
    d.style.cssText = "position:fixed;left:16px;right:16px;bottom:96px;z-index:100000;background:#14213D;color:#fff;border-radius:18px;padding:14px 16px;box-shadow:0 14px 34px rgba(0,0,0,.35);font:600 14px/1.35 system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto";
    d.innerHTML = '<div>❤️ Tes favoris sont gardés sur cet appareil. Crée un compte (10 secondes) pour ne pas les perdre si tu changes de téléphone.</div><div style="display:flex;gap:10px;margin-top:12px"><button type="button" data-n="go" style="flex:1;padding:11px;border:0;border-radius:12px;background:#E8655A;color:#fff;font:800 14px inherit;cursor:pointer">Créer mon compte</button><button type="button" data-n="x" style="flex:1;padding:11px;border:0;border-radius:12px;background:rgba(255,255,255,.14);color:#fff;font:700 14px inherit;cursor:pointer">Plus tard</button></div>';
    d.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-n]"); if (!b) return;
      if (b.dataset.n === "go") { try { var m = document.getElementById("account-modal"); if (m) m.classList.remove("hidden"); } catch (x) {} track("fav_nudge_go"); }
      d.remove();
    });
    document.body.appendChild(d);
    track("fav_nudge_show");
    setTimeout(function () { if (d.parentNode) d.remove(); }, 20000);
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#btn-favorite"); if (!b) return;
    var u = null; try { u = auth.currentUser; } catch (x) {}
    if (u && !u.isAnonymous) return; // avec un compte : comportement habituel
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    var id = state.currentEventId; if (!id) return;
    if (state.favorites.has(id)) state.favorites.delete(id); else state.favorites.add(id);
    saveFavorites(); openDetail(id); track("fav_guest");
    favNudge();
  }, true);
  // ---- points & fidélité : masqués pour l'instant (ils continuent de se compter en arrière-plan, rien n'est supprimé) ----
  var BTN_TXT = "📤 Inviter un ami";
  var MODAL_TXT = "Connecte-toi pour retrouver tes favoris et tes souvenirs sur tous tes appareils.";
  function noPoints() {
    try {
      var b = document.getElementById("btn-invite-friend");
      if (b && /pts|point/i.test(b.textContent + (b.dataset.i18n || ""))) { b.dataset.i18n = BTN_TXT; b.textContent = BTN_TXT; }
      var m = document.getElementById("account-modal");
      if (m) {
        var ps = m.querySelectorAll("p");
        for (var i = 0; i < ps.length; i++) if (/points/i.test(ps[i].textContent) && ps[i].children.length === 0) ps[i].textContent = MODAL_TXT;
      }
      var lb = document.getElementById("loyalty-badge"); if (lb) lb.style.display = "none";
    } catch (e) {}
  }
  noPoints(); setInterval(noPoints, 2000);
  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest("#btn-invite-friend"); if (!b) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    var url = location.origin + location.pathname + "?ref=1";
    function copy() {
      try {
        navigator.clipboard.writeText(url).then(function () {
          if (typeof showShareToast === "function") showShareToast("Lien copié ! Envoie-le à un ami."); else alert("Lien copié ! Envoie-le à un ami.");
        }, function () { prompt("Copie ce lien et envoie-le à un ami :", url); });
      } catch (x) { prompt("Copie ce lien et envoie-le à un ami :", url); }
    }
    track("invite_click");
    if (navigator.share) { navigator.share({ title: "Whazup", text: "Découvre les sorties près de chez toi !", url: url }).catch(function (er) { if (!er || er.name !== "AbortError") copy(); }); return; }
    copy();
  }, true);
})();
