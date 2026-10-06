// Remet en forme les textes écrits EN MAJUSCULES par les organisateurs (titres, lieux) :
// « CONCERT DE CLÔTURE (TOULOUSE LES ORGUES) » -> « Concert de clôture (Toulouse les Orgues) ».
// Un texte déjà normal n'est jamais modifié.
const SMALL = new Set(["de", "du", "des", "la", "le", "les", "et", "à", "au", "aux", "en", "sur", "sous", "un", "une", "d", "l", "à", "ou", "par", "pour", "dans", "chez", "the", "of", "and", "in", "on", "at", "a"]);
const KEEP = /^(dj|mc|tv|tgv|ter|sncf|mjc|cgt|ps|vtt|bd|ufc|usa|uk|fr|ccas|ehpad|cmj|tnt|fc|ac|as|us|rc|sc|oc|bmx|dj's|xl|3d|2d)$/i;
const ROMAN = /^(?=[ivxlcdm]+$)m{0,3}(cm|cd|d?c{0,3})(xc|xl|l?x{0,3})(ix|iv|v?i{0,3})$/i;

function letters(s) { return (s.match(/[A-Za-zÀ-ÿ]/g) || []); }
function mostlyUpper(s) {
  const l = letters(s);
  if (l.length < 4) return false;
  const up = l.filter((c) => c === c.toUpperCase() && c !== c.toLowerCase()).length;
  return up / l.length >= 0.6;
}
function fixWord(w, first) {
  const lower = w.toLowerCase();
  if (KEEP.test(w) || (ROMAN.test(w) && w.length <= 4 && w.length > 1 && !/^(mi|di|li|ci|mix|dix|mimi)$/i.test(w))) return w.toUpperCase();
  if (!first && SMALL.has(lower)) return lower;
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}
function tidyText(s) {
  if (typeof s !== "string" || !mostlyUpper(s)) return s;
  let firstDone = false;
  return s.replace(/[A-Za-zÀ-ÿ0-9]+/g, (w) => {
    if (/\d/.test(w)) return w;
    const out = fixWord(w, !firstDone);
    if (/[A-Za-zÀ-ÿ]/.test(w)) firstDone = true;
    return out;
  });
}
// lieu : « MARCHÉ SAINT CYPRIEN Place Saint-Cyprien, Toulouse » -> seules les parties en majuscules sont retouchées
function tidyPlace(s) {
  if (typeof s !== "string") return s;
  return s.replace(/((?:[A-ZÀ-ÖØ-Þ0-9'’\-]{2,}[ ]?)+)/g, (run) => {
    const t = run.trim();
    return letters(t).length >= 4 ? tidyText(t) + (run.endsWith(" ") ? " " : "") : run;
  });
}
module.exports = { tidyText, tidyPlace };
