// ---- Expos et événements « en cours » : toujours affichés jusqu'à leur date de fin ----
// Problème corrigé : une expo qui dure des semaines (ex. Musée Banksy) était datée du jour où le robot passe.
// Le lendemain matin, avant le passage du robot, elle disparaissait du site.
// Maintenant : si un événement a une date de fin (dateEnd) pas encore passée, il est affiché « aujourd'hui ».
// Pour annuler : retirer la ligne ongoing-events.js dans index.html.
(function () {
  "use strict";
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function today() { var d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  if (typeof allEvents !== "function") return;
  var base = allEvents;
  allEvents = function () {   // eslint-disable-line no-global-assign
    var list = base.apply(this, arguments), t = today();
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (e && e.dateEnd && e.date && e.date < t && e.dateEnd >= t && e.__roll !== t) { e.date = t; e.time = ""; e.__roll = t; }
    }
    return list;
  };
})();
