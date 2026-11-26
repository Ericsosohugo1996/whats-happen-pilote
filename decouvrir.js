// ---- « Découvrir Whazup » : 4 cartes pour comprendre l'appli en moins d'une minute ----
// - ouverte depuis un lien dans « Mon compte » (pas d'affichage d'office à la première visite)
// - aucune donnée, aucun appel réseau ; rien ne change pour les utilisateurs qui ne l'ouvrent pas
// - pour l'enlever : retirer la ligne decouvrir.js dans index.html.
(function () {
  "use strict";
  var CARDS = [
    { ico: "🔎", bg: "linear-gradient(135deg,#14213D 0%,#1c2f5a 55%,#4a6aa5 130%)", t: "Trouve une sortie", s: "Concerts, expos, soirées, marchés… partout en France.",
      steps: ["Choisis ta ville, ou touche « Me localiser »", "Touche Aujourd’hui, Ce soir, Demain ou Ce week-end", "Touche une sortie : photos, infos et itinéraire à pied ou à vélo"] },
    { ico: "✨", bg: "linear-gradient(135deg,#14213D 0%,#1c2f5a 55%,#E85D3D 140%)", t: "Surprends-moi", s: "Une idée en 1 clic, quand tu ne sais pas quoi faire.",
      steps: ["Touche « Surprends-moi » sur l’accueil : une idée apparaît", "Pas pour toi ? Change d’idée, ou touche « Affiner » pour choisir ton envie", "Onglet « Un programme » : une soirée ou une journée complète, étape par étape"] },
    { ico: "📖", bg: "linear-gradient(135deg,#27406b 0%,#3f5d7a 55%,#5f8a86 130%)", t: "Ton carnet", s: "Tes souvenirs, rangés par ville et par mois.",
      steps: ["Touche « 📸 Photo souvenir » et choisis une photo de ta galerie ou prends-en une", "Choisis « Moi seul » pour la garder privée", "Retrouve-la dans « Mon carnet »"] },
    { ico: "👥", bg: "linear-gradient(135deg,#1f2340 0%,#4a3560 55%,#a8648c 130%)", t: "Sors avec tes amis", s: "Invite-les, propose-leur une sortie, partagez vos photos.",
      steps: ["« Mes amis » puis « Inviter un ami » : ils reçoivent un message", "Sur l’accueil, touche un ami puis « Proposer une sortie »", "Photos partagées avec « Mes amis · 7 j » : ils les voient dans « Hier soir »"] }
  ];
  var idx = 0;
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function track(n, p) { try { if (typeof analytics !== "undefined" && analytics && analytics.logEvent) analytics.logEvent(n, p || {}); } catch (e) {} }

  function css() {
    if (document.getElementById("wz-dc-css")) return;
    var st = document.createElement("style"); st.id = "wz-dc-css";
    st.textContent = [
      "#wz-dc-open{display:block;width:100%;box-sizing:border-box;margin:0 0 12px;padding:13px 16px;border:1.5px solid #E85D3D;border-radius:14px;background:#fff;color:#14213D;font:700 14px inherit;font-family:inherit;text-align:left;cursor:pointer}",
      "#wz-dc-open small{display:block;font-weight:500;font-size:12px;color:#6B7280;margin-top:2px}",
      "#wz-dc{position:fixed;inset:0;z-index:2147483100;background:#EEF3FA;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:var(--font-body,system-ui,sans-serif);color:#14213D;display:none}",
      "#wz-dc .dc-in{max-width:520px;margin:0 auto;padding:14px 18px 24px;min-height:100%;box-sizing:border-box;display:flex;flex-direction:column}",
      "#wz-dc .dc-top{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:700;color:#6B7280}",
      "#wz-dc .dc-skip{border:0;background:none;font:inherit;color:#6B7280;cursor:pointer;padding:8px}",
      "#wz-dc .dc-hero{height:140px;border-radius:20px;display:flex;align-items:center;justify-content:center;font-size:64px;margin:8px 0 16px}",
      "#wz-dc h2{font-family:var(--font-display,Georgia,serif);font-size:26px;margin:0 0 4px;color:#14213D}",
      "#wz-dc .dc-s{margin:0 0 14px;font-size:14.5px;line-height:1.4;color:#4B5563}",
      "#wz-dc .dc-k{font-size:11.5px;letter-spacing:.08em;font-weight:800;color:#6B7280;margin:0 0 8px}",
      "#wz-dc .dc-st{display:flex;gap:10px;align-items:flex-start;background:#fff;border-radius:14px;padding:11px 12px;margin:0 0 8px;font-size:14px;line-height:1.35}",
      "#wz-dc .dc-n{flex:0 0 22px;height:22px;border-radius:50%;background:#E85D3D;color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center}",
      "#wz-dc .dc-sp{flex:1}",
      "#wz-dc .dc-dots{display:flex;gap:6px;justify-content:center;margin:14px 0}",
      "#wz-dc .dc-dots i{width:7px;height:7px;border-radius:50%;background:#CBD3E0}",
      "#wz-dc .dc-dots i.on{width:22px;border-radius:5px;background:#E85D3D}",
      "#wz-dc .dc-go{width:100%;border:0;border-radius:999px;background:#E85D3D;color:#fff;padding:15px;font:800 15px inherit;font-family:inherit;cursor:pointer}",
      "#wz-dc .dc-back{width:100%;border:0;background:none;color:#6B7280;font:600 13px inherit;font-family:inherit;padding:10px;cursor:pointer}"
    ].join("");
    document.head.appendChild(st);
  }

  function render() {
    var c = CARDS[idx], last = idx === CARDS.length - 1, el = document.getElementById("wz-dc");
    if (!el) { el = document.createElement("div"); el.id = "wz-dc"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Découvrir Whazup"); document.body.appendChild(el); }
    el.innerHTML = '<div class="dc-in"><div class="dc-top"><span>Carte ' + (idx + 1) + " sur " + CARDS.length + '</span><button type="button" class="dc-skip" data-dc="close">' + (last ? "Fermer" : "Passer") + "</button></div>" +
      '<div class="dc-hero" style="background:' + c.bg + '">' + c.ico + "</div>" +
      "<h2>" + esc(c.t) + '</h2><p class="dc-s">' + esc(c.s) + '</p><div class="dc-k">COMMENT FAIRE</div>' +
      c.steps.map(function (s, i) { return '<div class="dc-st"><span class="dc-n">' + (i + 1) + '</span><span class="dc-sp">' + esc(s) + "</span></div>"; }).join("") +
      '<div style="flex:1"></div><div class="dc-dots">' + CARDS.map(function (x, i) { return '<i class="' + (i === idx ? "on" : "") + '"></i>'; }).join("") + "</div>" +
      '<button type="button" class="dc-go" data-dc="' + (last ? "close" : "next") + '">' + (last ? "J’ai compris" : "Suivant") + "</button>" +
      (idx > 0 ? '<button type="button" class="dc-back" data-dc="prev">← Précédent</button>' : "") + "</div>";
    el.scrollTop = 0;
  }
  function open() { css(); idx = 0; render(); document.getElementById("wz-dc").style.display = "block"; track("decouvrir_open"); }
  function close() { var el = document.getElementById("wz-dc"); if (el) el.style.display = "none"; track("decouvrir_close", { card: idx + 1 }); }

  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("#wz-dc-open, #wz-dc [data-dc]");
    if (!t) return;
    e.preventDefault(); e.stopPropagation();
    if (t.id === "wz-dc-open") return open();
    var a = t.getAttribute("data-dc");
    if (a === "next" && idx < CARDS.length - 1) { idx++; return render(); }
    if (a === "prev" && idx > 0) { idx--; return render(); }
    if (a === "close") return close();
  }, true);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { var el = document.getElementById("wz-dc"); if (el && el.style.display === "block") close(); } });

  // le lien « Découvrir Whazup » en haut de « Mon compte » (visible connecté ou non)
  function paint() {
    try {
      var modal = document.querySelector("#account-modal .modal-content");
      if (!modal || document.getElementById("wz-dc-open")) return;
      var hero = modal.querySelector(".account-hero"), b = document.createElement("button");
      css(); b.type = "button"; b.id = "wz-dc-open";
      b.innerHTML = "💡 Découvrir Whazup<small>4 cartes pour tout comprendre en moins d’une minute</small>";
      if (hero && hero.parentNode === modal) modal.insertBefore(b, hero.nextSibling); else modal.appendChild(b);
    } catch (e) {}
  }
  function start() { paint(); setInterval(paint, 2000); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(start, 1500); });
  else setTimeout(start, 1500);
})();
