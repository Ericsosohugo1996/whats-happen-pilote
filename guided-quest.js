// guided-quest.js — Questionnaire guidé (remplace le Bonhomme 2 "Surprends-moi")
(function () {
  "use strict";

  const QUEST_CATEGORIES = [
    { key: "Bar", label: "🍸 Bar" },
    { key: "À voir", label: "🏛️ Musée" },
    { key: "Théâtre", label: "🎭 Théâtre / Spectacle" },
    { key: "Musique", label: "🎵 Musique" },
    { key: "Marché", label: "🛍️ Marché" },
    { key: "Festival", label: "🎉 Festival" },
   { key: "Soirée", label: "🎟️ Culture" },
    { key: "Sport", label: "⚽ Sport" },
    { key: "Expo", label: "🖼️ Expo" },
  ];

  const AMBIANCES = [
    { key: "festive", label: "🎊 Festive", boost: ["Bar", "Soirée", "Festival", "Musique"] },
    { key: "calme", label: "🧘 Calme et culturelle", boost: ["À voir", "Théâtre", "Expo"] },
    { key: "originale", label: "🎲 Originale", boost: [] },
  ];

  let questSelectedCats = [];
  let questAmbiance = null;

  function walkingTimeLabel(km) {
    const minutes = Math.max(2, Math.round((km * 12) / 5) * 5);
    return minutes + " min à pied";
  }

  function questGetCandidates() {
    const ref = referencePoint();
    const cityKey = state.userPos ? nearestCityKey() : state.city;
    const today = new Date().toISOString().slice(0, 10);
    const cats = questSelectedCats.length ? questSelectedCats : QUEST_CATEGORIES.map(function (c) { return c.key; });

    let list = allEvents().filter(function (ev) {
      if (ev.city !== cityKey || !ev.lat || !ev.lng) return false;
      if (!cats.includes(ev.category)) return false;
      if (!ev.isPlace && ev.date && ev.date < today) return false;
      return true;
    });

    list = list.map(function (ev) {
      const dist = haversineKm(ref.lat, ref.lng, ev.lat, ev.lng);
      const ambianceDef = AMBIANCES.find(function (a) { return a.key === questAmbiance; });
      const boost = ambianceDef && ambianceDef.boost.includes(ev.category) ? 1 : 0;
      return { ev: ev, dist: dist, boost: boost };
    });

        if (questAmbiance === "originale") {
      list = list.filter(function (item) { return item.dist <= 3; });
      list = list.sort(function () { return Math.random() - 0.5; });
    } else {
      list = list.sort(function (a, b) {
        if (a.boost !== b.boost) return b.boost - a.boost;
        return a.dist - b.dist;
      });
    }   
    // dédoublonner par catégorie pour varier le parcours
    const seenCats = {};
    const picked = [];
    for (const item of list) {
      const c = item.ev.category;
      if (seenCats[c] && picked.length < list.length) continue;
      seenCats[c] = true;
      picked.push(item);
      if (picked.length >= 3) break;
    }
    if (picked.length < 3) {
      for (const item of list) {
        if (picked.length >= 3) break;
        if (!picked.includes(item)) picked.push(item);
      }
    }
    return picked;
  }

  function questRenderResult() {
const overlay = document.getElementById("quest-overlay");
const catLabel = questSelectedCats.length
? questSelectedCats.join(", ")
: "Surprends-moi";
const ambianceDef = AMBIANCES.find(function (a) { return a.key === questAmbiance; });
const picked = questGetCandidates();

let stepsHtml = "";
if (!picked.length) {
stepsHtml = '<p style="color:#9BA5C2; font-size:13px; text-align:center; padding:20px 0;">Rien trouvé pour ce parcours pour le moment.</p>';
} else {
const intros = ["Commence par", "Puis direction", "Pour finir"];
stepsHtml = picked
.map(function (item, i) {
const intro = intros[i] || "Ensuite";
const catColor = (typeof CATEGORY_COLORS !== "undefined" && CATEGORY_COLORS[item.ev.category]) || "#8B6CF2";
const catIcon = (typeof CATEGORY_ICONS !== "undefined" && CATEGORY_ICONS[item.ev.category]) || "📍";
return (
'<div style="display:flex; gap:12px; margin-bottom:' + (i < picked.length - 1 ? "14px" : "0") + ';">' +
'<div style="display:flex; flex-direction:column; align-items:center;">' +
'<div style="width:38px; height:38px; border-radius:999px; background:' + catColor + '; box-shadow:0 4px 12px -4px ' + catColor + '99; color:#fff; font-size:16px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">' + catIcon + "</div>" +
(i < picked.length - 1 ? '<div style="width:2px; flex:1; background:repeating-linear-gradient(180deg, rgba(255,255,255,0.18) 0 5px, transparent 5px 10px); margin:4px 0;"></div>' : "") +
"</div>" +
'<div style="flex:1; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:14px; padding:11px 14px; padding-bottom:' + (i < picked.length - 1 ? "11px" : "11px") + ';">' +
'<div style="font-size:10px; font-weight:700; color:' + catColor + '; text-transform:uppercase; letter-spacing:0.3px;">' + intro + "</div>" +
'<button class="quest-step-btn" data-id="' + item.ev.id + '" style="background:none;border:none;padding:0;text-align:left;cursor:pointer;display:block;margin-top:2px;">' +
'<div style="font-size:14px; font-weight:700; color:#fff;">' + item.ev.title + "</div>" +
"</button>" +
'<div style="font-size:11px; color:#9BA5C2; margin-top:4px;">🚶 ' + walkingTimeLabel(item.dist) + (item.ev.place ? " · " + item.ev.place : "") + "</div>" +
"</div></div>"
);
})
.join("");
}

overlay.innerHTML =
'<div style="width:100%; max-width:420px; box-sizing:border-box;">' +
'<button id="quest-back" style="display:block; margin:0 0 14px; padding:8px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.15); background:transparent; color:#fff; font-size:12px; cursor:pointer;">← Retour aux 3 choix</button>' +
'<div style="background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:20px; padding:20px;">' +
'<div style="font-family:\'Fraunces\', Georgia, serif; font-size:19px; font-weight:600; color:#fff; margin-bottom:2px;">Ton parcours</div>' +
'<div style="font-size:11px; color:#9BA5C2; margin-bottom:16px;">' + catLabel + " · " + (ambianceDef ? ambianceDef.label : "") + "</div>" +
stepsHtml +
"</div>" +
'<button id="quest-ai-btn" style="width:100%; margin-top:14px; padding:13px; border-radius:999px; border:none; background:linear-gradient(90deg, #F2864B, #E85D3D); color:#fff; font-size:13px; font-weight:700; box-shadow:0 8px 18px -8px rgba(242,134,75,0.5); cursor:pointer;">✨ Enrichir Whazup</button>' +
'<div id="quest-ai-result" style="display:none; margin-top:14px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:16px;"></div>' +
'<button id="quest-redo" style="width:100%; margin-top:14px; padding:12px; border-radius:999px; border:1px solid rgba(255,255,255,0.15); background:transparent; color:#9BA5C2; font-size:13px; cursor:pointer;">🔄 Refaire un parcours</button>' +
"</div>" +
'<div class="wz-navbar" style="position:fixed; left:0; right:0; bottom:0; display:flex; align-items:center; justify-content:space-around; padding:12px 10px calc(12px + env(safe-area-inset-bottom, 0px)); background:rgba(9,13,26,0.85); backdrop-filter:blur(6px); border-top:1px solid rgba(255,255,255,0.08); z-index:2;">' +
'<div class="wz-navbar-item" data-nav="decouvre" style="display:flex; flex-direction:column; align-items:center; gap:4px; color:#F2864B; cursor:pointer;"><span style="font-size:16px;">🧭</span><span style="font-size:9.5px; font-weight:700;">Découvre</span></div>' +
'<div class="wz-navbar-item" data-nav="explore" style="display:flex; flex-direction:column; align-items:center; gap:4px; color:#5C6690; cursor:pointer;"><span style="font-size:16px;">🗺️</span><span style="font-size:9.5px; font-weight:600;">Explore</span></div>' +
'<div class="wz-navbar-item" data-nav="visite" style="display:flex; flex-direction:column; align-items:center; gap:4px; color:#5C6690; cursor:pointer;"><span style="font-size:16px;">🏙️</span><span style="font-size:9.5px; font-weight:600;">Visite</span></div>' +
'<div class="wz-navbar-item" data-nav="memorise" style="display:flex; flex-direction:column; align-items:center; gap:4px; color:#5C6690; cursor:pointer;"><span style="font-size:16px;">📖</span><span style="font-size:9.5px; font-weight:600;">Mémorise</span></div>' +
'<div class="wz-navbar-item" data-nav="partage" style="display:flex; flex-direction:column; align-items:center; gap:4px; color:#5C6690; cursor:pointer;"><span style="font-size:16px;">🔗</span><span style="font-size:9.5px; font-weight:600;">Partage</span></div>' +
"</div>";

overlay.style.paddingBottom = "84px";

document.getElementById("quest-back").addEventListener("click", function () {
overlay.remove();
__arrivalShow();
});

document.getElementById("quest-ai-btn").addEventListener("click", function () {
const btn = document.getElementById("quest-ai-btn");
const resultBox = document.getElementById("quest-ai-result");
btn.textContent = "✨ Rédaction en cours...";
btn.disabled = true;
const cityKey = state.userPos ? nearestCityKey() : state.city;
const cityName = CITIES[cityKey] ? CITIES[cityKey].name : "";
const now = new Date();
const timeLabel = now.getHours() + "h" + String(now.getMinutes()).padStart(2, "0");
const items = picked.map(function (item) {
return {
title: item.ev.title,
category: item.ev.category,
date: item.ev.isPlace ? null : item.ev.date,
time: item.ev.time || null,
place: item.ev.place,
distanceMin: walkingTimeLabel(item.dist).replace(" min à pied", ""),
};
});
fetch("https://tight-hill-1359.ericbrunebarbe.workers.dev/enrich", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
items: items,
question: catLabel,
context: { cityName: cityName, time: timeLabel },
}),
})
.then(function (r) { return r.json(); })
.then(function (data) {
resultBox.style.display = "block";
resultBox.innerHTML =
'<div style="font-size:10.5px; color:#F2A57E; font-weight:700; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.3px;">✨ Whazup enrichi</div>' +
'<div style="font-family:\'Fraunces\', Georgia, serif; font-size:13.5px; line-height:1.6; color:#fff; white-space:pre-wrap;" id="quest-ai-text"></div>';
btn.remove();
const target = document.getElementById("quest-ai-text");
const fullText = data.text || "Une erreur est survenue, réessaie.";
let i = 0;
function typeStep() {
if (i < fullText.length) {
target.textContent += fullText[i];
i++;
setTimeout(typeStep, 12);
} else {
const followWrap = document.createElement("div");
followWrap.style.cssText = "display:flex; gap:8px; margin-top:14px;";
followWrap.innerHTML =
'<input id="quest-ai-followup" type="text" placeholder="Réponds-lui..." style="flex:1; border:1px solid #eee; border-radius:999px; padding:10px 14px; font-size:13px; font-family:inherit;">' +
'<button id="quest-ai-followup-btn" style="padding:10px 16px; border-radius:999px; border:none; background:#14213D; color:#fff; font-size:13px; cursor:pointer;">➤</button>';
resultBox.appendChild(followWrap);
document.getElementById("quest-ai-followup-btn").addEventListener("click", sendFollowup);
document.getElementById("quest-ai-followup").addEventListener("keydown", function (e) {
if (e.key === "Enter") sendFollowup();
});
}
}
typeStep();

function sendFollowup() {
const input = document.getElementById("quest-ai-followup");
const question = input.value.trim();
if (!question) return;
const w = document.getElementById("quest-ai-followup");
if (w && w.parentElement) w.parentElement.remove();
const newBlock = document.createElement("div");
newBlock.style.cssText = "margin-top:14px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.1);";
newBlock.innerHTML = '<div style="font-size:12px; color:#9BA5C2; font-style:italic; margin-bottom:8px;">Toi : ' + question + '</div><div style="font-family:\'Fraunces\', Georgia, serif; font-size:13.5px; line-height:1.6; color:#fff; white-space:pre-wrap;" id="quest-ai-text2">✨</div>';
resultBox.appendChild(newBlock);
fetch("https://tight-hill-1359.ericbrunebarbe.workers.dev/enrich", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({
items: items,
question: question,
context: { cityName: cityName, time: timeLabel },
}),
})
.then(function (r) { return r.json(); })
.then(function (d2) {
const target2 = document.getElementById("quest-ai-text2");
target2.textContent = "";
const text2 = d2.text || "Une erreur est survenue.";
let j = 0;
function typeStep2() {
if (j < text2.length) {
target2.textContent += text2[j];
j++;
setTimeout(typeStep2, 12);
}
}
typeStep2();
});
}
})
.catch(function () {
resultBox.style.display = "block";
resultBox.innerHTML = '<div style="color:#c0392b; font-size:13px;">Erreur lors de la génération, réessaie.</div>';
btn.textContent = "✨ Enrichir Whazup";
btn.disabled = false;
});
});
document.getElementById("quest-redo").addEventListener("click", questShowStep1);
overlay.querySelectorAll(".quest-step-btn").forEach(function (btn) {
btn.addEventListener("click", function () {
overlay.remove();
openDetail(btn.dataset.id);
});
});
overlay.querySelectorAll(".wz-navbar-item").forEach(function (item) {
item.addEventListener("click", function () {
const nav = item.dataset.nav;
if (nav === "decouvre") { overlay.remove(); if (window.__arrivalShow) __arrivalShow(); }
else if (nav === "explore") { overlay.remove(); if (window.__exploreOpen) __exploreOpen(); }
else if (nav === "visite") { overlay.remove(); if (window.__arrivalShowCityView) __arrivalShowCityView(); }
else if (nav === "memorise") { overlay.remove(); if (window.__renderSouvenirsScreen) __renderSouvenirsScreen(); }
else if (nav === "partage") { if (window.__arrivalShareCity) __arrivalShareCity(); }
});
});
}

  function questShowStep2() {
    const overlay = document.getElementById("quest-overlay");
    overlay.innerHTML =
      '<div style="width:100%; max-width:420px; box-sizing:border-box;">' +
      '<div style="background:#14213D; border:1px solid rgba(255,255,255,0.15); border-radius:20px; padding:20px;">' +
      '<div style="color:#fff; font-size:11px; opacity:0.7; margin-bottom:10px;">ÉTAPE 2/2</div>' +
      '<div style="color:#fff; font-size:16px; font-weight:700; margin-bottom:14px;">Quelle ambiance ?</div>' +
      '<div id="quest-ambiance-list" style="display:flex; flex-direction:column; gap:8px;"></div>' +
      '<button id="quest-see-result" style="margin-top:16px;width:100%;padding:11px;border-radius:999px;border:none;background:#E85D3D;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">Voir mon parcours</button>' +
      "</div></div>";

    const list = document.getElementById("quest-ambiance-list");
    AMBIANCES.forEach(function (a) {
      const btn = document.createElement("button");
      btn.textContent = a.label;
      btn.style.cssText = "padding:12px;border-radius:12px;border:none;background:rgba(255,255,255,0.1);color:#fff;font-size:13px;text-align:left;cursor:pointer;";
      btn.addEventListener("click", function () {
        questAmbiance = a.key;
        Array.from(list.children).forEach(function (b) {
          b.style.background = "rgba(255,255,255,0.1)";
          b.style.color = "#fff";
          b.style.fontWeight = "400";
        });
        btn.style.background = "#fff";
        btn.style.color = "#14213D";
        btn.style.fontWeight = "600";
      });
      list.appendChild(btn);
    });

    document.getElementById("quest-see-result").addEventListener("click", function () {
      if (!questAmbiance) questAmbiance = "originale";
      questRenderResult();
    });
  }

  function questShowStep1() {
    questSelectedCats = [];
    questAmbiance = null;
    let overlay = document.getElementById("quest-overlay");
    if (!overlay) {
overlay = document.createElement("div");
overlay.id = "quest-overlay";
overlay.style.cssText = "position:fixed; inset:0; background:linear-gradient(165deg, #0E1526 0%, #141C36 55%, #1B1440 100%); z-index:9999; display:flex; flex-direction:column; align-items:center; padding:50px 20px 20px; overflow-y:auto;";
document.body.appendChild(overlay);
}
overlay.style.paddingBottom = "20px";

    overlay.innerHTML =
      '<div style="width:100%; max-width:420px; box-sizing:border-box;">' +
      '<div style="background:#14213D; border:1px solid rgba(255,255,255,0.15); border-radius:20px; padding:20px;">' +
      '<div style="color:#fff; font-size:11px; opacity:0.7; margin-bottom:10px;">ÉTAPE 1/2</div>' +
      '<div style="color:#fff; font-size:16px; font-weight:700; margin-bottom:4px;">Qu\'est-ce qui te tente ?</div>' +
      '<div style="color:rgba(255,255,255,0.6); font-size:11px; margin-bottom:14px;">Choisis-en autant que tu veux</div>' +
      '<div id="quest-cats-list" style="display:flex; flex-wrap:wrap; gap:8px;"></div>' +
      '<button id="quest-continue" style="margin-top:16px;width:100%;padding:11px;border-radius:999px;border:none;background:#E85D3D;color:#fff;font-size:13px;font-weight:600;cursor:pointer;">Continuer</button>' +
      '<button id="quest-cancel" style="margin-top:10px;width:100%;padding:10px;border-radius:999px;border:1px solid rgba(255,255,255,0.3);background:transparent;color:#fff;font-size:12px;cursor:pointer;">← Retour aux 3 choix</button>' +
      "</div></div>";

    const list = document.getElementById("quest-cats-list");
    QUEST_CATEGORIES.forEach(function (c) {
      const btn = document.createElement("button");
      btn.textContent = c.label;
      const catColor = (typeof categoryColor === "function") ? categoryColor(c.key) : "rgba(255,255,255,0.1)";
      btn.style.cssText = "padding:9px 14px;border-radius:999px;border:none;background:" + catColor + ";color:#fff;font-size:12px;font-weight:600;cursor:pointer;";
      btn.addEventListener("click", function () {
        const idx = questSelectedCats.indexOf(c.key);
        if (idx === -1) {
          questSelectedCats.push(c.key);
          btn.style.background = "#fff";
          btn.style.color = "#14213D";
          btn.style.fontWeight = "600";
        } else {
          questSelectedCats.splice(idx, 1);
          btn.style.background = "rgba(255,255,255,0.1)";
          btn.style.color = "#fff";
          btn.style.fontWeight = "400";
        }
      });
      list.appendChild(btn);
    });

    const surpriseBtn = document.createElement("button");
    surpriseBtn.textContent = "✨ Surprends-moi";
    surpriseBtn.style.cssText = "padding:9px 14px;border-radius:999px;border:1px dashed rgba(255,255,255,0.5);background:transparent;color:#fff;font-size:12px;cursor:pointer;";
    surpriseBtn.addEventListener("click", function () {
      questSelectedCats = [];
      Array.from(list.children).forEach(function (b) {
        b.style.background = "rgba(255,255,255,0.1)";
        b.style.color = "#fff";
        b.style.fontWeight = "400";
      });
      questShowStep2();
    });
    list.appendChild(surpriseBtn);

    document.getElementById("quest-continue").addEventListener("click", questShowStep2);
    document.getElementById("quest-cancel").addEventListener("click", function () {
      overlay.remove();
      __arrivalShow();
    });
  }

  window.__questOpen = questShowStep1;
})();
