// ---- bonhomme sur le bandeau "ville sélectionnée" avant tout choix ----
let __hasPickedCity = false;
let __hasPickedFilter = false;

function __ensureBonhomme() {
  if (document.getElementById("bonhomme-banner")) return document.getElementById("bonhomme-banner");
  const bar = document.querySelector(".locate-bar");
  const body = document.querySelector(".locate-body");
  if (!bar || !body) return null;
  const wrap = document.createElement("div");
  wrap.id = "bonhomme-banner";
  wrap.style.cssText = "display:flex; flex-direction:column; align-items:center; justify-content:center; padding:44px 0 34px; transition:opacity .3s ease;";
  wrap.innerHTML =
    '<svg width="72" height="72" viewBox="0 0 200 220">' +
      '<path d="M100 20 C 62 20 34 50 34 88 C 34 116 60 142 82 162 L100 178 L118 162 C 140 142 166 116 166 88 C 166 50 138 20 100 20 Z" fill="#ffffff"/>' +
      '<circle cx="78" cy="92" r="9" fill="#14213D"/>' +
      '<path d="M110 92 Q122 86 134 92" fill="none" stroke="#14213D" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M76 118 C 88 132 112 132 124 118" fill="none" stroke="#14213D" stroke-width="6" stroke-linecap="round"/>' +
    '</svg>' +
    '<div class="brand-word" style="font-size:22px; margin-top:10px;">Wha<span class="accent">zup</span></div>' +
    '<div style="font-size:13.5px; color:rgba(255,255,255,0.75); margin-top:3px;">Sélectionner une ville</div>';
  bar.insertBefore(wrap, body);
  return wrap;
}

function __toggleCityContent(show) {
  const ids = ["stats-banner", "city-info", "filters-panel"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? "" : "none";
  });
  const toolbar = document.querySelector(".toolbar");
  if (toolbar) toolbar.style.display = show ? "" : "none";
}

function __toggleResultsContent(show) {
  const ids = ["map-mock", "btn-see-list", "event-list", "empty-state"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = show ? "" : "none";
  });
}

function __toggleLocateBody(show) {
  const body = document.querySelector(".locate-body");
  if (body) body.style.display = show ? "" : "none";
}

const __renderLocateBarBase = renderLocateBar;
renderLocateBar = function () {
  const bonhomme = __ensureBonhomme();
  const info = document.querySelector(".locate-info");
  const photo = document.getElementById("locate-bar-photo");
  if (!__hasPickedCity) {
    if (bonhomme) bonhomme.style.display = "flex";
    if (info) info.style.display = "none";
    if (photo) photo.style.display = "none";
    __toggleCityContent(false);
    __toggleResultsContent(false);
    __toggleLocateBody(true);
    return;
  }
  if (bonhomme) bonhomme.style.display = "none";
  if (info) info.style.display = "";
  if (photo) photo.style.display = "";
  __toggleCityContent(true);
  __toggleResultsContent(__hasPickedFilter);
  __toggleLocateBody(false);
  __renderLocateBarBase();
};

const __renderCategoryChipsBase = renderCategoryChips;
renderCategoryChips = function () {
  __renderCategoryChipsBase();
  const el = document.getElementById("category-chips");
  if (!el) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "chip-btn" + (state.selectedCategories.size === 0 ? " active" : "");
  btn.textContent = "Tout voir";
  btn.onclick = () => {
    state.selectedCategories.clear();
    renderCategoryChips();
    renderDiscover();
    __hasPickedFilter = true;
    __toggleResultsContent(true);
  };
  el.insertBefore(btn, el.firstChild);
};

document.addEventListener("click", (e) => {
  if (e.target.closest(".chip-btn[data-city]") || e.target.closest("#btn-geoloc")) {
    __hasPickedCity = true;
    __hasPickedFilter = false;
  }
  if (
    e.target.closest("#category-chips .chip-btn") ||
    e.target.closest("#radius-presets .chip-btn") ||
    e.target.closest("#time-presets .chip-btn")
  ) {
    __hasPickedFilter = true;
    __toggleResultsContent(true);
  }
}, true);
