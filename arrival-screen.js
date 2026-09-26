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

let __exploreSortMode = "distance";
// ---- Bonhomme 1 : explorer par catégorie, triable distance/note ----

const EXPLORE_CATEGORIES = [
{ key: "", label: "Tout" },
{ key: "Musique", label: "🎵 Musique" },
{ key: "Marché", label: "🛍️ Marché" },
{ key: "Festival", label: "🎉 Festival" },
{ key: "Soirée", label: "🎟️ Culture" },
{ key: "Sport", label: "⚽ Sport" },
{ key: "Expo", label: "🖼️ Expo" },
{ key: "À voir", label: "🏛️ Musées" },
{ key: "Bar", label: "🍸 Bars" },
{ key: "Brocante", label: "📦 Brocante" },
];
let __exploreShowAll = false;
let __exploreCurrentCategory = "";
let __exploreTimeMode = "now";

// ---- recherche par état d'esprit (bars) ----
let __exploreMoodQuery = "";

const __MOOD_SYNONYMS = {
  calme: ["calme", "tranquille", "intimiste", "feutré", "feutree", "cosy", "détente", "detente", "lounge", "discret", "discrète", "discrete", "doux", "douce"],
  festif: ["festif", "festive", "animée", "animee", "dansant", "danser", "concerts", "concert", "musique", "rooftop", "soirée", "soiree", "energique", "énergique", "fête", "fete"],
  rencontre: ["rencontre", "rencontrer", "conviviale", "convivial", "chaleureuse", "chaleureux", "décontractée", "decontractee", "décontracté", "decontracte", "quartier", "populaire", "accueillant", "esprit", "sociable", "afterwork"],
};

// ---- le "style" d'un lieu (cocktail, biere, vin, rooftop, dansant, jeux, live)
// donne un signal fiable même quand la description est courte ----
const __MOOD_STYLE_BONUS = {
  calme: ["vin", "cocktail"],
  festif: ["dansant", "live", "rooftop"],
  rencontre: ["biere", "jeux", "vin"],
};

function __moodScoreForEvent(ev, query) {
  if (!query) return 0;
  const text = [ev.title, ev.description, ev.style, ev.category, ev.scene]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 0;

  let score = 0;
  const qWords = q.split(/\s+/).filter(Boolean);

  qWords.forEach(function (w) {
    if (text.indexOf(w) !== -1) score += 3;
  });

  let matchedGroup = null;
  Object.keys(__MOOD_SYNONYMS).forEach(function (moodKey) {
    const synonyms = __MOOD_SYNONYMS[moodKey];
    const queryMatchesMood = synonyms.some(function (s) { return q.indexOf(s) !== -1; });
    if (queryMatchesMood) {
      matchedGroup = moodKey;
      synonyms.forEach(function (s) {
        if (text.indexOf(s) !== -1) score += 2;
      });
    }
  });

  if (matchedGroup && ev.style && __MOOD_STYLE_BONUS[matchedGroup] && __MOOD_STYLE_BONUS[matchedGroup].indexOf(ev.style) !== -1) {
    score += 3;
  }

  return score;
}

function __exploreGetCandidates(category) {
const ref = referencePoint();
const cityKey = state.userPos ? nearestCityKey() : state.city;
const now = new Date();
const todayIso = now.toISOString().slice(0, 10);
const tomorrowIso = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const timeMode = (typeof __exploreTimeMode !== "undefined") ? __exploreTimeMode : "now";
return allEvents()
.filter(function (ev) {
if (ev.city !== cityKey || !ev.lat || !ev.lng) return false;
if (category && ev.category !== category) return false;
if (ev.isPlace) return true;
if (!ev.date) return false;
if (ev.date < todayIso) return false;
if (timeMode === "now") {
if (ev.date !== todayIso) return false;
} else if (timeMode === "tonight") {
if (ev.date !== todayIso) return false;
if (ev.time) {
const h = parseInt(ev.time.split(":")[0], 10);
if (!(h >= 18 || h < 4)) return false;
}
} else if (timeMode === "tomorrow") {
if (ev.date !== tomorrowIso) return false;
}
return true;
})
.map(function (ev) {
return { ev: ev, dist: haversineKm(ref.lat, ref.lng, ev.lat, ev.lng), datePriority: ev.isPlace ? 1 : (ev.date === todayIso ? 0 : 1) };
});
}
function __exploreShowMap() {
const ref = referencePoint();
const cityKey = state.userPos ? nearestCityKey() : state.city;
let allNearby = allEvents().filter(function (ev) {
return ev.city === cityKey && ev.lat && ev.lng;
});
if (__exploreCurrentCategory) {
allNearby = allNearby.filter(function (ev) { return ev.category === __exploreCurrentCategory; });
}

const resultEl = document.getElementById("explore-result");
const moreBtn = document.getElementById("explore-more-btn");
moreBtn.style.display = "none";
resultEl.style.padding = "0";
resultEl.innerHTML =
'<div id="explore-leaflet-map" style="width:100%; height:300px; border-radius:16px; overflow:hidden;"></div>' +
'<div id="explore-map-cats" style="display:flex; flex-wrap:wrap; gap:14px; justify-content:center; padding:16px 10px 8px;"></div>';

const catsWrap = document.getElementById("explore-map-cats");
EXPLORE_CATEGORIES.filter(function (c) { return c.key; }).forEach(function (c) {
const btn = document.createElement("button");
const color = (typeof CATEGORY_COLORS !== "undefined" && CATEGORY_COLORS[c.key]) || "#6C757D";
const emoji = (typeof CATEGORY_ICONS !== "undefined" && CATEGORY_ICONS[c.key]) || "📍";
const active = __exploreCurrentCategory === c.key;
const labelText = c.label.replace(/^\S+\s*/, "");
btn.style.cssText = "background:none; border:none; display:flex; flex-direction:column; align-items:center; gap:5px; cursor:pointer; width:56px;";
btn.innerHTML =
'<span style="width:46px; height:46px; border-radius:50%; background:' + color + '; display:flex; align-items:center; justify-content:center; font-size:20px;' + (active ? " box-shadow:0 0 0 3px rgba(20,33,61,0.5);" : "") + '">' + emoji + '</span>' +
'<span style="font-size:10px; color:#333; font-weight:600; text-align:center;">' + labelText + '</span>';
btn.addEventListener("click", function () {
__exploreCurrentCategory = active ? "" : c.key;
__exploreShowAll = false;
__exploreShowMap();
});
catsWrap.appendChild(btn);
});

setTimeout(function () {
const map = L.map("explore-leaflet-map").setView([ref.lat, ref.lng], 15);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
attribution: "© OpenStreetMap",
maxZoom: 19,
}).addTo(map);

L.circle([ref.lat, ref.lng], { radius: 1000, color: "#c1440e", fillOpacity: 0.08, weight: 1.5, dashArray: "4 4" }).addTo(map);
L.circleMarker([ref.lat, ref.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#14213D", fillOpacity: 1 }).addTo(map);

allNearby.forEach(function (ev) {
const dist = haversineKm(ref.lat, ref.lng, ev.lat, ev.lng);
if (dist > 1.2) return;
const emoji = (typeof CATEGORY_ICONS !== "undefined" && CATEGORY_ICONS[ev.category]) || "📍";
const pinColor = (typeof CATEGORY_COLORS !== "undefined" && CATEGORY_COLORS[ev.category]) || "#6C757D";
const icon = L.divIcon({
html:
'<div style="position:relative; width:32px; height:40px;">' +
'<div style="width:30px; height:30px; border-radius:50% 50% 50% 0; background:' + pinColor + '; transform:rotate(-45deg); border:2.5px solid #fff; box-shadow:0 3px 6px rgba(0,0,0,0.4); position:absolute; top:0; left:1px;"></div>' +
'<div style="position:absolute; top:0; left:1px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; font-size:14px;">' + emoji + '</div>' +
"</div>",
className: "",
iconSize: [32, 40],
iconAnchor: [16, 40],
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
  const moodEligible = __exploreCurrentCategory === "Bar";
  const moodQuery = (typeof __exploreMoodQuery !== "undefined") ? __exploreMoodQuery.trim() : "";
  if (moodEligible && moodQuery) {
    list.forEach(function (item) {
      item.moodScore = __moodScoreForEvent(item.ev, moodQuery);
    });
    list = list.filter(function (item) { return item.moodScore > 0; });
    list = list.slice().sort(function (a, b) {
      if (b.moodScore !== a.moodScore) return b.moodScore - a.moodScore;
      return a.dist - b.dist;
    });
  } else {
    list = list.slice().sort(function (a, b) {
      if (a.datePriority !== b.datePriority) return a.datePriority - b.datePriority;
      return a.dist - b.dist;
    });
  }
  const shown = __exploreShowAll ? list : list.slice(0, 3);
  const resultEl = document.getElementById("explore-result");
  const moreBtn = document.getElementById("explore-more-btn");
  if (!list.length) {
    resultEl.innerHTML =
      '<p style="padding:16px 0; color:#888; font-size:13px;">' +
      (moodEligible && moodQuery ? "Aucun résultat pour cette ambiance, essayez une autre recherche." : "Rien trouvé dans cette catégorie pour le moment.") +
      "</p>";
    moreBtn.style.display = "none";
    return;
  }
  resultEl.innerHTML = shown
    .map(function (item, i) {
      const walkMin = Math.max(2, Math.round((item.dist * 12) / 5 / 5) * 5);
      const today = new Date().toISOString().slice(0, 10);
      let dateLabel = "";
      if (item.ev.date) {
        const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
        if (item.ev.date === today) dateLabel = "Aujourd'hui";
        else if (item.ev.date === tomorrow) dateLabel = "Demain";
        else dateLabel = formatDate(item.ev.date);
        if (item.ev.time) dateLabel += " · " + item.ev.time;
      }
      const icon = (typeof CATEGORY_ICONS !== "undefined" && CATEGORY_ICONS[item.ev.category]) || (typeof iconFor === "function" ? iconFor(item.ev.category) : "📌");
      const catColor = (typeof CATEGORY_COLORS !== "undefined" && CATEGORY_COLORS[item.ev.category]) || "#6C757D";
           const thumbPhoto = item.ev.photo || (typeof CATEGORY_PHOTOS !== "undefined" && CATEGORY_PHOTOS[item.ev.category]) || "";
      const thumbSvg = thumbPhoto
        ? '<img src="' + thumbPhoto + '" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.outerHTML = (typeof sceneSVG===\'function\') ? sceneSVG(\'' + (item.ev.scene || '') + '\') : \'\';">'
        : ((typeof sceneSVG === "function") ? sceneSVG(item.ev.scene) : "");
      const priceRaw = item.ev.price || "";
      let priceLabel = "", priceBg = "";
      if (priceRaw) {
        const p = priceRaw.toLowerCase();
        if (p.indexOf("gratuit") !== -1 || p.indexOf("libre") !== -1) { priceLabel = "Gratuit"; priceBg = "#28C76F"; }
        else if (p.indexOf("inscription") !== -1) { priceLabel = "Inscription"; priceBg = "linear-gradient(135deg,#A57CF7,#8B6CF2)"; }
        else { priceLabel = "Payant"; priceBg = "linear-gradient(135deg,#F2C879,#E85D3D)"; }
      }
      return (
        '<button class="explore-pick" data-id="' +
        item.ev.id +
        '" style="display:flex; align-items:flex-start; gap:12px; width:100%; text-align:left; background:none; border:none; padding:14px 0; cursor:pointer;' +
        (i > 0 ? "border-top:1px solid #eee;" : "") +
        '">' +
        '<div style="position:relative; width:56px; height:56px; flex-shrink:0;">' +
        '<div style="width:56px; height:56px; border-radius:14px; overflow:hidden; background:#f0f0f0;">' + thumbSvg + '</div>' +
        '<div style="position:absolute; top:-4px; left:-4px; width:22px; height:22px; border-radius:50%; background:' + catColor + '; display:flex; align-items:center; justify-content:center; font-size:11px; border:2px solid #fff; box-shadow:0 2px 4px rgba(0,0,0,0.2);">' + icon + '</div>' +
        '</div>' +
        '<div style="flex:1; min-width:0;">' +
        '<div style="display:flex; align-items:flex-start; justify-content:space-between; gap:8px;">' +
        '<div style="font-family:var(--font-display); font-size:13.5px; font-weight:600; color:#14213D; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + item.ev.title + '</div>' +
        (priceLabel ? '<div style="font-size:10px; font-weight:800; color:#fff; background:' + priceBg + '; padding:4px 9px; border-radius:999px; white-space:nowrap; flex-shrink:0;">' + priceLabel + '</div>' : '') +
        '</div>' +
        (item.ev.place ? '<div style="font-size:11px; color:#999; margin-top:2px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + item.ev.place + '</div>' : '') +
        '<div style="display:flex; align-items:center; gap:8px; margin-top:4px;">' +
        '<span style="font-size:11px; color:#E85D3D; font-weight:600;">🚶 ' + walkMin + ' min</span>' +
        (dateLabel ? '<span style="font-size:11px; color:#888;">· ' + dateLabel + '</span>' : '') +
        '</div>' +
        '</div>' +
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
__exploreCurrentCategory = "";
__exploreTimeMode = "now";
__exploreMoodQuery = "";
const cityKey = state.userPos ? nearestCityKey() : state.city;
const cityName = CITIES[cityKey] ? CITIES[cityKey].name : "";
const explorePhoto = (typeof CITY_PHOTOS !== "undefined") ? CITY_PHOTOS[cityKey] : null;
const exploreHeroBg = explorePhoto
? "linear-gradient(180deg, rgba(9,14,29,0.62) 0%, rgba(13,19,38,0.78) 45%, rgba(24,17,58,0.94) 100%), url('" + explorePhoto + "') center/cover no-repeat"
: "linear-gradient(160deg, #0d1730 0%, #1a2550 55%, #2b1f4a 100%)";
const overlay = document.createElement("div");
overlay.id = "explore-overlay";
overlay.style.cssText =
"position:fixed; inset:0; background:" + exploreHeroBg + "; background-color:#0d1730; z-index:9999; display:flex; flex-direction:column; align-items:center; padding:50px 20px 20px; overflow-y:auto;";

overlay.innerHTML =
'<div style="width:100%; max-width:420px; box-sizing:border-box;">' +
'<div style="position:relative; padding:16px 18px 14px; border-radius:18px; margin-bottom:12px; overflow:hidden; text-align:center; background:linear-gradient(135deg, rgba(242,134,75,0.16), rgba(139,108,242,0.16)); border:1px solid rgba(255,255,255,0.14);">' +
'<div style="position:absolute; top:-30px; right:-20px; width:90px; height:90px; border-radius:50%; background:radial-gradient(circle, rgba(242,134,75,0.4), transparent 70%); filter:blur(24px); pointer-events:none;"></div>' +
'<div style="position:absolute; bottom:-30px; left:-20px; width:80px; height:80px; border-radius:50%; background:radial-gradient(circle, rgba(139,108,242,0.35), transparent 70%); filter:blur(24px); pointer-events:none;"></div>' +
'<div style="position:relative;">' +
'<div style="font-size:10px; font-weight:700; letter-spacing:0.6px; color:rgba(255,255,255,0.6); text-transform:uppercase;">📍 Vous êtes à</div>' +
'<div style="font-family:var(--font-display); font-size:23px; font-weight:700; color:#fff; margin-top:2px; line-height:1.1;">' + cityName + '</div>' +
'<div id="explore-weather-badge" style="font-family:var(--font-display); font-style:italic; font-size:12.5px; font-weight:500; color:rgba(255,255,255,0.78); margin-top:3px;">…</div>' +
'</div>' +
'</div>' +
'<button id="explore-back" style="display:block; margin:0 0 14px; padding:8px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:12px; cursor:pointer;">← Retour aux 3 choix</button>' +
'<div id="explore-time-tabs" style="display:flex; gap:6px; margin-bottom:12px;">' +
'<button class="explore-time-btn" data-time="now" style="flex:1; padding:9px 4px; border-radius:10px; border:none; background:linear-gradient(135deg,#F2C879,#E85D3D); color:#fff; font-size:12px; font-weight:700; cursor:pointer;">Maintenant</button>' +
'<button class="explore-time-btn" data-time="tonight" style="flex:1; padding:9px 4px; border-radius:10px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:12px; font-weight:600; cursor:pointer;">Ce soir</button>' +
'<button class="explore-time-btn" data-time="tomorrow" style="flex:1; padding:9px 4px; border-radius:10px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:12px; font-weight:600; cursor:pointer;">Demain</button>' +
'</div>' +
'<div id="explore-cats" style="display:flex; gap:6px; overflow-x:auto; margin-bottom:12px; padding-bottom:2px;"></div>' +
'<div id="explore-mood-row" style="display:none; margin:-4px 0 12px;">' +
'<input id="explore-mood-search" placeholder="Calme pour discuter, festif, rencontre..." style="width:100%; box-sizing:border-box; padding:10px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); background:rgba(255,255,255,0.08); color:#fff; font-size:13px; outline:none;" />' +
'<div id="explore-mood-chips" style="display:flex; gap:6px; margin-top:8px; flex-wrap:wrap;"></div>' +
'</div>' +
'<div style="display:flex; gap:8px; margin-bottom:14px;">' +
'<div id="explore-sorts" style="display:flex; gap:6px; flex:1;"></div>' +
'<button id="explore-map-toggle" style="padding:9px 12px; border-radius:10px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:12px; font-weight:600; cursor:pointer; white-space:nowrap;">🗺️ Carte</button>' +
"</div>" +
'<div id="explore-result" style="background:#fff; border-radius:16px; padding:0 14px;"></div>' +
'<button id="explore-more-btn" style="display:none; margin-top:10px; width:100%; padding:10px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:12px; cursor:pointer;"></button>' +
'<button id="explore-close" style="width:100%; margin-top:16px; padding:12px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:13px; cursor:pointer;">Fermer</button>' +
"</div>";

document.body.appendChild(overlay);
(async function () {
const badge = document.getElementById("explore-weather-badge");
if (!badge || typeof weatherCurrentCoords !== "function") return;
const coords = weatherCurrentCoords();
if (!coords) { badge.remove(); return; }
try {
const url = "https://api.open-meteo.com/v1/forecast?latitude=" + coords.lat + "&longitude=" + coords.lng + "&current=temperature_2m,weather_code&timezone=auto";
const res = await fetch(url);
const data = await res.json();
const temp = Math.round(data.current.temperature_2m);
const info = weatherCodeToInfo(data.current.weather_code);
badge.textContent = info.icon + " Il fait " + temp + "°C";
} catch (e) {
badge.remove();
}
})();
overlay.addEventListener("click", function (e) {
if (e.target === overlay) overlay.remove();
if (e.target.id === "explore-close" && !__exploreOnMap) overlay.remove();
});
document.getElementById("explore-back").addEventListener("click", function () {
overlay.remove();
__arrivalShow();
});

overlay.querySelectorAll(".explore-time-btn").forEach(function (btn) {
btn.addEventListener("click", function () {
__exploreTimeMode = btn.dataset.time;
__exploreShowAll = false;
overlay.querySelectorAll(".explore-time-btn").forEach(function (b) {
b.style.background = "transparent";
b.style.color = "#fff";
b.style.border = "1px solid rgba(255,255,255,0.3)";
b.style.fontWeight = "600";
});
btn.style.background = "linear-gradient(135deg,#F2C879,#E85D3D)";
btn.style.color = "#fff";
btn.style.border = "none";
btn.style.fontWeight = "700";
__exploreRender();
});
});

// ---- recherche par ambiance (bars) ----
const moodRow = document.getElementById("explore-mood-row");
const moodInput = document.getElementById("explore-mood-search");
const moodChipsWrap = document.getElementById("explore-mood-chips");
let __moodActiveChip = "";
const MOOD_CHIPS = [
{ key: "calme", label: "🤫 Calme" },
{ key: "festif", label: "🎉 Festif" },
{ key: "rencontre", label: "💬 Rencontre" },
];

function __exploreUpdateMoodVisibility() {
const eligible = __exploreCurrentCategory === "Bar";
moodRow.style.display = eligible ? "block" : "none";
if (!eligible) {
__exploreMoodQuery = "";
__moodActiveChip = "";
moodInput.value = "";
Array.from(moodChipsWrap.children).forEach(function (c) {
c.style.background = "transparent";
c.style.border = "1px solid rgba(255,255,255,0.3)";
c.style.fontWeight = "400";
});
}
}

MOOD_CHIPS.forEach(function (m) {
const chip = document.createElement("button");
chip.type = "button";
chip.textContent = m.label;
chip.dataset.mood = m.key;
chip.style.cssText = "padding:6px 12px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:12px; cursor:pointer;";
chip.addEventListener("click", function () {
if (__moodActiveChip === m.key) {
__moodActiveChip = "";
__exploreMoodQuery = "";
chip.style.background = "transparent";
chip.style.border = "1px solid rgba(255,255,255,0.3)";
chip.style.fontWeight = "400";
} else {
Array.from(moodChipsWrap.children).forEach(function (c) {
c.style.background = "transparent";
c.style.border = "1px solid rgba(255,255,255,0.3)";
c.style.fontWeight = "400";
});
__moodActiveChip = m.key;
__exploreMoodQuery = m.key;
chip.style.background = "#E85D3D";
chip.style.border = "1px solid #E85D3D";
chip.style.fontWeight = "700";
}
moodInput.value = "";
__exploreShowAll = false;
__exploreRender();
});
moodChipsWrap.appendChild(chip);
});

moodInput.addEventListener("input", function () {
__exploreMoodQuery = moodInput.value;
__moodActiveChip = "";
Array.from(moodChipsWrap.children).forEach(function (c) {
c.style.background = "transparent";
c.style.border = "1px solid rgba(255,255,255,0.3)";
c.style.fontWeight = "400";
});
__exploreShowAll = false;
__exploreRender();
});

const catsWrap = document.getElementById("explore-cats");
EXPLORE_CATEGORIES.forEach(function (c, i) {
const btn = document.createElement("button");
const activeColor = (typeof CATEGORY_COLORS !== "undefined" && CATEGORY_COLORS[c.key]) || "#fff";
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
btn.style.background = c.key ? activeColor : "#fff";
btn.style.color = c.key ? "#fff" : "#14213D";
btn.style.border = "1px solid " + (c.key ? activeColor : "#fff");
__exploreUpdateMoodVisibility();
__exploreRender();
});
catsWrap.appendChild(btn);
});
__exploreUpdateMoodVisibility();
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
function __exploreApplyMapToggleUI() {
const toggleBtn = document.getElementById("explore-map-toggle");
if (__exploreOnMap) {
toggleBtn.textContent = "☰ Liste";
toggleBtn.style.background = "#fff";
toggleBtn.style.color = "#14213D";
document.getElementById("explore-cats").style.display = "none";
moodRow.style.display = "none";
document.getElementById("explore-sorts").style.display = "none";
document.getElementById("explore-time-tabs").style.display = "none";
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
__exploreUpdateMoodVisibility();
document.getElementById("explore-sorts").style.display = "flex";
document.getElementById("explore-time-tabs").style.display = "flex";
document.getElementById("explore-result").style.background = "#fff";
document.getElementById("explore-result").style.padding = "0 14px";
const closeBtn2 = document.getElementById("explore-close");
closeBtn2.textContent = "Fermer";
closeBtn2.onclick = null;
setTimeout(__exploreRender, 100);
}
}
document.getElementById("explore-map-toggle").addEventListener("click", function () {
__exploreOnMap = !__exploreOnMap;
__exploreApplyMapToggleUI();
});
document.getElementById("explore-more-btn").addEventListener("click", function () {
__exploreShowAll = true;
__exploreRender();
});

__exploreOnMap = true;
__exploreApplyMapToggleUI();
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
  if (typeof __hasPickedCity !== "undefined") __hasPickedCity = true;
  if (typeof __hasPickedFilter !== "undefined") __hasPickedFilter = true;
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
const hour = now.getHours();
const cityKey = state.userPos ? nearestCityKey() : state.city;
const cityName = CITIES[cityKey] ? CITIES[cityKey].name : "";
const time = hour + "h" + String(now.getMinutes()).padStart(2, "0");
const weatherText = __arrivalWeatherText();

let greeting;
if (hour >= 5 && hour < 12) {
greeting = "Une nouvelle journée commence à " + cityName + ". Par quoi on démarre ?";
} else if (hour >= 12 && hour < 17) {
greeting = "Il est " + time + " à " + cityName + ". Qu'est-ce qu'on fait de cet après-midi ?";
} else if (hour >= 17 && hour < 20) {
greeting = "Le soleil décline sur " + cityName + ". Qu'est-ce qu'on fait de cette soirée ?";
} else {
greeting = cityName + " s'anime pour la nuit. Qu'est-ce qui vous tente ?";
}

const cityPhoto = (typeof CITY_PHOTOS !== "undefined") ? CITY_PHOTOS[cityKey] : null;
const heroBg = cityPhoto
? "linear-gradient(180deg, rgba(11,17,34,0.60) 0%, rgba(15,21,42,0.72) 45%, rgba(20,15,48,0.93) 100%), url('" + cityPhoto + "') center/cover no-repeat"
: "linear-gradient(165deg, #0E1526 0%, #141C36 55%, #1B1440 100%)";

const overlay = document.createElement("div");
overlay.id = "arrival-screen-overlay";
overlay.style.cssText =
"position:fixed; inset:0; background:" + heroBg + "; background-color:#0E1526; z-index:9998; display:flex; flex-direction:column; align-items:center; padding:60px 24px 84px; overflow-y:auto;";

overlay.innerHTML =
'<style>@keyframes wzOrbFloat1{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(18px,-26px) scale(1.08);}}@keyframes wzOrbFloat2{0%,100%{transform:translate(0,0) scale(1);}50%{transform:translate(-22px,22px) scale(1.05);}}</style>' +
'<div class="flags-row" style="position:absolute; top:16px; right:16px; z-index:2; max-width:150px; flex-wrap:wrap; justify-content:flex-end;">' +
'<button class="flag-btn" id="flag-fr-arrival" data-lang="fr"><img src="https://flagcdn.com/w40/fr.png" alt="Français"></button>' +
'<button class="flag-btn" id="flag-en-arrival" data-lang="en"><img src="https://flagcdn.com/w40/gb.png" alt="English"></button>' +
'<button class="flag-btn" id="flag-es-arrival" data-lang="es"><img src="https://flagcdn.com/w40/es.png" alt="Español"></button>' +
'<button class="flag-btn" id="flag-de-arrival" data-lang="de"><img src="https://flagcdn.com/w40/de.png" alt="Deutsch"></button>' +
'<button class="flag-btn" id="flag-it-arrival" data-lang="it"><img src="https://flagcdn.com/w40/it.png" alt="Italiano"></button>' +
'<button class="flag-btn" id="flag-ja-arrival" data-lang="ja"><img src="https://flagcdn.com/w40/jp.png" alt="日本語"></button>' +
'<button class="flag-btn" id="flag-zh-arrival" data-lang="zh"><img src="https://flagcdn.com/w40/cn.png" alt="中文"></button>' +
'</div>' +
'<div style="position:absolute; top:-60px; right:-40px; width:220px; height:220px; border-radius:50%; background:radial-gradient(circle, rgba(242,134,75,0.55), transparent 70%); filter:blur(50px); pointer-events:none; z-index:0; animation:wzOrbFloat1 9s ease-in-out infinite;"></div>' +
'<div style="position:absolute; bottom:60px; left:-50px; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle, rgba(139,108,242,0.5), transparent 70%); filter:blur(50px); pointer-events:none; z-index:0; animation:wzOrbFloat2 11s ease-in-out infinite;"></div>' +
'<div style="text-align:center; margin-bottom:38px; max-width:340px; position:relative; z-index:1;">' +
'<div style="color:#C7CEE3; font-size:12px; margin-bottom:8px; font-weight:700; letter-spacing:0.4px; text-transform:uppercase; text-shadow:0 2px 8px rgba(0,0,0,0.45);">' + cityName + " · " + time + "</div>" +
'<div style="color:#fff; font-family:\'Fraunces\', Georgia, serif; font-size:24px; font-weight:500; line-height:1.4; text-shadow:0 2px 10px rgba(0,0,0,0.5);">' + greeting + "</div>" +
"</div>" +
'<div style="display:flex; flex-wrap:wrap; gap:14px; justify-content:center; max-width:300px; position:relative; z-index:1;">' +
'<div class="arrival-opt" data-key="near" style="text-align:center; cursor:pointer;">' +
'<div style="width:74px; height:74px; border-radius:22px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); display:flex; align-items:center; justify-content:center; font-size:26px;">📍</div>' +
'<div style="color:#C7CEE3; font-size:11.5px; margin-top:9px; font-weight:600;">Autour de moi</div>' +
"</div>" +
'<div class="arrival-opt" data-key="other" style="text-align:center; cursor:pointer;">' +
'<div style="width:74px; height:74px; border-radius:22px; background:linear-gradient(135deg, #F2864B, #E85D3D); display:flex; align-items:center; justify-content:center; font-size:26px; box-shadow:0 8px 20px rgba(242,134,75,0.35);">✨</div>' +
'<div style="color:#fff; font-size:11.5px; margin-top:9px; font-weight:600;">Surprends-moi</div>' +
"</div>" +
'<div class="arrival-opt" data-key="all" style="text-align:center; cursor:pointer;">' +
'<div style="width:74px; height:74px; border-radius:22px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); display:flex; align-items:center; justify-content:center; font-size:26px;">🗺️</div>' +
'<div style="color:#C7CEE3; font-size:11.5px; margin-top:9px; font-weight:600;">Tout voir</div>' +
"</div>" +
'<div class="arrival-opt" data-key="carnet" style="text-align:center; cursor:pointer;">' +
'<div style="width:74px; height:74px; border-radius:22px; background:linear-gradient(135deg, #A57CF7, #8B6CF2); display:flex; align-items:center; justify-content:center; font-size:26px; box-shadow:0 8px 20px rgba(139,108,242,0.35);">📖</div>' +
'<div style="color:#fff; font-size:11.5px; margin-top:9px; font-weight:600;">Mon carnet</div>' +
"</div>" +
"</div>" +
(weatherText
? '<div style="margin-top:34px; text-align:center; position:relative; z-index:1;"><div style="display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:999px; background:rgba(255,255,255,0.06); color:#9BA5C2; font-size:11px;">' + weatherText + "</div></div>"
: "") +
wzNavbarHtml("decouvre");

document.body.appendChild(overlay);

overlay.querySelectorAll(".flag-btn[data-lang]").forEach(function (btn) {
btn.addEventListener("click", function () {
if (typeof setLang === "function") setLang(btn.dataset.lang);
});
});
if (typeof applyTranslation === "function") applyTranslation();

overlay.querySelectorAll(".arrival-opt").forEach(function (opt) {
opt.addEventListener("click", function () {
opt.style.transform = "scale(0.94)";
const key = opt.dataset.key;
setTimeout(function () {
overlay.remove();
if (key === "near") __exploreOpen();
else if (key === "other") { if (window.__questOpen) __questOpen(); else __arrivalOpenMood(); }
else if (key === "all") __arrivalShowCityView();
else if (key === "carnet") { if (window.__renderSouvenirsScreen) __renderSouvenirsScreen(); }
}, 180);
});
});

wzNavbarBind(overlay, function () { overlay.remove(); });
}


function __arrivalShareCity() {
  const cityKey = state.userPos ? nearestCityKey() : state.city;
  const cityName = CITIES[cityKey] ? CITIES[cityKey].name : "";
  const text = "Découvre les événements, musées et bonnes adresses de " + cityName + " sur Whazup : https://whazup.fr";
  if (navigator.share) {
    navigator.share({ title: "Whazup", text: text }).catch(function () {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function () {
      if (typeof showShareToast === "function") showShareToast("✓ Lien copié ! Collez-le dans votre message.");
    }).catch(function () {});
  }
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

// ---- bouton retour sur "Tout voir" -> revient aux 3 choix ----
document.addEventListener("click", function (e) {
  if (e.target && e.target.id === "btn-discover-back") {
    __arrivalShow();
  }
});
