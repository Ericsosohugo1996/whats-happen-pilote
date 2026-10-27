// ---- Fiches Shotgun : bouton « Réserver sur Shotgun » ----
// Condition de l'accès gratuit à l'API Shotgun : renvoyer vers Shotgun pour l'achat des billets.
// Exception volontaire à la règle « aucun lien externe sur la fiche » : seulement pour les soirées venant de Shotgun.
// Pour retirer : supprimer la ligne shotgun-link.js dans index.html.
(function () {
  "use strict";
  if (typeof openDetail !== "function") return;
  var css = document.createElement("style");
  css.textContent = "#wz-sg-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin:14px 0 6px;padding:14px;border:none;border-radius:14px;background:#111 !important;color:#fff !important;font-weight:800;font-size:15px;font-family:inherit;cursor:pointer;text-decoration:none;box-sizing:border-box}#wz-sg-btn small{font-weight:600;opacity:.8;font-size:12px;color:#fff !important}#wz-sg-btn *{color:#fff !important}";
  document.head.appendChild(css);
  var base = openDetail;
  openDetail = function (id) {   // eslint-disable-line no-global-assign
    var r = base.apply(this, arguments);
    try {
      var old = document.getElementById("wz-sg-btn"); if (old) old.remove();
      var ev = allEvents().find(function (e) { return e.id === id; });
      if (!ev || ev.source !== "shotgun" || !/^https:\/\//.test(ev.link || "")) return r;
      var host = document.querySelector("#view-detail .action-tiles");
      if (!host || !host.parentNode) return r;
      var a = document.createElement("a");
      a.id = "wz-sg-btn"; a.href = ev.link; a.target = "_blank"; a.rel = "noopener";
      a.innerHTML = "🎟️ Réserver sur Shotgun <small>billetterie officielle</small>";
      a.addEventListener("click", function () { try { if (typeof analytics !== "undefined" && analytics.logEvent) analytics.logEvent("shotgun_click", { city: ev.city }); } catch (e) {} });
      host.parentNode.insertBefore(a, host.nextSibling);
    } catch (e) {}
    return r;
  };
})();
