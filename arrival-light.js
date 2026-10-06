// Whazup — écran d'arrivée en version claire (photo lumineuse en haut, panneau blanc dessous).
// Pour revenir à l'ancien look : supprimer ce fichier sur GitHub (et la ligne dans index.html n'est pas nécessaire : un fichier absent est ignoré).
(function () {
  "use strict";
  var css =
    '#arrival-screen-overlay{background-color:#fff!important}' +
    '#arrival-screen-overlay .arrival-opt:not([data-key="near"]){background:#fff!important;border:1px solid #E5E7EB!important;box-shadow:0 6px 16px -12px rgba(20,33,61,.35)}' +
    '#arrival-screen-overlay .arrival-opt:not([data-key="near"]) span:last-child{color:#14213D!important;font-size:12px!important}' +
    '#arrival-screen-overlay #sejour-tile{background:linear-gradient(135deg,#FFF4DC,#E3F1F1)!important;border:1px solid #F0D79A!important}' +
    '#arrival-screen-overlay #sejour-tile span:last-child{color:#14213D!important;font-size:13px!important;font-weight:700!important}' +
    '#arrival-screen-overlay .arrival-tonight-card{background:#fff!important;border:1px solid #E5E7EB!important;box-shadow:0 8px 18px -12px rgba(20,33,61,.35)}' +
    '#arrival-screen-overlay .arrival-tonight-card div+div div:first-child{color:#14213D!important}' +
    '#arrival-screen-overlay .arrival-tonight-card div+div div:last-child{color:#6B7280!important}' +
    '#arrival-screen-overlay #arrival-tonight-strip{scrollbar-width:none}' +
    '#arrival-screen-overlay #arrival-tonight-strip::-webkit-scrollbar{display:none}' +
    '#arrival-screen-overlay #arrival-tonight-strip:before{display:none}' +
    '#arrival-screen-overlay .wz-al-h{color:#14213D!important}' +
    '#arrival-screen-overlay .wz-al-weather{background:#F1F3F7!important;color:#4B5563!important}' +
    '#arrival-screen-overlay #arrival-change-city{background:rgba(255,255,255,.22)!important;border-color:rgba(255,255,255,.7)!important;backdrop-filter:blur(4px)}' +
    '#arrival-screen-overlay .wz-navbar{background:rgba(255,255,255,.96)!important;border-top:1px solid #E5E7EB!important;backdrop-filter:blur(8px)}' +
    '#arrival-screen-overlay .wz-navbar-item[aria-current="page"]{color:#E85D3D!important}' +
    '#arrival-screen-overlay .wz-navbar-item:not([aria-current="page"]){color:#6B7280!important}' +
    '#arrival-screen-overlay #arrival-flags-row{background:#fff!important;border:1px solid #E5E7EB!important}' +
    '#arrival-screen-overlay>div[style*="blur(50px)"]{display:none!important}';
  var st = document.createElement("style");
  st.id = "wz-arrival-light-css";
  st.textContent = css;
  document.head.appendChild(st);

  function lighten(ov) {
    if (!ov || ov.__wzLight) return;
    ov.__wzLight = 1;
    var m = /url\(["']?([^"')]+)["']?\)/.exec(ov.style.backgroundImage || ov.getAttribute("style") || "");
    if (m) {
      ov.style.setProperty("background",
        "linear-gradient(180deg,rgba(12,18,36,.62) 0%,rgba(12,18,36,.42) 38%,rgba(12,18,36,.12) 62%,rgba(255,255,255,.6) 86%,#fff 100%) top/100% 360px no-repeat local," +
        "url('" + m[1] + "') top center/100% 360px no-repeat local," +
        "#fff", "important");
    } else {
      ov.style.setProperty("background", "linear-gradient(180deg,#2A3A66 0,#3A4F86 200px,#fff 360px) top/100% 100% no-repeat local,#fff", "important");
    }
    // titre "Ce soir près de toi" + pastille météo
    var strip = ov.querySelector("#arrival-tonight-strip");
    if (strip && strip.previousElementSibling) strip.previousElementSibling.classList.add("wz-al-h");
    Array.prototype.forEach.call(ov.querySelectorAll("div"), function (d) {
      if (d.style && d.style.borderRadius === "999px" && /inline-flex/.test(d.style.display || "")) d.classList.add("wz-al-weather");
    });
  }
  function scan() { lighten(document.getElementById("arrival-screen-overlay")); }
  new MutationObserver(scan).observe(document.documentElement, { childList: true, subtree: true });
  scan();
})();
