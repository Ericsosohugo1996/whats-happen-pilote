// Whazup — écrans secondaires en version claire (amis, souvenirs, passeport, nouveautés, explorer, choix de ville).
// Pour revenir à l'ancien look : supprimer ce fichier sur GitHub.
(function () {
  "use strict";
  var ROOTS = ["friends-screen", "souvenirs-screen", "passport-screen", "newfinds-overlay", "explore-city-picker-overlay", "souvenir-modal", "souvenir-detail-modal", "explore-overlay", "quest-overlay", "propose-outing-modal"];
  var NAVY = "#14213D", GREY = "#4B5563", LINE = "#E5E7EB", SOFT = "#F7F8FA";

  function parse(c) {
    var m = /rgba?\(([^)]+)\)/.exec(c || "");
    if (!m) return null;
    var p = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  }
  function lum(c) { return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255; }
  function sat(c) { return (Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b)) / 255; }

  // luminance du fond "effectif" derrière un élément (0 = sombre/photo, 1 = blanc)
  function behind(el, root) {
    if (root.__wzBase === "photo" && el.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop < 235 && !el.closest("#explore-result")) return 0;
    for (var n = el; n; n = n.parentElement) {
      var cs = getComputedStyle(n);
      if (n !== root && (cs.backgroundImage !== "none")) return 0;
      var c = parse(cs.backgroundColor);
      if (c && c.a > 0.5) return lum(c);
      if (n === root) return n.__wzBase === "photo" ? 0 : 1;
    }
    return 1;
  }

  function lightenRoot(root) {
    if (!root) return;
    var cs0 = getComputedStyle(root);
    if (!root.__wzInit) {
      root.__wzInit = 1;
      var m = /url\(["']?([^"')]+)["']?\)/.exec(root.getAttribute("style") || "");
      var bc0 = parse(cs0.backgroundColor); var isModal = !!(bc0 && bc0.a > 0.2 && bc0.r === 0 && bc0.g === 0 && bc0.b === 0);
      if (isModal) { root.__wzBase = "modal"; }
      else if (m && root.id === "explore-overlay") {
        root.__wzBase = "photo";
        root.style.setProperty("background", "linear-gradient(180deg,rgba(12,18,36,.62) 0%,rgba(12,18,36,.4) 150px,rgba(255,255,255,0) 240px) top/100% 260px no-repeat local,url('" + m[1] + "') top center/100% 260px no-repeat local,#fff", "important");
      } else {
        root.__wzBase = "white";
        root.style.setProperty("background", "linear-gradient(180deg,#fff 0%,#F7F8FA 100%)", "important");
      }
    }
    var photoTop = root.__wzBase === "photo";
    var els = root.querySelectorAll("*");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.tagName === "IMG" || el.tagName === "svg" || el.closest("svg") || el.closest(".leaflet-container")) continue;
      var cs = getComputedStyle(el);
      var bg = parse(cs.backgroundColor), hasImg = cs.backgroundImage !== "none";
      // fonds
      if (!hasImg && bg && bg.a > 0.02 && !(root.id === "quest-overlay" && el.tagName === "BUTTON")) {
        var isBtn = el.tagName === "BUTTON" || el.getAttribute("role") === "button";
        if (bg.r > 235 && bg.g > 235 && bg.b > 235 && bg.a < 0.5) {
          el.style.setProperty("background", SOFT, "important");
        } else if (lum(bg) < 0.28 && bg.a > 0.4 && !isBtn && sat(bg) < 0.45 && behind(el.parentElement, root) > 0.6) {
          el.style.setProperty("background", "#fff", "important");
          el.style.setProperty("box-shadow", "0 6px 16px -12px rgba(20,33,61,.35)", "important");
        } else if (bg.a < 0.3 && sat(bg) > 0.3 && !isBtn) {
          // teintes violettes/orangées transparentes : on garde
        }
      }
      // bordures claires -> gris clair
      var bc = parse(cs.borderTopColor);
      if (bc && bc.a > 0 && cs.borderTopWidth !== "0px" && bc.r > 200 && bc.g > 200 && bc.b > 200 && behind(el, root) > 0.6) {
        el.style.setProperty("border-color", LINE, "important");
      }
      // textes clairs sur fond clair -> bleu marine / gris
      var col = parse(cs.color);
      if (col && col.a > 0.2 && behind(el, root) > 0.6) {
        var L = lum(col);
        if (L > 0.72 && sat(col) < 0.35) el.style.setProperty("color", NAVY, "important");
        else if (L > 0.5 && sat(col) < 0.35) el.style.setProperty("color", GREY, "important");
      }
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT") {
        el.style.setProperty("color", NAVY, "important");
      }
    }
  }

  var queued = false;
  function scan() {
    queued = false;
    ROOTS.forEach(function (id) { lightenRoot(document.getElementById(id)); });
  }
  function queue() { if (!queued) { queued = true; setTimeout(scan, 60); } }
  new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true });
  queue();
})();
