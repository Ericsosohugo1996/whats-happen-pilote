// ---- « Tu as un bar ? » : les bars publient eux-mêmes leurs soirées (gratuit) ----
// - page d'accueil pour les bars : lien direct whazup.fr/#bars, lien dans « + Publier », bandeau dans les rubriques Bar et Soirées
// - formulaire dédié (nom du bar, type de soirée, « revient chaque semaine », affiche)
// - même circuit qu'avant : la soirée arrive dans la liste « Modération » (statut "pending") avant d'être visible
// - une soirée « chaque semaine » s'affiche automatiquement sur les 8 prochaines semaines
// Pour tout retirer : supprimer la ligne <script defer src="bars-publish.js"></script> dans index.html.
(function () {
  "use strict";
  var DAYS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
  var DAYS_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  var KINDS = [
    ["quiz", "❓ Quiz"], ["blindtest", "🎵 Blind test"], ["karaoke", "🎤 Karaoké"], ["concert", "🎸 Concert"],
    ["dj", "🎧 DJ"], ["happyhour", "🍹 Happy hour"], ["theme", "🎭 Soirée à thème"]
  ];
  var REPEAT_RE = /🔁 Chaque (dimanche|lundi|mardi|mercredi|jeudi|vendredi|samedi)/i;

  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function iso(d) { return d.getFullYear() + "-" + ("0" + (d.getMonth() + 1)).slice(-2) + "-" + ("0" + d.getDate()).slice(-2); }
  function track(n) { try { if (typeof analytics !== "undefined" && analytics && analytics.logEvent) analytics.logEvent(n); } catch (e) {} }

  // ---------- 1) soirées « chaque semaine » : une date par semaine, sur 8 semaines ----------
  function repeatDay(ev) {
    if (typeof ev.repeatDay === "number") return ev.repeatDay;
    var m = REPEAT_RE.exec(String(ev.description || ""));
    return m ? DAYS.indexOf(m[1].toLowerCase()) : -1;
  }
  function expand(list) {
    var out = [], today = new Date(); today.setHours(0, 0, 0, 0);
    (list || []).forEach(function (ev) {
      var wd = ev && !ev.isPlace ? repeatDay(ev) : -1;
      if (wd < 0) { out.push(ev); return; }
      var d = new Date(today); d.setDate(d.getDate() + ((wd - d.getDay() + 7) % 7));
      for (var i = 0; i < 8; i++) {
        var c = {}; for (var k in ev) c[k] = ev[k];
        c.date = iso(d); c.id = ev.id + "~" + c.date; c.recurring = "Chaque " + DAYS[wd];
        out.push(c);
        d.setDate(d.getDate() + 7);
      }
    });
    return out;
  }
  if (typeof allEvents === "function") {
    var baseAll = allEvents;
    allEvents = function () {   // eslint-disable-line no-global-assign
      var all = baseAll.apply(this, arguments);
      try {
        var ce = (typeof state !== "undefined" && state.communityEvents) || [];
        if (!ce.some(function (e) { return repeatDay(e) >= 0; })) return all;
        var set = new Set(ce);
        return all.filter(function (e) { return !set.has(e); }).concat(expand(ce));
      } catch (e) { return all; }
    };
  }

  // ---------- 2) styles ----------
  function css() {
    if (document.getElementById("wz-bars-css")) return;
    var st = document.createElement("style"); st.id = "wz-bars-css";
    st.textContent = [
      "#wz-bars{position:fixed;inset:0;z-index:2147483000;background:#EEF3FA;overflow-y:auto;-webkit-overflow-scrolling:touch;font-family:var(--font-body,inherit);color:#14213D}",
      "#wz-bars .wb-in{max-width:520px;margin:0 auto;padding:14px 18px 110px}",
      "#wz-bars .wb-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px}",
      "#wz-bars .wb-back{border:none;background:#fff;border-radius:12px;padding:9px 13px;font-weight:700;font-size:13px;color:#6B7280;cursor:pointer;box-shadow:0 2px 6px -3px rgba(20,33,61,.2)}",
      "#wz-bars .wb-hero{background:linear-gradient(150deg,#14213D,#2A3F6E);border-radius:22px;padding:22px 20px;color:#fff;position:relative;overflow:hidden}",
      "#wz-bars .wb-hero:after{content:'';position:absolute;right:-30px;top:-30px;width:140px;height:140px;border-radius:50%;background:rgba(232,96,76,.35)}",
      "#wz-bars .wb-k{font-size:11px;letter-spacing:.12em;font-weight:800;color:#FFB4A6;text-transform:uppercase;position:relative}",
      "#wz-bars h2{font-family:var(--font-display,Georgia,serif);font-size:27px;line-height:1.12;margin:8px 0;position:relative;color:#fff}",
      "#wz-bars h2 em{color:#FF8E7A}",
      "#wz-bars .wb-hero p{font-size:13.5px;line-height:1.45;color:#D5DDF0;position:relative;margin:0}",
      "#wz-bars .wb-free{display:inline-block;margin-top:12px;background:#fff;color:#14213D;font-weight:800;font-size:12px;padding:6px 11px;border-radius:9px;position:relative}",
      "#wz-bars .wb-ben{background:#fff;border-radius:16px;padding:13px 14px;display:flex;gap:12px;align-items:center;margin-top:10px;box-shadow:0 6px 16px -12px rgba(20,33,61,.3)}",
      "#wz-bars .wb-ic{width:40px;height:40px;border-radius:12px;background:#FCEAE7;display:flex;align-items:center;justify-content:center;font-size:20px;flex:0 0 auto}",
      "#wz-bars .wb-ben b{font-size:14px;display:block}#wz-bars .wb-ben small{font-size:12px;color:#6B7280}",
      "#wz-bars h3{font-family:var(--font-display,Georgia,serif);font-size:19px;margin:18px 2px 8px;color:#14213D}",
      "#wz-bars .wb-steps{display:flex;gap:8px}",
      "#wz-bars .wb-st{flex:1;background:#fff;border-radius:14px;padding:11px 9px;text-align:center;font-size:11.5px;color:#6B7280;line-height:1.3}",
      "#wz-bars .wb-st b{display:block;font-size:18px;color:#E8604C;font-family:var(--font-display,Georgia,serif)}",
      "#wz-bars .wb-cta{position:fixed;left:50%;transform:translateX(-50%);bottom:18px;width:calc(100% - 36px);max-width:484px;border:none;background:linear-gradient(135deg,#E8604C,#C64A38);color:#fff;font-weight:800;font-size:15px;padding:15px;border-radius:15px;cursor:pointer;box-shadow:0 10px 22px -10px rgba(232,96,76,.8)}",
      "#wz-bars .wb-cta[disabled]{opacity:.6}",
      "#wz-bars .wb-ft{font-family:var(--font-display,Georgia,serif);font-size:23px;margin:0}",
      "#wz-bars .wb-fs{font-size:12.5px;color:#6B7280;margin:3px 0 6px}",
      "#wz-bars label.wb-l{display:block;font-size:12px;font-weight:800;margin:14px 0 6px}",
      "#wz-bars input,#wz-bars select,#wz-bars textarea{width:100%;box-sizing:border-box;background:#fff;border:1.5px solid #E3E8F0;border-radius:12px;padding:11px 12px;font-size:14px;color:#14213D;font-family:inherit}",
      "#wz-bars .wb-chips{display:flex;flex-wrap:wrap;gap:6px}",
      "#wz-bars .wb-chip{background:#fff;border:1.5px solid #E3E8F0;border-radius:10px;padding:7px 10px;font-size:12.5px;font-weight:600;cursor:pointer;color:#14213D}",
      "#wz-bars .wb-chip.on{background:#14213D;border-color:#14213D;color:#fff}",
      "#wz-bars .wb-rep{background:#fff;border-radius:14px;border:1.5px solid #E3E8F0;padding:11px 12px;margin-top:14px}",
      "#wz-bars .wb-rep.on{border-color:#E8604C}",
      "#wz-bars .wb-rep-t{display:flex;justify-content:space-between;align-items:center;font-size:13.5px;font-weight:800;cursor:pointer}",
      "#wz-bars .wb-sw{width:40px;height:23px;border-radius:12px;background:#CBD3E1;position:relative;flex:0 0 auto;transition:background .2s}",
      "#wz-bars .wb-sw:after{content:'';position:absolute;left:3px;top:3px;width:17px;height:17px;border-radius:50%;background:#fff;transition:left .2s}",
      "#wz-bars .wb-rep.on .wb-sw{background:#E8604C}#wz-bars .wb-rep.on .wb-sw:after{left:20px}",
      "#wz-bars .wb-days{display:none;gap:5px;margin-top:10px}#wz-bars .wb-rep.on .wb-days{display:flex}",
      "#wz-bars .wb-d{flex:1;text-align:center;font-size:11.5px;font-weight:700;padding:7px 0;border-radius:9px;background:#EEF3FA;color:#6B7280;cursor:pointer;border:none}",
      "#wz-bars .wb-d.on{background:#E8604C;color:#fff}",
      "#wz-bars .wb-two{display:flex;gap:8px}#wz-bars .wb-two>div{flex:1;min-width:0}",
      "#wz-bars .wb-note{font-size:11.5px;color:#6B7280;margin-top:12px;line-height:1.45}",
      "#wz-bars .wb-err{color:#C0392B;font-size:12.5px;font-weight:700;margin-top:10px;display:none}",
      "#wz-bars .wb-ok{text-align:center;padding:60px 10px}#wz-bars .wb-ok .wb-big{font-size:54px}",
      "#wz-bars .wb-prev img{max-height:140px;border-radius:10px;margin-top:8px;display:block}",
      ".wz-bars-band{display:flex;align-items:center;gap:10px;width:calc(100% - 32px);margin:6px 16px 12px;padding:12px 14px;border:none;border-radius:14px;background:#14213D;color:#fff;text-align:left;cursor:pointer;font-family:inherit}",
      ".wz-bars-band b{font-size:13.5px;display:block}.wz-bars-band small{font-size:12px;color:#C9D2EA}.wz-bars-band span.go{margin-left:auto;font-size:18px;color:#FF8E7A}",
      ".wz-bars-link{display:block;width:100%;margin:0 0 14px;padding:12px 14px;border:1.5px solid #E8604C;border-radius:14px;background:#FCEAE7;color:#14213D;font-weight:700;font-size:13.5px;text-align:left;cursor:pointer;font-family:inherit}"
    ].join("");
    document.head.appendChild(st);
  }

  function root() {
    css();
    var r = document.getElementById("wz-bars");
    if (!r) { r = document.createElement("div"); r.id = "wz-bars"; document.body.appendChild(r); }
    r.style.display = "block"; r.scrollTop = 0;
    document.documentElement.style.overflow = "hidden";
    return r;
  }
  function close() {
    var r = document.getElementById("wz-bars"); if (r) { r.style.display = "none"; r.innerHTML = ""; }
    document.documentElement.style.overflow = "";
    if (location.hash === "#bars") { try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {} }
  }
  var TOP = '<div class="wb-top"><button type="button" class="wb-back" data-wb="close">← Retour</button></div>';

  // ---------- 3) la page pour les bars ----------
  function landing() {
    var r = root(); track("bars_landing");
    r.innerHTML = '<div class="wb-in">' + TOP +
      '<div class="wb-hero"><div class="wb-k">Pour les bars</div><h2>Tu as un bar ?<br>Remplis tes <em>soirées</em>.</h2>' +
      '<p>Quiz, blind test, karaoké, concert, happy hour… Publie tes soirées sur Whazup : les gens du quartier les voient le soir même.</p>' +
      '<span class="wb-free">100 % gratuit · sans engagement</span></div>' +
      '<div class="wb-ben"><div class="wb-ic">📍</div><div><b>Vu par les gens autour de toi</b><small>Ta soirée apparaît dans les Soirées et dans « Surprends-moi ».</small></div></div>' +
      '<div class="wb-ben"><div class="wb-ic">🔁</div><div><b>Une seule fois pour toute l\'année</b><small>Ton quiz du lundi s\'affiche chaque semaine, tout seul.</small></div></div>' +
      '<div class="wb-ben"><div class="wb-ic">🖼️</div><div><b>Ton affiche, ta photo</b><small>Tu ajoutes ton visuel, on s\'occupe du reste.</small></div></div>' +
      '<h3>Comment ça marche</h3><div class="wb-steps">' +
      '<div class="wb-st"><b>1</b>Tu remplis le formulaire</div><div class="wb-st"><b>2</b>On vérifie sous 24 h</div><div class="wb-st"><b>3</b>Ta soirée est en ligne</div></div>' +
      '</div><button type="button" class="wb-cta" data-wb="form">Publier une soirée</button>';
  }

  // ---------- 4) le formulaire ----------
  var photoFile = null;
  function cityOptions() {
    var cur = (typeof state !== "undefined" && state.city) || "paris";
    var keys = Object.keys(CITIES).sort(function (a, b) { return CITIES[a].name.localeCompare(CITIES[b].name, "fr"); });
    return keys.map(function (k) { return '<option value="' + esc(k) + '"' + (k === cur ? " selected" : "") + ">" + esc(CITIES[k].name) + "</option>"; }).join("");
  }
  function form() {
    var r = root(); photoFile = null; track("bars_form");
    var today = iso(new Date());
    r.innerHTML = '<div class="wb-in">' + TOP +
      '<h1 class="wb-ft">Publier une soirée</h1><div class="wb-fs">Ça prend 1 minute.</div>' +
      '<form id="wb-form" novalidate>' +
      '<label class="wb-l">Nom du bar</label><input name="bar" required placeholder="Ex. Le Comptoir des Amis" maxlength="80">' +
      '<label class="wb-l">Type de soirée</label><div class="wb-chips">' +
      KINDS.map(function (k, i) { return '<button type="button" class="wb-chip' + (i === 0 ? " on" : "") + '" data-kind="' + k[0] + '">' + k[1] + "</button>"; }).join("") + "</div>" +
      '<label class="wb-l">Titre de la soirée</label><input name="title" required placeholder="Ex. Le grand quiz du lundi" maxlength="90">' +
      '<div class="wb-rep" id="wb-rep"><div class="wb-rep-t" data-wb="rep">🔁 Revient chaque semaine <span class="wb-sw"></span></div>' +
      '<div class="wb-days">' + [1, 2, 3, 4, 5, 6, 0].map(function (d) { return '<button type="button" class="wb-d" data-day="' + d + '">' + DAYS_SHORT[d] + "</button>"; }).join("") + "</div></div>" +
      '<div id="wb-date-box"><label class="wb-l">Date</label><input type="date" name="date" min="' + today + '" value="' + today + '"></div>' +
      '<div class="wb-two"><div><label class="wb-l">Heure</label><input type="time" name="time" value="20:00" required></div>' +
      '<div><label class="wb-l">Prix</label><input name="price" placeholder="Gratuit, 5 €…" maxlength="40"></div></div>' +
      '<label class="wb-l">Ville</label><select name="city" required>' + cityOptions() + "</select>" +
      '<label class="wb-l">Adresse du bar</label><input name="address" required placeholder="Ex. 12 rue Oberkampf" maxlength="120">' +
      '<label class="wb-l">Quelques mots (facultatif)</label><textarea name="desc" rows="3" maxlength="500" placeholder="Thème, lots à gagner, réservation conseillée…"></textarea>' +
      '<label class="wb-l">Affiche ou photo (facultatif)</label><input type="file" id="wb-photo" accept="image/*" style="padding:9px 10px">' +
      '<div class="wb-prev" id="wb-prev"></div>' +
      '<label class="wb-l">Ton e-mail ou ton Instagram</label><input name="contact" required placeholder="Pour te prévenir quand c\'est en ligne" maxlength="100">' +
      '<div class="wb-note">Il n\'est pas affiché sur le site. En envoyant, tu confirmes avoir les droits sur l\'affiche ou la photo. Ta soirée est vérifiée avant d\'apparaître (généralement sous 24 h).</div>' +
      '<div class="wb-err" id="wb-err"></div>' +
      '</form></div><button type="button" class="wb-cta" data-wb="send">Envoyer ma soirée</button>';
    r.querySelector("#wb-photo").addEventListener("change", function () {
      photoFile = this.files[0] || null;
      var p = r.querySelector("#wb-prev");
      p.innerHTML = photoFile ? '<img alt="" src="' + URL.createObjectURL(photoFile) + '">' : "";
    });
  }
  function err(msg) { var e = document.getElementById("wb-err"); if (e) { e.textContent = msg; e.style.display = "block"; } }

  async function geocode(address, cityName) {
    try {
      var q = encodeURIComponent(address + ", " + cityName + ", France");
      var res = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=fr&q=" + q, { headers: { "Accept-Language": "fr" } });
      var data = await res.json();
      if (data && data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    } catch (e) {}
    return null;
  }

  async function send(btn) {
    var f = document.getElementById("wb-form"); if (!f) return;
    var fd = new FormData(f);
    var bar = String(fd.get("bar") || "").trim(), title = String(fd.get("title") || "").trim();
    var address = String(fd.get("address") || "").trim(), contact = String(fd.get("contact") || "").trim();
    var city = fd.get("city"), time = String(fd.get("time") || "").trim();
    var kindBtn = f.querySelector(".wb-chip.on"), kind = kindBtn ? kindBtn.getAttribute("data-kind") : "quiz";
    var kindLabel = kindBtn ? kindBtn.textContent.replace(/^\S+\s*/, "") : "Quiz";
    var repOn = document.getElementById("wb-rep").classList.contains("on");
    var dayBtn = f.querySelector(".wb-d.on"), wd = repOn && dayBtn ? +dayBtn.getAttribute("data-day") : -1;
    if (!bar || !title || !address || !contact || !time || !CITIES[city]) return err("Merci de remplir le nom du bar, le titre, l'heure, la ville, l'adresse et ton contact.");
    if (repOn && wd < 0) return err("Choisis le jour de la semaine où ta soirée revient.");
    var date = String(fd.get("date") || "");
    if (wd >= 0) { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + ((wd - d.getDay() + 7) % 7)); date = iso(d); }
    if (!date) return err("Choisis la date de ta soirée.");
    var user = (typeof auth !== "undefined") && auth.currentUser;
    if (!user) return err("Un instant, la connexion n'est pas encore prête — réessaie dans quelques secondes.");
    btn.disabled = true; btn.textContent = "Envoi…";
    try {
      var id = "community-bar-" + Date.now();
      var coords = await geocode(address, CITIES[city].name) || { lat: CITIES[city].lat, lng: CITIES[city].lng };
      var photo = "";
      if (photoFile) {
        try {
          var ref = firebase.storage().ref().child("communityEvents/" + id + ".jpg");
          await ref.put(photoFile); photo = await ref.getDownloadURL();
        } catch (e) { console.error("Envoi de l'affiche impossible :", e); }
      }
      var extra = String(fd.get("desc") || "").trim();
      var head = "✓ Publié par le bar · " + kindLabel + (wd >= 0 ? " · 🔁 Chaque " + DAYS[wd] : "");
      var price = String(fd.get("price") || "").trim();
      var base = {
        id: id, city: city, category: kind === "concert" ? "Musique" : "Soirée",
        scene: (typeof CATEGORY_SCENE !== "undefined" && CATEGORY_SCENE[kind === "concert" ? "Musique" : "Soirée"]) || "village",
        title: title, isPlace: false, date: date, time: time, place: bar + ", " + address + ", " + CITIES[city].name,
        lat: coords.lat, lng: coords.lng, price: price || "Non précisé", thumb: "alt", photo: photo || null,
        description: head + (extra ? "\n" + extra : ""), status: "pending", authorId: user.uid,
        authorEmail: user.email || contact, createdAt: Date.now()
      };
      var full = {}; for (var k in base) full[k] = base[k];
      full.byVenue = true; full.barName = bar; full.kind = kind; full.contact = contact; if (wd >= 0) full.repeatDay = wd;
      try { await db.collection("communityEvents").doc(id).set(full); }
      catch (e1) { await db.collection("communityEvents").doc(id).set(base); }   // si la base refuse les nouveaux champs : même format qu'avant
      track("bars_sent");
      var r = root();
      r.innerHTML = '<div class="wb-in">' + TOP + '<div class="wb-ok"><div class="wb-big">🎉</div><h3>Soirée envoyée !</h3>' +
        '<p style="color:#6B7280;font-size:14px;line-height:1.5">Elle sera visible sur Whazup après vérification (généralement sous 24 h).' + (wd >= 0 ? "<br>Elle s'affichera ensuite <b>chaque " + DAYS[wd] + "</b>, automatiquement." : "") + "</p></div></div>" +
        '<button type="button" class="wb-cta" data-wb="form">Publier une autre soirée</button>';
    } catch (e) {
      console.error(e); btn.disabled = false; btn.textContent = "Envoyer ma soirée";
      err("L'envoi a échoué (" + (e && e.message ? e.message : "erreur") + "). Réessaie dans un instant.");
    }
  }

  // ---------- 5) clics ----------
  document.addEventListener("click", function (e) {
    var t = e.target.closest && e.target.closest("[data-wb], #wz-bars .wb-chip, #wz-bars .wb-d, .wz-bars-band, .wz-bars-link");
    if (!t) return;
    if (t.classList.contains("wz-bars-band") || t.classList.contains("wz-bars-link")) { e.preventDefault(); landing(); return; }
    if (t.classList.contains("wb-chip")) { t.parentNode.querySelectorAll(".wb-chip").forEach(function (c) { c.classList.toggle("on", c === t); }); return; }
    if (t.classList.contains("wb-d")) { t.parentNode.querySelectorAll(".wb-d").forEach(function (c) { c.classList.toggle("on", c === t); }); return; }
    var a = t.getAttribute("data-wb");
    if (a === "close") close();
    else if (a === "form") form();
    else if (a === "send") send(t);
    else if (a === "rep") {
      var rep = document.getElementById("wb-rep"); rep.classList.toggle("on");
      document.getElementById("wb-date-box").style.display = rep.classList.contains("on") ? "none" : "";
      if (rep.classList.contains("on") && !rep.querySelector(".wb-d.on")) { var b = rep.querySelector('.wb-d[data-day="' + new Date().getDay() + '"]'); if (b) b.classList.add("on"); }
    }
  });

  // ---------- 6) points d'entrée ----------
  function checkHash() { if (location.hash === "#bars") landing(); }
  window.addEventListener("hashchange", checkHash);
  window.__wzBarsOpen = landing;

  // lien en haut du formulaire « Nouvel événement »
  function addPublishLink() {
    var v = document.getElementById("view-publish"), f = document.getElementById("publish-form");
    if (!v || !f || v.querySelector(".wz-bars-link")) return;
    css();
    var b = document.createElement("button"); b.type = "button"; b.className = "wz-bars-link";
    b.textContent = "🍸 Tu as un bar ? Formulaire spécial soirées (quiz, karaoké…) →";
    f.parentNode.insertBefore(b, f);
  }
  // bandeau dans les rubriques Bar et Soirées
  function addBand() {
    try {
      var list = document.getElementById("event-list"); if (!list) return;
      var sel = (typeof state !== "undefined" && state.selectedCategories) || null;
      var want = !!(sel && (sel.has("Bar") || sel.has("Soirée")));
      var band = document.getElementById("wz-bars-band");
      if (!want) { if (band) band.remove(); return; }
      if (band) return;
      css();
      band = document.createElement("button"); band.type = "button"; band.id = "wz-bars-band"; band.className = "wz-bars-band";
      band.innerHTML = '<span style="font-size:22px">🍸</span><span><b>Tu as un bar ?</b><small>Publie tes soirées gratuitement</small></span><span class="go">→</span>';
      list.parentNode.insertBefore(band, list);
    } catch (e) {}
  }
  function install() {
    addPublishLink();
    if (typeof renderDiscover === "function" && !renderDiscover.__wzBars) {
      var base = renderDiscover;
      renderDiscover = function () { var r = base.apply(this, arguments); addBand(); return r; };   // eslint-disable-line no-global-assign
      renderDiscover.__wzBars = true;
    }
    addBand();
    checkHash();
  }
  if (document.readyState === "complete") setTimeout(install, 300);
  else window.addEventListener("load", function () { setTimeout(install, 300); });
})();
