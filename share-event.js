// ---- partager un événement avec un ami ----
function eventShareUrl(ev) {
  try {
    return "https://whazup.fr/?ev=" + encodeURIComponent(ev.id) + (ev.city ? "&v=" + encodeURIComponent(ev.city) : "");
  } catch (e) { return "https://whazup.fr"; }
}

function buildShareText(ev) {
  const dateLabel = typeof formatDate === "function" ? formatDate(ev.date) : ev.date;
  let text = ev.title + "\n" + dateLabel;
  if (ev.time) text += " · " + ev.time;
  if (ev.place) text += "\n" + ev.place;
  text += "\n\nVoir la sortie sur Whazup : " + eventShareUrl(ev);
  return text;
}

function showShareToast(message) {
  let toast = document.getElementById("share-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "share-toast";
    toast.style.cssText =
      "position:fixed; left:50%; bottom:90px; transform:translateX(-50%); background:#14213D; color:#fff; padding:10px 16px; border-radius:10px; font-size:13px; z-index:9999; box-shadow:0 8px 20px rgba(0,0,0,0.25); transition:opacity .3s;";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.display = "block";
  clearTimeout(window.__shareToastTimer);
  window.__shareToastTimer = setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => { toast.style.display = "none"; }, 300);
  }, 2500);
}

async function shareCurrentEvent() {
  const ev = allEvents().find((e) => e.id === state.currentEventId);
  if (!ev) return;
  const text = buildShareText(ev);
  if (navigator.share) {
    try {
      await navigator.share({ title: ev.title, text: text });
    } catch (e) {}
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showShareToast("✓ Lien copié ! Collez-le dans votre message.");
  } catch (e) {
    showShareToast("Impossible de copier automatiquement.");
  }
}

function __ensureShareButton() {
  if (document.getElementById("btn-share")) return;
  const tiles = document.querySelector(".action-tiles");
  if (!tiles) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "action-tile";
  btn.id = "btn-share";
  btn.innerHTML = '<span class="tile-icon">📤</span><span class="tile-label">Partager</span>';
  btn.onclick = shareCurrentEvent;
  tiles.appendChild(btn);
}

document.addEventListener("DOMContentLoaded", __ensureShareButton);
document.addEventListener("click", (e) => {
  if (e.target.closest(".event-card, .surprise-card, #surprise-card, .itin-stop")) {
    setTimeout(__ensureShareButton, 50);
  }
}, true);


// ---- lien direct vers une sortie : https://whazup.fr/?ev=<id>&v=<ville> ouvre directement la fiche ----
(function () {
  "use strict";
  var q, evId, vKey;
  try { q = new URLSearchParams(location.search); evId = (q.get("ev") || "").trim(); vKey = (q.get("v") || "").trim(); } catch (e) { return; }
  if (!evId) return;
  var hide = document.createElement("style");
  hide.id = "wz-evlink-hide";
  hide.textContent = "#wz-intro,#splash-screen,#brand-intro-screen,#choice-screen,#wz-ob,#arrival-overlay{display:none!important}";
  document.head.appendChild(hide);
  try { localStorage.setItem("wz_onboarded_v1", "1"); } catch (e) {}
  try {
    var ob = new MutationObserver(function () { var e = document.getElementById("wz-ob"); if (e) e.remove(); });
    ob.observe(document.documentElement, { childList: true, subtree: true });
    setTimeout(function () { ob.disconnect(); }, 12000);
  } catch (e) {}
  function unhide() { var h = document.getElementById("wz-evlink-hide"); if (h) h.remove(); }
  var tries = 0;
  function start() {
    tries++;
    var ok = false;
    try { ok = typeof state !== "undefined" && typeof CITIES !== "undefined" && typeof allEvents === "function" && typeof openDetail === "function"; } catch (e) {}
    if (!ok) { if (tries < 100) return setTimeout(start, 100); return unhide(); }
    try { if (vKey && CITIES[vKey]) { state.city = vKey; state.userPos = null; } } catch (e) {}
    try { __hasPickedCity = true; } catch (e) {}
    try { hideBrandIntroScreen(); } catch (e) {}
    ["wz-intro", "splash-screen", "wz-ob", "arrival-overlay"].forEach(function (id) { var e = document.getElementById(id); if (e) e.remove(); });
    var cs = document.getElementById("choice-screen"); if (cs) cs.classList.add("hidden");
    var ens = (typeof window.__wzEnsureData === "function") ? window.__wzEnsureData() : Promise.resolve();
    var done = false;
    function fire() {
      if (done) return; done = true;
      try { if (typeof renderDiscover === "function") renderDiscover(); } catch (e) {}
      try {
        var found = allEvents().some(function (e) { return e.id === evId; });
        if (found) openDetail(evId);
      } catch (e) {}
      unhide();
    }
    Promise.resolve(ens).then(function () {
      var n = 0;
      (function wait() {
        var has = false;
        try { has = allEvents().some(function (e) { return e.id === evId; }); } catch (e) {}
        if (has || n++ > 40) fire(); else setTimeout(wait, 150);
      })();
    }, fire);
    setTimeout(fire, 8000);
  }
  if (document.readyState === "complete") setTimeout(start, 50);
  else window.addEventListener("load", function () { setTimeout(start, 50); });
})();
