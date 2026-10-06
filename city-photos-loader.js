// Utilise les photos de villes copiées sur whazup.fr (city-photos.json) au lieu de Wikimedia,
// et les charge à l'avance pour que les écrans d'accueil ne restent pas vides.
(function () {
  function preload(urls) {
    urls.forEach(function (u) { try { var i = new Image(); i.decoding = "async"; i.src = u; } catch (e) {} });
  }
  function go() {
    if (typeof CITY_PHOTOS === "undefined") return;
    var intro = (typeof BRAND_INTRO_PHOTO_CITIES !== "undefined" ? BRAND_INTRO_PHOTO_CITIES : []);
    fetch("city-photos.json", { cache: "no-cache" }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; })
      .then(function (map) {
        if (map) Object.keys(map).forEach(function (k) { if (CITY_PHOTOS[k]) CITY_PHOTOS[k] = map[k]; });
        // d'abord les photos du carrousel d'accueil, puis toutes les autres
        preload(intro.filter(function (k) { return CITY_PHOTOS[k]; }).map(function (k) { return CITY_PHOTOS[k]; }));
        setTimeout(function () {
          preload(Object.keys(CITY_PHOTOS).filter(function (k) { return intro.indexOf(k) < 0; }).map(function (k) { return CITY_PHOTOS[k]; }));
        }, 4000);
      });
  }
  go();
})();
