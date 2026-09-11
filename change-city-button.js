// ---- bouton "changer de ville" : retour à la sélection de ville ----
function goToChangeCity() {
  const landmarkModal = document.getElementById("landmark-modal");
  if (landmarkModal) landmarkModal.classList.add("hidden");

  if (typeof __hasPickedCity !== "undefined") {
    __hasPickedCity = false;
    if (typeof renderLocateBar === "function") renderLocateBar();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function __createChangeCityButton() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-ghost";
  btn.style.cssText = "display:flex; align-items:center; gap:4px; font-size:12.5px; white-space:nowrap;";
  btn.innerHTML =
    '<svg width="14" height="14" viewBox="0 0 200 220"><path d="M100 20 C 62 20 34 50 34 88 C 34 116 60 142 82 162 L100 178 L118 162 C 140 142 166 116 166 88 C 166 50 138 20 100 20 Z" fill="currentColor"/></svg> Changer de ville';
  btn.onclick = goToChangeCity;
  return btn;
}

document.addEventListener("DOMContentLoaded", () => {
  const topbar = document.querySelector(".topbar");
  if (topbar) {
    const publishBtn = document.getElementById("btn-publish-header");
    const btn1 = __createChangeCityButton();
    if (publishBtn) topbar.insertBefore(btn1, publishBtn);
    else topbar.appendChild(btn1);
  }

  const landmarkCard = document.querySelector(".landmark-modal-card");
  if (landmarkCard) {
    const closeBtn = document.getElementById("btn-landmark-close");
    const btn2 = __createChangeCityButton();
    btn2.style.margin = "8px 0 0 12px";
    if (closeBtn) closeBtn.insertAdjacentElement("afterend", btn2);
    else landmarkCard.insertBefore(btn2, landmarkCard.firstChild);
  }
});
