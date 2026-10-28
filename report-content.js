// Lien discret « Signaler ce contenu » sous la description de chaque fiche d'événement
// (exigé par l'App Store et Google Play pour les contenus publiés par des utilisateurs).
// Ouvre un e-mail pré-rempli vers l'adresse de contact. Aucune donnée n'est envoyée par Whazup.
// Pour tout annuler : retirer la ligne <script src="report-content.js"> dans index.html.
(function () {
  "use strict";

  var CONTACT = "whazup.contact@gmail.com";
  var CSS =
    "#wz-report{display:block;margin:10px 0 0;font-size:12.5px;color:#9BA5C2;text-decoration:underline;cursor:pointer}" +
    "#wz-report:focus-visible{outline:2px solid #E8604C;outline-offset:2px}";

  function currentId() {
    try { if (typeof state !== "undefined" && state && state.currentEventId) return String(state.currentEventId); } catch (e) {}
    return "";
  }

  function buildHref() {
    var t = document.getElementById("detail-title");
    var title = t ? t.textContent.trim() : "";
    var id = currentId();
    var subject = "Signalement Whazup : " + title;
    var body =
      "Bonjour,\n\nJe souhaite signaler ce contenu :\n" +
      "Titre : " + title + "\n" +
      (id ? "Identifiant : " + id + "\n" : "") +
      "Page : " + location.href + "\n\n" +
      "Motif (contenu inapproprié, informations fausses, droits d'auteur, autre) :\n\n";
    return "mailto:" + CONTACT + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  function build() {
    var desc = document.getElementById("detail-desc");
    if (!desc) return false;
    if (document.getElementById("wz-report")) return true;
    if (!document.getElementById("wz-report-css")) {
      var st = document.createElement("style");
      st.id = "wz-report-css";
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var a = document.createElement("a");
    a.id = "wz-report";
    a.href = "#";
    a.textContent = "Signaler ce contenu";
    // L'adresse est calculée au moment du clic : elle correspond toujours à la fiche ouverte.
    a.addEventListener("click", function (e) {
      e.preventDefault();
      location.href = buildHref();
    });
    desc.insertAdjacentElement("afterend", a);
    return true;
  }

  function init() {
    try {
      if (build()) return;
      var tries = 0;
      var t = setInterval(function () {
        tries++;
        if (build() || tries > 40) clearInterval(t);
      }, 500);
    } catch (e) { console.error("report-content.js", e); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
