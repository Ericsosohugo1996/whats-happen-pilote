// home-count.js — deux améliorations de l'accueil inspirées d'Evaneos :
//  1. un chiffre sous le slogan : « 1 234 sorties cette semaine autour de Paris » (compté sur les vraies données chargées) ;
//  2. le bouton « Je ne sais pas quoi faire » remonte juste sous « Aujourd'hui / Ce soir / Demain / Ce week-end ».
// POUR TOUT ANNULER : retirer la ligne <script src="home-count.js"> dans index.html.
(function () {
  "use strict";
  var CSS = [
    "html body.wz-v2:not(.wz-nocity) #view-discover > #wz-count{order:0;display:block;margin:0 22px 8px;font-size:13px;color:#6F6678;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}",
    "#wz-count b{color:#C9482A;font-weight:800}",
    "body.wz-nocity #wz-count{display:none !important}",
    "html body.wz-v2:not(.wz-nocity) #view-discover > #sc-surprise{order:2;display:flex;margin:4px 16px 12px;width:calc(100% - 32px);box-sizing:border-box}"
  ].join("");
  var st = document.createElement("style"); st.id = "wz-count-css"; st.textContent = CSS; document.head.appendChild(st);

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function iso(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }

  function weekCount() {
    try {
      if (typeof baseVisibleEvents !== "function") return 0;
      var a = new Date(), b = new Date(); b.setDate(b.getDate() + 6);
      var from = iso(a), to = iso(b), n = 0, list = baseVisibleEvents() || [];
      for (var i = 0; i < list.length; i++) {
        var ev = list[i];
        if (!ev || ev.isPlace || !ev.date) continue;
        if (ev.date >= from && ev.date <= to) n++;
      }
      return n;
    } catch (e) { return 0; }
  }

  function cityName() {
    try { if (typeof CITIES !== "undefined" && state && state.city && CITIES[state.city]) return CITIES[state.city].name; } catch (e) {}
    return "";
  }
  function whereName() {
    try { if (state && state.userPos && window.__wzLocal && window.__wzLocal.lat === state.userPos.lat && window.__wzLocal.lng === state.userPos.lng) return window.__wzLocal.label; } catch (e) {}
    return cityName();
  }

  function paint() {
    var host = document.getElementById("view-discover");
    if (!host || document.body.classList.contains("wz-nocity")) return;
    var slogan = document.getElementById("wz-slogan");
    var box = document.getElementById("wz-count");
    if (!box) {
      if (!slogan) return;
      box = document.createElement("div"); box.id = "wz-count"; box.setAttribute("aria-live", "polite");
      slogan.parentNode.insertBefore(box, slogan.nextSibling);
    }
    var n = weekCount(), c = whereName();
    if (n < 20 || !c) { box.style.display = "none"; return; }
    box.style.display = "";
    var html = "✨ <b>" + n.toLocaleString("fr-FR") + "</b> sorties cette semaine autour de " + c.replace(/[<>&]/g, "");
    if (box.__h !== html) { box.innerHTML = html; box.__h = html; }
  }

  function moveSurprise() {
    var sc = document.getElementById("sc-surprise"), chips = document.getElementById("wz-chips");
    if (!sc || !chips) return;
    if (sc.parentNode !== chips.parentNode || sc.previousElementSibling !== chips) chips.parentNode.insertBefore(sc, chips.nextSibling);
  }

  function tick() { paint(); moveSurprise(); }
  function start() {
    tick();
    setInterval(tick, 2000);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(start, 1200); });
  else setTimeout(start, 1200);
})();
