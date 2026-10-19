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

  // petites villes (moins de 60 événements) : on y ajoute les événements des grandes villes voisines (moins de 45 km, 3 au plus)
  var nbCache = {};
  window.__wzNeighbors = function (cityKey) {
    try {
      if (nbCache[cityKey]) return nbCache[cityKey];
      if (!index || !index.events || !CITIES[cityKey]) return [];
      if ((index.events[cityKey] || 0) >= 60) return (nbCache[cityKey] = []);
      var me = CITIES[cityKey], list = [];
      Object.keys(CITIES).forEach(function (k) {
        if (k === cityKey || (index.events[k] || 0) < 60) return;
        var d = haversineKm(me.lat, me.lng, CITIES[k].lat, CITIES[k].lng);
        if (d <= 45) list.push({ k: k, d: d });
      });
      list.sort(function (a, b) { return a.d - b.d; });
      return (nbCache[cityKey] = list.slice(0, 3).map(function (x) { return x.k; }));
    } catch (e) { return []; }
  };

  function neededKeys() {
    var keys = [];
    try {
      if (!state.userPos) { keys.push(state.city); (window.__wzNeighbors(state.city) || []).forEach(function (k) { keys.push(k); }); }
      else {
        var r = (state.radiusKm || 20) + 45, list = [];
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
    var sk = STATE_KEY[kind];
    var hasSoon = kind === "events" && index.soon && index.soon[key];
    pending++; setLoading();
    function addFull(soonItems) {
      // chargement complet en arrière-plan : il remplace le petit paquet, sans rien perdre
      return origFetch("/data/" + kind + "/" + key + ".json")
        .then(function (r) { return r.ok ? r.json() : []; })
        .then(function (arr) {
          if (!Array.isArray(arr) || !arr.length) return;
          if (soonItems && soonItems.length) {
            var set = new Set(soonItems);
            state[sk] = state[sk].filter(function (e) { return !set.has(e); });
          }
          state[sk] = state[sk].concat(arr);
        });
    }
    var job;
    if (hasSoon) {
      job = origFetch("/data/events/" + key + ".soon.json")
        .then(function (r) { return r.ok ? r.json() : null; })
        .catch(function () { return null; })
        .then(function (soon) {
          if (Array.isArray(soon) && soon.length) {
            state[sk] = state[sk].concat(soon);
            loaded[id] = true;
            rerender(); // les événements des prochains jours s'affichent tout de suite
            // le reste arrive en arrière-plan puis on redessine
            // on laisse d'abord le site respirer (affichage, photos) : le gros fichier arrive ~4 s plus tard
            var later = function (f) { setTimeout(f, 4000); };
            later(function () {
              addFull(soon).catch(function (e) { console.error("Chargement complet de " + id + " impossible", e); })
                .then(function () { rerender(); });
            });
          } else {
            return addFull(null).then(function () { loaded[id] = true; });
          }
        });
    } else {
      job = addFull(null).then(function () { loaded[id] = true; });
    }
    inflight[id] = job
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
        var fresh = ["events", "places", "bars"].some(function (kind) { return !loaded[kind + "/" + k]; });
        if (!fresh) { ["events", "places", "bars"].forEach(function (kind) { if (inflight[kind + "/" + k]) jobs.push(inflight[kind + "/" + k]); }); return; }
        if (index.soon && index.soon[k]) {
          // grande ville : les événements d'abord (petit paquet), puis les lieux et les bars
          jobs.push(loadKey("events", k).then(function () { return Promise.all([loadKey("places", k), loadKey("bars", k)]); }));
        } else {
          ["events", "places", "bars"].forEach(function (kind) { jobs.push(loadKey(kind, k)); });
        }
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
