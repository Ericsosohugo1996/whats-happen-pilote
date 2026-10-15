// Whazup — mini-visite de bienvenue (3 écrans), montrée une seule fois aux nouveaux visiteurs, après le choix de la ville.
// Pour la revoir : https://whazup.fr/?tour=1   —   pour la retirer : supprimer ce fichier sur GitHub (et sa ligne dans index.html).
(function () {
  "use strict";
  var KEY = "wz_tour_v1";
  var force = false, link = false;
  try { var q = new URLSearchParams(location.search); force = q.get("tour") === "1"; link = !!(q.get("ev") || q.get("ville")); } catch (e) {}
  var seen = false, had = false;
  try { seen = !!localStorage.getItem(KEY); had = !!localStorage.getItem("wz_last_open_v1"); } catch (e) {}
  if (link && !force) return;
  // les personnes qui utilisaient déjà Whazup n'ont pas besoin de la visite
  if (!force && had) { try { localStorage.setItem(KEY, "1"); } catch (e) {} return; }
  if (!force && seen) return;

  var SLIDES = [
    { ico: "🌙", t: "Trouve quoi faire, ce soir", p: "Des milliers de sorties dans toute la France : concerts, expos, marchés, spectacles, soirées. Choisis « Ce soir », « Demain » ou « Ce week-end »." },
    { ico: "❤️", t: "Garde tes envies", p: "Touche le cœur d’une sortie pour la retrouver plus tard dans « Mon carnet ». Partage-la à un ami en un geste." },
    { ico: "📸", t: "Garde un souvenir", p: "Après la sortie, prends une photo avec le bouton du milieu. Elle rejoint ton carnet. « Si j’avais su, j’y serais allé » devient « J’y étais »." }
  ];
  var idx = 0, box = null;
  function css() {
    if (document.getElementById("wz-tour-css")) return;
    var st = document.createElement("style"); st.id = "wz-tour-css";
    st.textContent = "#wz-tour{position:fixed;inset:0;z-index:100000;background:rgba(8,12,26,.88);display:flex;align-items:flex-end;justify-content:center;font-family:inherit}" +
      "#wz-tour .tc{width:100%;max-width:520px;background:#16213F;color:#fff;border-radius:28px 28px 0 0;padding:28px 24px calc(22px + env(safe-area-inset-bottom,0px));box-shadow:0 -20px 50px rgba(0,0,0,.45)}" +
      "#wz-tour .ti{font-size:46px;line-height:1;margin-bottom:12px}" +
      "#wz-tour h2{font-family:'Fraunces',Georgia,serif;font-size:26px;line-height:1.15;margin:0 0 10px;color:#fff;text-wrap:balance}" +
      "#wz-tour p{font-size:15.5px;line-height:1.5;color:#c9cfdf;margin:0 0 18px}" +
      "#wz-tour .td{display:flex;gap:7px;margin:0 0 18px}" +
      "#wz-tour .td i{width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.25)}" +
      "#wz-tour .td i.on{background:#F2C879;width:22px;border-radius:6px}" +
      "#wz-tour .tb{display:flex;align-items:center;justify-content:space-between;gap:12px}" +
      "#wz-tour button{font:inherit;cursor:pointer;border:0}" +
      "#wz-tour .skip{background:none;color:#aeb5c8;font-size:14.5px;padding:12px 6px;text-decoration:underline}" +
      "#wz-tour .next{background:linear-gradient(135deg,#F2C879,#E85D3D);color:#14213D;font-weight:800;font-size:16px;padding:14px 26px;border-radius:999px}" +
      "#wz-tour button:focus-visible{outline:2px solid #F2C879;outline-offset:2px}";
    document.head.appendChild(st);
  }
  function done() {
    try { localStorage.setItem(KEY, "1"); } catch (e) {}
    if (box) { box.remove(); box = null; }
  }
  function render() {
    var s = SLIDES[idx], last = idx === SLIDES.length - 1;
    var dots = SLIDES.map(function (_, i) { return '<i class="' + (i === idx ? "on" : "") + '"></i>'; }).join("");
    box.innerHTML = '<div class="tc" role="dialog" aria-modal="true" aria-label="Bienvenue sur Whazup"><div class="ti" aria-hidden="true">' + s.ico + "</div><h2>" + s.t + "</h2><p>" + s.p + '</p><div class="td" aria-hidden="true">' + dots +
      '</div><div class="tb"><button type="button" class="skip" data-a="skip">Passer</button><button type="button" class="next" data-a="next">' + (last ? "C’est parti" : "Suivant") + "</button></div></div>";
  }
  function show() {
    css();
    box = document.createElement("div"); box.id = "wz-tour";
    box.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest("button") : null;
      if (!b) { return; }
      if (b.getAttribute("data-a") === "skip") return done();
      if (idx >= SLIDES.length - 1) return done();
      idx++; render();
    });
    document.body.appendChild(box); render();
    var n = box.querySelector(".next"); if (n) n.focus();
  }
  function busy() {
    if (!document.body.classList.contains("wz-v2") || document.body.classList.contains("wz-nocity")) return true;
    try { if (typeof __hasPickedCity === "undefined" || !__hasPickedCity) return true; } catch (e) { return true; }
    var ids = ["wz-ob", "wz-sheet", "arrival-overlay", "wz-intro", "splash-screen", "brand-intro-screen", "choice-screen"];
    for (var i = 0; i < ids.length; i++) { var e = document.getElementById(ids[i]); if (e && e.offsetParent !== null) return true; }
    var am = document.getElementById("account-modal"); if (am && !am.classList.contains("hidden")) return true;
    var d = document.getElementById("view-discover"); if (!d || d.classList.contains("hidden")) return true;
    return false;
  }
  var tries = 0, calm = 0, t0 = Date.now();
  var iv = setInterval(function () {
    if (Date.now() - t0 < 4500) return; // on laisse l'appli finir de démarrer (l'écran de choix de ville apparaît après ~2 s)
    if (++tries > 400) return clearInterval(iv);
    if (busy()) { calm = 0; return; }
    if (++calm < 4) return; // l'accueil doit être stable ~3 s avant d'afficher la visite
    clearInterval(iv); show();
  }, 700);
})();
