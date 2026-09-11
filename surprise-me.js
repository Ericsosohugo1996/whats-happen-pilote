// ---- surprends-moi aujourd'hui ----
const SURPRISE_TIME_KM = { "1h": 2, "demi": 10, "jour": 20 };
const SURPRISE_TIME_LABELS = { "1h": "1h dispo", "demi": "Demi-journée", "jour": "Journée entière" };

function surpriseCandidates(radiusKm, relaxed) {
  const ref = referencePoint();
  const todayIso = new Date().toISOString().slice(0, 10);
  let events = allEvents()
    .filter((ev) => !ev.isPlace)
    .filter((ev) => (state.userPos ? true : ev.city === state.city))
    .map((ev) => ({ ...ev, distance: haversineKm(ref.lat, ref.lng, ev.lat, ev.lng) }))
    .filter((ev) => ev.distance <= radiusKm);

  if (!relaxed) {
    events = events.filter((ev) => ev.date === todayIso);
    const isOutdoor = window.__weatherOutdoor;
    if (typeof isOutdoor === "boolean") {
      const cats = isOutdoor ? WEATHER_OUTDOOR_CATS : WEATHER_INDOOR_CATS;
      const weatherFiltered = events.filter((ev) => cats.includes(ev.category));
      if (weatherFiltered.length > 0) events = weatherFiltered;
    }
  } else {
    const weekLimit = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    events = events.filter((ev) => ev.date >= todayIso && ev.date <= weekLimit);
  }
  return events;
}

function pickSurprise(timeKey) {
  const radiusKm = SURPRISE_TIME_KM[timeKey];
  let candidates = surpriseCandidates(radiusKm, false);
  let relaxed = false;
  if (candidates.length === 0) {
    candidates = surpriseCandidates(radiusKm, true);
    relaxed = true;
  }
  if (candidates.length === 0) return null;
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  const isOutdoor = window.__weatherOutdoor;
  const timeLabel = SURPRISE_TIME_LABELS[timeKey];
  let reason;
  if (relaxed) {
    reason = timeLabel + " → notre meilleure trouvaille cette semaine à proximité";
  } else {
    const weatherLabel = isOutdoor === true ? "beau temps" : isOutdoor === false ? "temps couvert" : "";
    reason = weatherLabel
      ? timeLabel + " + " + weatherLabel + " → ce choix devrait vous plaire aujourd'hui"
      : timeLabel + " → ce choix devrait vous plaire aujourd'hui";
  }
  return { pick, reason };
}

function __ensureSurpriseUI() {
  if (document.getElementById("surprise-block")) return document.getElementById("surprise-block");
  const cityInfo = document.getElementById("city-info");
  if (!cityInfo || !cityInfo.parentNode) return null;
  const block = document.createElement("div");
  block.id = "surprise-block";
  block.style.cssText = "margin:0 16px 16px;";
  block.innerHTML =
    '<button type="button" id="surprise-btn" style="width:100%; padding:14px; border-radius:14px; border:none; background:linear-gradient(135deg,#E8604C,#c94a38); color:#fff; font-size:14.5px; font-weight:600; cursor:pointer;">✨ Surprends-moi aujourd\'hui</button>' +
    '<div id="surprise-time-step" style="display:none; flex-direction:column; gap:6px; margin-top:10px;">' +
      '<button type="button" class="chip-btn" data-surprise-time="1h" style="text-align:left;">⏱️ 1 heure</button>' +
      '<button type="button" class="chip-btn" data-surprise-time="demi" style="text-align:left;">🕐 Une demi-journée</button>' +
      '<button type="button" class="chip-btn" data-surprise-time="jour" style="text-align:left;">☀️ Toute la journée</button>' +
    '</div>' +
    '<div id="surprise-result" style="display:none; margin-top:10px;"></div>';
  cityInfo.parentNode.insertBefore(block, cityInfo.nextSibling);

  block.querySelector("#surprise-btn").onclick = () => {
    const timeStep = block.querySelector("#surprise-time-step");
    const result = block.querySelector("#surprise-result");
    result.style.display = "none";
    timeStep.style.display = timeStep.style.display === "none" ? "flex" : "none";
  };

  block.querySelectorAll("[data-surprise-time]").forEach((btn) => {
    btn.onclick = () => {
      const timeKey = btn.dataset.surpriseTime;
      const outcome = pickSurprise(timeKey);
      const timeStep = block.querySelector("#surprise-time-step");
      const result = block.querySelector("#surprise-result");
      timeStep.style.display = "none";
      if (!outcome) {
        result.innerHTML =
          '<div style="background:#fff; border-radius:12px; padding:14px; border:0.5px solid rgba(0,0,0,0.08); font-size:13px; color:#666;">Aucun événement trouvé pour l\'instant dans ce rayon. Essayez un temps plus large.</div>';
      } else {
        const ev = outcome.pick;
               const photoUrl = (typeof CITY_PHOTOS !== "undefined" && CITY_PHOTOS[ev.city]) || "";
        result.innerHTML =
          '<div style="background:#fff; border-radius:12px; overflow:hidden; border:0.5px solid rgba(0,0,0,0.08); cursor:pointer;" id="surprise-card">' +
            (photoUrl
              ? '<div style="height:120px; background-image:url(\'' + photoUrl + '\'); background-size:cover; background-position:center;"></div>'
              : "") +
            '<div style="padding:14px;">' +
              '<span style="font-size:10.5px; font-weight:600; color:#E8604C; text-transform:uppercase;">' + ev.category + '</span>' +
              '<div style="font-weight:600; font-size:14.5px; margin:4px 0;">' + ev.title + '</div>' +
              '<div style="font-size:12px; color:#777; margin-bottom:8px;">' + formatDate(ev.date) + (ev.time ? " · " + ev.time : "") + " · " + (Math.round(ev.distance * 10) / 10) + ' km</div>' +
              '<div style="font-size:11.5px; color:#E8604C; background:rgba(232,96,76,0.08); border-radius:8px; padding:6px 8px;">' + outcome.reason + '</div>' +
            '</div>' +
          '</div>';
        result.querySelector("#surprise-card").onclick = () => openDetail(ev.id);
      }
      result.style.display = "block";
    };
  });

  return block;
}

const __renderLocateBarBaseSurprise = renderLocateBar;
renderLocateBar = function () {
  __renderLocateBarBaseSurprise();
  if (typeof __hasPickedCity !== "undefined" && __hasPickedCity) {
    __ensureSurpriseUI();
  }
};
