// Whazup — « Autour de moi » sans position : on ne te met plus à Aix, on te demande ta ville.
// Pour retirer ce comportement : supprimer ce fichier sur GitHub.
(function () {
  "use strict";
  function ready(fn) { if (document.readyState !== "loading") fn(); else document.addEventListener("DOMContentLoaded", fn); }

  function toast(msg) {
    var t = document.createElement("div");
    t.textContent = msg;
    t.style.cssText = "position:fixed;left:50%;bottom:96px;transform:translateX(-50%);max-width:86%;background:#14213D;color:#fff;font:600 13px system-ui,sans-serif;padding:11px 16px;border-radius:14px;z-index:100001;box-shadow:0 10px 24px -10px rgba(0,0,0,.5);text-align:center";
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 4500);
  }
  function chooseCity(why) {
    try { state.userPos = null; } catch (e) {}
    try { __hasPickedCity = false; } catch (e) {}
    try { renderDiscover(); } catch (e) {}
    toast(why);
  }
  function removeSearching() { var o = document.getElementById("arrival-searching-overlay"); if (o) o.remove(); }

  function locate() {
    try { hideBrandIntroScreen(); } catch (e) {}
    if (window.__arrivalShowSearching) { try { __arrivalShowSearching(); } catch (e) {} }
    if (!navigator.geolocation) { removeSearching(); chooseCity("Position indisponible : choisis ta ville."); return; }
    var done = false;
    function fail() { if (done) return; done = true; removeSearching(); chooseCity("On n’a pas pu te localiser : choisis ta ville."); }
    var timer = setTimeout(fail, 12000);
    navigator.geolocation.getCurrentPosition(function (pos) {
      if (done) return; done = true; clearTimeout(timer);
      try { state.userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }; } catch (e) {}
      removeSearching();
      try { if (window.__arrivalShow) __arrivalShow(); } catch (e) {}
    }, function () { clearTimeout(timer); fail(); }, { timeout: 10000, maximumAge: 300000 });
  }

  ready(function () {
    var btn = document.getElementById("brand-choice-locate");
    if (!btn) return;
    btn.addEventListener("click", function (e) {
      e.stopImmediatePropagation(); e.preventDefault();
      locate();
    }, true);
  });
})();
