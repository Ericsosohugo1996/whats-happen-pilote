// Whazup — prévient Bing (et Yandex, Seznam…) dès qu'une page « Sorties à … » est nouvelle ou modifiée, grâce à IndexNow.
// Lancé par .github/workflows/city-pages.yml juste après la fabrication des pages. Gratuit, sans compte.
// La clé est publique par nature : le fichier /bb446cd9760b51ee55607d2103a180c1.txt prouve que le site nous appartient.
const fs = require("fs");
const KEY = "bb446cd9760b51ee55607d2103a180c1";
const HOST = "whazup.fr";
const LIST = process.argv[2] || "changed.txt";
(async () => {
  let files = [];
  try { files = fs.readFileSync(LIST, "utf8").split("\n").map((s) => s.trim()).filter(Boolean); } catch (e) {}
  const urls = [...new Set(files.filter((f) => /^sorties\/.*index\.html$/.test(f)).map((f) => "https://" + HOST + "/" + f.replace(/index\.html$/, "")))];
  if (!urls.length) { console.log("IndexNow : aucune page nouvelle ou modifiée"); return; }
  urls.unshift("https://" + HOST + "/");
  for (let i = 0; i < urls.length; i += 10000) {
    const body = { host: HOST, key: KEY, keyLocation: "https://" + HOST + "/" + KEY + ".txt", urlList: urls.slice(i, i + 10000) };
    try {
      const r = await fetch("https://api.indexnow.org/indexnow", { method: "POST", headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(body) });
      console.log("IndexNow :", body.urlList.length, "pages signalées → réponse", r.status);
    } catch (e) { console.log("IndexNow : échec (" + e.message + "), on réessaiera au prochain passage"); }
  }
})();
