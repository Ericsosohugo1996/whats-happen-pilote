// Whazup — « Choisir une date » : un calendrier pour voir les sorties d'un jour ou d'une période (ex. du 24 au 31 octobre).
// S'ajoute à côté des raccourcis (Aujourd'hui / Ce soir / Demain / Ce week-end) et dans la fenêtre « Changer de ville ou de date ».
// Pour tout annuler : retirer la ligne <script src="date-picker.js"> dans index.html.
(function () {
  "use strict";
  var MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
  var MS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  var DAYS_AHEAD = 120;
  var a = null, b = null;        // début / fin choisis (YYYY-MM-DD)
  var view = null;               // {y, m} mois affiché
  var counts = null;

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parse(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function today() { return iso(new Date()); }
  function plus(s, n) { var d = parse(s); d.setDate(d.getDate() + n); return iso(d); }
  function short(s) { var d = parse(s); return d.getDate() + " " + MS[d.getMonth()]; }
  function labelOf(p) {
    if (!p) return "";
    var m = /^range:(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})$/.exec(p);
    if (m) {
      var d1 = parse(m[1]), d2 = parse(m[2]);
      if (d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()) return d1.getDate() + "–" + d2.getDate() + " " + MS[d2.getMonth()];
      return short(m[1]) + " – " + short(m[2]);
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return short(p);
    return "";
  }
  window.__wzWhenLabel = labelOf;

  // filtre : « range:A:B » (les lieux restent toujours visibles, comme pour les autres périodes)
  try {
    if (typeof matchesPeriod === "function" && !matchesPeriod.__wzRange) {
      var orig = matchesPeriod;
      var wrapped = function (ev, period) {
        if (period && typeof period === "string" && period.indexOf("range:") === 0) {
          var m = /^range:(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})$/.exec(period);
          if (!m) return true;
          if (ev.isPlace) return true;
          return !!ev.date && ev.date >= m[1] && ev.date <= m[2];
        }
        return orig(ev, period);
      };
      wrapped.__wzRange = true;
      matchesPeriod = wrapped; // eslint-disable-line no-global-assign
    }
  } catch (e) {}

  var CSS = [
    "#wz-cal{position:fixed;inset:0;z-index:9800;display:flex;align-items:flex-end;justify-content:center;background:rgba(20,16,30,.45);font-family:system-ui,-apple-system,'Segoe UI',sans-serif}",
    "#wz-cal .cal-box{width:100%;max-width:440px;background:#fffaf3;color:#2b2233;border-radius:22px 22px 0 0;padding:16px 16px max(env(safe-area-inset-bottom),16px);box-shadow:0 -10px 40px rgba(0,0,0,.25)}",
    "@media (min-width:600px){#wz-cal{align-items:center}#wz-cal .cal-box{border-radius:22px}}",
    "#wz-cal .cal-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}",
    "#wz-cal .cal-top h2{margin:0;font-size:18px;font-weight:800}",
    "#wz-cal .cal-x{width:36px;height:36px;border-radius:50%;border:0;background:#f1e7da;color:#2b2233;font-size:17px;cursor:pointer}",
    "#wz-cal .cal-nav{display:flex;align-items:center;justify-content:space-between;margin:6px 0}",
    "#wz-cal .cal-nav strong{font-size:16px;text-transform:capitalize}",
    "#wz-cal .cal-nav button{width:38px;height:38px;border-radius:50%;border:1px solid #eadccd;background:#fff;color:#2b2233;font-size:18px;cursor:pointer}",
    "#wz-cal .cal-nav button:disabled{opacity:.3;cursor:default}",
    "#wz-cal .cal-wd,#wz-cal .cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}",
    "#wz-cal .cal-wd span{text-align:center;font-size:11px;font-weight:700;color:#8a7b8f;padding:4px 0;text-transform:uppercase}",
    "#wz-cal .cal-d{position:relative;aspect-ratio:1/1;border:0;background:transparent;border-radius:12px;font-size:15px;font-weight:600;color:#2b2233;cursor:pointer;display:flex;align-items:center;justify-content:center}",
    "#wz-cal .cal-d:disabled{color:#c9bfcc;cursor:default}",
    "#wz-cal .cal-d.cal-in{background:#fde3d8;border-radius:0}",
    "#wz-cal .cal-d.cal-end{background:#e0623f;color:#fff;border-radius:12px}",
    "#wz-cal .cal-d.cal-start{background:#e0623f;color:#fff;border-radius:12px}",
    "#wz-cal .cal-d.cal-today{box-shadow:inset 0 0 0 1.5px #e0623f}",
    "#wz-cal .cal-d i{position:absolute;bottom:5px;left:50%;width:5px;height:5px;margin-left:-2.5px;border-radius:50%;background:#e0623f;opacity:.55}",
    "#wz-cal .cal-d.cal-start i,#wz-cal .cal-d.cal-end i{background:#fff;opacity:.9}",
    "#wz-cal .cal-quick{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 4px}",
    "#wz-cal .cal-quick button{border:1px solid #eadccd;background:#fff;color:#2b2233;border-radius:999px;padding:8px 12px;font-size:13px;font-weight:700;cursor:pointer}",
    "#wz-cal .cal-sum{min-height:20px;margin:8px 2px 10px;font-size:14px;color:#6b5d70}",
    "#wz-cal .cal-foot{display:flex;gap:10px}",
    "#wz-cal .cal-foot button{flex:1;border-radius:14px;padding:13px;font-size:15px;font-weight:800;cursor:pointer;border:1.5px solid #eadccd;background:#fff;color:#2b2233}",
    "#wz-cal .cal-foot .cal-ok{border:0;background:#e0623f;color:#fff}",
    "#wz-cal .cal-foot .cal-ok:disabled{opacity:.4;cursor:default}",
    ".wz-cal-chip{cursor:pointer}",
    ".wz-cal-x{margin-left:6px;display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:rgba(20,33,61,.2);font-size:11px;line-height:1}",
    ".wz-cal-x[hidden]{display:none !important}",
    "#wz-chips .wz-cal-chip{flex:0 0 auto !important;white-space:nowrap}",
    "#wz-chips .wz-cal-chip .wz-chip-n{display:none !important}"
  ].join("\n");

  function countEvents() {
    var c = {};
    try {
      var keep = state.selectedPeriod; state.selectedPeriod = null;
      try { baseVisibleEvents().forEach(function (e) { if (e && e.date && !e.isPlace) c[e.date] = (c[e.date] || 0) + 1; }); } finally { state.selectedPeriod = keep; }
    } catch (e) {}
    return c;
  }

  function summary() {
    if (!a) return "Touche un jour, puis un deuxième pour une période.";
    if (!b || a === b) return "Le " + short(a);
    return "Du " + short(a) + " au " + short(b);
  }

  function draw() {
    var box = document.getElementById("wz-cal"); if (!box) return;
    var t = today(), last = plus(t, DAYS_AHEAD);
    var first = new Date(view.y, view.m, 1);
    var lead = (first.getDay() + 6) % 7; // lundi = 0
    var n = new Date(view.y, view.m + 1, 0).getDate();
    var cells = "";
    for (var i = 0; i < lead; i++) cells += "<span></span>";
    for (var d = 1; d <= n; d++) {
      var s = view.y + "-" + pad(view.m + 1) + "-" + pad(d);
      var dis = s < t || s > last;
      var cls = "cal-d";
      if (s === t) cls += " cal-today";
      var lo = a, hi = b || a;
      if (a && s === lo) cls += " cal-start";
      if (hi && b && s === hi) cls += " cal-end";
      if (a && b && s > lo && s < hi) cls += " cal-in";
      var dot = !dis && counts && counts[s] ? "<i></i>" : "";
      cells += '<button type="button" class="' + cls + '" data-d="' + s + '"' + (dis ? " disabled" : "") + ' aria-label="' + d + " " + MONTHS[view.m] + '">' + d + dot + "</button>";
    }
    var prevOk = new Date(view.y, view.m, 1) > new Date(parse(t).getFullYear(), parse(t).getMonth(), 1);
    var nextOk = new Date(view.y, view.m + 1, 1) <= parse(last);
    box.querySelector(".cal-box").innerHTML =
      '<div class="cal-top"><h2>Choisir une date</h2><button type="button" class="cal-x" aria-label="Fermer">✕</button></div>' +
      '<div class="cal-nav"><button type="button" class="cal-prev" aria-label="Mois précédent"' + (prevOk ? "" : " disabled") + '>‹</button><strong>' + MONTHS[view.m] + " " + view.y + '</strong><button type="button" class="cal-next" aria-label="Mois suivant"' + (nextOk ? "" : " disabled") + '>›</button></div>' +
      '<div class="cal-wd"><span>L</span><span>M</span><span>M</span><span>J</span><span>V</span><span>S</span><span>D</span></div>' +
      '<div class="cal-grid">' + cells + "</div>" +
      '<div class="cal-quick"><button type="button" data-q="7">7 prochains jours</button><button type="button" data-q="30">30 prochains jours</button></div>' +
      '<div class="cal-sum">' + summary() + "</div>" +
      '<div class="cal-foot"><button type="button" class="cal-clear">Effacer</button><button type="button" class="cal-ok"' + (a ? "" : " disabled") + ">Voir les sorties</button></div>";
  }

  function close() { var el = document.getElementById("wz-cal"); if (el) el.remove(); }

  function apply() {
    if (!a) return;
    var hi = b || a;
    state.selectedPeriod = (a === hi) ? a : "range:" + a + ":" + hi;
    close();
    try { var x = document.querySelector("#wz-sheet .sh-x"); if (x) x.click(); } catch (e) {}
    try { document.querySelectorAll(".stat[data-filter]").forEach(function (s) { s.classList.remove("active"); }); } catch (e) {}
    try { renderDiscover(); } catch (e) {}
    setTimeout(function () {
      var t = document.getElementById("event-list-featured") || document.getElementById("event-list");
      if (t && t.scrollIntoView) t.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
  }

  function open() {
    if (document.getElementById("wz-cal")) return;
    var p = state.selectedPeriod || "", m = /^range:(\d{4}-\d{2}-\d{2}):(\d{4}-\d{2}-\d{2})$/.exec(p);
    a = null; b = null;
    if (m) { a = m[1]; b = m[2]; } else if (/^\d{4}-\d{2}-\d{2}$/.test(p)) { a = p; }
    var ref = parse(a || today());
    view = { y: ref.getFullYear(), m: ref.getMonth() };
    counts = countEvents();
    var box = document.createElement("div");
    box.id = "wz-cal"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "Choisir une date");
    box.innerHTML = '<div class="cal-box"></div>';
    document.body.appendChild(box);
    box.addEventListener("click", function (e) {
      if (e.target === box) return close();
      var t = e.target.closest ? e.target.closest("button") : null; if (!t) return;
      if (t.classList.contains("cal-x")) return close();
      if (t.classList.contains("cal-prev")) { view.m--; if (view.m < 0) { view.m = 11; view.y--; } return draw(); }
      if (t.classList.contains("cal-next")) { view.m++; if (view.m > 11) { view.m = 0; view.y++; } return draw(); }
      if (t.classList.contains("cal-clear")) { state.selectedPeriod = null; close(); try { renderDiscover(); } catch (x) {} return; }
      if (t.classList.contains("cal-ok")) return apply();
      if (t.getAttribute("data-q")) { a = today(); b = plus(a, +t.getAttribute("data-q") - 1); return draw(); }
      var d = t.getAttribute("data-d");
      if (d) {
        if (!a || b) { a = d; b = null; }
        else if (d < a) { a = d; }
        else if (d === a) { b = null; }
        else { b = d; }
        draw();
      }
    });
    document.addEventListener("keydown", function esc(e) { if (e.key === "Escape") { close(); document.removeEventListener("keydown", esc); } });
    draw();
  }
  window.__wzOpenCalendar = open;

  function ensure() {
    try {
      if (!document.getElementById("wz-cal-css")) { var st = document.createElement("style"); st.id = "wz-cal-css"; st.textContent = CSS; document.head.appendChild(st); }
      var lab = labelOf(state && state.selectedPeriod);
      var row = document.getElementById("wz-chips");
      if (row) {
        var c = row.querySelector(".wz-cal-chip");
        if (!c) {
          c = document.createElement("button"); c.type = "button"; c.className = "wz-chip wz-cal-chip"; c.dataset.key = "cal";
          c.setAttribute("aria-label", "Choisir une date");
          c.innerHTML = '<span class="wz-chip-l"></span><span class="wz-chip-n"></span><span class="wz-cal-x" role="button" aria-label="Effacer la date" title="Effacer la date" hidden>✕</span>';
          c.addEventListener("click", function (e) {
            if (e.target && e.target.closest && e.target.closest(".wz-cal-x")) { e.stopPropagation(); state.selectedPeriod = null; try { renderDiscover(); } catch (x) {} return; }
            open();
          });
          row.appendChild(c);
        }
        c.querySelector(".wz-chip-l").textContent = (lab || "Date");
        c.classList.toggle("on", !!lab);
        var xx = c.querySelector(".wz-cal-x"); if (xx) xx.hidden = !lab;
      }
      var sh = document.getElementById("wz-sheet");
      if (sh) {
        var h = [].slice.call(sh.querySelectorAll(".card h3")).filter(function (x) { return /Quand/i.test(x.textContent); })[0];
        var chips = h && h.parentNode.querySelector(".chips");
        if (chips && !chips.querySelector(".wz-cal-s")) {
          var bt = document.createElement("button"); bt.type = "button"; bt.className = "chip wz-cal-s wz-cal-chip"; bt.textContent = "📅 Choisir une date";
          bt.addEventListener("click", open);
          chips.appendChild(bt);
        }
      }
    } catch (e) {}
  }

  function install() {
    try {
      if (typeof renderDiscover === "function" && !renderDiscover.__wzCal) {
        var o = renderDiscover;
        var w = function () { var r = o.apply(this, arguments); setTimeout(ensure, 0); return r; };
        w.__wzCal = true; renderDiscover = w; // eslint-disable-line no-global-assign
      }
    } catch (e) {}
    ensure();
    setInterval(ensure, 700);
  }
  function boot() {
    try { if (typeof state === "undefined" || typeof renderDiscover !== "function" || typeof baseVisibleEvents !== "function") return setTimeout(boot, 300); } catch (e) { return setTimeout(boot, 300); }
    setTimeout(install, 800);
  }
  if (document.readyState === "complete") setTimeout(boot, 100); else window.addEventListener("load", function () { setTimeout(boot, 100); });
})();
