// Découpe les 3 gros fichiers de données (événements, lieux, bars) en un petit fichier par ville :
//   data/events/<ville>.json, data/places/<ville>.json, data/bars/<ville>.json
// plus data/index.json (liste des villes disponibles et date de génération).
// Lancé automatiquement par le robot GitHub (.github/workflows/split-data.yml) après chaque mise à jour des gros fichiers.
const fs = require("fs");
const path = require("path");
const { nameMatches } = require("./photo-match.js");
const { pickFor } = require("./type-photos.js");
const { tidyText, tidyPlace } = require("./tidy-text.js");
const { reclassify } = require("./reclass.js");

// les lieux passent AVANT les événements : on réutilise leurs photos pour les spectacles et concerts sans affiche
const SOURCES = [
  { kind: "places", file: "datatourisme-places.json" },
  { kind: "bars", file: "osm-bars.json" },
  { kind: "events", file: "datatourisme-events.json" },
];
const OUT = "data";
const index = { generatedAt: new Date().toISOString(), events: {}, places: {}, bars: {}, soon: {} };

function safe(key) {
  return String(key || "autre").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
}

for (const { kind, file } of SOURCES) {
  if (!fs.existsSync(file)) { console.log("absent :", file); continue; }
  const items = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!Array.isArray(items)) { console.log("format inattendu :", file); continue; }
  // lieux OpenStreetMap (osm-places.js) : ils complètent les villes où DataTourisme n'a presque rien
  if (kind === "places" && fs.existsSync("osm-places.json")) {
    try {
      const extra = JSON.parse(fs.readFileSync("osm-places.json", "utf8"));
      const have = new Set(items.map((p) => p.id));
      let added = 0;
      if (Array.isArray(extra)) for (const p of extra) if (!have.has(p.id)) { items.push(p); added++; }
      console.log("lieux OpenStreetMap ajoutés :", added);
    } catch (e) { console.log("osm-places.json illisible :", e.message); }
  }
  // événements officiels de la Ville de Paris (paris-events-sync.js) : on les ajoute, sans doublon avec DATAtourisme
  if (kind === "events" && fs.existsSync("paris-events.json")) {
    try {
      const extra = JSON.parse(fs.readFileSync("paris-events.json", "utf8"));
      const fold = (x) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const have = new Set(items.filter((e) => e.city === "paris").map((e) => fold(e.title) + "|" + e.date));
      let added = 0;
      if (Array.isArray(extra)) for (const e of extra) {
        const k = fold(e.title) + "|" + e.date;
        if (have.has(k)) continue;
        have.add(k); items.push(e); added++;
      }
      console.log("événements Ville de Paris ajoutés :", added);
    } catch (e) { console.log("paris-events.json illisible :", e.message); }
  }
  // concerts, soirées et sport via Ticketmaster (ticketmaster-sync.js) : on les ajoute, sans doublon (même ville, même titre, même jour)
  if (kind === "events" && fs.existsSync("ticketmaster-events.json")) {
    try {
      const extra = JSON.parse(fs.readFileSync("ticketmaster-events.json", "utf8"));
      const fold2 = (x) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const have2 = new Set(items.map((e) => e.city + "|" + fold2(e.title) + "|" + e.date));
      let added2 = 0;
      if (Array.isArray(extra)) for (const e of extra) {
        const k = e.city + "|" + fold2(e.title) + "|" + e.date;
        if (have2.has(k)) continue;
        have2.add(k); items.push(e); added2++;
      }
      console.log("événements Ticketmaster ajoutés :", added2);
    } catch (e) { console.log("ticketmaster-events.json illisible :", e.message); }
  }
  // concerts et soirées via OpenAgenda (openagenda-sync.js, dont l'agenda Shotgun) : on les ajoute, sans doublon (même ville, même titre, même jour)
  if (kind === "events" && fs.existsSync("openagenda-events.json")) {
    try {
      const extra3 = JSON.parse(fs.readFileSync("openagenda-events.json", "utf8"));
      const fold3 = (x) => String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
      const have3 = new Set(items.map((e) => e.city + "|" + fold3(e.title) + "|" + e.date));
      let added3 = 0;
      if (Array.isArray(extra3)) for (const e of extra3) {
        const k = e.city + "|" + fold3(e.title) + "|" + e.date;
        if (have3.has(k)) continue;
        have3.add(k); items.push(e); added3++;
      }
      console.log("événements OpenAgenda ajoutés :", added3);
    } catch (e) { console.log("openagenda-events.json illisible :", e.message); }
  }
  // photos des lieux (trouvées par enrich-photos.js) : on les ajoute aux lieux qui n'en ont pas
  if (kind === "places") {
    let cache = {};
    try { cache = JSON.parse(fs.readFileSync("photos-cache.json", "utf8")); } catch (e) {}
    let n = 0;
    for (const ev of items) {
      const c = cache[ev.id];
      if (c && c.u && !ev.photo && nameMatches(ev.title, c.w)) { ev.photo = c.u; ev.photoCredit = "Wikimedia Commons"; n++; }
    }
    console.log("photos ajoutées aux lieux :", n);
    // lieux toujours sans photo : photo d'illustration de leur type (théâtre, musée…), si type-photos.json existe
    let typePhotos = null;
    try { typePhotos = JSON.parse(fs.readFileSync("type-photos.json", "utf8")); } catch (e) {}
    if (typePhotos) {
      let g = 0;
      for (const ev of items) {
        if (ev.photo || ev.category !== "À voir") continue;
        const p = pickFor(ev, typePhotos);
        if (p) { ev.photo = p.u; ev.photoCredit = p.c; ev.photoGeneric = true; g++; }
      }
      console.log("photos d'illustration ajoutées :", g);
    }
  }
  // titres et lieux écrits EN MAJUSCULES par les organisateurs : on les remet en forme normale
  if (kind === "events" || kind === "places") {
    let n = 0;
    for (const ev of items) {
      const t = tidyText(ev.title), pl = tidyPlace(ev.place);
      if (t !== ev.title || pl !== ev.place) n++;
      ev.title = t; ev.place = pl;
    }
    console.log("titres/lieux remis en forme :", n);
  }
  // « Festival » ne doit contenir que de vrais festivals : le reste est rangé dans sa vraie catégorie
  if (kind === "events") {
    const moved = {};
    for (const ev of items) {
      const c = reclassify(ev);
      if (c !== ev.category) { moved[c] = (moved[c] || 0) + 1; ev.category = c; }
    }
    console.log("événements reclassés depuis « Festival » :", JSON.stringify(moved));
    // concerts, spectacles et soirées sans affiche : photo du lieu (salle, théâtre) si on en a une à moins de 150 m, avec le même nom
    try {
      const STOP = new Set(["theatre", "le", "la", "les", "de", "du", "des", "salle", "paris", "et", "au", "aux", "l", "d", "st", "saint", "sainte", "cafe", "bar", "club", "espace", "centre", "maison", "palais"]);
      const toks = (x) => new Set(String(x || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w)));
      const dm = (a, b, c, d) => { const r = Math.PI / 180, x = (c - a) * r, y = (d - b) * r * Math.cos(a * r); return 6371000 * Math.sqrt(x * x + y * y); };
      const pcache = {};
      const placesOf = (city) => {
        if (pcache[city]) return pcache[city];
        let arr = [];
        try { arr = JSON.parse(fs.readFileSync(path.join(OUT, "places", safe(city) + ".json"), "utf8")).filter((p) => p.photo && isFinite(p.lat) && isFinite(p.lng)).map((p) => ({ p, t: toks(p.title) })); } catch (e) {}
        return (pcache[city] = arr);
      };
      let v = 0;
      for (const ev of items) {
        if (ev.photo || !["Spectacles", "Musique", "Soirée"].includes(ev.category) || !isFinite(ev.lat) || !isFinite(ev.lng)) continue;
        const et = toks(String(ev.place || "").split(",")[0]);
        if (!et.size) continue;
        let best = null;
        for (const { p, t } of placesOf(ev.city)) {
          const d = dm(ev.lat, ev.lng, p.lat, p.lng);
          if (d > 150) continue;
          let ok = false; for (const w of et) if (t.has(w)) { ok = true; break; }
          if (ok && (!best || d < best.d)) best = { d, p };
        }
        if (best) { ev.photo = best.p.photo; ev.photoCredit = best.p.photoCredit || "Photo du lieu"; ev.photoVenue = true; v++; }
      }
      console.log("événements : photo du lieu ajoutée :", v);
    } catch (e) { console.log("photos des lieux (événements) :", e.message); }
    // photo réelle du lieu trouvée sur Wikipédia (venue-photos.json, robot « Photos des salles »)
    try {
      const { venueKey } = require("./venue-photos.js");
      const vp = JSON.parse(fs.readFileSync("venue-photos.json", "utf8"));
      let w = 0;
      for (const ev of items) {
        if (ev.photo && !ev.photoGeneric) continue;
        if (!["Spectacles", "Musique", "Soirée", "Sport", "Famille", "Expo", "Festival"].includes(ev.category)) continue;
        const r = vp[venueKey(ev.place, ev.city)];
        if (r && r.u) { ev.photo = r.u; ev.photoCredit = r.c; ev.photoVenue = true; delete ev.photoGeneric; w++; }
      }
      console.log("événements : photo du lieu (Wikipédia) :", w);
    } catch (e) { /* pas encore de venue-photos.json */ }
    // photo de l'artiste (Wikipédia), robot « Photos des artistes » : pour les concerts sans affiche
    try {
      const { artistKey } = require("./artist-photos.js");
      const ap = JSON.parse(fs.readFileSync("artist-photos.json", "utf8"));
      let a = 0;
      for (const ev of items) {
        if (ev.category !== "Musique" && ev.category !== "Soirée") continue;
        if (ev.photo && !ev.photoGeneric && !ev.photoVenue) continue; // vraie affiche : on la garde
        const k = artistKey(ev.title); if (!k) continue;
        const r = ap[k];
        if (r && r.u) { ev.photo = r.u; ev.photoCredit = r.c; ev.photoArtist = true; delete ev.photoGeneric; delete ev.photoVenue; a++; }
      }
      console.log("événements : photo de l'artiste (Wikipédia) :", a);
    } catch (e) { /* pas encore d'artist-photos.json */ }
    // photo officielle DATAtourisme (robot « Photos DATAtourisme », API officielle, Licence Ouverte) : on crédite l'auteur et la source
    try {
      const dp = JSON.parse(fs.readFileSync("dt-photos.json", "utf8"));
      let n = 0;
      for (const ev of items) {
        if (ev.source !== "datatourisme" || (ev.photo && !ev.photoGeneric && !ev.photoVenue && !ev.photoArtist)) continue;
        const r = dp[String(ev.id).replace(/^dt-/, "")]; if (!r || !r.u) continue;
        ev.photo = r.u; ev.photoCredit = "Photo : " + (r.s || "office de tourisme") + " · DATAtourisme" + (r.d ? ", mis à jour le " + r.d.split("-").reverse().join("/") : ""); ev.photoDt = true; delete ev.photoGeneric; delete ev.photoVenue; delete ev.photoArtist; n++;
      }
      console.log("événements : photo officielle DATAtourisme :", n);
    } catch (e) { /* pas encore de dt-photos.json */ }
    // image de partage de la page de l'organisateur (robot « Photos des organisateurs ») : affichée depuis son site, avec son nom
    try {
      const og = JSON.parse(fs.readFileSync("og-photos.json", "utf8"));
      let o = 0;
      for (const ev of items) {
        if (ev.photo && !ev.photoGeneric && !ev.photoVenue) continue; // vraie affiche ou photo d'artiste
        const r = og[ev.link] || og[ev.ticket]; if (!r || !r.u) continue;
        ev.photo = r.u; ev.photoCredit = "Image : " + r.d; ev.photoOrganizer = true; delete ev.photoGeneric; delete ev.photoVenue; o++;
      }
      console.log("événements : image de l'organisateur :", o);
    } catch (e) { /* pas encore d'og-photos.json */ }
    // sans affiche ni photo de lieu : photo d'illustration (théâtre pour les spectacles, salle de concert pour la musique, club pour les soirées)
    try {
      const tp = JSON.parse(fs.readFileSync("type-photos.json", "utf8"));
      const expoPool = (ev) => {
        const t = String(ev.title + " " + ev.place).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        if (/chateau|abbaye|manoir|forteresse|citadelle/.test(t)) return tp.chateau;
        if (/eglise|cathedrale|chapelle|basilique|collegiale/.test(t)) return tp.eglise;
        if (/jardin|parc |nature|oiseaux|foret/.test(t)) return tp.jardin;
        if (/musee|museum|patrimoine|visite/.test(t)) return tp.musee;
        if (/bibliotheque|mediatheque|livre|lecture|librairie/.test(t)) return tp.livre;
        return tp.galerie;
      };
      // « Divers » : on devine le type d'après le titre et le lieu ; sinon photo neutre d'un monument de France — jamais d'événement sans photo
      const diversPool = (ev) => {
        const t = String(ev.title + " " + ev.place).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
        if (/concert|tribute|chanson|orchestre|jazz|rock|chorale|symphon|recital|dj |live/.test(t)) return tp.concert;
        if (/theatre|spectacle|comedie|humour|danse|cirque|magie|cabaret|opera|ballet|conte|marionnette|clown/.test(t)) return tp.theatre;
        const tt = String(ev.title).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); // titre seul : une adresse « parking de l'Église » ne fait pas une sortie d'église
        if (/chateau|abbaye|manoir|forteresse|citadelle/.test(tt)) return tp.chateau;
        if (/eglise|cathedrale|chapelle|basilique|collegiale/.test(tt)) return tp.eglise;
        if (/visite|histoire|patrimoine|fouille|archeolog|jeu de piste|croisade|resistance|bicentenaire|monument/.test(t)) return tp.monument;
        if (/musee|museum|exposition|photographie/.test(t)) return tp.musee;
        if (/jardin|nature|oiseau|safari|biodiversite|foret|randonnee|balade|ferme/.test(t)) return tp.jardin;
        if (/sport|trail|course|corrida|peche|fishing|match|rugby|foot|yoga|croisiere|regate|voile|velo/.test(t)) return tp.sport;
        if (/bibliotheque|mediatheque|lecture|livre|conference|rencontre|dedicace|jeu de role|jeu video/.test(t)) return tp.livre;
        return tp.monument; // photo neutre d'un lieu de France
      };
      const pools = { "Spectacles": tp.theatre, "Musique": tp.concert, "Soirée": tp.club, "Marché": tp.marche, "Sport": tp.sport, "Brocante": tp.brocante, "Festival": tp.festival, "Famille": tp.jardin };
      let g = 0;
      for (const ev of items) {
        const pool = ev.category === "Expo" ? expoPool(ev) : ev.category === "Divers" ? diversPool(ev) : pools[ev.category];
        if (ev.photo || !pool || !pool.length) continue;
        let h = 0; for (const ch of String(ev.id)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        const p = pool[h % pool.length];
        ev.photo = p.u; ev.photoCredit = p.c; ev.photoGeneric = true; g++;
      }
      console.log("événements : photos d'illustration ajoutées :", g);
    } catch (e) {}
  }
  const byCity = {};
  for (const ev of items) (byCity[safe(ev.city)] = byCity[safe(ev.city)] || []).push(ev);
  const dir = path.join(OUT, kind);
  fs.mkdirSync(dir, { recursive: true });
  // on supprime les fichiers de villes qui n'existent plus, pour ne pas garder de vieilles données
  for (const f of fs.readdirSync(dir)) if (f.endsWith(".json") && !f.endsWith(".soon.json") && !byCity[f.slice(0, -5)]) fs.unlinkSync(path.join(dir, f));
  for (const [city, list] of Object.entries(byCity)) {
    const json = JSON.stringify(list);
    const target = path.join(dir, city + ".json");
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== json) fs.writeFileSync(target, json);
    index[kind][city] = list.length;
    // grandes villes : petit fichier « prochains jours » pour que le site s'affiche vite (le fichier complet suit en arrière-plan)
    if (kind === "events") {
      const sp = path.join(dir, city + ".soon.json");
      if (list.length > 400) {
        const lim = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
        const soon = list.filter((e) => !e.date || e.date <= lim).map((e) => { const c = Object.assign({}, e); delete c.description; return c; });
        const sj = JSON.stringify(soon);
        if (!fs.existsSync(sp) || fs.readFileSync(sp, "utf8") !== sj) fs.writeFileSync(sp, sj);
        index.soon[city] = soon.length;
      } else if (fs.existsSync(sp)) fs.unlinkSync(sp);
    }
  }
  if (kind === "events") for (const f of fs.readdirSync(dir)) if (f.endsWith(".soon.json") && !index.soon[f.slice(0, -10)]) fs.unlinkSync(path.join(dir, f));
  console.log(kind + " :", items.length, "éléments,", Object.keys(byCity).length, "villes");
}
// l'index ne change pas la date si rien d'autre n'a changé : on conserve l'ancienne date dans ce cas
const idxPath = path.join(OUT, "index.json");
try {
  const old = JSON.parse(fs.readFileSync(idxPath, "utf8"));
  const same = JSON.stringify([old.events, old.places, old.bars, old.soon]) === JSON.stringify([index.events, index.places, index.bars, index.soon]);
  if (same) index.generatedAt = old.generatedAt;
} catch (e) {}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(idxPath, JSON.stringify(index));
