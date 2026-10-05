// ---- Prépare ton séjour (version 1) ----
// Choisis une ville + des dates + un rythme : Whazup compose un programme jour par jour
// avec les vrais événements (heures fixes), les lieux à voir et les bars de la base.
// Pour tout annuler : retirer la ligne <script src="sejour.js"> dans index.html.
(function () {
  "use strict";

  var STORE_KEY = "wz_sejour_v1";
  var DUR_MIN = 120;            // durée supposée d'un événement à heure fixe
  var SLOT_MIN = { morning: 600, afternoon: 900, evening: 1230 };
  var SLOT_LABEL = { morning: "Matin", afternoon: "Après-midi", evening: "Soir" };
  var MAX_DAYS = 7;
  var MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var WEEKDAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

  // ---- les envies proposées ----
  var GROUPS = [
    { id: "musique", label: "Concerts et soirées", color: "#9d4edd", cats: ["Musique", "Concert", "Soirée", "Spectacle", "Théâtre", "Danse"] },
    { id: "fetes", label: "Fêtes et festivals", color: "#d97a2b", cats: ["Festival", "Fête"] },
    { id: "culture", label: "Expos et culture", color: "#2a9d8f", cats: ["Expo", "Conférence", "Cinéma", "Atelier", "Visite"] },
    { id: "marches", label: "Marchés et brocantes", color: "#c9a227", cats: ["Marché", "Brocante"] },
    { id: "sport", label: "Sport et nature", color: "#3a86ff", cats: ["Sport", "Rando", "Nature"] },
    { id: "lieux", label: "Lieux à voir", color: "#1f6f78", cats: ["À voir"] },
    { id: "vins", label: "Vignobles et dégustations", color: "#b5446e", cats: [] },
    { id: "bars", label: "Bars", color: "#6c757d", cats: ["Bar"] }
  ];
  var DEFAULT_GROUPS = ["musique", "fetes", "culture", "lieux"];
  var WINE_RE = /vign|vin\b|vins\b|d[ée]gust|ch[âa]teau|domaine|cave\b|oenolog|œnolog|vendange/i;

  function groupOf(it) {
    if (it.category === "Bar") return "bars";
    if (it.category === "À voir") return WINE_RE.test(it.title || "") ? "vins" : "lieux";
    if (WINE_RE.test(it.title || "") && it.category !== "Marché") return "vins";
    for (var i = 0; i < GROUPS.length; i++) if (GROUPS[i].cats.indexOf(it.category) >= 0) return GROUPS[i].id;
    return "fetes";
  }

  // ---- petits outils ----
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function isoOf(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseIso(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2], 12, 0, 0); }
  function addDays(iso, n) { var d = parseIso(iso); d.setDate(d.getDate() + n); return isoOf(d); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function dayLong(iso) { var d = parseIso(iso); return cap(WEEKDAYS[d.getDay()]) + " " + d.getDate() + " " + MONTHS[d.getMonth()]; }
  function dayShort(iso) { var d = parseIso(iso); return cap(WEEKDAYS[d.getDay()].slice(0, 3)) + ". " + d.getDate(); }
  function rangeLabel(a, b) {
    var da = parseIso(a), db = parseIso(b);
    if (a === b) return da.getDate() + " " + MONTHS[da.getMonth()];
    if (da.getMonth() === db.getMonth()) return da.getDate() + " → " + db.getDate() + " " + MONTHS[db.getMonth()];
    return da.getDate() + " " + MONTHS[da.getMonth()] + " → " + db.getDate() + " " + MONTHS[db.getMonth()];
  }
  function parseTime(t) {
    var m = /^\s*(\d{1,2})\s*[:hH]\s*(\d{2})?/.exec(t || "");
    if (!m) return null;
    var h = +m[1], mi = m[2] ? +m[2] : 0;
    if (h > 23 || mi > 59) return null;
    return h * 60 + mi;
  }
  function hhmm(min) { return pad(Math.floor(min / 60)) + ":" + pad(min % 60); }
  function km(a, b) {
    var R = 6371, r = Math.PI / 180;
    var dLat = (b.lat - a.lat) * r, dLng = (b.lng - a.lng) * r;
    var x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }
  function validPt(o) { return o && typeof o.lat === "number" && typeof o.lng === "number" && isFinite(o.lat) && isFinite(o.lng); }
  function hop(a, b) {
    if (!validPt(a) || !validPt(b)) return "";
    var d = km(a, b);
    if (d < 0.15) return "juste à côté";
    if (d < 1.6) return "à environ " + Math.max(2, Math.round(d * 12 / 5) * 5) + " min à pied";
    return "à environ " + (d < 10 ? d.toFixed(1).replace(".", ",") : Math.round(d)) + " km";
  }
  function typeKey(title) {
    var t = (title || "").toLowerCase();
    if (/ch[âa]teau/.test(t)) return "chateau";
    if (/[ée]glise|cath[ée]drale|basilique|chapelle|abbaye|temple/.test(t)) return "eglise";
    if (/mus[ée]e|galerie|expo/.test(t)) return "musee";
    if (/jardin|parc|square/.test(t)) return "jardin";
    if (/th[ée][âa]tre|opéra|opera|salle/.test(t)) return "theatre";
    return "autre";
  }

  // ---- composition du programme ----
  function placeScore(p, centre) {
    var d = km(centre, p);
    var s = 10 - d * 0.7;
    if (p.photo && !p.photoGeneric) s += 2.5; else if (p.photo) s += 1;
    return s;
  }
  function prepare(data, centre, groups) {
    function ok(it) { return validPt(it) && groups[groupOf(it)]; }
    var events = (data.events || []).filter(function (e) { return e.date && ok(e) && km(centre, e) <= 30; });
    var places = (data.places || []).filter(function (p) { return ok(p) && km(centre, p) <= 25 && !/librairie|boutique|office de tourisme|parking|toilette|billetterie/i.test(p.title || ""); });
    var bars = (data.bars || []).filter(function (p) { return ok(p) && km(centre, p) <= 6; });
    return { events: events, places: places, bars: bars };
  }

  function mkStop(it, kind, slot, time) {
    return {
      id: it.id, kind: kind, title: it.title || "Sans titre", category: it.category || "", place: it.place || "",
      lat: it.lat, lng: it.lng, time: time || "", slot: slot || "", photo: it.photo || ""
    };
  }

  function tkey(title) {
    return "k:" + String(title || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
  }
  function mark(used, it) { used[it.id] = true; used[tkey(it.title)] = true; }

  function pickNearest(pool, used, anchor, centre, usedTypes) {
    var best = null, bestV = -1e9;
    var top = pool.filter(function (p) { return !used[p.id] && !used[tkey(p.title)]; })
      .map(function (p) { return { p: p, s: placeScore(p, centre) }; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 14);
    top.forEach(function (x) {
      var v = x.s - (anchor ? km(anchor, x.p) * 0.9 : 0);
      if (usedTypes && usedTypes[typeKey(x.p.title)] && typeKey(x.p.title) !== "autre") v -= 2.5;
      if (v > bestV) { bestV = v; best = x.p; }
    });
    return best;
  }

  function planDay(day, pools, centre, rhythm, groups, used) {
    var evs = pools.events.filter(function (e) { return e.date === day && !used[e.id]; });
    var timed = [], flex = [];
    evs.forEach(function (e) {
      var t = parseTime(e.time);
      if (t == null) flex.push(e); else timed.push({ e: e, t: t });
    });
    function evScore(x) {
      var e = x.e || x;
      var sc = 10 - km(centre, e) * 0.6 + 3;
      sc += { Musique: 1.5, Expo: 1.5, "Spectacle": 1.5, "Théâtre": 1.5, Concert: 1.5, "Soirée": 1, Festival: 0.3 }[e.category] || 0;
      if (/th[ée][âa]tre|com[ée]die|op[ée]ra|salle|capitole|z[ée]nith|casino|mus[ée]e|halle|cin[ée]ma|galerie|abbaye|[ée]glise|cath[ée]drale|jardin/i.test(e.place || "")) sc += 1.5;
      if ((e.description || "").length > 150) sc += 0.7;
      if (/octobre rose|vide-|journ[ée]e nationale|stage |loto|bourse aux|assembl[ée]e|r[ée]union|permanence|portes? ouvertes? du club/i.test(e.title || "")) sc -= 3;
      return sc;
    }
    timed.sort(function (a, b) { return evScore(b) - evScore(a); });
    var fixedCap = rhythm >= 4 ? rhythm : Math.max(1, rhythm - 1);
    var picked = [];
    timed.forEach(function (x) {
      var clash = null;
      for (var i = 0; i < picked.length; i++) {
        var o = picked[i];
        if (x.t < o.t + DUR_MIN + 20 && o.t < x.t + DUR_MIN + 20) { clash = o; break; }
      }
      if (clash) {
        (clash.alt = clash.alt || []).push({ title: x.e.title, time: hhmm(x.t) });
        clash.altN = (clash.altN || 0) + 1;
      } else if (picked.length < fixedCap) {
        picked.push(x);
      }
    });
    var stops = picked.map(function (x) {
      var s = mkStop(x.e, "event", "", hhmm(x.t));
      s.fixed = true;
      if (x.alt) s.alt = x.alt;
      mark(used, x.e);
      return s;
    });
    var busy = { morning: false, afternoon: false, evening: false };
    picked.forEach(function (x) {
      busy[x.t < 750 ? "morning" : x.t < 1080 ? "afternoon" : "evening"] = true;
    });
    var need = rhythm - stops.length;
    var usedTypes = {};
    var slots = ["morning", "afternoon", "evening"];
    var flexLeft = flex.slice().sort(function (a, b) { return evScore({ e: b }) - evScore({ e: a }); });
    slots.forEach(function (slot) {
      if (need <= 0 || busy[slot]) return;
      var anchor = null;
      stops.slice().sort(function (a, b) { return (parseTime(a.time) || SLOT_MIN[a.slot]) - (parseTime(b.time) || SLOT_MIN[b.slot]); })
        .forEach(function (s) { var m = parseTime(s.time) || SLOT_MIN[s.slot]; if (m <= SLOT_MIN[slot]) anchor = s; });
      var stop = null;
      var NIGHT = /^(Soirée|Concert|Musique|Spectacle|Théâtre|Danse)$/;
      if (slot === "evening") {
        var nf = flexLeft.filter(function (e) { return !used[e.id] && NIGHT.test(e.category) && km(centre, e) <= 15 && evScore({ e: e }) >= 11; })[0];
        if (nf) {
          stop = mkStop(nf, "event", slot, ""); stop.flex = true; mark(used, nf);
        } else if (groups.bars && pools.bars.length) {
          var b = pickNearest(pools.bars, used, anchor || centre, centre, null);
          if (b) { stop = mkStop(b, "bar", slot, ""); mark(used, b); }
        }
      } else {
        // un événement « sans heure précise » passe en premier s'il y en a un de bien placé
        var f = flexLeft.filter(function (e) { return !used[e.id] && !NIGHT.test(e.category) && km(centre, e) <= 12 && evScore({ e: e }) >= 11 && (slot !== "morning" || e.category === "Marché"); })[0];
        if (f) {
          stop = mkStop(f, "event", slot, ""); stop.flex = true; mark(used, f);
        } else {
          var p = pickNearest(pools.places, used, anchor || centre, centre, usedTypes);
          if (p) { stop = mkStop(p, "place", slot, ""); mark(used, p); usedTypes[typeKey(p.title)] = true; }
        }
      }
      if (stop) { stops.push(stop); need--; }
    });
    stops.sort(function (a, b) {
      var ta = a.time ? parseTime(a.time) : SLOT_MIN[a.slot], tb = b.time ? parseTime(b.time) : SLOT_MIN[b.slot];
      return ta - tb;
    });
    return stops;
  }

  function composePlan(data, opts) {
    var centre = opts.centre;
    var groups = {}; opts.groups.forEach(function (g) { groups[g] = true; });
    var pools = prepare(data, centre, groups);
    var used = {};
    var days = [];
    for (var i = 0; i < opts.nbDays; i++) {
      var iso = addDays(opts.start, i);
      days.push({ date: iso, stops: planDay(iso, pools, centre, opts.rhythm, groups, used) });
    }
    return {
      city: opts.city, cityName: opts.cityName, centre: centre, start: opts.start, end: addDays(opts.start, opts.nbDays - 1),
      rhythm: opts.rhythm, groups: opts.groups, days: days
    };
  }

  // remplace une sortie « libre » par une autre idée proche
  function swapStop(plan, data, di, si) {
    var day = plan.days[di], old = day.stops[si];
    if (!old || old.fixed) return false;
    var groups = {}; plan.groups.forEach(function (g) { groups[g] = true; });
    var pools = prepare(data, plan.centre, groups);
    var used = {};
    plan.days.forEach(function (d) { d.stops.forEach(function (s) { mark(used, s); }); });
    var anchor = day.stops[si - 1] || plan.centre;
    var pool = old.kind === "bar" ? pools.bars : pools.places;
    var p = pickNearest(pool, used, anchor, plan.centre, null);
    if (!p) return false;
    day.stops[si] = mkStop(p, old.kind, old.slot, "");
    return true;
  }

  // ---- données de la ville ----
  var cache = {};
  function getJson(url) {
    return fetch(url).then(function (r) { return r.ok ? r.json() : []; }).then(function (a) { return Array.isArray(a) ? a : []; }).catch(function () { return []; });
  }
  function loadCity(key) {
    if (cache[key]) return Promise.resolve(cache[key]);
    return Promise.all([
      getJson("/data/events/" + key + ".json"),
      getJson("/data/places/" + key + ".json"),
      getJson("/data/bars/" + key + ".json")
    ]).then(function (r) {
      var d = { events: r[0], places: r[1], bars: r[2] };
      if (d.events.length || d.places.length) cache[key] = d;
      return d;
    });
  }
  var indexCache = null;
  function loadIndex() {
    if (indexCache) return Promise.resolve(indexCache);
    return fetch("/data/index.json").then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
      .then(function (i) { indexCache = i; return i; });
  }

  // ---- export : calendrier, partage, itinéraire ----
  function icsEscape(s) { return String(s || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n"); }
  function stopStartMin(s) { return s.time ? parseTime(s.time) : SLOT_MIN[s.slot]; }
  function buildIcs(plan) {
    var out = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Whazup//Sejour//FR", "CALSCALE:GREGORIAN"];
    plan.days.forEach(function (d, di) {
      d.stops.forEach(function (s, si) {
        var st = stopStartMin(s), en = st + (s.kind === "event" && s.time ? DUR_MIN : 90);
        var ymd = d.date.replace(/-/g, "");
        function stamp(m) { return ymd + "T" + pad(Math.floor(Math.min(m, 1439) / 60)) + pad(Math.min(m, 1439) % 60) + "00"; }
        out.push("BEGIN:VEVENT",
          "UID:wz-" + plan.city + "-" + d.date + "-" + di + "-" + si + "@whazup.fr",
          "DTSTAMP:" + isoOf(new Date()).replace(/-/g, "") + "T000000Z",
          "DTSTART:" + stamp(st), "DTEND:" + stamp(en),
          "SUMMARY:" + icsEscape(s.title),
          "LOCATION:" + icsEscape(s.place),
          "DESCRIPTION:" + icsEscape("Programme Whazup · " + plan.cityName + (s.time ? "" : " · horaire à ta guise")),
          "END:VEVENT");
      });
    });
    out.push("END:VCALENDAR");
    return out.join("\r\n");
  }
  function downloadIcs(plan) {
    var blob = new Blob([buildIcs(plan)], { type: "text/calendar;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "sejour-" + plan.city + ".ics";
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  function planText(plan) {
    var lines = ["Mon séjour à " + plan.cityName + " · " + rangeLabel(plan.start, plan.end), ""];
    plan.days.forEach(function (d) {
      lines.push(dayLong(d.date));
      if (!d.stops.length) lines.push("  Libre");
      d.stops.forEach(function (s) { lines.push("  " + (s.time || SLOT_LABEL[s.slot]) + " · " + s.title); });
      lines.push("");
    });
    lines.push("Préparé avec Whazup · whazup.fr");
    return lines.join("\n");
  }
  function mapsDay(day) {
    var pts = day.stops.filter(validPt);
    if (!pts.length) return "";
    function ll(p) { return p.lat + "," + p.lng; }
    if (pts.length === 1) return "https://www.google.com/maps/search/?api=1&query=" + ll(pts[0]);
    var url = "https://www.google.com/maps/dir/?api=1&origin=" + ll(pts[0]) + "&destination=" + ll(pts[pts.length - 1]);
    var mid = pts.slice(1, -1).slice(0, 8).map(ll);
    if (mid.length) url += "&waypoints=" + encodeURIComponent(mid.join("|"));
    return url;
  }

  // ---- stockage ----
  function savePlan(plan) { try { localStorage.setItem(STORE_KEY, JSON.stringify(plan)); } catch (e) {} }
  function loadPlan() {
    try {
      var p = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (p && p.days && p.days.length && p.end >= isoOf(new Date())) return p;
    } catch (e) {}
    return null;
  }

  // ---- interface ----
  var CSS = [
    "#wz-sj{position:fixed;inset:0;z-index:100000;overflow-y:auto;-webkit-overflow-scrolling:touch;background:linear-gradient(180deg,#14213f 0%,#0b1526 100%);color:#fff;font-family:system-ui,-apple-system,'Segoe UI',sans-serif;padding:max(env(safe-area-inset-top),18px) 18px max(env(safe-area-inset-bottom),24px);box-sizing:border-box}",
    "#wz-sj *{box-sizing:border-box}",
    "#wz-sj .in{max-width:520px;margin:0 auto;display:flex;flex-direction:column;gap:16px}",
    "#wz-sj .top{display:flex;justify-content:space-between;align-items:center;min-height:36px}",
    "#wz-sj .x{border:0;background:rgba(255,255,255,.1);color:#fff;border-radius:999px;padding:8px 14px;font-size:14px;font-weight:700;cursor:pointer}",
    "#wz-sj .eyebrow{margin:0;font-size:12.5px;letter-spacing:.08em;font-weight:700;color:#f0c878;text-transform:uppercase}",
    "#wz-sj h1{margin:2px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;font-weight:700;text-wrap:balance}",
    "#wz-sj .lead{margin:6px 0 0;font-size:15px;line-height:1.45;color:#c3c8d6}",
    "#wz-sj .card{border-radius:16px;padding:14px 16px;background:#1b2a4d;display:flex;flex-direction:column;gap:10px}",
    "#wz-sj .lab{font-size:12px;color:#8f98ad;letter-spacing:.04em;font-weight:700;text-transform:uppercase}",
    "#wz-sj select,#wz-sj input[type=date]{width:100%;border:1.5px solid #3a4560;background:#14213f;color:#fff;border-radius:12px;padding:12px;font-size:16px;font-family:inherit;color-scheme:dark}",
    "#wz-sj .row{display:flex;gap:10px}#wz-sj .row>div{flex:1;display:flex;flex-direction:column;gap:6px;min-width:0}",
    "#wz-sj .rhythm{display:flex;gap:8px}",
    "#wz-sj .rbtn{flex:1;border:1.5px solid #3a4560;border-radius:14px;padding:11px 4px;background:#14213f;color:#dfe3ee;font-size:14px;font-weight:700;line-height:1.25;cursor:pointer;font-family:inherit}",
    "#wz-sj .rbtn small{display:block;font-size:12px;font-weight:500;color:#8f98ad}",
    "#wz-sj .rbtn.on{background:#1f6f78;border-color:#1f6f78;color:#fff}#wz-sj .rbtn.on small{color:#d6eef0}",
    "#wz-sj .chips{display:flex;flex-wrap:wrap;gap:8px}",
    "#wz-sj .chip{border-radius:999px;padding:9px 14px;border:1.5px solid #3a4560;background:transparent;color:#dfe3ee;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit}",
    "#wz-sj .chip.on{border-color:transparent;color:#fff;font-weight:700}",
    "#wz-sj .go{border:0;border-radius:16px;padding:18px;background:linear-gradient(90deg,#f0c878,#e85d3d);color:#fff;font-size:16px;font-weight:800;cursor:pointer;font-family:inherit}",
    "#wz-sj .go[disabled]{opacity:.55}",
    "#wz-sj .err{color:#ffb4a2;font-size:14px;line-height:1.4}",
    "#wz-sj .tabs{display:flex;gap:8px;overflow-x:auto;padding-bottom:2px}",
    "#wz-sj .tab{flex:1 0 auto;min-width:64px;text-align:center;border:1.5px solid #3a4560;border-radius:12px;padding:9px 8px;font-size:13.5px;font-weight:700;color:#aeb5c8;background:transparent;cursor:pointer;font-family:inherit}",
    "#wz-sj .tab.on{background:#f0c878;border-color:#f0c878;color:#14213f;font-weight:800}",
    "#wz-sj .stop{display:flex;gap:12px}",
    "#wz-sj .when{width:54px;flex-shrink:0;text-align:right;padding-top:12px}",
    "#wz-sj .when b{display:block;font-size:12px;color:#8f98ad;line-height:1.2}",
    "#wz-sj .when b.t{font-size:18px;color:#fff;font-variant-numeric:tabular-nums}",
    "#wz-sj .when i{display:block;font-style:normal;font-size:11px;color:#8f98ad}",
    "#wz-sj .bar{width:3px;border-radius:2px;flex-shrink:0;margin:6px 0}",
    "#wz-sj .body{flex:1;min-width:0;border-radius:16px;padding:12px 14px;background:#1b2a4d;margin-bottom:8px}",
    "#wz-sj .kind{font-size:11.5px;letter-spacing:.06em;font-weight:700;text-transform:uppercase}",
    "#wz-sj .ttl{font-family:Georgia,'Times New Roman',serif;font-size:17px;font-weight:700;line-height:1.25;margin:3px 0}",
    "#wz-sj .sub{font-size:13px;color:#aeb5c8;line-height:1.35;overflow-wrap:anywhere}",
    "#wz-sj .acts{display:flex;gap:14px;margin-top:8px;flex-wrap:wrap}",
    "#wz-sj .lnk{border:0;background:none;padding:2px 0;color:#f0c878;font-size:13px;font-weight:800;cursor:pointer;text-decoration:none;font-family:inherit}",
    "#wz-sj .lnk.dim{color:#8f98ad;font-weight:700}",
    "#wz-sj .hop{margin:-2px 0 6px 66px;font-size:12px;color:#8f98ad}",
    "#wz-sj .warn{border:1.5px dashed #3a4560;border-radius:14px;padding:10px 14px;font-size:13.5px;color:#aeb5c8;line-height:1.4}",
    "#wz-sj .warn b{color:#f0c878}",
    "#wz-sj .empty{border-radius:16px;padding:18px;background:#1b2a4d;color:#c3c8d6;font-size:14.5px;line-height:1.45}",
    "#wz-sj .exp{display:flex;gap:10px}",
    "#wz-sj .exp button{flex:1;border-radius:14px;padding:14px 6px;font-size:14.5px;font-weight:800;cursor:pointer;font-family:inherit}",
    "#wz-sj .b1{border:0;background:#1f6f78;color:#fff}#wz-sj .b2{border:1.5px solid #f0c878;background:transparent;color:#f0c878}",
    "#wz-sj .note{border-radius:14px;padding:12px 14px;background:#162340;font-size:13.5px;line-height:1.45;color:#c3c8d6}",
    "#wz-sj .note b{display:block;font-size:12px;color:#8f98ad;letter-spacing:.04em;margin-bottom:4px}",
    "#wz-sj button:focus-visible,#wz-sj select:focus-visible,#wz-sj input:focus-visible{outline:2px solid #f0c878;outline-offset:2px}"
  ].join("\n");

  var root = null, ui = { cityKey: null, start: "", end: "", rhythm: 3, groups: {}, plan: null, day: 0, err: "", busy: false, cities: [] };

  function ensureRoot() {
    if (!document.getElementById("wz-sj-css")) {
      var st = document.createElement("style"); st.id = "wz-sj-css"; st.textContent = CSS; document.head.appendChild(st);
    }
    if (!root) { root = document.createElement("div"); root.id = "wz-sj"; root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "Prépare ton séjour"); document.body.appendChild(root); }
    return root;
  }
  function closeSj() {
    if (root) { root.remove(); root = null; }
    document.body.style.overflow = ui._bodyOverflow || "";
  }

  function cityName(key) {
    try { if (typeof CITIES !== "undefined" && CITIES[key]) return CITIES[key].name; } catch (e) {}
    return key;
  }
  function cityCentre(key) {
    try { if (typeof CITIES !== "undefined" && CITIES[key]) return { lat: CITIES[key].lat, lng: CITIES[key].lng }; } catch (e) {}
    return null;
  }

  function nextFriday() {
    var d = new Date(); d.setHours(12, 0, 0, 0);
    var add = (5 - d.getDay() + 7) % 7;
    if (add === 0 && d.getHours() >= 0) add = 0;
    d.setDate(d.getDate() + add);
    return isoOf(d);
  }

  function renderForm() {
    var r = ensureRoot();
    var today = isoOf(new Date());
    var opts = ui.cities.map(function (c) {
      return '<option value="' + esc(c.key) + '"' + (c.key === ui.cityKey ? " selected" : "") + ">" + esc(c.name) + "</option>";
    }).join("");
    var chips = GROUPS.map(function (g) {
      var on = ui.groups[g.id];
      return '<button type="button" class="chip' + (on ? " on" : "") + '" data-g="' + g.id + '"' + (on ? ' style="background:' + g.color + '"' : "") + ' aria-pressed="' + (on ? "true" : "false") + '">' + esc(g.label) + "</button>";
    }).join("");
    var nb = ui.start && ui.end ? Math.round((parseIso(ui.end) - parseIso(ui.start)) / 86400000) + 1 : 0;
    var rh = [[2, "Tranquille", "2 sorties par jour"], [3, "Équilibré", "3 sorties par jour"], [4, "À fond", "4 par jour"]].map(function (x) {
      return '<button type="button" class="rbtn' + (ui.rhythm === x[0] ? " on" : "") + '" data-r="' + x[0] + '">' + x[1] + "<small>" + x[2] + "</small></button>";
    }).join("");
    r.innerHTML =
      '<div class="in">' +
        '<div class="top"><span></span><button type="button" class="x" data-act="close">Fermer</button></div>' +
        '<div><p class="eyebrow">Nouveau · Prépare ton séjour</p><h1>Où pars-tu, et quand ?</h1>' +
        '<p class="lead">On te compose un programme jour par jour avec ce qui se passe vraiment pendant ton séjour.</p></div>' +
        '<div class="card"><label class="lab" for="sj-city">Destination</label><select id="sj-city">' + opts + "</select></div>" +
        '<div class="card"><div class="lab">Dates' + (nb ? " · " + nb + (nb > 1 ? " jours" : " jour") : "") + "</div>" +
          '<div class="row"><div><label class="lab" for="sj-start">Arrivée</label><input type="date" id="sj-start" min="' + today + '" value="' + esc(ui.start) + '"></div>' +
          '<div><label class="lab" for="sj-end">Départ</label><input type="date" id="sj-end" min="' + today + '" value="' + esc(ui.end) + '"></div></div></div>' +
        '<div class="card"><div class="lab">Ton rythme</div><div class="rhythm">' + rh + "</div></div>" +
        '<div class="card"><div class="lab">Tes envies</div><div class="chips">' + chips + "</div></div>" +
        (ui.err ? '<div class="err" role="alert">' + esc(ui.err) + "</div>" : "") +
        '<button type="button" class="go" data-act="compose"' + (ui.busy ? " disabled" : "") + ">" + (ui.busy ? "Composition en cours…" : "Composer mon programme") + "</button>" +
      "</div>";
    var sc = r.querySelector("#sj-city");
    sc.onchange = function () { ui.cityKey = sc.value; };
    var s = r.querySelector("#sj-start"), e = r.querySelector("#sj-end");
    s.onchange = function () {
      ui.start = s.value;
      if (!ui.end || ui.end < ui.start) ui.end = addDays(ui.start, 2);
      renderForm();
    };
    e.onchange = function () { ui.end = e.value; renderForm(); };
  }

  var KIND_LABEL = { event: "Événement", place: "À voir", bar: "Bar" };
  function kindColor(s) {
    if (s.kind === "bar") return "#6c757d";
    if (s.kind === "place") return "#2a9d8f";
    var g = GROUPS.filter(function (x) { return x.id === groupOf(s); })[0];
    return g ? g.color : "#d97a2b";
  }

  function renderResult() {
    var r = ensureRoot(), p = ui.plan;
    var total = p.days.reduce(function (n, d) { return n + d.stops.length; }, 0);
    var tabs = p.days.map(function (d, i) {
      return '<button type="button" class="tab' + (i === ui.day ? " on" : "") + '" data-day="' + i + '">' + esc(dayShort(d.date)) + "</button>";
    }).join("");
    var d = p.days[ui.day];
    var body = "";
    if (!d.stops.length) {
      body = '<div class="empty">Rien de calé ce jour-là pour tes envies. Profites-en pour flâner, ou relance avec d’autres envies.</div>';
    } else {
      d.stops.forEach(function (s, i) {
        var col = kindColor(s);
        var when = s.time ? '<b class="t">' + esc(s.time) + "</b><i>heure fixe</i>" : "<b>" + SLOT_LABEL[s.slot] + "</b><i>à ta guise</i>";
        var sub = [];
        if (s.place) sub.push(esc(s.place));
        var kindTxt = (s.kind === "event" ? esc(s.category || "Événement") : KIND_LABEL[s.kind]);
        if (s.flex) sub.push("Horaires à vérifier sur place");
        var alt = "";
        if (s.alt && s.alt.length) {
          var shown = s.alt.slice(0, 2).map(function (a) { return esc(a.title) + " (" + esc(a.time) + ")"; }).join(", ");
          var more = s.alt.length > 2 ? " et " + (s.alt.length - 2) + " autre" + (s.alt.length > 3 ? "s" : "") : "";
          alt = '<div class="sub" style="margin-top:6px;color:#f0c878">À la même heure aussi : ' + shown + more + "</div>";
        }
        var maps = validPt(s) ? "https://www.google.com/maps/search/?api=1&query=" + s.lat + "," + s.lng : "";
        if (i > 0) {
          var h = hop(d.stops[i - 1], s);
          if (h) body += '<div class="hop">↓ ' + esc(h) + "</div>";
        }
        body += '<div class="stop"><div class="when">' + when + '</div><div class="bar" style="background:' + col + '"></div>' +
          '<div class="body"><div class="kind" style="color:' + col + '">' + kindTxt + '</div><div class="ttl">' + esc(s.title) + "</div>" +
          (sub.length ? '<div class="sub">' + sub.join(" · ") + "</div>" : "") + alt +
          '<div class="acts">' +
            (maps ? '<a class="lnk" href="' + esc(maps) + '" target="_blank" rel="noopener">Y aller</a>' : "") +
            (!s.fixed ? '<button type="button" class="lnk dim" data-swap="' + i + '">Autre idée</button>' : "") +
            '<button type="button" class="lnk dim" data-del="' + i + '">Retirer</button>' +
          "</div></div></div>";
      });
    }
    var route = mapsDay(d);
    r.innerHTML =
      '<div class="in">' +
        '<div class="top"><button type="button" class="x" data-act="edit">‹ Modifier</button><button type="button" class="x" data-act="close">Fermer</button></div>' +
        '<div><p class="eyebrow">Mon séjour</p><h1>' + esc(p.cityName) + ", " + esc(rangeLabel(p.start, p.end)) + "</h1>" +
        '<p class="lead" style="font-size:14px;color:#aeb5c8">' + total + (total > 1 ? " sorties" : " sortie") + " au programme · " + p.days.length + (p.days.length > 1 ? " jours" : " jour") + "</p></div>" +
        '<div class="tabs" role="tablist">' + tabs + "</div>" +
        '<div><div style="font-family:Georgia,serif;font-size:21px;font-weight:700;margin-bottom:10px">' + esc(dayLong(d.date)) + "</div>" + body + "</div>" +
        (route && d.stops.length > 1 ? '<a class="lnk" style="text-align:center;padding:4px" href="' + esc(route) + '" target="_blank" rel="noopener">Voir le parcours du jour sur la carte</a>' : "") +
        '<div class="exp"><button type="button" class="b1" data-act="ics">Ajouter au calendrier</button><button type="button" class="b2" data-act="share">Partager</button></div>' +
        '<div class="note"><b>IL RESTE À PRÉVOIR DE TON CÔTÉ</b>Où dormir, comment y aller et où manger. Whazup te propose un programme culturel et festif, pas une réservation. Les distances sont à vol d’oiseau : vérifie les horaires avant de partir.</div>' +
      "</div>";
    r.scrollTop = 0;
  }

  function showToast(msg) {
    if (!root) return;
    var t = document.createElement("div");
    t.textContent = msg;
    t.setAttribute("role", "status");
    t.style.cssText = "position:fixed;left:50%;bottom:28px;transform:translateX(-50%);background:#f0c878;color:#14213f;padding:10px 16px;border-radius:12px;font-weight:800;font-size:14px;z-index:100001;max-width:86vw;text-align:center";
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 2400);
  }

  function compose() {
    ui.err = "";
    if (!ui.cityKey) { ui.err = "Choisis une destination."; return renderForm(); }
    if (!ui.start || !ui.end) { ui.err = "Choisis tes dates d’arrivée et de départ."; return renderForm(); }
    var nb = Math.round((parseIso(ui.end) - parseIso(ui.start)) / 86400000) + 1;
    if (nb < 1) { ui.err = "Le départ doit être après l’arrivée."; return renderForm(); }
    if (nb > MAX_DAYS) { ui.err = "Un séjour de " + MAX_DAYS + " jours maximum pour l’instant."; return renderForm(); }
    var groups = Object.keys(ui.groups).filter(function (g) { return ui.groups[g]; });
    if (!groups.length) { ui.err = "Choisis au moins une envie."; return renderForm(); }
    var centre = cityCentre(ui.cityKey);
    if (!centre) { ui.err = "Ville inconnue."; return renderForm(); }
    ui.busy = true; renderForm();
    loadCity(ui.cityKey).then(function (data) {
      ui.busy = false;
      if (!data.events.length && !data.places.length) {
        ui.err = "On n’a pas encore de données pour cette ville. Essaie-en une autre."; return renderForm();
      }
      ui.plan = composePlan(data, { city: ui.cityKey, cityName: cityName(ui.cityKey), centre: centre, start: ui.start, nbDays: nb, rhythm: ui.rhythm, groups: groups });
      ui.day = 0; savePlan(ui.plan); renderResult();
    }).catch(function () { ui.busy = false; ui.err = "Chargement impossible. Vérifie ta connexion et réessaie."; renderForm(); });
  }

  function onClick(ev) {
    var t = ev.target.closest ? ev.target.closest("button,a") : null;
    if (!t || !root || !root.contains(t)) return;
    var act = t.getAttribute("data-act");
    if (act === "close") return closeSj();
    if (act === "edit") return renderForm();
    if (act === "compose") return compose();
    if (act === "ics") { downloadIcs(ui.plan); return showToast("Calendrier prêt : ouvre le fichier"); }
    if (act === "share") {
      var txt = planText(ui.plan);
      if (navigator.share) { navigator.share({ title: "Mon séjour à " + ui.plan.cityName, text: txt }).catch(function () {}); }
      else if (navigator.clipboard) { navigator.clipboard.writeText(txt).then(function () { showToast("Programme copié"); }, function () { showToast("Copie impossible"); }); }
      return;
    }
    if (t.hasAttribute("data-g")) { ui.groups[t.getAttribute("data-g")] = !ui.groups[t.getAttribute("data-g")]; return renderForm(); }
    if (t.hasAttribute("data-r")) { ui.rhythm = +t.getAttribute("data-r"); return renderForm(); }
    if (t.hasAttribute("data-day")) { ui.day = +t.getAttribute("data-day"); return renderResult(); }
    if (t.hasAttribute("data-del")) {
      ui.plan.days[ui.day].stops.splice(+t.getAttribute("data-del"), 1);
      savePlan(ui.plan); return renderResult();
    }
    if (t.hasAttribute("data-swap")) {
      var si = +t.getAttribute("data-swap");
      loadCity(ui.plan.city).then(function (data) {
        if (swapStop(ui.plan, data, ui.day, si)) { savePlan(ui.plan); renderResult(); }
        else showToast("Pas d’autre idée à proximité");
      });
    }
  }

  function open() {
    ensureRoot();
    ui._bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    root.onclick = onClick;
    loadIndex().then(function (idx) {
      var keys = [];
      try { keys = Object.keys(CITIES); } catch (e) {}
      ui.cities = keys.filter(function (k) { return !idx || (idx.events && idx.events[k]) || (idx.places && idx.places[k]); })
        .map(function (k) { return { key: k, name: cityName(k) }; })
        .sort(function (a, b) { return a.name.localeCompare(b.name, "fr"); });
      var saved = loadPlan();
      var cur = null;
      try { cur = state && state.city; } catch (e) {}
      if (!ui.cityKey) ui.cityKey = (saved && saved.city) || (cur && ui.cities.some(function (c) { return c.key === cur; }) ? cur : (ui.cities[0] && ui.cities[0].key));
      if (!ui.start) { ui.start = nextFriday(); ui.end = addDays(ui.start, 2); }
      if (!Object.keys(ui.groups).length) DEFAULT_GROUPS.forEach(function (g) { ui.groups[g] = true; });
      if (saved && !ui.plan) {
        ui.plan = saved; ui.cityKey = saved.city; ui.start = saved.start; ui.end = saved.end; ui.rhythm = saved.rhythm;
        ui.groups = {}; saved.groups.forEach(function (g) { ui.groups[g] = true; });
        ui.day = 0; return renderResult();
      }
      if (ui.plan) return renderResult();
      renderForm();
    });
  }

  // ---- le bouton sur l'accueil ----
  function ensureEntry() {
    if (document.getElementById("sejour-block")) return;
    var anchor = document.getElementById("itinerary-block") || document.getElementById("surprise-block");
    if (!anchor || !anchor.parentNode) return;
    var b = document.createElement("div");
    b.id = "sejour-block";
    b.style.cssText = "margin:0 16px 16px;";
    b.innerHTML = '<button type="button" id="sejour-btn" style="width:100%;padding:14px;border-radius:14px;border:none;background:linear-gradient(135deg,#14213f,#1f6f78);color:#fff;font-size:14.5px;font-weight:600;cursor:pointer;">🧳 Prépare ton séjour</button>';
    anchor.parentNode.insertBefore(b, anchor.nextSibling);
    b.querySelector("#sejour-btn").onclick = open;
  }


  // ---- le même bouton sur l'écran d'arrivée (Surprends-moi / Tout voir / Mon carnet / Nouveautés) ----
  function ensureArrivalTile() {
    var ref = document.querySelector('.arrival-opt[data-key="nouveautes"]') || document.querySelector('.arrival-opt[data-key="carnet"]');
    if (!ref || !ref.parentNode || ref.parentNode.querySelector("#sejour-tile")) return;
    var t = ref.cloneNode(true);
    t.classList.remove("arrival-opt");
    t.removeAttribute("data-key");
    t.id = "sejour-tile";
    t.style.gridColumn = "1 / -1";
    t.style.background = "linear-gradient(135deg, rgba(240,200,120,0.22), rgba(31,111,120,0.30))";
    t.style.border = "1px solid rgba(240,200,120,0.45)";
    var spans = t.querySelectorAll("span");
    if (spans[0]) spans[0].textContent = "🧳";
    if (spans[1]) { spans[1].textContent = "Prépare ton séjour"; spans[1].style.color = "#fff"; spans[1].style.fontSize = "13px"; spans[1].style.fontWeight = "700"; }
    t.onclick = function (e) { e.stopPropagation(); open(); };
    ref.parentNode.appendChild(t);
  }
  try {
    var pending = false;
    new MutationObserver(function () {
      if (pending) return;
      pending = true;
      setTimeout(function () { pending = false; try { ensureArrivalTile(); } catch (e) {} }, 150);
    }).observe(document.body, { childList: true, subtree: true });
  } catch (e) {}

  window.openSejour = open;
  window.__wzSejour = { composePlan: composePlan, swapStop: swapStop, buildIcs: buildIcs, planText: planText, groupOf: groupOf };

  try {
    if (typeof renderLocateBar === "function") {
      var base = renderLocateBar;
      renderLocateBar = function () {
        var r = base.apply(this, arguments);
        try { if (typeof __hasPickedCity === "undefined" || __hasPickedCity) ensureEntry(); } catch (e) {}
        return r;
      };
    }
    setTimeout(function () { try { ensureEntry(); } catch (e) {} }, 1500);
  } catch (e) { /* on ne casse jamais l'appli */ }
})();
