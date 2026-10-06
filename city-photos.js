// Copie les photos des villes (Wikimedia Commons) sur whazup.fr pour qu'elles s'affichent vite.
// Lancé par le robot GitHub "Photos des villes" (.github/workflows/city-photos.yml).
// Écrit city-photos/<ville>.jpg et city-photos.json (ville -> chemin local).
// Les photos restent sous leur licence d'origine (Wikimedia Commons, voir CREDITS.md).
const fs = require("fs");

const OUT_DIR = "city-photos";
const OUT_JSON = "city-photos.json";
const BASE = process.env.WIKI_BASE || "https://commons.wikimedia.org";
const UA = "Whazup/1.0 (https://whazup.fr; contact: whazup.fr) node-fetch";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function readCityPhotos() {
  const app = fs.readFileSync("app.js", "utf8");
  const start = app.indexOf("const CITY_PHOTOS = {");
  if (start < 0) throw new Error("CITY_PHOTOS introuvable dans app.js");
  const end = app.indexOf("};", start);
  const block = app.slice(start, end);
  const out = {};
  const re = /([a-z0-9_]+):\s*"([^"]+)"/gi;
  let m;
  while ((m = re.exec(block))) out[m[1]] = m[2];
  return out;
}

function extOf(type) {
  if (/png/i.test(type)) return "png";
  if (/webp/i.test(type)) return "webp";
  return "jpg";
}

async function download(url) {
  for (let essai = 0; essai < 4; essai++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "image/*" }, redirect: "follow", signal: AbortSignal.timeout(60000) });
      if (res.ok) {
        const type = res.headers.get("content-type") || "";
        if (!/^image\//i.test(type)) return { error: "pas une image (" + type + ")" };
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 5000) return { error: "image trop petite" };
        return { buf, ext: extOf(type) };
      }
      if (res.status === 429 || res.status >= 500) { await sleep(5000 * (essai + 1)); continue; }
      return { error: "HTTP " + res.status };
    } catch (e) {
      await sleep(3000);
      if (essai === 3) return { error: e.message };
    }
  }
  return { error: "échec" };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const photos = readCityPhotos();
  let previous = {};
  try { previous = JSON.parse(fs.readFileSync(OUT_JSON, "utf8")); } catch (e) {}
  const result = {};
  let ok = 0, kept = 0, fail = 0;
  for (const key of Object.keys(photos)) {
    let url = photos[key];
    if (!/^https?:\/\//.test(url)) continue; // déjà une photo du site
    if (previous[key] && fs.existsSync(previous[key])) { result[key] = previous[key]; kept++; continue; }
    if (url.indexOf("commons.wikimedia.org/wiki/Special:FilePath/") >= 0 && url.indexOf("?") < 0) url += "?width=900";
    url = url.replace("https://commons.wikimedia.org", BASE);
    const r = await download(url);
    if (r.error) { fail++; console.log(key, "ÉCHEC :", r.error); await sleep(1500); continue; }
    const file = OUT_DIR + "/" + key + "." + r.ext;
    fs.writeFileSync(file, r.buf);
    result[key] = file;
    ok++;
    console.log(key, "→", file, Math.round(r.buf.length / 1024) + " Ko");
    await sleep(1500);
  }
  console.log("copiées :", ok, "| déjà là :", kept, "| échecs :", fail);
  const json = JSON.stringify(result, null, 1);
  if (!fs.existsSync(OUT_JSON) || fs.readFileSync(OUT_JSON, "utf8") !== json) fs.writeFileSync(OUT_JSON, json);
}
main().catch((e) => { console.error(e); process.exit(1); });
