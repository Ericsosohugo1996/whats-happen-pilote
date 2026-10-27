// ---- Fiches Shotgun : bouton « Réserver sur Shotgun » ----
// Condition de l'accès gratuit à l'API Shotgun : renvoyer vers Shotgun pour l'achat des billets.
// Exception volontaire à la règle « aucun lien externe sur la fiche » : seulement pour les soirées venant de Shotgun.
// Pour retirer : supprimer la ligne shotgun-link.js dans index.html.
(function () {
  "use strict";
  if (typeof openDetail !== "function") return;
  var css = document.createElement("style");
  css.textContent = "#wz-sg-btn{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin:14px 0 6px;padding:14px;border:none;border-radius:14px;background:#111 !important;color:#fff !important;font-weight:800;font-size:15px;font-family:inherit;cursor:pointer;text-decoration:none;box-sizing:border-box}#wz-sg-btn small{font-weight:600;opacity:.8;font-size:12px;color:#fff !important}#wz-sg-btn *{color:#fff !important}";
  document.head.appendChild(css);
  var base = openDetail;
  openDetail = function (id) {   // eslint-disable-line no-global-assign
    var r = base.apply(this, arguments);
    try {
      var old = document.getElementById("wz-sg-btn"); if (old) old.remove();
      var ev = allEvents().find(function (e) { return e.id === id; });
      if (!ev || ev.source !== "shotgun" || !/^https:\/\//.test(ev.link || "")) return r;
      var host = document.querySelector("#view-detail .action-tiles");
      if (!host || !host.parentNode) return r;
      var a = document.createElement("a");
      a.id = "wz-sg-btn"; a.href = ev.link; a.target = "_blank"; a.rel = "noopener";
      a.innerHTML = "🎟️ Réserver sur Shotgun <small>billetterie officielle</small>";
      a.addEventListener("click", function () {
        track("shotgun_click", ev.city);
        // on note la soirée : au retour sur Whazup, on proposera « J'y vais » / « Proposer à un ami »
        try { localStorage.setItem("wzSgBack", JSON.stringify({ id: ev.id, title: ev.title, t: Date.now() })); } catch (e) {}
      });
      host.parentNode.insertBefore(a, host.nextSibling);
    } catch (e) {}
    return r;
  };

  function track(n, city) { try { if (typeof analytics !== "undefined" && analytics.logEvent) analytics.logEvent(n, { city: city || (state && state.city) }); } catch (e) {} }

  // ---- retour depuis Shotgun : « Tu y vas ? » ----
  var sheetCss = document.createElement("style");
  sheetCss.textContent = "#wz-sg-back{position:fixed;left:0;right:0;bottom:0;z-index:2147482500;display:flex;justify-content:center;padding:0 12px 14px;pointer-events:none}" +
    "#wz-sg-back .bx{pointer-events:auto;width:100%;max-width:460px;background:#fff;border-radius:22px;box-shadow:0 -10px 40px rgba(20,33,61,.25);padding:18px 18px 14px;font-family:var(--font-body,inherit);color:#14213D;animation:wzup .3s ease}" +
    "@keyframes wzup{from{transform:translateY(40px);opacity:0}to{transform:none;opacity:1}}" +
    "#wz-sg-back h3{margin:0 0 4px;font-family:var(--font-display,Georgia,serif);font-size:21px}#wz-sg-back p{margin:0 0 14px;color:#6B7280;font-size:13.5px;line-height:1.4}" +
    "#wz-sg-back button{display:block;width:100%;border:none;border-radius:14px;padding:13px;font-weight:800;font-size:14.5px;font-family:inherit;cursor:pointer;margin-top:8px}" +
    "#wz-sg-back .go{background:linear-gradient(135deg,#E8604C,#C64A38);color:#fff}#wz-sg-back .fr{background:#14213D;color:#fff}#wz-sg-back .no{background:none;color:#6B7280;font-weight:600}";
  document.head.appendChild(sheetCss);
  function esc(t) { return String(t || "").replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function closeSheet() { var x = document.getElementById("wz-sg-back"); if (x) x.remove(); }
  function showBack() {
    var p = null;
    try { p = JSON.parse(localStorage.getItem("wzSgBack") || "null"); } catch (e) {}
    if (!p || !p.id) return;
    var age = Date.now() - (p.t || 0);
    if (age < 5000) return;                                   // pas encore parti sur Shotgun
    try { localStorage.removeItem("wzSgBack"); } catch (e) {}
    if (age > 6 * 3600 * 1000 || document.getElementById("wz-sg-back")) return;   // trop ancien : on ne dérange pas
    track("shotgun_back");
    var d = document.createElement("div"); d.id = "wz-sg-back";
    d.innerHTML = '<div class="bx"><h3>Tu y vas ? 🎉</h3><p>' + esc(p.title) + '<br>Garde-la dans Whazup et préviens tes amis.</p>' +
      '<button type="button" class="go" data-k="go">✅ J\'y vais</button>' +
      '<button type="button" class="fr" data-k="fr">👥 Proposer à un ami</button>' +
      '<button type="button" class="no" data-k="no">Plus tard</button></div>';
    document.body.appendChild(d);
    d.addEventListener("click", function (e) {
      var k = e.target.closest && e.target.closest("[data-k]"); if (!k) return;
      var what = k.getAttribute("data-k"); closeSheet();
      if (what === "no") { track("shotgun_back_later"); return; }
      try { if (state.currentEventId !== p.id) openDetail(p.id); } catch (x) {}
      setTimeout(function () {
        var b = document.getElementById(what === "go" ? "btn-interested" : "btn-propose-outing");
        track(what === "go" ? "shotgun_back_going" : "shotgun_back_friend");
        if (b) b.click();
      }, 350);
    });
  }
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "visible") setTimeout(showBack, 600); });
  window.addEventListener("focus", function () { setTimeout(showBack, 600); });
  window.addEventListener("load", function () { setTimeout(showBack, 2500); });
})();
