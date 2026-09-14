// ---- écran d'arrivée : 3 bonhommes juste après "Je me localise" ----

const MASCOT_NEUTRAL_SVG =
  '<svg width="72" height="72" viewBox="0 0 200 220">' +
  '<path d="M100 20 C 62 20 34 50 34 88 C 34 116 60 142 82 162 L100 178 L118 162 C 140 142 166 116 166 88 C 166 50 138 20 100 20 Z" fill="#fff"></path>' +
  '<circle class="eye-l" cx="78" cy="92" r="9" fill="#14213D"></circle>' +
  '<circle class="eye-r" cx="122" cy="92" r="9" fill="#14213D"></circle>' +
  '<path class="mouth" d="M74 116 Q100 138 126 116" fill="none" stroke="#14213D" stroke-width="6" stroke-linecap="round"></path>' +
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

function __arrivalWeatherText() {
  const el = document.getElementById("weather-mini");
  return el && el.textContent.trim() ? el.textContent.trim() : "";
}

function __arrivalShow() {
  const existing = document.getElementById("arrival-screen-overlay");
  if (existing) existing.remove();

  const now = new Date();
  const cityKey = state.userPos ? nearestCityKey() : state.city;
  const cityName = CITIES[cityKey] ? CITIES[cityKey].name : "";
  const time = now.getHours() + "h" + String(now.getMinutes()).padStart(2, "0");
  const weatherText = __arrivalWeatherText();

  const overlay = document.createElement("div");
  overlay.id = "arrival-screen-overlay";
  overlay.style.cssText =
    "position:fixed; inset:0; background:#14213D; z-index:9998; display:flex; flex-direction:column; align-items:center; padding:50px 20px 20px; overflow-y:auto;";

  overlay.innerHTML =
    '<div style="text-align:center; color:#fff; margin-bottom:32px; font-size:17px; line-height:1.5;">' +
    "Vous êtes à <b>" + cityName + "</b>, il est <b>" + time + "</b>" +
    (weatherText ? "<br>et il fait " + weatherText.replace(/^\s*/, "") : "") +
    "</div>" +
    '<div style="display:flex; gap:24px; justify-content:center;">' +
    '<div class="arrival-opt" data-key="near" style="text-align:center; cursor:pointer;">' +
    '<div class="arrival-svg-wrap">' + MASCOT_NEUTRAL_SVG + "</div>" +
    '<div style="color:#fff; font-size:12.5px; margin-top:8px; font-weight:600;">Autour de moi</div>' +
    "</div>" +
    '<div class="arrival-opt" data-key="other" style="text-align:center; cursor:pointer;">' +
    '<div class="arrival-svg-wrap">' + MASCOT_NEUTRAL_SVG + "</div>" +
    '<div style="color:#fff; font-size:12.5px; margin-top:8px; font-weight:600;">Une autre idée</div>' +
    "</div>" +
    '<div class="arrival-opt" data-key="all" style="text-align:center; cursor:pointer;">' +
    '<div class="arrival-svg-wrap">' + MASCOT_NEUTRAL_SVG + "</div>" +
    '<div style="color:#fff; font-size:12.5px; margin-top:8px; font-weight:600;">Tout voir</div>' +
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
          __ensureArrivalBackButton();
          return;
        }
        if (key === "other") __landingPreferredCategory = "À voir";
        overlay.remove();
        __landingModeOpen();
        __ensureArrivalBackInsideModal();
      }, 320);
    });
  });
}

function __ensureArrivalBackInsideModal() {
  setTimeout(function () {
    const modal = document.getElementById("landing-mode-overlay") || document.getElementById("layover-overlay");
    if (!modal) return;
    const card = modal.firstElementChild;
    if (!card || card.querySelector("#arrival-back-btn")) return;
    const back = document.createElement("button");
    back.id = "arrival-back-btn";
    back.textContent = "← Retour aux 3 choix";
    back.style.cssText =
      "display:block; margin:0 0 14px; padding:8px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:12px; cursor:pointer;";
    back.addEventListener("click", function () {
      modal.remove();
      __arrivalShow();
    });
    card.insertBefore(back, card.firstChild);
  }, 50);
}

function __ensureArrivalBackButton() {
  if (document.getElementById("arrival-back-floating")) return;
  const btn = document.createElement("button");
  btn.id = "arrival-back-floating";
  btn.textContent = "🛬";
  btn.title = "Revenir à l'écran d'arrivée";
  btn.style.cssText =
    "position:fixed; bottom:20px; right:20px; width:52px; height:52px; border-radius:50%; border:none; background:#14213D; color:#fff; font-size:22px; box-shadow:0 4px 12px rgba(0,0,0,0.25); z-index:9000; cursor:pointer;";
  btn.addEventListener("click", function () {
    btn.remove();
    __arrivalShow();
  });
  document.body.appendChild(btn);
}

const __choiceLocateBase = document.getElementById("choice-locate");
if (__choiceLocateBase) {
  __choiceLocateBase.addEventListener("click", function () {
    setTimeout(__arrivalShow, 900);
  });
}
