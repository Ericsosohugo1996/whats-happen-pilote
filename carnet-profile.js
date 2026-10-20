// Bandeau « profil » en haut du carnet : initiale, prénom, nombre de souvenirs et de villes.
// Style dans insta-home.css (#wz-prof). Pour le retirer : supprimer la ligne carnet-profile.js dans index.html.
(function () {
  "use strict";
  function esc(s) { return String(s || "").replace(/[<>&"]/g, ""); }
  function who() {
    try {
      var u = firebase.auth().currentUser;
      if (!u || u.isAnonymous) return "";
      var n = u.displayName ? String(u.displayName).trim().split(/\s+/)[0] : "";
      if (!n) {
        var e = String(u.email || "").split("@")[0];
        n = (e.match(/^[A-Za-zÀ-ÿ]+/) || [""])[0];
        if (n.length > 9 && n.length === e.length) n = "";
      }
      return n ? n.charAt(0).toUpperCase() + n.slice(1).toLowerCase() : "";
    } catch (e) { return ""; }
  }
  function fill(box) {
    var list = window.__souvenirsList;
    var name = who() || "Mon carnet";
    var w = who(); var ini = w ? w.charAt(0).toUpperCase() : "🙂";
    var nb = Array.isArray(list) ? list.length : "–";
    var villes = "–";
    if (Array.isArray(list)) {
      var set = {};
      list.forEach(function (s) { if (s.city && s.city !== "autre") set[s.city] = 1; });
      villes = Object.keys(set).length;
    }
    box.innerHTML =
      '<div class="wz-prof-av"><div>' + esc(ini) + '</div></div>' +
      '<div class="wz-prof-main"><div class="wz-prof-name">' + esc(name) + '</div>' +
      '<div class="wz-prof-st"><span><b>' + nb + '</b> souvenir' + (nb === 1 ? "" : "s") + '</span>' +
      '<span><b>' + villes + '</b> ville' + (villes === 1 ? "" : "s") + '</span></div></div>';
  }
  function inject() {
    var scr = document.getElementById("souvenirs-screen");
    if (!scr || scr.querySelector("#wz-prof")) return;
    var tabs = scr.querySelector("#wz-ctabs");
    if (!tabs) return;
    var box = document.createElement("div");
    box.id = "wz-prof";
    tabs.parentNode.insertBefore(box, tabs);
    fill(box);
    var n = 0, iv = setInterval(function () { // la liste arrive un peu après l'ouverture
      n++; if (!document.body.contains(box) || n > 20) return clearInterval(iv);
      fill(box);
    }, 400);
  }
  try { new MutationObserver(inject).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
})();
