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
  css += "body:not(.wz-nocity) #wz-local{display:none}";
  var st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);

  function go(lat, lng, label, km) {
    try {
      state.userPos = { lat: lat, lng: lng };
      window.__wzLocal = { lat: lat, lng: lng, label: label };
      if (typeof __nearMeShow === "function") __nearMeShow();
      [100, 700, 1800].forEach(function (ms, i) {
        setTimeout(function () {
          try {
            var k = km;
            if (i === 2) {
              var n = baseVisibleEvents().length;
              var m = document.querySelector(".wz-l-msg");
              if (n < 6 && km < 30) { k = 30; if (m) m.textContent = "Peu de sorties à " + km + " km : j'élargis à 30 km."; }
              else if (m) m.textContent = "";
            }
            if (state.radiusKm !== k || i === 0) {
              state.radiusKm = k;
              var r = document.getElementById("radius-range"); if (r) r.value = k;
              var v = document.getElementById("radius-value"); if (v && typeof formatRadius === "function") v.textContent = formatRadius(k);
              document.querySelectorAll("#radius-presets .chip-btn").forEach(function (b) { b.classList.toggle("active", Number(b.dataset.radius) === k); });
              renderDiscover();
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
  var seq = 0, COM = null;
  function fold(t) { return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[-']/g, " "); }
  try { fetch("idf-communes.json").then(function (r) { return r.json(); }).then(function (j) { COM = j; }).catch(function () {}); } catch (e) {}
  function makeBox(idp) {
    var box = document.createElement("div"); box.id = "wz-local" + idp; box.className = "wz-local-box";
    box.innerHTML = "<h3>🏘️ Autour de chez moi</h3><p>Île-de-France : choisis ton département ou tape ta commune, sans passer par Paris.</p>" +
      "<div class='wz-l-row'></div>" +
      "<input id='wz-l-in" + idp + "' type='search' autocomplete='off' placeholder='Ta commune (ex. Viry-Châtillon, Longjumeau…)'>" +
      "<div class='wz-l-res'></div><div class='wz-l-msg' id='wz-l-msg" + idp + "'></div>";
    var row = box.querySelector(".wz-l-row");
    function after() { var x = document.querySelector("#wz-sheet .sh-x"); if (x) x.click(); }
    DEPS.forEach(function (d) {
      var b = document.createElement("button"); b.type = "button"; b.className = "wz-l-chip";
      b.textContent = d[0] + " · " + d[1];
      b.onclick = function () { go(d[2], d[3], d[1] + " (" + d[0] + ")", d[4]); after(); };
      row.appendChild(b);
    });
    var inp = box.querySelector("input"), res = box.querySelector(".wz-l-res"), tm;
    inp.addEventListener("input", function () {
      clearTimeout(tm); var q = inp.value.trim();
      if (q.length < 2) { res.innerHTML = ""; return; }
      res.textContent = "Recherche…";
      var mine = ++seq;
      tm = setTimeout(function () {
        function show(list) {
          if (mine !== seq) return;
          res.innerHTML = "";
          list.forEach(function (it) {
            var b = document.createElement("button"); b.type = "button";
            b.textContent = it.name + " (" + it.dep + ")";
            b.onclick = function () { res.innerHTML = ""; inp.value = it.name; go(it.lat, it.lng, it.name, 15); after(); };
            res.appendChild(b);
          });
          if (!list.length) res.textContent = "Commune introuvable.";
        }
        function getJ(url) {
          return new Promise(function (ok, ko) {
            var t = setTimeout(function () { ko(new Error("trop long")); }, 6000);
            fetch(url).then(function (r) { return r.json(); }).then(function (j) { clearTimeout(t); ok(j); }, function (e) { clearTimeout(t); ko(e); });
          });
        }
        var qn = fold(q), hits = (COM || []).filter(function (c) { return fold(c[0]).indexOf(qn) >= 0; })
          .sort(function (a, b) { return (fold(a[0]).indexOf(qn) === 0 ? 0 : 1) - (fold(b[0]).indexOf(qn) === 0 ? 0 : 1) || a[0].localeCompare(b[0], "fr"); }).slice(0, 8);
        if (hits.length) { show(hits.map(function (c) { return { name: c[0], dep: c[1], lat: c[2], lng: c[3] }; })); return; }
        getJ("https://geo.api.gouv.fr/communes?nom=" + encodeURIComponent(q) + "&fields=nom,centre,codeDepartement&boost=population&limit=6")
          .then(function (j) {
            show((j || []).filter(function (c) { return c.centre; }).map(function (c) {
              return { name: c.nom, dep: c.codeDepartement, lat: c.centre.coordinates[1], lng: c.centre.coordinates[0] };
            }));
          })
          .catch(function () {
            getJ("https://api-adresse.data.gouv.fr/search/?type=municipality&limit=6&q=" + encodeURIComponent(q)).then(function (j) {
              show((j.features || []).map(function (f) {
                return { name: f.properties.city, dep: (f.properties.postcode || "").slice(0, 2), lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] };
              }));
            }).catch(function (err) { if (mine === seq) res.textContent = "Recherche indisponible (" + ((err && err.message) || "réseau") + "). Choisis un département."; });
          });
      }, 250);
    });
    return box;
  }
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
