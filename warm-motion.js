// warm-motion.js — deux finitions douces sur l'accueil :
//  B. chaque rangée glisse et apparaît quand on arrive dessus ;
//  C. le dernier mot des titres de rangée passe en italique orange.
// Rien ne reste caché si le script échoue (tout est révélé après 3 s), et rien ne bouge si l'appareil demande moins d'animations.
// POUR TOUT ANNULER : retirer la ligne <script src="warm-motion.js"> dans index.html.
(function () {
  "use strict";
  var reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  var CSS = [
    "#wz-rows .wzr-h h2 em.wz-em{font-style:italic;font-weight:600;color:#C9482A}",
    "html body #view-discover #wz-rows .wzr-h h2 em.wz-em{color:#E85D3D !important}",
    ".wz-rv{opacity:0;transform:translateY(22px)}",
    ".wz-rv.wz-in{opacity:1;transform:none;transition:opacity .6s ease,transform .6s cubic-bezier(.2,.7,.2,1)}"
  ].join("");
  var st = document.createElement("style"); st.id = "wz-motion-css"; st.textContent = CSS; document.head.appendChild(st);

  var io = null;
  if (!reduce && "IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("wz-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  }

  function emphasise(h2) {
    if (h2.getAttribute("data-wz-em")) return;
    h2.setAttribute("data-wz-em", "1");
    var t = h2.textContent || "";
    var m = t.match(/^(.*\s)(\S+)$/);
    if (!m) return;                       // titre d'un seul mot : on ne touche pas
    h2.textContent = "";
    h2.appendChild(document.createTextNode(m[1]));
    var em = document.createElement("em"); em.className = "wz-em"; em.textContent = m[2];
    h2.appendChild(em);
  }

  function prepare(sec) {
    if (sec.getAttribute("data-wz-rv")) return;
    sec.setAttribute("data-wz-rv", "1");
    if (!io) return;
    var r = sec.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92) return;   // déjà visible : on ne cache rien
    sec.classList.add("wz-rv");
    io.observe(sec);
  }

  function scan() {
    var root = document.getElementById("wz-rows");
    if (!root) return;
    root.querySelectorAll(".wzr-h h2").forEach(emphasise);
    root.querySelectorAll("section.wzr").forEach(prepare);
  }

  function revealAll() {
    document.querySelectorAll(".wz-rv").forEach(function (e) { e.classList.add("wz-in"); });
  }

  function start() {
    scan();
    var root = document.getElementById("wz-rows");
    if (root) { try { new MutationObserver(function () { scan(); }).observe(root, { childList: true, subtree: true }); } catch (e) {} }
    else setTimeout(start, 800);
    setTimeout(revealAll, 3000);          // filet de sécurité
    window.addEventListener("pagehide", revealAll);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();
