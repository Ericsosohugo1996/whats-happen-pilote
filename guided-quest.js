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
    { key: "Soirée", label: "🎊 Soirée" },
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
      stepsHtml = '<p style="color:#888; font-size:13px; text-align:center; padding:20px 0;">Rien trouvé pour ce parcours pour le moment.</p>';
    } else {
      const intros = ["Commence par", "Puis direction", "Pour finir"];
      stepsHtml = picked
        .map(function (item, i) {
          const intro = intros[i] || "Ensuite";
          return (
            '<div style="display:flex; gap:12px; margin-bottom:' + (i < picked.length - 1 ? "16px" : "0") + ';">' +
            '<div style="display:flex; flex-direction:column; align-items:center;">' +
            '<div style="width:30px; height:30px; border-radius:999px; background:#E85D3D; color:#fff; font-size:13px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0;">' + (i + 1) + "</div>" +
            (i < picked.length - 1 ? '<div style="width:2px; flex:1; background:#eee; margin:4px 0;"></div>' : "") +
            "</div>" +
            '<div style="padding-bottom:4px;">' +
            '<button class="quest-step-btn" data-id="' + item.ev.id + '" style="background:none;border:none;padding:0;text-align:left;cursor:pointer;">' +
            '<div style="font-size:13px; font-weight:700; color:#14213D;">' + intro + " " + item.ev.title + "</div>" +
            "</button>" +
            '<div style="font-size:11px; color:#E85D3D; font-weight:600; margin-top:2px;">🚶 ' + walkingTimeLabel(item.dist) + "</div>" +
            '<div style="font-size:11px; color:#666; margin-top:2px;">' + (item.ev.place || "") + "</div>" +
            "</div></div>"
          );
        })
        .join("");
    }

    overlay.innerHTML =
      '<div style="width:100%; max-width:420px; box-sizing:border-box;">' +
      '<button id="quest-back" style="display:block; margin:0 0 14px; padding:8px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:12px; cursor:pointer;">← Retour aux 3 choix</button>' +
      '<div style="background:#fff; border-radius:20px; padding:20px;">' +
      '<div style="font-size:16px; font-weight:800; color:#14213D; margin-bottom:2px;">🗺️ Ton parcours</div>' +
      '<div style="font-size:11px; color:#888; margin-bottom:16px;">' + catLabel + " · " + (ambianceDef ? ambianceDef.label : "") + "</div>" +
      stepsHtml +
      "</div>" +
      '<button id="quest-redo" style="width:100%; margin-top:14px; padding:12px; border-radius:999px; border:1px solid rgba(255,255,255,0.3); background:transparent; color:#fff; font-size:13px; cursor:pointer;">🔄 Refaire un parcours</button>' +
      "</div>";

    document.getElementById("quest-back").addEventListener("click", function () {
      overlay.remove();
      __arrivalShow();
    });
    document.getElementById("quest-redo").addEventListener("click", questShowStep1);
    overlay.querySelectorAll(".quest-step-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        overlay.remove();
        openDetail(btn.dataset.id);
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
      overlay.style.cssText = "position:fixed; inset:0; background:#14213D; z-index:9999; display:flex; flex-direction:column; align-items:center; padding:50px 20px 20px; overflow-y:auto;";
      document.body.appendChild(overlay);
    }

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
      btn.style.cssText = "padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,0.3);background:rgba(255,255,255,0.1);color:#fff;font-size:12px;cursor:pointer;";
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
