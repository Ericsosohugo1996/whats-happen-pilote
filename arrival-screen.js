// ---- écran d'arrivée : 3 bonhommes juste après "Je me localise" ----

const MASCOT_NEUTRAL_SVG =
  '<svg width="72" height="72" viewBox="0 0 200 220">' +
  '<path d="M100 20 C 62 20 34 50 34 88 C 34 116 60 142 82 162 L100 178 L118 162 C 140 142 166 116 166 88 C 166 50 138 20 100 20 Z" fill="#fff"></path>' +
  '<circle class="eye-l" cx="78" cy="92" r="9" fill="#14213D"></circle>' +
  '<circle class="eye-r" cx="122" cy="92" r="9" fill="#14213D"></circle>' +
  '<path class="mouth" d="M74 116 Q100 138 126 116" fill="none" stroke="#14213D" stroke-width="6" stroke-linecap="round"></path>' +
  "</svg>";

function __arrivalWink(svgEl) {
  const eyeR = svgEl.querySelector(".eye-r");
  if (eyeR) {
    eyeR.outerHTML =
      '<path class="eye-r" d="M110 92 Q122 86 134 92" fill="none" stroke="#14213D" stroke-width="6" stroke-linecap="round"></path>';
  }
  const mouth = svgEl.querySelector(".mouth");
  if (mouth) mouth.setAttribute("d", "M74 118 C 86 132 114 132 126 118");
}

function __arrivalWeatherText() {
  const el = document.getElementById("weather-mini");
  return el && el.textContent.trim() ? el.textContent.trim() : "";
}

// ---- Bonhomme 1 : explorer par catégorie, triable distance/note ----

const EXPLORE_CATEGORIES = [
  { key: "Bar", label: "🍸 Bar" },
  { key: "À voir", label: "🏛️ Visite" },
  { key: "Musique", label: "🎵 Musique" },
  { key: "Marché", label: "🛍️ Marché" },
  { key: "Festival", label: "🎉 Festival" },
  { key: "Brocante", label: "📦 Brocante" },
];

let __exploreSortMode = "distance";
let __exploreShowAll = false;
let __exploreCurrentCategory = "Bar";

function __exploreGetCandidates(category) {
  const ref = referencePoint();
  const cityKey = state.userPos ? nearestCityKey() : state.city;
  return allEvents()
    .filter(function (ev) {
      return ev.city === cityKey && ev.category === category && ev.lat && ev.lng;
    })
    .map(function (ev) {
      return { ev: ev, dist: haversineKm(ref.lat, ref.lng, ev.lat, ev.lng) };
    });
}
function __exploreShowMap() {
  const ref = referencePoint();
  const cityKey = state.userPos ? nearestCityKey() : state.city;
  const allNearby = allEvents().filter(function (ev) {
    return ev.city === cityKey && ev.lat && ev.lng;
  });

  const resultEl = document.getElementById("explore-result");
  const moreBtn = document.getElementById("explore-more-btn");
  moreBtn.style.display = "none";
  resultEl.style.padding = "0";
  resultEl.innerHTML = '<div id="explore-leaflet-map" style="width:100%; height:340px; border-radius:16px; overflow:hidden;"></div>';

  setTimeout(function () {
    const map = L.map("explore-leaflet-map").setView([ref.lat, ref.lng], 15);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
      maxZoom: 19,
    }).addTo(map);

    L.circle([ref.lat, ref.lng], { radius: 1000, color: "#c1440e", fillOpacity: 0.08, weight: 1.5, dashArray: "4 4" }).addTo(map);
    L.circleMarker([ref.lat, ref.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#14213D", fillOpacity: 1 }).addTo(map);

    const catEmoji = { Bar: "🍸", "À voir": "🏛️", Musique: "🎵", Marché: "🛍️", Festival: "🎉", Brocante: "📦" };
    allNearby.forEach(function (ev) {
      const dist = haversineKm(ref.lat, ref.lng, ev.lat, ev.lng);
      if (dist > 1.2) return;
      const emoji = catEmoji[ev.category] || "📍";
      const icon = L.divIcon({
        html: '<div style="background:#fff; border-radius:50%; width:28px; height:28px; display:flex; align-items:center; justify-content:center; font-size:14px; box-shadow:0 2px 6px rgba(0,0,0,0.3);">' + emoji + "</div>",
        className: "",
        iconSize: [28, 28],
      });
      L.marker([ev.lat, ev.lng], { icon: icon })
        .addTo(map)
        .on("click", function () {
          const exploreOv = document.getElementById("explore-overlay");
          if (exploreOv) exploreOv.remove();
          openDetail(ev.id);
        });
    });
  }, 50);
}
function __exploreRender() {
  let list = __exploreGetCandidates(__exploreCurrentCategory);
  if (__exploreSortMode === "rating") {
    list = list.slice().sort(function (a, b) {
      return (b.ev.rating || 0) - (a.ev.rating || 0);
    });
  } else {
    list = list.slice().sort(function (a, b) {
      return a.dist - b.dist;
    });
  }
  const shown = __exploreShowAll ? list : list.slice(0, 3);
  const resultEl = document.getElementById("explore-result");
  const moreBtn = document.getElementById("explore-more-btn");
  if (!list.length) {
    resultEl.innerHTML =
      '<p style="padding:16px 0; color:#888; font-size:13px;">Rien trouvé dans cette catégorie pour le moment.</p>';
    moreBtn.style.display = "none";
    return;
  }
  resultEl.innerHTML = shown
    .map(function (item, i) {
      const metaTxt =
        __exploreSortMode === "rating" && item.ev.rating
          ? "⭐ " + item.ev.rating
          : item.dist.toFixed(1).replace(".", ",") + " km";
      return (
        '<button class="explore-pick" data-id="' +
        item.ev.id +
        '" style="display:flex; justify-content:space-between; align-items:center; width:100%; text-align:left; background:none; border:none; padding:10px 0; cursor:pointer;' +
        (i > 0 ? "border-top:1px solid #eee;" : "") +
        '">' +
        '<span style="font-size:13px; font-weight:600; color:#14213D;">' +
        item.ev.title +
        "</span>" +
        '<span style="font-size:11px; color:#c0392b; font-weight:600;">' +
        metaTxt +
        "</span>" +
        "</button>"
      );
    })
    .join("");
  resultEl.querySelectorAll(".explore-pick").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const exploreOv = document.getElementById("explore-overlay");
      if (exploreOv) exploreOv.remove();
      openDetail(btn.dataset.id);
    });
  });
  const remaining = list.length - shown.length;
  if (remaining > 0 && !__exploreShowAll) {
    moreBtn.style.display = "block";
    moreBtn.textContent = "Voir plus (" + remaining + " autres)";
  } else {
    moreBtn.style.display = "none";
  }
}

function __exploreOpen() {
  __exploreMapMode = false;  
  __exploreShowAll = false;
  __exploreSortMode = "distance";
  __exploreCurrentCategory = "Bar";
  const cityKey = state.userPos ? nearestCityKey() : state.city;
  const cityName = CITIES[cityKey] ? CITIES[cityKey].name : "";
  const cityPhoto = CITY_PHOTOS[cityKey] || "";
  const overlay = document.createElement("div");
  overlay.id = "explore-overlay";
  overlay.style.cssText =
    "position:fixed; inset:0; background:rgba(20,33,61,0.6); z-index:9999; display:flex; align-items:flex-end; justify-content:center;";

  overlay.innerHTML =
    '<div style="background:#14213D; border-radius:28px 28px 0 0; padding:24px 20px 28px; width:100%; max-width:420px; box-sizing:border-box; max-height:85vh; overflow-y:auto;">' +
    '<button id="explore-back" style="display:block; margin:0 0 14px; padding:8px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:12px; cursor:pointer;">← Retour aux 3 choix</button>' +
    '<div id="explore-cats" style="display:flex; gap:6px; overflow-x:auto; margin-bottom:12px; padding-bottom:2px;"></div>' +
    '<div style="display:flex; gap:8px; margin-bottom:14px;">' +
    '<div id="explore-sorts" style="display:flex; gap:6px; flex:1;"></div>' +
    '<button id="explore-map-toggle" style="padding:9px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap;">🗺️ Carte</button>' +
    "</div>" +
    '<div id="explore-result" style="background:#fff; border-radius:16px; padding:0 14px;"></div>' +
    '<button id="explore-more-btn" style="display:none; margin-top:10px; width:100%; padding:10px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:12px; cursor:pointer;"></button>' +
    '<button id="explore-close" style="width:100%; margin-top:16px; padding:12px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:13px; cursor:pointer;">Fermer</button>' +
    "</div>";

  document.body.appendChild(overlay);
  overlay.addEventListener("click", function (e) {
      if (e.target === overlay) overlay.remove();
    if (e.target.id === "explore-close" && !__exploreOnMap) overlay.remove();
  });
  document.getElementById("explore-back").addEventListener("click", function () {
    overlay.remove();
    __arrivalShow();
  });

  const catsWrap = document.getElementById("explore-cats");
  EXPLORE_CATEGORIES.forEach(function (c, i) {
    const btn = document.createElement("button");
    btn.textContent = c.label;
    btn.style.cssText =
      "flex:0 0 auto; padding:8px 12px; border-radius:999px; border:1px solid " +
      (i === 0 ? "#fff" : "rgba(255,255,255,0.3)") +
      "; background:" +
      (i === 0 ? "#fff" : "transparent") +
      "; color:" +
      (i === 0 ? "#14213D" : "#fff") +
      "; font-size:11.5px; font-weight:600; white-space:nowrap; cursor:pointer;";
    btn.addEventListener("click", function () {
      __exploreCurrentCategory = c.key;
      __exploreShowAll = false;
      Array.from(catsWrap.children).forEach(function (b) {
        b.style.background = "transparent";
        b.style.color = "#fff";
        b.style.border = "1px solid rgba(255,255,255,0.3)";
      });
      btn.style.background = "#fff";
      btn.style.color = "#14213D";
      btn.style.border = "1px solid #fff";
      __exploreRender();
    });
    catsWrap.appendChild(btn);
  });

  const sortsWrap = document.getElementById("explore-sorts");
  const sortOptions = [
    { key: "distance", label: "📍 Plus proche" },
    { key: "rating", label: "⭐ Mieux notés" },
  ];
  sortOptions.forEach(function (s, i) {
    const btn = document.createElement("button");
    btn.textContent = s.label;
    btn.style.cssText =
      "flex:1; padding:9px 4px; border-radius:10px; border:" +
      (i === 0 ? "none" : "1px solid rgba(255,255,255,0.3)") +
      "; background:" +
      (i === 0 ? "#fff" : "transparent") +
      "; color:" +
      (i === 0 ? "#14213D" : "#fff") +
      "; font-size:12px; font-weight:600; cursor:pointer;";
    btn.addEventListener("click", function () {
      __exploreSortMode = s.key;
      __exploreShowAll = false;
      Array.from(sortsWrap.children).forEach(function (b) {
        b.style.background = "transparent";
        b.style.color = "#fff";
        b.style.border = "1px solid rgba(255,255,255,0.3)";
      });
      btn.style.background = "#fff";
      btn.style.color = "#14213D";
      btn.style.border = "none";
      __exploreRender();
    });
    sortsWrap.appendChild(btn);
  });
  let __exploreOnMap = false;
  document.getElementById("explore-map-toggle").addEventListener("click", function () {
    __exploreOnMap = !__exploreOnMap;
    const toggleBtn = document.getElementById("explore-map-toggle");
       if (__exploreOnMap) {
      toggleBtn.textContent = "☰ Liste";
      toggleBtn.style.background = "#fff";
      toggleBtn.style.color = "#14213D";
      document.getElementById("explore-cats").style.display = "none";
      document.getElementById("explore-sorts").style.display = "none";
      document.getElementById("explore-result").style.background = "transparent";
      const closeBtn = document.getElementById("explore-close");
      closeBtn.textContent = "☰ Retour à la liste";
            closeBtn.onclick = function (e) {
        e.stopPropagation();
        toggleBtn.click();
      };
      __exploreShowMap();
    } else {
      toggleBtn.textContent = "🗺️ Carte";
      toggleBtn.style.background = "transparent";
      toggleBtn.style.color = "#fff";
      document.getElementById("explore-cats").style.display = "flex";
      document.getElementById("explore-sorts").style.display = "flex";
      document.getElementById("explore-result").style.background = "#fff";
          document.getElementById("explore-result").style.padding = "0 14px";
      const closeBtn2 = document.getElementById("explore-close");
      closeBtn2.textContent = "Fermer";
          closeBtn2.onclick = null;
      setTimeout(__exploreRender, 100); 
    }
  });
  document.getElementById("explore-more-btn").addEventListener("click", function () {
    __exploreShowAll = true;
    __exploreRender();
  });

  __exploreRender();
}

// ---- Bonhomme 2 : ambiance puis idées multiples (réutilise le Mode Escale) ----

function __arrivalOpenMood() {
  __layoverOpen();
  setTimeout(function () {
    const notConvinced = document.getElementById("layover-not-convinced");
    if (notConvinced) notConvinced.click();
    const backRow = document.getElementById("layover-pref-chips");
    if (backRow && backRow.parentElement) {
      const back = document.createElement("button");
      back.textContent = "← Retour aux 3 choix";
      back.style.cssText =
        "display:block; margin:14px auto 0; padding:8px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:12px; cursor:pointer;";
      back.addEventListener("click", function () {
        const ov = document.getElementById("layover-overlay");
        if (ov) ov.remove();
        __arrivalShow();
      });
      backRow.parentElement.appendChild(back);
    }
 }, 400);
}

// ---- Bonhomme 3 : vue "ville" avec la ville détectée ----

function __arrivalShowCityView() {
  if (state.userPos) state.city = nearestCityKey();
  renderDiscover();
  __ensureArrivalBackButton();
}

function __ensureArrivalBackButton() {
  if (document.getElementById("arrival-back-floating")) return;
  const btn = document.createElement("button");
  btn.id = "arrival-back-floating";
  btn.textContent = "🛬";
  btn.title = "Revenir à l'écran d'arrivée";
  btn.style.cssText =
    "position:fixed; bottom:20px; right:20px; width:52px; height:52px; border-radius:50%; border:none; background:#14213D; color:#fff; font-size:22px; box-shadow:0 4px 12px rgba(0,0,0,0.25); z-index:9000; cursor:pointer;";
  btn.addEventListener("click", function () {
    btn.remove();
    __arrivalShow();
  });
  document.body.appendChild(btn);
}

// ---- écran principal des 3 bonhommes ----

function __arrivalShow() {
  const existing = document.getElementById("arrival-screen-overlay");
  if (existing) existing.remove();
  const floating = document.getElementById("arrival-back-floating");
  if (floating) floating.remove();

  const now = new Date();
  const cityKey = state.userPos ? nearestCityKey() : state.city;
  const cityName = CITIES[cityKey] ? CITIES[cityKey].name : "";
  const time = now.getHours() + "h" + String(now.getMinutes()).padStart(2, "0");
  const weatherText = __arrivalWeatherText();

  const overlay = document.createElement("div");
  overlay.id = "arrival-screen-overlay";
  overlay.style.cssText =
    "position:fixed; inset:0; background:#14213D; z-index:9998; display:flex; flex-direction:column; align-items:center; padding:50px 20px 20px; overflow-y:auto;";

  overlay.innerHTML =
    '<div style="text-align:center; color:#fff; margin-bottom:32px; font-size:17px; line-height:1.5;">' +
    "Vous êtes à <b>" +
    cityName +
    "</b>, il est <b>" +
    time +
    "</b>" +
    (weatherText ? "<br>et il fait " + weatherText.replace(/^\s*/, "") : "") +
    "</div>" +
    '<div style="display:flex; gap:24px; justify-content:center;">' +
    '<div class="arrival-opt" data-key="near" style="text-align:center; cursor:pointer;">' +
    '<div class="arrival-svg-wrap">' +
    MASCOT_NEUTRAL_SVG +
    "</div>" +
    '<div style="color:#fff; font-size:12.5px; margin-top:8px; font-weight:600;">Autour de moi</div>' +
    "</div>" +
    '<div class="arrival-opt" data-key="other" style="text-align:center; cursor:pointer;">' +
    '<div class="arrival-svg-wrap">' +
    MASCOT_NEUTRAL_SVG +
    "</div>" +
    '<div style="color:#fff; font-size:12.5px; margin-top:8px; font-weight:600;">Une autre idée</div>' +
    "</div>" +
    '<div class="arrival-opt" data-key="all" style="text-align:center; cursor:pointer;">' +
    '<div class="arrival-svg-wrap">' +
    MASCOT_NEUTRAL_SVG +
    "</div>" +
    '<div style="color:#fff; font-size:12.5px; margin-top:8px; font-weight:600;">Tout voir</div>' +
    "</div>" +
    "</div>";

  document.body.appendChild(overlay);

  overlay.querySelectorAll(".arrival-opt").forEach(function (opt) {
    opt.addEventListener("click", function () {
      const svg = opt.querySelector("svg");
      __arrivalWink(svg);
      const key = opt.dataset.key;
      setTimeout(function () {
        overlay.remove();
        if (key === "near") __exploreOpen();
        else if (key === "other") __arrivalOpenMood();
        else if (key === "all") __arrivalShowCityView();
      }, 320);
    });
  });
}

function __arrivalShowSearching() {
  const overlay = document.createElement("div");
  overlay.id = "arrival-searching-overlay";
  overlay.style.cssText =
    "position:fixed; inset:0; background:#14213D; z-index:9998; display:flex; flex-direction:column; align-items:center; justify-content:center;";
  overlay.innerHTML =
    '<div id="arrival-searching-wrap" style="display:flex; flex-direction:column; align-items:center; gap:12px; animation:arrivalBounce 1s ease-in-out infinite;">' +
   '<svg width="72" height="72" viewBox="0 0 200 220"><path d="M100 20 C 62 20 34 50 34 88 C 34 116 60 142 82 162 L100 178 L118 162 C 140 142 166 116 166 88 C 166 50 138 20 100 20 Z" fill="#fff"></path><circle cx="78" cy="92" r="9" fill="#14213D"></circle><circle cx="122" cy="92" r="9" fill="#14213D"></circle><path d="M74 116 Q100 138 126 116" fill="none" stroke="#14213D" stroke-width="6" stroke-linecap="round"></path></svg>' +
    '<span style="color:#fff; font-size:13px; font-weight:600;">📍 Recherche de votre position...</span>' +
    "</div>";
  document.body.appendChild(overlay);
  if (!document.getElementById("arrival-searching-style")) {
    const styleTag = document.createElement("style");
    styleTag.id = "arrival-searching-style";
    styleTag.textContent =
      "@keyframes arrivalBounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);}}";
    document.head.appendChild(styleTag);
  }
}

const __choiceLocateBase = document.getElementById("choice-locate");
if (__choiceLocateBase) {
  __choiceLocateBase.addEventListener("click", function () {
    __arrivalShowSearching();
    let __arrivalWaited = 0;
    const __arrivalWaitInterval = setInterval(function () {
      __arrivalWaited += 200;
      if (state.userPos || __arrivalWaited >= 8000) {
        clearInterval(__arrivalWaitInterval);
        const searchingOv = document.getElementById("arrival-searching-overlay");
        if (searchingOv) searchingOv.remove();
        __arrivalShow();
      }
    }, 200);
  });
}
