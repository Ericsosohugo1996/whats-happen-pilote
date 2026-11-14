// Robot test : lit la page officielle de la Ville de Paris sur les brocantes et en garde une copie lisible pour contrôle.
// Il ne modifie rien dans Whazup : il écrit seulement data/brocantes-test/.
const fs = require("fs");
const URL_PAGE = "https://www.paris.fr/pages/brocantes-et-vide-greniers-chiner-a-paris-18730";
(async () => {
  fs.mkdirSync("data/brocantes-test", { recursive: true });
  const r = await fetch(URL_PAGE, { headers: { "User-Agent": "Whazup/1.0 (whazup.contact@gmail.com)", Accept: "text/html" } });
  const html = await r.text();
  const body = (html.match(/<main[\s\S]*<\/main>/i) || [html])[0];
  const text = body.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|li|h1|h2|h3|h4|div|tr|br)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#039;|&rsquo;/g, "'").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
  fs.writeFileSync("data/brocantes-test/paris-page.txt", "HTTP " + r.status + " — " + html.length + " caractères HTML\n\n" + text.slice(0, 20000) + "\n");
  console.log("HTTP", r.status, html.length, "caractères ; texte :", text.length);
})();
