// Fiche d'un événement : bouton « Infos et billets » (site de l'organisateur / billetterie),
// bouton « Appeler » et crédit de la photo. Données fournies par DATAtourisme (licence ouverte).
(function () {
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
        var c = el("div", { id: "wz-ev-credit", textContent: "📷 " + ev.photoCredit }, "font-size:11px;color:#8a8f98;margin:4px 16px 0;");
        hero.parentNode.insertBefore(c, hero.nextSibling);
      }
      var link = safeUrl(ev.link);
      if (!desc || (!link && !ev.phone)) return;
      var box = el("div", { id: "wz-ev-links" }, "display:flex;gap:10px;flex-wrap:wrap;margin:14px 0 4px;");
      if (link) {
        var a = el("a", { href: link, target: "_blank", rel: "noopener noreferrer", textContent: ev.ticket ? "🎟️ Billets et infos" : "ℹ️ Infos sur l’événement" },
          "display:inline-block;background:#6C5CE7;color:#fff;font-weight:800;font-size:14.5px;padding:11px 16px;border-radius:12px;text-decoration:none;");
        box.appendChild(a);
      }
      if (ev.phone && /^[+\d][\d\s().-]{5,}$/.test(ev.phone)) {
        var p = el("a", { href: "tel:" + ev.phone.replace(/[^\d+]/g, ""), textContent: "📞 Appeler" },
          "display:inline-block;border:1.5px solid #6C5CE7;color:#6C5CE7;font-weight:800;font-size:14.5px;padding:10px 16px;border-radius:12px;text-decoration:none;");
        box.appendChild(p);
      }
      desc.parentNode.insertBefore(box, desc.nextSibling);
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
