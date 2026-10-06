// Fiche d'un événement : bouton « Infos et billets » (site de l'organisateur / billetterie),
// bouton « Appeler » et crédit de la photo. Données fournies par DATAtourisme (licence ouverte).
(function () {
  // fond blanc (au lieu du dégradé crème), cartes d'info bien détachées
  try {
    var st = document.createElement("style");
    st.id = "wz-white-css";
    st.textContent = "body{background:#fff!important}" +
      "@media (min-width:600px){body{background:#eef0f4!important}}" +
      ".info-card{background:#fff!important;border:1px solid #E5E7EB;box-shadow:0 6px 18px -10px rgba(20,33,61,.18)}" +
      ".action-tile{background:#fff!important;border:1px solid #E5E7EB!important}" +
      ".event-card:active{background:#f6f7f9!important}";
    document.head.appendChild(st);
  } catch (e) {}
  // thème clair : feuille de style séparée (séjour, bienvenue, accueil, compte, boutons…)
  try {
    if (!document.getElementById("wz-light-css")) {
      var lk = document.createElement("link");
      lk.id = "wz-light-css"; lk.rel = "stylesheet"; lk.href = "light-theme.css";
      document.head.appendChild(lk);
    }
  } catch (e) {}
  // écran d'arrivée clair : fichier séparé (le supprimer sur GitHub = retour à l'ancien look)
  try {
    if (!document.getElementById("wz-arrival-light-js")) {
      var sc = document.createElement("script");
      sc.id = "wz-arrival-light-js"; sc.src = "arrival-light.js";
      document.head.appendChild(sc);
    }
    if (!document.getElementById("wz-screens-light-js")) {
      var sc2 = document.createElement("script");
      sc2.id = "wz-screens-light-js"; sc2.src = "screens-light.js";
      document.head.appendChild(sc2);
    }
  } catch (e) {}
  function safeUrl(u) { return /^https?:\/\/[^\s"'<>]+$/i.test(String(u || "")) ? u : ""; }
  function el(tag, props, css) { var e = document.createElement(tag); if (props) Object.keys(props).forEach(function (k) { e[k] = props[k]; }); if (css) e.style.cssText = css; return e; }
  function decorate(id) {
    try {
      var old = document.getElementById("wz-ev-links"); if (old) old.remove();
      var oldC = document.getElementById("wz-ev-credit"); if (oldC) oldC.remove();
      var ev = (typeof allEvents === "function" ? allEvents() : []).find(function (e) { return e.id === id; });
      if (!ev) return;
      var desc = document.getElementById("detail-desc");
      var hero = document.getElementById("detail-hero");
      if (hero && ev.photo && ev.photoCredit) {
        hero.style.position = "relative";
        var c = el("span", { id: "wz-ev-credit", textContent: "📷 " + ev.photoCredit },
          "position:absolute;right:10px;bottom:10px;background:rgba(20,16,40,.62);color:#fff;font-size:11px;font-weight:600;padding:3px 9px;border-radius:999px;max-width:80%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;");
        hero.appendChild(c);
      }
      var link = safeUrl(ev.link);
      var hasPhone = ev.phone && /^[+\d][\d\s().-]{5,}$/.test(ev.phone);
      if (!desc || (!link && !hasPhone)) return;
      var box = el("div", { id: "wz-ev-links" }, "display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin:14px 0 6px;");
      if (link && ev.ticket) {
        box.appendChild(el("a", { href: link, target: "_blank", rel: "noopener noreferrer", textContent: "🎟️ Réserver ma place" },
          "display:inline-block;background:linear-gradient(135deg,#F2C879,#E85D3D);color:#fff;font-weight:800;font-size:14.5px;padding:11px 16px;border-radius:12px;box-shadow:0 8px 18px -8px rgba(232,93,61,.6);text-decoration:none;"));
      }
      if (hasPhone) {
        box.appendChild(el("a", { href: "tel:" + ev.phone.replace(/[^\d+]/g, ""), textContent: "📞 Appeler" },
          "display:inline-block;border:1.5px solid #14213D;color:#14213D;font-weight:800;font-size:14.5px;padding:10px 16px;border-radius:12px;text-decoration:none;"));
      }
      if (link && !ev.ticket) {
        box.appendChild(el("a", { href: link, target: "_blank", rel: "noopener noreferrer", textContent: "Site de l’organisateur ↗" },
          "font-size:12.5px;color:#8a8f98;text-decoration:underline;padding:4px 2px;"));
      }
      var card = document.querySelector("#view-detail .info-card");
      if (card && card.parentNode) card.parentNode.insertBefore(box, card.nextSibling);
      else desc.parentNode.insertBefore(box, desc.nextSibling);
    } catch (e) {}
  }
  function wrap() {
    if (typeof window.openDetail !== "function" || window.openDetail.__wzLinks) return;
    var orig = window.openDetail;
    var w = function (id) { var r = orig.apply(this, arguments); setTimeout(function () { decorate(id); }, 0); return r; };
    w.__wzLinks = true;
    window.openDetail = w;
  }
  wrap();
  document.addEventListener("DOMContentLoaded", wrap);
  setTimeout(wrap, 1500);
  window.__wzEventLinks = decorate;
})();
