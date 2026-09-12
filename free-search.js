// ---- recherche libre ----
let __searchQuery = "";

const __baseVisibleEventsOriginal = baseVisibleEvents;
baseVisibleEvents = function () {
  const events = __baseVisibleEventsOriginal();
  if (!__searchQuery) return events;
  const q = __searchQuery.toLowerCase();
  return events.filter(function (ev) {
    return (
      (ev.title && ev.title.toLowerCase().includes(q)) ||
      (ev.category && ev.category.toLowerCase().includes(q)) ||
      (ev.description && ev.description.toLowerCase().includes(q)) ||
      (ev.place && ev.place.toLowerCase().includes(q))
    );
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
    '<input type="text" id="free-search-box" placeholder="🔍 Rechercher un événement..." style="width:100%; padding:11px 14px; border-radius:12px; border:1px solid rgba(0,0,0,0.15); font-size:14px; box-sizing:border-box;">';
  toolbar.parentNode.insertBefore(wrap, toolbar);
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
