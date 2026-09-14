// ---- Mode Escale : programme calculé selon le temps disponible avant de repartir ----

const __LAYOVER_WALK_SPEED_KMH = 4.5;
const __LAYOVER_DEFAULT_DURATIONS = {
  "À voir": 25,
  Bar: 45,
  Marché: 30,
  Expo: 30,
  Festival: 40,
};

function __layoverWalkMinutes(km) {
  return Math.ceil((km / __LAYOVER_WALK_SPEED_KMH) * 60);
}

function __layoverBuildItinerary(totalMinutes) {
  const ref = referencePoint();
   const cityKey = state.userPos ? nearestCityKey() : state.city;
  const returnBuffer = Math.max(5, Math.round(totalMinutes * 0.15));
  let budget = totalMinutes - returnBuffer;
  const candidates = allEvents()
    .filter(function (ev) {
      const cityMatch = ev.city === cityKey && ev.lat && ev.lng;
      if (__layoverPreferredCategory) return cityMatch && ev.category === __layoverPreferredCategory;
      return cityMatch;
    })
    .map(function (ev) {
      return { ev: ev, dist: haversineKm(ref.lat, ref.lng, ev.lat, ev.lng) };
    })
    .sort(function (a, b) {
      return a.dist - b.dist;
    });
 

  const steps = [];
  let cursor = ref;
  let usedIds = {};

  while (budget > 10 && steps.length < 4) {
    let best = null;
    let bestCost = Infinity;
    candidates.forEach(function (c) {
      if (usedIds[c.ev.id]) return;
      const dKm = haversineKm(cursor.lat, cursor.lng, c.ev.lat, c.ev.lng);
      const walk = __layoverWalkMinutes(dKm);
      const visit = __LAYOVER_DEFAULT_DURATIONS[c.ev.category] || 30;
      const cost = walk + visit;
      if (cost <= budget && cost < bestCost) {
        bestCost = cost;
        best = { ev: c.ev, walk: walk, visit: visit };
      }
    });
    if (!best) break;
    steps.push(best);
    usedIds[best.ev.id] = true;
    budget -= best.walk + best.visit;
    cursor = { lat: best.ev.lat, lng: best.ev.lng };
  }

  const backKm = haversineKm(cursor.lat, cursor.lng, ref.lat, ref.lng);
  const backWalk = __layoverWalkMinutes(backKm);

  return { steps: steps, returnBuffer: returnBuffer, backWalk: backWalk };
}

function __layoverFormatTime(date) {
  return date.getHours() + "h" + String(date.getMinutes()).padStart(2, "0");
}

function __layoverRenderResult(totalMinutes) {
  const now = new Date();
  const result = __layoverBuildItinerary(totalMinutes);
  const container = document.getElementById("layover-result");

  if (!result.steps.length) {
    container.innerHTML =
      '<p style="padding:16px 0; color:#888; font-size:13px;">Pas assez de temps pour un programme, essayez un créneau plus long.</p>';
    return;
  }

  let clock = new Date(now);
  const rows = result.steps.map(function (step, i) {
    clock = new Date(clock.getTime() + step.walk * 60000);
    const startLabel = __layoverFormatTime(clock);
    clock = new Date(clock.getTime() + step.visit * 60000);
    const emoji = step.ev.category === "Bar" ? "🍸" : step.ev.category === "Marché" ? "🛍️" : step.ev.category === "À voir" ? "🏛️" : "🎉";
    return (
      '<button class="layover-pick" data-id="' +
      step.ev.id +
      '" style="display:flex; gap:10px; width:100%; text-align:left; background:none; border:none; cursor:pointer;' +
      (i > 0 ? "margin-top:12px; padding-top:12px; border-top:1px solid #eee;" : "") +
      '">' +
      '<div style="font-size:24px;">' + emoji + "</div>" +
      '<div style="flex:1;">' +
      '<div style="font-size:10px; color:#c0392b; font-weight:700;">' + startLabel + " · " + step.visit + " min</div>" +
      '<div style="font-size:14px; font-weight:600; color:#14213D;">' + step.ev.title + "</div>" +
      "</div></button>"
    );
  });

  const departTime = new Date(now.getTime() + totalMinutes * 60000);

  container.innerHTML =
    rows.join("") +
    '<div style="margin-top:14px; padding-top:12px; border-top:1px dashed #ddd; font-size:11px; color:#c1440e; font-weight:600;">🚶 ' +
    result.backWalk +
    " min de marge retour — soyez prêt à repartir avant " +
    __layoverFormatTime(departTime) +
    ".</div>";

  container.querySelectorAll(".layover-pick").forEach(function (btn) {
    btn.addEventListener("click", function () {
      document.getElementById("layover-overlay").remove();
      openDetail(btn.dataset.id);
    });
  });
}
let __layoverPreferredCategory = null;
function __layoverOpen() {
  const overlay = document.createElement("div");
  overlay.id = "layover-overlay";
  overlay.style.cssText =
    "position:fixed; inset:0; background:rgba(20,33,61,0.6); z-index:9999; display:flex; align-items:flex-end; justify-content:center;";

  overlay.innerHTML =
    '<div style="background:#14213D; border-radius:28px 28px 0 0; padding:24px 20px 28px; width:100%; max-width:420px; box-sizing:border-box;">' +
    '<div style="color:#fff; font-size:13px; font-weight:500; margin-bottom:10px; opacity:0.8;">⏱️ Combien de temps devant vous ?</div>' +
    '<div id="layover-duration-btns" style="display:flex; gap:6px; margin-bottom:20px;"></div>' +
    '<div id="layover-result" style="background:#fff; border-radius:18px; padding:16px; min-height:20px;"></div>' +
        '<div style="text-align:center; margin-top:12px;"><button id="layover-not-convinced" style="background:none; border:none; color:rgba(255,255,255,0.7); font-size:12px; text-decoration:underline; cursor:pointer;">Pas convaincu ? Dites-nous ce que vous voulez</button></div>' +
    '<div id="layover-pref-chips" style="display:none; gap:6px; margin-top:10px; flex-wrap:wrap; justify-content:center;"></div>' +
    '<button id="layover-close" style="width:100%; margin-top:16px; padding:12px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:13px; cursor:pointer;">Fermer</button>' +
    "</div>";

  document.body.appendChild(overlay);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay || e.target.id === "layover-close") overlay.remove();
  });

  const durations = [
    { label: "30 min", value: 30 },
    { label: "1h", value: 60 },
    { label: "1h30", value: 90 },
    { label: "2h", value: 120 },
    { label: "3h", value: 180 },
  ];
  const btnRow = document.getElementById("layover-duration-btns");
  durations.forEach(function (d, i) {
    const btn = document.createElement("button");
    btn.textContent = d.label;
    btn.style.cssText =
      "flex:1; padding:10px 4px; border-radius:10px; border:" +
      (i === 1 ? "none" : "1px solid rgba(255,255,255,0.3)") +
      "; background:" +
      (i === 1 ? "#fff" : "transparent") +
      "; color:" +
      (i === 1 ? "#14213D" : "#fff") +
      "; font-size:12.5px; font-weight:600; cursor:pointer;";
    btn.addEventListener("click", function () {
      Array.from(btnRow.children).forEach(function (b) {
        b.style.background = "transparent";
        b.style.color = "#fff";
        b.style.border = "1px solid rgba(255,255,255,0.3)";
      });
      btn.style.background = "#fff";
      btn.style.color = "#14213D";
      btn.style.border = "none";
      __layoverRenderResult(d.value);
    });
    btnRow.appendChild(btn);
  });
  __layoverRenderResult(60);
}

function __ensureLayoverButton() {
  const choiceScreen = document.getElementById("choice-screen");
  const existing = document.getElementById("layover-mode-btn");
  if (choiceScreen && !choiceScreen.classList.contains("hidden")) {
    if (existing) existing.remove();
    return;
  }
  if (existing) return;
  const landingBtn = document.getElementById("landing-mode-btn");
  if (!landingBtn) return;
  const btn = document.createElement("button");
  btn.id = "layover-mode-btn";
  btn.type = "button";
  btn.textContent = "⏱️ J'ai un créneau";
  btn.style.cssText =
    "display:block; margin:8px auto 0; padding:11px 20px; border-radius:999px; border:2px solid #14213D; background:#fff; color:#14213D; font-weight:700; font-size:13.5px; cursor:pointer;";
  btn.addEventListener("click", __layoverOpen);
  landingBtn.insertAdjacentElement("afterend", btn);
}

const __renderDiscoverBaseLayover = renderDiscover;
renderDiscover = function () {
  __renderDiscoverBaseLayover();
  __ensureLayoverButton();
};
setTimeout(__ensureLayoverButton, 300);
