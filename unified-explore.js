// ---- unifie les anciens boutons en un seul point d'entrée "Explorer" ----
// (landing-mode.js a été retiré du site : son bouton n'existe plus, rien à neutraliser pour lui.)
function __unifiedHideOldButtons() {
  ["layover-mode-btn", "surprise-btn", "itinerary-btn"].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}
 
function __ensureUnifiedExploreButton() {
  const choiceScreen = document.getElementById("choice-screen");
  const existing = document.getElementById("unified-explore-btn");
  if (choiceScreen && !choiceScreen.classList.contains("hidden")) {
    if (existing) existing.remove();
    return;
  }
  __unifiedHideOldButtons();
  const cityKey = state.userPos ? nearestCityKey() : state.city;
  const cityName = CITIES[cityKey] ? CITIES[cityKey].name : "";
  if (existing) {
    existing.textContent = "🔍 Explorer " + cityName;
    return;
  }
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;
  const btn = document.createElement("button");
  btn.id = "unified-explore-btn";
  btn.type = "button";
  btn.textContent = "🔍 Explorer " + cityName;
  btn.style.cssText =
    "display:block; margin:10px auto 0; padding:11px 20px; border-radius:999px; border:none; background:linear-gradient(90deg,#c1440e,#e3a72e); color:#fff; font-weight:700; font-size:13.5px; cursor:pointer;";
  btn.addEventListener("click", function () {
    if (typeof __arrivalShow === "function") __arrivalShow();
  });
  topbar.insertAdjacentElement("afterend", btn);
}
 
const __renderDiscoverBaseUnified = renderDiscover;
renderDiscover = function () {
  __renderDiscoverBaseUnified();
  __ensureUnifiedExploreButton();
};
setInterval(__unifiedHideOldButtons, 500);
setTimeout(__ensureUnifiedExploreButton, 300);
 
