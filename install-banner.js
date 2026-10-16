// install-banner.js — petite bannière « Installer Whazup sur ton téléphone » (accueil, mobile uniquement).
// - Android / Chrome : bouton « Installer » (invite système). - iPhone / Safari : explication en 2 gestes.
// - N'apparaît pas si Whazup est déjà installé, ni sur ordinateur ; « Plus tard » la masque 14 jours, ✕ 60 jours.
// POUR TOUT ANNULER : retirer la ligne <script src="install-banner.js"> dans index.html.
(function () {
  "use strict";
  var KEY = "wz-install-hide-until";
  var ua = navigator.userAgent || "";
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  var isAndroid = /Android/i.test(ua);
  if (!isIOS && !isAndroid) return;
  var standalone = (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || navigator.standalone === true;
  if (standalone) return;

  function hidden() { try { return Number(localStorage.getItem(KEY) || 0) > Date.now(); } catch (e) { return false; } }
  function hideFor(days) { try { localStorage.setItem(KEY, String(Date.now() + days * 86400000)); } catch (e) {} }

  var deferred = null;
  window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); deferred = e; });
  window.addEventListener("appinstalled", function () { hideFor(3650); var b = document.getElementById("wz-install"); if (b) b.remove(); });

  var CSS = [
    "#wz-install{position:fixed;left:12px;right:12px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:900;max-width:460px;margin:0 auto;background:#fff;color:#2A2233;border:1px solid #EADFCF;border-radius:18px;padding:14px 16px;box-shadow:0 14px 34px -12px rgba(90,60,30,.4);font-family:system-ui,-apple-system,'Segoe UI',sans-serif}",
    "#wz-install .wi-t{display:flex;align-items:center;gap:10px;font-weight:800;font-size:15px;padding-right:26px}",
    "#wz-install .wi-t img{width:34px;height:34px;border-radius:9px}",
    "#wz-install .wi-d{margin:8px 0 0;font-size:13.5px;line-height:1.45;color:#6F6678}",
    "#wz-install .wi-d b{color:#2A2233}",
    "#wz-install .wi-a{display:flex;gap:10px;margin-top:12px}",
    "#wz-install button{font-family:inherit;cursor:pointer;border-radius:999px;font-size:14px;font-weight:700}",
    "#wz-install .wi-go{flex:1;border:0;padding:12px;background:linear-gradient(135deg,#F2864B,#E85D3D);color:#fff}",
    "#wz-install .wi-later{border:1px solid #EADFCF;background:#fff;color:#6F6678;padding:12px 16px}",
    "#wz-install .wi-x{position:absolute;top:8px;right:8px;width:30px;height:30px;border:0;background:none;color:#8F8696;font-size:16px}"
  ].join("");

  function homeVisible() {
    var v = document.getElementById("view-discover");
    return v && !v.classList.contains("hidden") && !document.body.classList.contains("wz-nocity");
  }

  function show() {
    if (document.getElementById("wz-install") || hidden() || !homeVisible()) return;
    if (document.getElementById("wz-sheet") || document.getElementById("wz-tour") || document.getElementById("wz-ob")) return;
    if (!document.getElementById("wz-install-css")) {
      var st = document.createElement("style"); st.id = "wz-install-css"; st.textContent = CSS; document.head.appendChild(st);
    }
    var canPrompt = !!deferred;
    var b = document.createElement("div"); b.id = "wz-install"; b.setAttribute("role", "dialog"); b.setAttribute("aria-label", "Installer Whazup");
    var body = canPrompt
      ? '<p class="wi-d">Ajoute Whazup à ton écran d’accueil : il s’ouvre en plein écran, plus vite, comme une vraie appli.</p>' +
        '<div class="wi-a"><button class="wi-go" type="button">Installer</button><button class="wi-later" type="button">Plus tard</button></div>'
      : isIOS
        ? '<p class="wi-d">Sur iPhone, 2 gestes : touche le bouton <b>Partager</b> (le carré avec une flèche vers le haut, en bas de Safari), puis <b>« Sur l’écran d’accueil »</b>.</p>' +
          '<div class="wi-a"><button class="wi-go wi-ok" type="button">J’ai compris</button><button class="wi-later" type="button">Plus tard</button></div>'
        : '<p class="wi-d">Sur Android : ouvre le menu <b>⋮</b> de Chrome, puis <b>« Installer l’application »</b> (ou « Ajouter à l’écran d’accueil »).</p>' +
          '<div class="wi-a"><button class="wi-go wi-ok" type="button">J’ai compris</button><button class="wi-later" type="button">Plus tard</button></div>';
    b.innerHTML = '<button class="wi-x" type="button" aria-label="Fermer">✕</button>' +
      '<div class="wi-t"><img src="logo-192.png" alt="">Installer Whazup sur ton téléphone</div>' + body;
    document.body.appendChild(b);
    b.querySelector(".wi-x").onclick = function () { hideFor(60); b.remove(); };
    b.querySelector(".wi-later").onclick = function () { hideFor(14); b.remove(); };
    var ok = b.querySelector(".wi-ok"); if (ok) ok.onclick = function () { hideFor(60); b.remove(); };
    var go = b.querySelector(".wi-go");
    if (canPrompt && go) go.onclick = function () {
      try { deferred.prompt(); deferred.userChoice.then(function () { deferred = null; hideFor(60); b.remove(); }); } catch (e) { b.remove(); }
    };
  }

  // 2e visite (ou plus) : on ne dérange pas quelqu'un qui découvre le site
  var visits = 1;
  try { visits = Number(localStorage.getItem("wz-visits") || 0) + 1; localStorage.setItem("wz-visits", String(visits)); } catch (e) {}
  if (visits < 2) return;
  setTimeout(function () { show(); setInterval(function () {
    var b = document.getElementById("wz-install");
    if (b && !homeVisible()) b.remove(); else if (!b) show();
  }, 4000); }, 20000);
})();
