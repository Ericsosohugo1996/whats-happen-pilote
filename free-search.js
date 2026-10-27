// ---- recherche libre ----
let __searchQuery = "";

const __baseVisibleEventsOriginal = baseVisibleEvents;
baseVisibleEvents = function () {
  const events = __baseVisibleEventsOriginal();
  if (!__searchQuery) return events;
  const fold = function (x) { return String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); };
  const q = fold(__searchQuery);
  // tolère les petites fautes de frappe (« bansky » trouve « Banksy », « picaso » trouve « Picasso »)
  const qw = q.split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 2; });
  function close(a, b) {   // distance d'édition (avec inversion de 2 lettres) <= 1, ou <= 2 pour les mots longs
    const max = a.length >= 7 ? 2 : 1;
    if (Math.abs(a.length - b.length) > max) return false;
    const d = [];
    for (let i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (let j = 0; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      let rowMin = Infinity;
      for (let j = 1; j <= b.length; j++) {
        const c = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + c);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        if (d[i][j] < rowMin) rowMin = d[i][j];
      }
      if (rowMin > max) return false;
    }
    return d[a.length][b.length] <= max;
  }
  return events.filter(function (ev) {
    const hay = fold(ev.title) + " " + fold(ev.category) + " " + fold(ev.description) + " " + fold(ev.place);
    if (hay.includes(q)) return true;
    if (!qw.length) return false;
    const words = ev.__sw || (ev.__sw = (fold(ev.title) + " " + fold(ev.place)).split(/[^a-z0-9]+/).filter(function (w) { return w.length >= 3; }));
    return qw.every(function (w) {
      if (hay.includes(w)) return true;
      if (w.length < 4) return false;
      return words.some(function (x) { return close(w, x); });
    });
  });
};

function __ensureSearchBox() {
  if (document.getElementById("free-search-box")) return;
  const toolbar = document.querySelector(".toolbar");
  if (!toolbar || !toolbar.parentNode) return;
  const wrap = document.createElement("div");
  wrap.id = "free-search-wrap";
  wrap.style.cssText = "margin: 0 16px 12px;";
    wrap.innerHTML =
    '<input type="text" id="free-search-box" data-i18n-placeholder="🔍 Rechercher un événement..." placeholder="🔍 Rechercher un événement..." style="width:100%; padding:11px 14px; border-radius:12px; border:1px solid rgba(0,0,0,0.15); font-size:14px; box-sizing:border-box;">';
  toolbar.parentNode.insertBefore(wrap, toolbar);
  if (typeof applyTranslation === "function") applyTranslation();
  document.getElementById("free-search-box").oninput = function (e) {
    __searchQuery = e.target.value.trim();
    if (__searchQuery && typeof __toggleResultsContent === "function") {
      __hasPickedFilter = true;
      __toggleResultsContent(true);
    }
    renderDiscover();
  };
}

const __renderDiscoverBaseSearch = renderDiscover;
renderDiscover = function () {
  __ensureSearchBox();
  __renderDiscoverBaseSearch();
  const wrap = document.getElementById("free-search-wrap");
  if (wrap) wrap.style.display = typeof __hasPickedCity !== "undefined" && __hasPickedCity ? "" : "none";
  const box = document.getElementById("free-search-box");
  if (box && document.activeElement !== box) box.value = __searchQuery;
};
