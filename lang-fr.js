// Whazup — site 100 % français pour le moment (traductions désactivées).
// Pour réactiver les traductions plus tard : supprimer ce fichier sur GitHub, retirer sa ligne dans index.html,
// et retirer la ligne <meta name="google" content="notranslate"> et l'attribut translate="no" de <html>.
(function () {
  "use strict";
  // 1) on force le français, même si le téléphone avait gardé une autre langue en mémoire
  try { localStorage.setItem("wh_lang", "fr"); } catch (e) {}
  // 2) on cache tous les drapeaux et boutons de choix de langue
  try {
    var st = document.createElement("style");
    st.id = "wz-lang-fr-css";
    st.textContent = "#brand-intro-lang-toggle,#brand-intro-flags-row,#arrival-lang-toggle,#arrival-flags-row,.flags-row,.flag-btn{display:none !important}";
    document.head.appendChild(st);
  } catch (e) {}
  // 3) si quelque chose tente quand même de changer la langue, on reste en français
  function lock() {
    try {
      if (typeof window.setLang === "function" && !window.setLang.__wzFr) {
        var w = function () { return window.__wzOrigSetLang.call(this, "fr"); };
        window.__wzOrigSetLang = window.setLang;
        w.__wzFr = true;
        window.setLang = w;
      }
    } catch (e) {}
    try { if (typeof currentLang !== "undefined" && currentLang.value !== "fr") { currentLang.value = "fr"; if (typeof applyTranslation === "function") applyTranslation(); } } catch (e) {}
  }
  window.addEventListener("load", function () { lock(); setTimeout(lock, 800); setTimeout(lock, 2500); });
})();
