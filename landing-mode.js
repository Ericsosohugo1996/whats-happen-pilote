// ---- Mode Atterrissage : une seule recommandation selon l'heure d'arrivée ----

function __landingModeGetSlot(hour) {
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 23) return "evening";
  return "night";
}

function __landingModeHeadline(slot, hour, minutes, cityName) {
  const time = hour + "h" + String(minutes).padStart(2, "0");
  const phrases = {
    morning: "Un café pour commencer ?",
    afternoon: "Direction une visite ou un marché ?",
    evening: "L'heure de l'apéro.",
    night: "La soirée continue.",
  };
  return "Il est " + time + " à " + cityName + ".<br>" + phrases[slot];
}

function __landingModeNearest(events, ref) {
  let best = null;
  let bestDist = Infinity;
  events.forEach(function (ev) {
    if (!ev.lat || !ev.lng) return;
    const d = haversineKm(ref.lat, ref.lng, ev.lat, ev.lng);
    if (d < bestDist) {
      bestDist = d;
      best = ev;
    }
  });
  return best ? { ev: best, dist: bestDist } : null;
}
let __landingPreferredCategory = null;
function __landingModePicks(slot) {
  const ref = referencePoint();
    const cityKey = state.userPos ? nearestCityKey() : state.city;
  const events = allEvents().filter(function (ev) {
    return ev.city === cityKey;
  });
  const bars = events.filter(function (ev) {
    return ev.category === "Bar";
  });
  const landmarks = events.filter(function (ev) {
    return ev.category === "À voir";
  });
  const today = new Date().toISOString().slice(0, 10);
  const liveEvents = events.filter(function (ev) {
    return !ev.isPlace && ev.date === today && ["Soirée", "Musique", "Festival", "Marché"].includes(ev.category);
  });

   const picks = [];
  if (__landingPreferredCategory) {
    const matching = events
      .filter(function (ev) { return ev.category === __landingPreferredCategory; })
      .map(function (ev) {
        return { ev: ev, dist: haversineKm(ref.lat, ref.lng, ev.lat, ev.lng) };
      })
      .sort(function (a, b) { return a.dist - b.dist; })
      .slice(0, 3);
    const emoji = __landingPreferredCategory === "Bar" ? "🍸" : __landingPreferredCategory === "À voir" ? "🏛️" : __landingPreferredCategory === "Marché" ? "🛍️" : "🎉";
    return matching.map(function (m, i) {
      return { label: i === 0 ? "SELON VOTRE ENVIE" : "AUTRE OPTION", emoji: emoji, pick: m };
    });
  }
  if (slot === "morning" || slot === "afternoon") {
    const liveNow = __landingModeNearest(liveEvents, ref);
    if (liveNow) picks.push({ label: slot === "afternoon" ? "AUJOURD'HUI" : "À VOIR EN PASSANT", emoji: liveNow.ev.category === "Marché" ? "🛍️" : "🎉", pick: liveNow });
    const landmark = __landingModeNearest(landmarks, ref);
    if (landmark && !picks.find(function (p) { return p.pick.ev.id === landmark.ev.id; })) {
      picks.push({ label: "À VOIR", emoji: "🏛️", pick: landmark });
    }
  } else {
    const bar = __landingModeNearest(bars, ref);
    if (bar) picks.push({ label: "POUR L'APÉRO", emoji: "🍸", pick: bar });
    const liveTonight = __landingModeNearest(liveEvents, ref);
    if (liveTonight) picks.push({ label: "CE SOIR", emoji: "🎷", pick: liveTonight });
  }
  return picks.slice(0, 2);
}

function __landingModeOpen() {
  const now = new Date();
  const slot = __landingModeGetSlot(now.getHours());
    const activeCityKey = state.userPos ? nearestCityKey() : state.city;
  const cityName = CITIES[activeCityKey] ? CITIES[activeCityKey].name : "";
  const picks = __landingModePicks(slot);
    const info = CITY_INFO[activeCityKey];
  const contextLine = info ? info.desc.split(". ")[0] + "." : "";

  const overlay = document.createElement("div");
  overlay.id = "landing-mode-overlay";
  overlay.style.cssText =
    "position:fixed; inset:0; background:rgba(20,33,61,0.6); z-index:9999; display:flex; align-items:flex-end; justify-content:center;";

  const cardsHTML = picks.length
    ? picks
        .map(function (p) {
          return (
            '<button class="landing-pick" data-id="' +
            p.pick.ev.id +
            '" style="display:flex; align-items:center; gap:12px; width:100%; text-align:left; background:none; border:none; padding:12px 0; border-top:1px solid #eee; cursor:pointer;">' +
            '<div style="font-size:28px;">' +
            p.emoji +
            "</div>" +
            '<div style="flex:1;">' +
            '<div style="font-size:10px; font-weight:700; color:#c0392b; letter-spacing:0.5px;">' +
            p.label +
            "</div>" +
            '<div style="font-size:15px; font-weight:600; color:#14213D;">' +
            p.pick.ev.title +
            "</div>" +
            '<div style="font-size:12px; color:#888;">' +
            p.pick.dist.toFixed(1).replace(".", ",") +
            " km" +
            "</div>" +
            "</div>" +
            "</button>"
          );
        })
        .join("")
    : '<p style="padding:16px 0; color:#888; font-size:13px;">Rien de spécial à proposer pour le moment, essayez « Ma position » pour affiner.</p>';

  overlay.innerHTML =
    '<div style="background:#14213D; border-radius:28px 28px 0 0; padding:24px 20px 28px; width:100%; max-width:420px; box-sizing:border-box;">' +
       '<div style="color:#fff; font-size:19px; font-weight:700; line-height:1.35; margin-bottom:6px;">' +
    __landingModeHeadline(slot, now.getHours(), now.getMinutes(), cityName) +
    "</div>" +
    '<div style="color:rgba(255,255,255,0.65); font-size:12px; line-height:1.4; margin-bottom:16px;">' +
    contextLine +
    "</div>" +
    
    '<div style="background:#fff; border-radius:18px; padding:0 16px;">' +
    cardsHTML +
    "</div>" +
        '<div style="text-align:center; margin-top:12px;"><button id="landing-not-convinced" style="background:none; border:none; color:rgba(255,255,255,0.7); font-size:12px; text-decoration:underline; cursor:pointer;">Pas convaincu ? Dites-nous ce que vous voulez</button></div>' +
    '<div id="landing-pref-chips" style="display:none; gap:6px; margin-top:10px; flex-wrap:wrap; justify-content:center;"></div>' +
    '<button id="landing-mode-close" style="width:100%; margin-top:16px; padding:12px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:13px; cursor:pointer;">Fermer</button>' +
    "</div>";

  document.body.appendChild(overlay);
  overlay.addEventListener("click", function (e) {
    if (e.target === overlay || e.target.id === "landing-mode-close") overlay.remove();
  });
  overlay.querySelectorAll(".landing-pick").forEach(function (btn) {
    btn.addEventListener("click", function () {
      overlay.remove();
      openDetail(btn.dataset.id);
    });
     document.getElementById("landing-not-convinced").addEventListener("click", function () {
    const chipsWrap = document.getElementById("landing-pref-chips");
    chipsWrap.style.display = "flex";
    const prefs = [
      { key: "Bar", label: "🍸 Un bar" },
      { key: "À voir", label: "🏛️ Une visite" },
      { key: "Musique", label: "🎵 De la musique" },
      { key: "Marché", label: "🛍️ Un marché" },
    ];
    chipsWrap.innerHTML = prefs
      .map(function (p) {
        return '<button class="landing-pref-chip" data-cat="' + p.key + '" style="padding:7px 12px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:11.5px; cursor:pointer;">' + p.label + "</button>";
      })
      .join("");
    chipsWrap.querySelectorAll(".landing-pref-chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        __landingPreferredCategory = chip.dataset.cat;
        overlay.remove();
        __landingModeOpen();
      });
    });
  }); 
  });
}

function __ensureLandingModeButton() {
  const choiceScreen = document.getElementById("choice-screen");
  const existing = document.getElementById("landing-mode-btn");
  if (choiceScreen && !choiceScreen.classList.contains("hidden")) {
    if (existing) existing.remove();
    return;
  }
  if (existing) return;
  const topbar = document.querySelector(".topbar");
  if (!topbar) return;
  const btn = document.createElement("button");
  btn.id = "landing-mode-btn";
  btn.type = "button";
  btn.textContent = "🛬 Je viens d'arriver";
  btn.style.cssText =
    "display:block; margin:10px auto 0; padding:11px 20px; border-radius:999px; border:none; background:linear-gradient(90deg,#c1440e,#e3a72e); color:#fff; font-weight:700; font-size:13.5px; cursor:pointer;";
  btn.addEventListener("click", __landingModeOpen);
  topbar.insertAdjacentElement("afterend", btn);
}

const __renderDiscoverBaseLanding = renderDiscover;
renderDiscover = function () {
  __renderDiscoverBaseLanding();
  __ensureLandingModeButton();
};
setTimeout(__ensureLandingModeButton, 300);
