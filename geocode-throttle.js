/* Whazup — limite les demandes de géolocalisation (api-adresse.data.gouv.fr).
   1) une même requête n'est envoyée qu'une seule fois (réponse partagée) ;
   2) au plus 4 requêtes en même temps, les autres patientent.
   Ne modifie aucune donnée. Retour arrière : retirer la ligne <script> de index.html. */
(function () {
  "use strict";
  var MAX = 4, running = 0, queue = [], cache = new Map();
  var origFetch = window.fetch.bind(window);

  function next() {
    while (running < MAX && queue.length) {
      var job = queue.shift();
      running++;
      origFetch(job.url, job.init).then(job.resolve, job.reject).then(function () {
        running--; next();
      });
    }
  }
  function limited(url, init) {
    return new Promise(function (resolve, reject) {
      queue.push({ url: url, init: init, resolve: resolve, reject: reject });
      next();
    });
  }

  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    if (url.indexOf("api-adresse.data.gouv.fr/search") === -1 || (init && init.method && init.method !== "GET")) {
      return origFetch(input, init);
    }
    var p = cache.get(url);
    if (!p) {
      p = limited(url, init).then(function (r) {
        if (!r.ok) cache.delete(url);
        return r;
      }, function (e) { cache.delete(url); throw e; });
      cache.set(url, p);
    }
    return p.then(function (r) { return r.clone(); });
  };
})();
