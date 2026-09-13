// ---- bonhomme animé pendant le chargement des événements ----
let __eventsStillLoading = true;

const __fetchAllOpenAgendaEventsBase = fetchAllOpenAgendaEvents;
fetchAllOpenAgendaEvents = async function () {
  const result = await __fetchAllOpenAgendaEventsBase();
  __eventsStillLoading = false;
  __refreshLoadingDisplay();
  return result;
};

const MASCOT_SEARCHING_SVG =
  '<svg width="56" height="56" viewBox="0 0 200 220">' +
  '<path d="M100 20 C 62 20 34 50 34 88 C 34 116 60 142 82 162 L100 178 L118 162 C 140 142 166 116 166 88 C 166 50 138 20 100 20 Z" fill="#14213D"></path>' +
  '<circle cx="78" cy="92" r="9" fill="#fff"></circle>' +
  '<circle cx="122" cy="92" r="9" fill="#fff"></circle>' +
  '<path d="M76 118 Q100 122 124 118" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"></path>' +
  "</svg>";

const MASCOT_FOUND_SVG =
  '<svg width="56" height="56" viewBox="0 0 200 220">' +
  '<path d="M100 20 C 62 20 34 50 34 88 C 34 116 60 142 82 162 L100 178 L118 162 C 140 142 166 116 166 88 C 166 50 138 20 100 20 Z" fill="#14213D"></path>' +
  '<circle cx="78" cy="92" r="9" fill="#fff"></circle>' +
  '<path d="M110 92 Q122 86 134 92" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"></path>' +
  '<path d="M76 118 C 88 132 112 132 124 118" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"></path>' +
  "</svg>";

function __refreshLoadingDisplay() {
  const emptyEl = document.getElementById("empty-state");
  const listEl = document.getElementById("event-list");
  if (!emptyEl || !listEl) return;
  if (__eventsStillLoading && listEl.children.length === 0 && !emptyEl.classList.contains("hidden")) {
    emptyEl.innerHTML =
      '<div id="mascot-loading-wrap" style="display:flex; flex-direction:column; align-items:center; gap:10px; animation:mascotBounce 1s ease-in-out infinite;">' +
      MASCOT_SEARCHING_SVG +
      '<span>🔍 Recherche des événements en cours...</span>' +
      "</div>";
  } else if (!__eventsStillLoading && emptyEl.innerHTML.includes("mascot-loading-wrap")) {
    const wrap = document.getElementById("mascot-loading-wrap");
    if (wrap) {
      wrap.style.animation = "mascotPop 0.5s ease";
      wrap.innerHTML = MASCOT_FOUND_SVG + '<span>✨ Événements trouvés !</span>';
      setTimeout(function () {
        emptyEl.textContent =
          "Aucun événement ne correspond à ces filtres pour le moment. Essayez d'élargir le rayon ou les catégories.";
      }, 900);
    }
  }
}

const styleTag = document.createElement("style");
styleTag.textContent =
  "@keyframes mascotBounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-6px);}}" +
  "@keyframes mascotPop{0%{transform:scale(1);}40%{transform:scale(1.15);}100%{transform:scale(1);}}";
document.head.appendChild(styleTag);

const __renderDiscoverBaseLoading = renderDiscover;
renderDiscover = function () {
  __renderDiscoverBaseLoading();
  __refreshLoadingDisplay();
};
