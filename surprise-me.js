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

function pickSurprise(timeKey, excludeId) {
  const radiusKm = SURPRISE_TIME_KM[timeKey];
  let candidates = surpriseCandidates(radiusKm, false);
  let relaxed = false;
  if (candidates.length === 0) {
    candidates = surpriseCandidates(radiusKm, true);
    relaxed = true;
  }
  if (candidates.length === 0) return null;
  const pool = (excludeId && candidates.length > 1) ? candidates.filter((c) => c.id !== excludeId) : candidates;
  const pick = pool[Math.floor(Math.random() * pool.length)];
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

// ---- « À ne pas manquer » : les lieux incontournables de la ville ----
function mustSeeList(max) {
  const ref = referencePoint();
  const GOOD = /mus[ée]e|ch[âa]teau|cath[ée]drale|basilique|abbaye|jardin|parc |palais|tour |monument|forteresse|citadelle|fort |grotte|panorama|remparts|op[ée]ra|[ée]glise|chapelle|vieux|historique|patrimoine|place |pont /i;
  const BAD = /biblioth[èe]que|m[ée]diath[èe]que|archives|cours |atelier|stage|boutique|restaurant|location|vente|gîte|camping|salle des f/i;
  const seen = new Set();
  return allEvents()
    .filter((ev) => ev.isPlace && ev.category === "À voir" && ev.title && (state.userPos ? true : ev.city === state.city))
    .filter((ev) => { const k = String(ev.title).toLowerCase().replace(/[^a-z0-9]+/g, ""); if (seen.has(k)) return false; seen.add(k); return true; })
    .map((ev) => {
      const d = haversineKm(ref.lat, ref.lng, ev.lat, ev.lng);
      const score = Math.min(String(ev.description || "").length, 400) + (ev.photo || ev.thumb ? 150 : 0) + (GOOD.test(ev.title) ? 400 : 0) - (BAD.test(ev.title) ? 900 : 0) - Math.min(d, 30) * 8;
      return { ev, d, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, max);
}

function __wdOpen(w, cityName) {
  const norm = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const b = norm(w.title);
  // 1) le même lieu existe déjà dans l'appli (lieux « À voir ») : on ouvre sa fiche
  const found = b.length >= 6 && allEvents().find((e) => e.isPlace && (state.userPos ? true : e.city === state.city) && (() => { const a = norm(e.title); return a === b || a.includes(b) || b.includes(a); })());
  if (found) { openDetail(found.id); return; }
  // 2) sinon on ajoute le lieu à l'appli, puis on ouvre sa fiche (itinéraire à pied intégré comme d'habitude)
  const id = "wd-" + (w.id || b.replace(/ /g, "-"));
  if (Array.isArray(state.dataTourismePlaces) && !allEvents().some((e) => e.id === id)) {
    state.dataTourismePlaces.push({
      id, isPlace: true, scene: "expo", city: state.city, category: "À voir",
      title: w.title.charAt(0).toUpperCase() + w.title.slice(1), date: null, time: "", place: cityName,
      lat: w.lat, lng: w.lng, price: "Voir sur place", thumb: "", source: "wikidata",
      description: w.description ? w.description.charAt(0).toUpperCase() + w.description.slice(1) + "." : "",
      photo: w.image ? w.image + (w.image.indexOf("?") < 0 ? "?width=800" : "") : "", photoCredit: w.image ? "Wikimedia Commons" : ""
    });
  }
  openDetail(id);
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
      '<button type="button" class="chip-btn" id="surprise-must" style="text-align:left; font-weight:700;">🏛️ À ne pas manquer ici</button>' +
    '</div>' +
    '<div id="surprise-result" style="display:none; margin-top:10px;"></div>';
  cityInfo.parentNode.insertBefore(block, cityInfo.nextSibling);

  block.querySelector("#surprise-btn").onclick = () => {
    const timeStep = block.querySelector("#surprise-time-step");
    const result = block.querySelector("#surprise-result");
    result.style.display = "none";
    timeStep.style.display = timeStep.style.display === "none" ? "flex" : "none";
  };

  function renderSurpriseResult(timeKey, excludeId) {
    const outcome = pickSurprise(timeKey, excludeId);
    const timeStep = block.querySelector("#surprise-time-step");
    const result = block.querySelector("#surprise-result");
    timeStep.style.display = "none";
    if (!outcome) {
      result.innerHTML =
        '<div style="display:flex; align-items:flex-start; gap:10px;">' +
          '<img src="logo.svg" alt="" style="width:32px;height:32px;border-radius:50%;background:#14213D;padding:6px;flex:0 0 auto;box-shadow:0 4px 10px -4px rgba(0,0,0,.3);">' +
          '<div style="background:#fff; border-radius:4px 16px 16px 16px; padding:12px 14px; border:0.5px solid rgba(0,0,0,0.08); font-size:13px; color:#666; flex:1;">Aucun événement trouvé pour l\'instant dans ce rayon. Essayez un temps plus large.</div>' +
        '</div>';
      result.style.display = "block";
      return;
    }
    const ev = outcome.pick;
    const photoUrl = ev.photo || (typeof CATEGORY_PHOTOS !== "undefined" && CATEGORY_PHOTOS[ev.category]) || (typeof CITY_PHOTOS !== "undefined" && CITY_PHOTOS[ev.city]) || "";
    result.innerHTML =
      '<div style="display:flex; align-items:flex-start; gap:10px;">' +
        '<img src="logo.svg" alt="" style="width:32px;height:32px;border-radius:50%;background:#14213D;padding:6px;flex:0 0 auto;box-shadow:0 4px 10px -4px rgba(0,0,0,.3);">' +
        '<div style="flex:1; min-width:0;">' +
          '<div style="background:#fff; border-radius:4px 16px 16px 16px; padding:10px 13px; font-size:12.5px; color:#333; margin-bottom:8px; box-shadow:0 4px 10px -6px rgba(0,0,0,.15);">J\'ai trouvé une idée pour toi 👇</div>' +
          '<div style="background:#fff; border-radius:14px; overflow:hidden; border:0.5px solid rgba(0,0,0,0.08); cursor:pointer; box-shadow:0 6px 16px -10px rgba(0,0,0,.25);" id="surprise-card">' +
            (photoUrl
              ? '<div style="height:120px; background-image:url(\'' + photoUrl + '\'); background-size:cover; background-position:center;"></div>'
              : "") +
            '<div style="padding:14px;">' +
              '<span style="font-size:10.5px; font-weight:600; color:#E8604C; text-transform:uppercase;">' + ev.category + '</span>' +
              '<div style="font-weight:600; font-size:14.5px; margin:4px 0;">' + ev.title + '</div>' +
              '<div style="font-size:12px; color:#777; margin-bottom:8px;">' + formatDate(ev.date) + (ev.time ? " · " + ev.time : "") + " · " + (Math.round(ev.distance * 10) / 10) + ' km</div>' +
              '<div style="font-size:11.5px; color:#E8604C; background:rgba(232,96,76,0.08); border-radius:8px; padding:6px 8px;">' + outcome.reason + '</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex; gap:8px; margin-top:8px;">' +
            '<button type="button" id="surprise-go" style="flex:1; padding:10px; border-radius:10px; border:none; background:linear-gradient(135deg,#E8604C,#c94a38); color:#fff; font-size:12.5px; font-weight:700; cursor:pointer;">J\'y vais</button>' +
            '<button type="button" id="surprise-reroll" style="flex:1; padding:10px; border-radius:10px; border:1px solid rgba(20,33,61,0.15); background:#fff; color:#14213D; font-size:12.5px; font-weight:700; cursor:pointer;">🔁 Une autre idée</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    result.querySelector("#surprise-card").onclick = () => openDetail(ev.id);
    result.querySelector("#surprise-go").onclick = () => openDetail(ev.id);
    result.querySelector("#surprise-reroll").onclick = () => renderSurpriseResult(timeKey, ev.id);
    result.style.display = "block";
  }

  block.querySelectorAll("[data-surprise-time]").forEach((btn) => {
    btn.onclick = () => renderSurpriseResult(btn.dataset.surpriseTime, null);
  });

  block.querySelector("#surprise-must").onclick = async () => {
    const timeStep = block.querySelector("#surprise-time-step");
    const result = block.querySelector("#surprise-result");
    timeStep.style.display = "none";
    const cityName = (typeof CITIES !== "undefined" && CITIES[state.city] && CITIES[state.city].name) || "ici";
    const esc = (t) => String(t == null ? "" : t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    // 1) lieux les plus célèbres (Wikidata, mis à jour chaque mois) ; 2) à défaut, les lieux « À voir » déjà dans l'appli
    let items = [];
    try {
      const r = await fetch("data/wikidata/" + encodeURIComponent(state.city) + ".json", { cache: "force-cache" });
      if (r.ok) {
        const wd = await r.json();
        if (Array.isArray(wd) && wd.length >= 3) {
          const ref = referencePoint();
          items = wd.slice(0, 8).map((w) => ({
            title: w.title.charAt(0).toUpperCase() + w.title.slice(1),
            desc: w.description ? w.description.charAt(0).toUpperCase() + w.description.slice(1) : "",
            photo: w.image ? w.image + (w.image.indexOf("?") < 0 ? "?width=240" : "") : "",
            d: (w.lat != null && w.lng != null) ? haversineKm(ref.lat, ref.lng, w.lat, w.lng) : null,
            w
          }));
        }
      }
    } catch (e) {}
    if (!items.length) {
      items = mustSeeList(8).map((x) => ({
        title: x.ev.title,
        desc: String(x.ev.description || "").replace(/\s+/g, " ").trim(),
        photo: x.ev.photo || x.ev.thumb || "",
        d: x.d, id: x.ev.id
      }));
    }
    if (!items.length) {
      result.innerHTML = '<div style="background:#fff; border-radius:14px; padding:12px 14px; border:0.5px solid rgba(0,0,0,0.08); font-size:13px; color:#666;">Pas encore de lieux à te recommander ici. Reviens bientôt !</div>';
      result.style.display = "block";
      return;
    }
    result.innerHTML =
      '<div style="background:#fff; border-radius:4px 16px 16px 16px; padding:10px 13px; font-size:12.5px; color:#333; margin-bottom:8px; box-shadow:0 4px 10px -6px rgba(0,0,0,.15);">À ne pas manquer à <b>' + esc(cityName) + '</b> 👇</div>' +
      items.map((x, i) => {
        const desc = x.desc;
        return '<div data-must="' + i + '" style="display:flex; gap:10px; background:#fff; border-radius:14px; overflow:hidden; border:0.5px solid rgba(0,0,0,0.08); box-shadow:0 6px 16px -10px rgba(0,0,0,.25); margin-bottom:8px; cursor:pointer;">' +
          (x.photo ? '<div style="flex:0 0 84px; background-color:#14213D; background-image:url(\'' + esc(x.photo) + '\'); background-size:cover; background-position:center;"></div>' : '<div style="flex:0 0 84px; background:#14213D; color:#fff; display:flex; align-items:center; justify-content:center; font-size:26px;">🏛️</div>') +
          '<div style="padding:10px 12px 10px 0; min-width:0; flex:1;">' +
            '<div style="font-weight:700; font-size:14px; line-height:1.25;">' + esc(x.title) + '</div>' +
            (x.d != null ? '<div style="font-size:11.5px; color:#777; margin:2px 0 4px;">' + (Math.round(x.d * 10) / 10) + ' km</div>' : '<div style="height:4px;"></div>') +
            (desc ? '<div style="font-size:12px; color:#555; line-height:1.35;">' + esc(desc.length > 110 ? desc.slice(0, 110).replace(/\s+\S*$/, "") + "…" : desc) + '</div>' : "") +
          '</div></div>';
      }).join("");
    result.querySelectorAll("[data-must]").forEach((el) => {
      const x = items[+el.dataset.must];
      el.onclick = () => { if (x.id) openDetail(x.id); else if (x.w) __wdOpen(x.w, cityName); };
    });
    result.style.display = "block";
  };

  return block;
}

const __renderLocateBarBaseSurprise = renderLocateBar;
renderLocateBar = function () {
  __renderLocateBarBaseSurprise();
  if (typeof __hasPickedCity !== "undefined" && __hasPickedCity) {
    __ensureSurpriseUI();
  }
};


// ---- « À ne pas manquer » dans l'écran « Ta surprise » (le panneau de l'accueil) ----
// Se greffe sur le panneau existant (#wz-idea) : ajoute un bouton au-dessus de « Plus de choix », sans toucher à ce panneau.
(function () {
  "use strict";
  var wdCache = {};
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function norm(t) { return String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
  function track(n) { try { if (typeof analytics !== "undefined" && analytics && analytics.logEvent) analytics.logEvent(n, { city: state.city }); } catch (e) {} }
  function cityName() { return (typeof CITIES !== "undefined" && CITIES[state.city] && CITIES[state.city].name) || "ici"; }

  var THEMES = { musique: ["Musique"], soiree: ["Soirée"], spectacle: ["Spectacles"], famille: ["Famille"], marche: ["Marché"], festival: ["Festival"], sport: ["Sport"], bar: ["Bar"], expo: ["Expo"], musee: ["À voir"] };
  var MUSEUM_RE = /mus[eé]e|museum|mus[eé]um|galerie|fondation|centre d.art|ch[aâ]teau|panth[eé]on|catacombes|tour eiffel|arc de triomphe|sainte.chapelle|cath[eé]drale|basilique|abbaye|conciergerie|invalides|op[eé]ra/i;
  // thème choisi dans « Ta surprise » (puce allumée) ; null = « Peu importe »
  function theme() {
    var on = document.querySelector('#wz-idea [data-i="swant"].on');
    var k = on && on.getAttribute("data-v");
    if (!k || !THEMES[k]) return null;
    return { key: k, cats: THEMES[k], label: on.textContent.trim() };
  }
  function isoDay(off) { return new Date(Date.now() + off * 86400000).toISOString().slice(0, 10); }
  // sorties municipales, ateliers, conférences… : utiles, mais pas « à ne pas manquer »
  var NOISE_RE = /s[ée]nior|biblioth[èe]que|m[ée]diath[èe]que|paris anim|centre social|atelier|stage|cours |cours$|initiation|conf[ée]rence|r[ée]union|permanence|inscription|remise d[eu]|projection|caf[ée] (?:ciné|philo)|th[ée]s? dansants?|visite guid|jeu de piste|assembl[ée]e|club de|mairie|salle des f|portes? ouvertes?/i;
  // les meilleures sorties à venir (14 jours) du thème : billetterie et lieux connus d'abord, une seule par titre, 2 par lieu
  function themeEvents(th) {
    var nowD = new Date(), from = isoDay(0), to = isoDay(14), hm = ("0" + nowD.getHours()).slice(-2) + ":" + ("0" + nowD.getMinutes()).slice(-2);
    var ref = (typeof referencePoint === "function") ? referencePoint() : null, seen = {}, venues = {};
    return allEvents().filter(function (e) {
      if (e.isPlace || th.cats.indexOf(e.category) === -1 || !e.date || e.date < from || e.date > to) return false;
      if (!(state.userPos ? true : e.city === state.city)) return false;
      if (e.date === from && e.time && /^\d\d:\d\d/.test(e.time) && e.time.slice(0, 5) < hm) return false;   // déjà commencé
      var t = String(e.title || "");
      if (NOISE_RE.test(t)) return false;
      if (th.key === "marche") return /march[ée]|brocante|puces|foire|salon/i.test(t) && !/sportive|nordique|entretien|paris sport/i.test(t);
      if (th.key === "sport") return !/paris sport|sportives?\b|multisports|baby/i.test(t) && (e.source === "ticketmaster" || /match|tournoi|coupe|championnat|course|marathon|trail|finale|open|gala/i.test(t));
      if (th.key === "festival") return /festival|f[êe]te|salon|nuit de/i.test(t) || e.source === "ticketmaster";
      return true;
    })
      .map(function (e) {
        var d = (ref && e.lat && e.lng) ? haversineKm(ref.lat, ref.lng, e.lat, e.lng) : 0;
        var days = Math.max(0, (new Date(e.date) - new Date(from)) / 86400000);
        var pr = String(e.price || "");
        var sc = (e.source === "ticketmaster" ? 500 : 0) + (/billetterie/i.test(pr) ? 150 : 0) + (e.photo || e.thumb ? 150 : 0) + (e.time ? 60 : 0) +
          Math.min(String(e.description || "").length, 120) + (/gratuit|libre/i.test(pr) ? 30 : 0) + (e.source === "paris-opendata" ? -120 : 0) - days * 10 - Math.min(d, 20) * 4;
        return { e: e, sc: sc };
      })
      .sort(function (a, b) { return b.sc - a.sc; })
      .filter(function (x) {
        var k = norm(x.e.title), v = norm(String(x.e.place || "").split(",")[0]);
        if (seen[k]) return false; seen[k] = 1;
        if (v) { venues[v] = (venues[v] || 0) + 1; if (venues[v] > 2) return false; }
        return true;
      })
      .slice(0, 8).map(function (x) { return x.e; });
  }

  function css() {
    if (document.getElementById("wz-m-css")) return;
    var st = document.createElement("style"); st.id = "wz-m-css";
    st.textContent = "#wz-idea .wz-m-sub{color:#9BA5C2;font-size:14px;margin:-6px 0 14px}#wz-idea .wz-m-src{color:#9BA5C2;font-size:11.5px;margin:6px 0 14px}#wz-idea .wz-i-card .wz-i-ph{height:132px}";
    document.head.appendChild(st);
  }

  // fiche utilisable dans l'appli : le lieu existe déjà (lieux « À voir »), sinon on l'ajoute à la liste des lieux
  function resolve(w) {
    var b = norm(w.title), found = null;
    if (b.length >= 6) found = allEvents().filter(function (e) { if (!e.isPlace || !(state.userPos ? true : e.city === state.city)) return false; var a = norm(e.title); return a === b || a.indexOf(b) !== -1 || b.indexOf(a) !== -1; })[0];
    if (found) return found;
    var id = "wd-" + (w.id || b.replace(/ /g, "-"));
    var ex = allEvents().filter(function (e) { return e.id === id; })[0];
    if (ex) return ex;
    var ev = {
      id: id, isPlace: true, scene: "expo", city: state.city, category: "À voir",
      title: w.title.charAt(0).toUpperCase() + w.title.slice(1), date: null, time: "", place: cityName(),
      lat: w.lat, lng: w.lng, price: "Voir sur place", thumb: "", source: "wikidata",
      description: w.description ? w.description.charAt(0).toUpperCase() + w.description.slice(1) + "." : "",
      photo: w.image ? w.image + (w.image.indexOf("?") < 0 ? "?width=800" : "") : "", photoCredit: w.image ? "Wikimedia Commons" : ""
    };
    if (Array.isArray(state.dataTourismePlaces)) state.dataTourismePlaces.push(ev);
    return ev;
  }

  function dt() {
    var GOOD = /mus[ée]e|ch[âa]teau|cath[ée]drale|basilique|abbaye|jardin|parc |palais|tour |monument|forteresse|citadelle|fort |grotte|panorama|remparts|op[ée]ra|[ée]glise|chapelle|vieux|historique|patrimoine|place |pont /i;
    var BAD = /biblioth[èe]que|m[ée]diath[èe]que|archives|cours |atelier|stage|boutique|restaurant|location|vente|gîte|camping|salle des f/i;
    var seen = {};
    return allEvents().filter(function (e) { return e.isPlace && e.category === "À voir" && e.title && (state.userPos ? true : e.city === state.city); })
      .filter(function (e) { var k = norm(e.title); if (seen[k]) return false; seen[k] = 1; return true; })
      .map(function (e) { return { ev: e, s: Math.min(String(e.description || "").length, 400) + (e.photo || e.thumb ? 150 : 0) + (GOOD.test(e.title) ? 400 : 0) - (BAD.test(e.title) ? 900 : 0) }; })
      .sort(function (a, b) { return b.s - a.s; }).slice(0, 8).map(function (x) { return x.ev; });
  }

  function load(th, cb) {
    if (th && th.key !== "musee") {
      var ev = themeEvents(th);
      if (ev.length >= 2) return cb({ items: ev, src: false, th: th, events: true });
      if (th.key === "bar" || th.key === "expo") th = null;   // peu de résultats : retour aux incontournables de la ville
    }
    var key = state.city, wantMus = th && th.key === "musee";
    function fin(res) { res.th = th && th.key === "musee" ? th : null; cb(res); }
    var cached = wdCache[key];
    if (cached) return fin(wantMus ? { items: cached.items.filter(function (e) { return MUSEUM_RE.test(e.title); }).concat(cached.items.filter(function (e) { return !MUSEUM_RE.test(e.title); })).slice(0, 8), src: cached.src } : cached);
    fetch("data/wikidata/" + encodeURIComponent(key) + ".json").then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }).then(function (wd) {
      var items = [], src = false;
      if (Array.isArray(wd) && wd.length >= 3) { items = wd.slice(0, 12).map(resolve); src = true; }
      else items = dt();
      wdCache[key] = { items: items.slice(0, 8), src: src };
      var all = items;
      if (wantMus) all = items.filter(function (e) { return MUSEUM_RE.test(e.title); }).concat(items.filter(function (e) { return !MUSEUM_RE.test(e.title); }));
      fin({ items: all.slice(0, 8), src: src });
    });
  }

  function cardHtml(ev, first) {
    var ref = (typeof referencePoint === "function") ? referencePoint() : null;
    var d = (ref && ev.lat && ev.lng) ? haversineKm(ref.lat, ref.lng, ev.lat, ev.lng) : null;
    var dist = d == null ? "" : (d <= 3 ? Math.max(2, Math.round(d * 12 / 5) * 5) + " min à pied" : d.toFixed(1).replace(".", ",") + " km");
    var desc = String(ev.description || "").replace(/\s+/g, " ").trim();
    if (desc.length > 120) desc = desc.slice(0, 120).replace(/\s+\S*$/, "") + "…";
    return '<button type="button" class="wz-i-card" data-i="open" data-id="' + esc(ev.id) + '" data-m="1"><div class="wz-i-ph">' + (typeof eventPhotoHTML === "function" ? eventPhotoHTML(ev) : "") +
      '<span class="wz-i-pill" style="--c:#457B9D">' + (ev.isPlace ? "🏛️ À VOIR" : esc(String(ev.category || "").toUpperCase())) + '</span></div><div class="wz-i-bd"><div class="wz-i-t">' + esc(ev.title) + '</div>' +
      ((ev.date && !ev.isPlace) ? '<div class="wz-i-v">' + esc(formatDate(ev.date) + (ev.time ? " · " + ev.time : "") + (dist ? " · " + dist : "")) + '</div>' : (dist ? '<div class="wz-i-v">' + esc(dist) + '</div>' : "")) + (desc ? '<div class="wz-i-why" style="font-weight:600;color:#C9D2EA">' + esc(desc) + '</div>' : "") + '</div></button>';
  }

  function screen() {
    var r = document.getElementById("wz-idea"); if (!r) return;
    var th0 = theme(); css(); track("surprise_must_open");
    r.innerHTML = '<button type="button" class="wz-i-x" data-i="close" aria-label="Fermer">✕</button><div class="wz-i-k" style="margin:2px 0 14px">🏛️ À ne pas manquer</div><div class="wz-m-sub">Chargement…</div>';
    r.scrollTop = 0;
    load(th0, function (res) {
      var rr = document.getElementById("wz-idea"); if (!rr) return;
      var h = '<button type="button" class="wz-i-x" data-i="close" aria-label="Fermer">✕</button><div class="wz-i-k" style="margin:2px 0 14px">🏛️ À ne pas manquer</div>';
      if (!res.items.length) {
        h += '<div class="wz-m-sub">Pas encore de lieux à te recommander ici. Reviens bientôt !</div>';
      } else {
        h += '<div class="wz-m-sub">' + (res.events ? esc(res.th.label.replace(/^\S+\s*/, "")) + " à ne pas manquer, dans les 14 prochains jours" : res.th ? "Les musées et lieux à ne pas manquer à " + esc(cityName()) : "Les incontournables de " + esc(cityName())) + '</div>' + res.items.map(function (ev, i) { return cardHtml(ev, i === 0); }).join("");
        if (res.src) h += '<div class="wz-m-src">Sélection établie à partir de Wikidata (données libres).</div>';
      }
      h += '<button type="button" class="wz-i-alt ghost" data-i="must-back">← Retour à ma surprise</button>';
      rr.innerHTML = h; rr.scrollTop = 0;
    });
  }

  // ajoute le bouton dans l'écran « Ta surprise » dès qu'il s'affiche
  function inject() {
    var r = document.getElementById("wz-idea");
    if (!r || r.querySelector('[data-i="must"]')) return;
    var full = r.querySelector('[data-i="full"]');
    if (!full || !r.querySelector(".wz-s-row")) return;   // seulement dans « Ta surprise »
    var b = document.createElement("button");
    b.type = "button"; b.className = "wz-i-alt wz-s-send"; b.setAttribute("data-i", "must");
    var n = cityName(), prep = "à " + n;
    if (/^Le /.test(n)) prep = "au " + n.slice(3); else if (/^Les /.test(n)) prep = "aux " + n.slice(4);
    var th = theme();
    b.textContent = th ? (th.label + " à ne pas manquer " + prep) : ("🏛️ À ne pas manquer " + prep);
    b.style.fontWeight = "800";
    full.parentNode.insertBefore(b, full);
  }
  var timer = null;
  new MutationObserver(function () { if (timer) return; timer = setTimeout(function () { timer = null; try { inject(); } catch (e) {} }, 60); })
    .observe(document.body, { childList: true, subtree: true });

  document.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest('#wz-idea [data-i="must"], #wz-idea [data-i="must-back"]');
    if (b) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); if (b.getAttribute("data-i") === "must") screen(); else if (typeof window.__wzSurpriseOpen === "function") window.__wzSurpriseOpen(); return; }
    var m = e.target.closest && e.target.closest('#wz-idea [data-m="1"]');
    if (m) track("surprise_must_go");
  }, true);
})();
