// ---- écran d'arrivée : 3 bonhommes juste après "Je me localise" ----

const MASCOT_NEUTRAL_SVG =
  '<svg width="44" height="44" viewBox="0 0 200 220">' +
  '<path d="M100 20 C 62 20 34 50 34 88 C 34 116 60 142 82 162 L100 178 L118 162 C 140 142 166 116 166 88 C 166 50 138 20 100 20 Z" fill="#fff"></path>' +
  '<circle class="eye-l" cx="78" cy="92" r="9" fill="#14213D"></circle>' +
  '<circle class="eye-r" cx="122" cy="92" r="9" fill="#14213D"></circle>' +
  '<path class="mouth" d="M76 118 Q100 122 124 118" fill="none" stroke="#14213D" stroke-width="6" stroke-linecap="round"></path>' +
  "</svg>";

function __arrivalWink(svgEl) {
  const eyeR = svgEl.querySelector(".eye-r");
  if (eyeR) {
    eyeR.outerHTML =
      '<path class="eye-r" d="M110 92 Q122 86 134 92" fill="none" stroke="#14213D" stroke-width="6" stroke-linecap="round"></path>';
  }
  const mouth = svgEl.querySelector(".mouth");
  if (mouth) mouth.setAttribute("d", "M76 118 C 88 132 112 132 124 118");
}

function __arrivalShow() {
  if (document.getElementById("arrival-screen-overlay")) return;
  const now = new Date();
  const cityKey = state.userPos ? nearestCityKey() : state.city;
  const cityName = CITIES[cityKey] ? CITIES[cityKey].name : "";
  const time = now.getHours() + "h" + String(now.getMinutes()).padStart(2, "0");
  const dateStr = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const overlay = document.createElement("div");
  overlay.id = "arrival-screen-overlay";
  overlay.style.cssText =
    "position:fixed; inset:0; background:#14213D; z-index:9998; display:flex; flex-direction:column; align-items:center; padding:40px 20px 20px; overflow-y:auto;";

  overlay.innerHTML =
    '<div style="text-align:center; color:#fff; margin-bottom:28px;">' +
    '<div style="font-size:20px; font-weight:700;">📍 ' + cityName + "</div>" +
    '<div style="font-size:14px; opacity:0.8; margin-top:4px;">' + time + " · " + dateStr + "</div>" +
    "</div>" +
    '<div style="display:flex; gap:20px; justify-content:center;">' +
    '<div class="arrival-opt" data-key="near" style="text-align:center; cursor:pointer;">' +
    '<div class="arrival-svg-wrap">' + MASCOT_NEUTRAL_SVG + "</div>" +
    '<div style="color:#fff; font-size:11px; margin-top:6px; font-weight:600;">Autour de moi</div>' +
    "</div>" +
    '<div class="arrival-opt" data-key="other" style="text-align:center; cursor:pointer;">' +
    '<div class="arrival-svg-wrap">' + MASCOT_NEUTRAL_SVG + "</div>" +
    '<div style="color:#fff; font-size:11px; margin-top:6px; font-weight:600;">Une autre idée</div>' +
    "</div>" +
    '<div class="arrival-opt" data-key="all" style="text-align:center; cursor:pointer;">' +
    '<div class="arrival-svg-wrap">' + MASCOT_NEUTRAL_SVG + "</div>" +
    '<div style="color:#fff; font-size:11px; margin-top:6px; font-weight:600;">Tout voir</div>' +
    "</div>" +
    "</div>" +
    '<div id="arrival-reveal" style="width:100%; max-width:420px; margin-top:24px;"></div>';

  document.body.appendChild(overlay);

  overlay.querySelectorAll(".arrival-opt").forEach(function (opt) {
    opt.addEventListener("click", function () {
      const svg = opt.querySelector("svg");
      __arrivalWink(svg);
      const key = opt.dataset.key;
      setTimeout(function () {
        if (key === "all") {
          overlay.remove();
          return;
        }
        if (key === "other") __landingPreferredCategory = "À voir";
        overlay.remove();
        __landingModeOpen();
      }, 320);
    });
  });
}

const __choiceLocateBase = document.getElementById("choice-locate");
if (__choiceLocateBase) {
  __choiceLocateBase.addEventListener("click", function () {
    setTimeout(__arrivalShow, 900);
  });
}
