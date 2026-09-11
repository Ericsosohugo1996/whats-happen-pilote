// ---- mon itinéraire du jour : enchaînement de 2-3 arrêts ----
const ITIN_STOPS_COUNT = { demi: 2, jour: 3 };

function buildItinerary(timeKey) {
  const n = ITIN_STOPS_COUNT[timeKey];
  const radiusKm = SURPRISE_TIME_KM[timeKey];
  let candidates = surpriseCandidates(radiusKm, false);
  candidates = candidates.slice().sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  if (candidates.length < n) {
    candidates = surpriseCandidates(radiusKm, true);
  }
  if (candidates.length === 0) return [];
  const picks = [];
  const usedCats = new Set();
  const step = candidates.length / n;
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(i * step);
    let chosen = null;
    for (let offset = 0; offset < candidates.length; offset++) {
      const tryIdx = (idx + offset) % candidates.length;
      const cand = candidates[tryIdx];
      if (!picks.includes(cand) && !usedCats.has(cand.category)) {
        chosen = cand;
        break;
      }
    }
    if (!chosen) chosen = candidates.find((c) => !picks.includes(c));
    if (chosen) {
      picks.push(chosen);
      usedCats.add(chosen.category);
    }
  }
  return picks.sort((a, b) => ((a.date || "") + (a.time || "")).localeCompare((b.date || "") + (b.time || "")));
}

function __ensureItineraryUI() {
  if (document.getElementById("itinerary-block")) return document.getElementById("itinerary-block");
  const surpriseBlock = document.getElementById("surprise-block");
  if (!surpriseBlock || !surpriseBlock.parentNode) return null;
  const block = document.createElement("div");
  block.id = "itinerary-block";
  block.style.cssText = "margin:0 16px 16px;";
  block.innerHTML =
    '<button type="button" id="itinerary-btn" style="width:100%; padding:14px; border-radius:14px; border:none; background:linear-gradient(135deg,#6C5CE7,#4834b0); color:#fff; font-size:14.5px; font-weight:600; cursor:pointer;">🗺️ Mon itinéraire du jour</button>' +
    '<div id="itinerary-time-step" style="display:none; flex-direction:column; gap:6px; margin-top:10px;">' +
      '<button type="button" class="chip-btn" data-itin-time="demi" style="text-align:left;">🕐 Une demi-journée · 2 arrêts</button>' +
      '<button type="button" class="chip-btn" data-itin-time="jour" style="text-align:left;">☀️ Toute la journée · 3 arrêts</button>' +
    '</div>' +
    '<div id="itinerary-result" style="display:none; margin-top:10px;"></div>';
  surpriseBlock.parentNode.insertBefore(block, surpriseBlock.nextSibling);

  block.querySelector("#itinerary-btn").onclick = () => {
    const timeStep = block.querySelector("#itinerary-time-step");
    const result = block.querySelector("#itinerary-result");
    result.style.display = "none";
    timeStep.style.display = timeStep.style.display === "none" ? "flex" : "none";
  };

  block.querySelectorAll("[data-itin-time]").forEach((btn) => {
    btn.onclick = () => {
      const timeKey = btn.dataset.itinTime;
      const stops = buildItinerary(timeKey);
      const timeStep = block.querySelector("#itinerary-time-step");
      const result = block.querySelector("#itinerary-result");
      timeStep.style.display = "none";
      if (stops.length === 0) {
        result.innerHTML =
          '<div style="background:#fff; border-radius:12px; padding:14px; border:0.5px solid rgba(0,0,0,0.08); font-size:13px; color:#666;">Pas assez d\'événements trouvés pour construire un itinéraire aujourd\'hui.</div>';
      } else {
        let html = '<div style="position:relative; padding-left:20px;">';
        stops.forEach((ev, i) => {
          html +=
            '<div style="position:relative; padding-bottom:' + (i < stops.length - 1 ? "18px" : "0") + ';">' +
              '<div style="position:absolute; left:-20px; top:3px; width:10px; height:10px; border-radius:50%; background:#6C5CE7;"></div>' +
              (i < stops.length - 1
                ? '<div style="position:absolute; left:-16px; top:13px; width:2px; height:calc(100% - 4px); background:rgba(0,0,0,0.12);"></div>'
                : "") +
              '<div class="itin-stop" data-ev-id="' + ev.id + '" style="background:#fff; border-radius:12px; padding:12px; border:0.5px solid rgba(0,0,0,0.08); cursor:pointer;">' +
                '<div style="font-size:11px; font-weight:600; color:#6C5CE7;">' + (ev.time || "") + '</div>' +
                '<div style="font-size:10px; color:#E8604C; font-weight:600; margin-top:4px; text-transform:uppercase;">' + ev.category + '</div>' +
                '<div style="font-size:13.5px; font-weight:500; margin-top:2px;">' + ev.title + '</div>' +
                '<div style="font-size:11px; color:#999; margin-top:3px;">' + (Math.round(ev.distance * 10) / 10) + ' km</div>' +
              '</div>' +
            '</div>';
        });
        html += "</div>";
        result.innerHTML = html;
        result.querySelectorAll(".itin-stop").forEach((card) => {
          card.onclick = () => openDetail(card.dataset.evId);
        });
      }
      result.style.display = "block";
    };
  });

  return block;
}

const __renderLocateBarBaseItin = renderLocateBar;
renderLocateBar = function () {
  __renderLocateBarBaseItin();
  if (typeof __hasPickedCity !== "undefined" && __hasPickedCity) {
    __ensureItineraryUI();
  }
};
