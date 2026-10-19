// « Autour de chez moi » : tous les départements d'Île-de-France + recherche de n'importe quelle commune.
(function () {
  var DEPS = [
    ["75", "Paris", 48.857, 2.347, 8],
    ["92", "Hauts-de-Seine", 48.85, 2.23, 12],
    ["93", "Seine-Saint-Denis", 48.91, 2.48, 12],
    ["94", "Val-de-Marne", 48.77, 2.47, 12],
    ["91", "Essonne", 48.60, 2.30, 25],
    ["78", "Yvelines", 48.80, 1.95, 25],
    ["95", "Val-d'Oise", 49.05, 2.15, 25],
    ["77", "Seine-et-Marne", 48.70, 2.90, 30]
  ];
  var css = ".wz-local-box{margin:14px 0;padding:14px;border-radius:16px;background:#fff7ef;border:1px solid #f0d9c4}" +
    ".wz-local-box h3{margin:0 0 4px;font-size:16px}.wz-local-box p{margin:0 0 10px;font-size:13px;color:#6b5a4c}" +
    ".wz-local-box .wz-l-row{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}" +
    ".wz-local-box .wz-l-chip{border:1px solid #e3c9b0;background:#fff;border-radius:999px;padding:7px 12px;font-size:13px;cursor:pointer}" +
    ".wz-local-box .wz-l-chip.on{background:#c1440e;color:#fff;border-color:#c1440e}" +
    ".wz-local-box input{width:100%;box-sizing:border-box;padding:11px 12px;border-radius:12px;border:1px solid #e3c9b0;font-size:15px}" +
    ".wz-local-box .wz-l-res{display:flex;flex-direction:column;gap:4px;margin-top:6px}" +
    ".wz-local-box .wz-l-res button{text-align:left;padding:10px 12px;border-radius:10px;border:1px solid #eadccd;background:#fff;font-size:14px;cursor:pointer}" +
    ".wz-local-box .wz-l-msg{margin-top:8px;font-size:13px;color:#8a4b1f}";
  css += "body:not(.wz-nocity) #wz-local{display:none}html body.wz-v2.wz-nocity #view-discover > #event-list,html body.wz-v2.wz-nocity #view-discover > #event-list-featured{display:none!important}";
  css += ".wz-local-box summary{cursor:pointer;font-size:14px;font-weight:600;list-style:none;color:#3a2a1e}.wz-local-box summary::-webkit-details-marker{display:none}.wz-local-box details[open] summary{margin-bottom:10px}";
  css += ".wz-com-res{display:flex;flex-direction:column;gap:6px;margin-top:10px}.wz-com-h{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:#8a4b1f}.wz-com-b{text-align:left;padding:11px 12px;border-radius:12px;border:1px solid #eadccd;background:#fff;font-size:15px;cursor:pointer}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function go(lat, lng, label, km) {
    try {
      state.userPos = { lat: lat, lng: lng };
      window.__wzLocal = { lat: lat, lng: lng, label: label };
      if (typeof __nearMeShow === "function") __nearMeShow();
      [100, 700, 1800, 3500].forEach(function (ms, i) {
        setTimeout(function () {
          try {
            var k = km;
            if (i >= 2) {
              var n = baseVisibleEvents().length;
              k = state.radiusKm;
              if (n < 6 && k < 30) k = 30;
              else if (i === 3 && n < 6 && k < 50) k = 50;
            }
            if (state.radiusKm !== k || i === 0) {
              var wider = k > state.radiusKm && i >= 2;
              state.radiusKm = k;
              var r = document.getElementById("radius-range"); if (r) r.value = k;
              var v = document.getElementById("radius-value"); if (v && typeof formatRadius === "function") v.textContent = formatRadius(k);
              document.querySelectorAll("#radius-presets .chip-btn").forEach(function (b) { b.classList.toggle("active", Number(b.dataset.radius) === k); });
              renderDiscover();
              if (wider && typeof showShareToast === "function") showShareToast("Peu de sorties tout près : j'ai élargi à " + k + " km autour de " + label + ".");
            }
            label2(label);
          } catch (e) {}
        }, ms);
      });
    } catch (e) {}
  }
  function label2(label) {
    var el = document.getElementById("locate-value");
    if (el) el.textContent = "📍 " + label;
  }
  var COM = null, COMF = null, comLoading = false;
  function fold(t) { return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[-'’]/g, " "); }
  // la liste des communes (≈1,2 Mo) ne se télécharge qu'à la première recherche, pas à l'ouverture du site
  function loadCom(cb) {
    if (COM) { if (cb) cb(); return; }
    if (comLoading) return; comLoading = true;
    try {
      fetch("communes.json").then(function (r) { return r.json(); }).then(function (j) {
        COM = j; COMF = j.map(function (c) { return fold(c[0]); }); comLoading = false; if (cb) cb();
      }).catch(function () { comLoading = false; });
    } catch (e) { comLoading = false; }
  }
  document.addEventListener("focusin", function (e) { var t = e.target; if (t && (t.id === "city-search-input" || t.id === "sh-q")) loadCom(); }, true);
  function makeBox(idp) {
    var box = document.createElement("div"); box.id = "wz-local" + idp; box.className = "wz-local-box";
    box.innerHTML = "<details><summary>🏘️ Île-de-France : choisis ton département</summary><div class='wz-l-row'></div></details>";
    var row = box.querySelector(".wz-l-row");
    DEPS.forEach(function (d) {
      var b = document.createElement("button"); b.type = "button"; b.className = "wz-l-chip";
      b.textContent = d[0] + " · " + d[1];
      b.onclick = function () {
        if (d[0] === "75" && typeof CITIES !== "undefined" && CITIES.paris) {
          try { state.userPos = null; window.__wzLocal = null; state.city = "paris"; state.radiusKm = 20; if (typeof __hasPickedCity !== "undefined") __hasPickedCity = true; renderDiscover(); } catch (e) {}
        } else go(d[2], d[3], d[1] + " (" + d[0] + ")", d[4]);
        closeSheet();
      };
      row.appendChild(b);
    });
    return box;
  }
  function closeSheet() { var x = document.querySelector("#wz-sheet .sh-x"); if (x) x.click(); }

  // ---- les communes apparaissent dans les cases de recherche existantes ----
  function communeHits(q) {
    var qn = fold(q).trim(); if (qn.length < 2 || !COM) return [];
    var known = {};
    try { Object.keys(CITIES).forEach(function (k) { known[fold(CITIES[k].name)] = 1; }); } catch (e) {}
    var pre = [], mid = [];
    for (var i = 0; i < COM.length; i++) {
      var n = COMF[i], at = n.indexOf(qn);
      if (at < 0 || known[n]) continue;
      (at === 0 ? pre : mid).push(COM[i]);
      if (pre.length >= 40 && mid.length >= 40) break;
    }
    var cmp = function (a, b) { return (b[4] || 0) - (a[4] || 0) || a[0].length - b[0].length || a[0].localeCompare(b[0], "fr"); };
    return pre.sort(cmp).concat(mid.sort(cmp)).slice(0, 8);
  }
  function paintCommunes(host, q, after) {
    var old = host.querySelector(".wz-com-res"); if (old) old.remove();
    var hits = communeHits(q); if (!hits.length) return;
    var box = document.createElement("div"); box.className = "wz-com-res";
    var h = document.createElement("div"); h.className = "wz-com-h"; h.textContent = "Communes";
    box.appendChild(h);
    hits.forEach(function (c) {
      var b = document.createElement("button"); b.type = "button"; b.className = "wz-com-b";
      b.textContent = "📍 " + c[0] + " (" + c[1] + ")";
      b.onclick = function () { go(c[2], c[3], c[0], 15); if (after) after(); };
      box.appendChild(b);
    });
    host.appendChild(box);
  }
  function paintFor(t) {
    if (t.id === "city-search-input") {
      var res = document.getElementById("city-search-results"); if (!res) return;
      if (!t.value.trim()) { var o = res.querySelector(".wz-com-res"); if (o) o.remove(); return; }
      res.classList.remove("hidden");
      var empty = res.querySelector(".city-search-empty"); if (empty && communeHits(t.value).length) empty.remove();
      paintCommunes(res, t.value, null);
    } else if (t.id === "sh-q") {
      var rows = document.getElementById("sh-rows"); if (!rows) return;
      paintCommunes(rows, t.value, closeSheet);
    }
  }
  document.addEventListener("input", function (e) {
    var t = e.target; if (!t || (t.id !== "city-search-input" && t.id !== "sh-q")) return;
    setTimeout(function () { paintFor(t); }, 30);
    if (!COM) loadCom(function () { paintFor(t); });
  }, true);
  function build() {
    // 1) écran de départ
    var si = document.getElementById("city-search-input");
    var anchor = si && si.parentNode;
    if (anchor && anchor.parentNode && !document.getElementById("wz-local")) anchor.parentNode.insertBefore(makeBox(""), anchor.nextSibling);
    // 2) fenêtre « Changer de ville ou de date »
    var body = document.querySelector("#wz-sheet .sh-body");
    if (body && !body.querySelector("#wz-local-s")) body.insertBefore(makeBox("-s"), body.firstChild);
  }
  setInterval(build, 500);
})();
