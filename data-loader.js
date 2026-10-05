// ---- chargement des données par ville (à placer AVANT app.js dans index.html) ----
// Avant : l'appli téléchargeait 24 Mo (événements + lieux + bars de toute la France) à chaque ouverture.
// Maintenant : elle ne télécharge que les petits fichiers des villes dont elle a besoin (data/<type>/<ville>.json,
// fabriqués chaque jour par le robot GitHub "Découper les données par ville").
// Si ces fichiers n'existent pas encore (ou en cas de souci), elle retombe sur les gros fichiers comme avant.
// Pour tout annuler : retirer la ligne <script src="data-loader.js"> dans index.html.
(function () {
  "use strict";
  var origFetch = window.fetch ? window.fetch.bind(window) : null;
  if (!origFetch || typeof Response === "undefined") return;
  var BIG = { "/datatourisme-events.json": "events", "/datatourisme-places.json": "places", "/osm-bars.json": "bars" };
  var STATE_KEY = { events: "dataTourismeEvents", places: "dataTourismePlaces", bars: "osmBars" };
  var index = null, indexPromise = null, fallback = false, fallbackDone = false;
  var loaded = {}, inflight = {}, pending = 0;
  window.__wzDataLoading = true;

  // app.js demande les 3 gros fichiers au démarrage : on lui répond tout de suite "vide",
  // les vraies données arrivent ensuite, ville par ville.
  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    var path = url;
    try { path = new URL(url, location.href).pathname; } catch (e) {}
    if (BIG[path] && !(init && init.__wzReal)) {
      return Promise.resolve(new Response("[]", { status: 200, headers: { "Content-Type": "application/json" } }));
    }
    return origFetch(input, init);
  };

  function setLoading() { window.__wzDataLoading = pending > 0 || (!index && !fallbackDone); }
  function getIndex() {
    if (indexPromise) return indexPromise;
    indexPromise = origFetch("/data/index.json", { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (idx) {
        if (idx && idx.events) index = idx; else fallback = true;
        return idx;
      });
    return indexPromise;
  }

  function rerender() {
    try { if (typeof renderDiscover === "function") renderDiscover(); } catch (e) { console.error(e); }
  }

  // secours : on télécharge les gros fichiers comme avant
  function loadEverything() {
    if (fallbackDone) return Promise.resolve();
    fallbackDone = true; pending++; setLoading();
    return Promise.all(Object.keys(BIG).map(function (path) {
      var kind = BIG[path];
      return origFetch(path, { __wzReal: true })
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (arr) { if (Array.isArray(arr)) state[STATE_KEY[kind]] = arr; })
        .catch(function (e) { console.error("Chargement de " + path + " impossible", e); });
    })).then(function () { pending--; setLoading(); rerender(); });
  }

  function neededKeys() {
    var keys = [];
    try {
      if (!state.userPos) keys.push(state.city);
      else {
        var r = (state.radiusKm || 20) + 25, list = [];
        Object.keys(CITIES).forEach(function (k) {
          var c = CITIES[k];
          var d = haversineKm(state.userPos.lat, state.userPos.lng, c.lat, c.lng);
          if (d <= r) list.push({ k: k, d: d });
        });
        list.sort(function (a, b) { return a.d - b.d; });
        keys = list.slice(0, 12).map(function (x) { return x.k; });
      }
    } catch (e) {}
    return keys.filter(Boolean);
  }

  function loadKey(kind, key) {
    var id = kind + "/" + key;
    if (loaded[id] || inflight[id]) return inflight[id] || Promise.resolve();
    if (!index[kind] || !index[kind][key]) { loaded[id] = true; return Promise.resolve(); }
    pending++; setLoading();
    inflight[id] = origFetch("/data/" + kind + "/" + key + ".json")
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (arr) {
        if (Array.isArray(arr) && arr.length) state[STATE_KEY[kind]] = state[STATE_KEY[kind]].concat(arr);
        loaded[id] = true;
      })
      .catch(function (e) { console.error("Chargement de " + id + " impossible", e); })
      .then(function () { delete inflight[id]; pending--; setLoading(); });
    return inflight[id];
  }

  // charge ce qu'il faut pour la ville / la position actuelle ; renvoie une promesse
  function ensure() {
    return getIndex().then(function () {
      if (fallback) return loadEverything();
      var jobs = [];
      neededKeys().forEach(function (k) {
        ["events", "places", "bars"].forEach(function (kind) {
          var id = kind + "/" + k;
          if (!loaded[id] && !inflight[id]) jobs.push(loadKey(kind, k));
          else if (inflight[id]) jobs.push(inflight[id]);
        });
      });
      return Promise.all(jobs).then(function () { return jobs.length; });
    });
  }
  window.__wzEnsureData = ensure;

  function ensureThenRender() {
    ensure().then(function (n) { if (n) rerender(); setLoading(); });
  }

  function install() {
    // à chaque redessin, on vérifie que les données de la ville affichée sont là
    if (typeof renderDiscover === "function") {
      var origRender = renderDiscover;
      renderDiscover = function () {
        var r = origRender.apply(this, arguments);
        try { ensureThenRender(); } catch (e) {}
        return r;
      };
    }
    // les écrans "Autour de moi" / "Explorer" lisent les données tout de suite : on les retarde le temps de les avoir
    ["__arrivalShow", "__arrivalShowCityView", "__nearMeShow"].forEach(function (name) {
      var orig = window[name];
      if (typeof orig !== "function") return;
      window[name] = function () {
        var self = this, args = arguments, done = false;
        function go() { if (done) return; done = true; orig.apply(self, args); }
        var t = setTimeout(go, 4000); // sécurité : on n'attend jamais plus de 4 s
        ensure().then(function () { clearTimeout(t); go(); }, function () { clearTimeout(t); go(); });
      };
    });
    ensureThenRender();
  }
  // tous les scripts de la page sont chargés à l'événement "load"
  if (document.readyState === "complete") setTimeout(install, 0);
  else window.addEventListener("load", function () { setTimeout(install, 0); });
  getIndex();
})();
