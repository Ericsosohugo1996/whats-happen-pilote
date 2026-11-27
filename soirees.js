// soirees.js — Soirées partagées : un album commun pour les personnes d'une soirée.
// Données : Firestore « soirees/{id} » (nom, date, lieu, membres) et « soirees/{id}/photos/{id} ».
// Photos : même dossier de stockage que le carnet (souvenirs/<uid>/soiree-…jpg), réduites comme les souvenirs.
// L'identifiant de la soirée (aléatoire) sert de lien d'invitation : https://whazup.fr/?soiree=<id>
// Pour tout annuler : retirer la ligne <script defer src="soirees.js"> dans index.html.
(function () {
  "use strict";
  if (window.__wzSoirees) return;
  window.__wzSoirees = true;

  var MAX_PHOTOS = 30, MAX_MEMBERS = 50;
  var LINK = "https://whazup.fr/?soiree=";
  var PENDING = "wz_pending_soiree";

  // ---- accès Firebase (remplaçables pour les tests) ----
  function T() { return window.__wzSoireeTest || {}; }
  function DB() { return T().db || db; }
  function AUTH() { return T().auth || auth; }
  function STORE() { return T().storage || firebase.storage(); }
  function FV() { return T().fieldValue || firebase.firestore.FieldValue; }

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  var toastTimer = null;
  function toast(m) {
    try {
      addCss();
      var t = document.getElementById("wz-so-toast");
      if (!t) { t = document.createElement("div"); t.id = "wz-so-toast"; document.body.appendChild(t); }
      t.textContent = m; t.style.opacity = "1";
      clearTimeout(toastTimer); toastTimer = setTimeout(function () { t.style.opacity = "0"; }, 3200);
    } catch (e) { try { alert(m); } catch (x) {} }
  }
  function realUser() { try { var u = AUTH().currentUser; return (u && !u.isAnonymous) ? u : null; } catch (e) { return null; } }
  function myName() {
    try {
      var u = realUser();
      var n = window.__niceName ? window.__niceName(u, u && u.email) : "";
      return n || "Un participant";
    } catch (e) { return "Un participant"; }
  }
  function newId() {
    var a = "abcdefghijklmnopqrstuvwxyz0123456789", out = "";
    try { var r = new Uint8Array(20); crypto.getRandomValues(r); for (var i = 0; i < 20; i++) out += a[r[i] % a.length]; }
    catch (e) { for (var j = 0; j < 20; j++) out += a[Math.floor(Math.random() * a.length)]; }
    return out;
  }
  function fmtDate(d) {
    try { return new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }); } catch (e) { return d || ""; }
  }
  function openAccount() { var m = document.getElementById("account-modal"); if (m) m.classList.remove("hidden"); }

  // ---- habillage ----
  var CSS = [
    "#wz-so{position:fixed;inset:0;z-index:100000;background:#FAFAFA;color:#1A1A1A;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:calc(14px + env(safe-area-inset-top,0px)) 16px calc(28px + env(safe-area-inset-bottom,0px));font-family:inherit}",
    "#wz-so .so-in{max-width:560px;margin:0 auto}",
    "#wz-so .so-top{display:flex;align-items:center;gap:10px;margin-bottom:14px}",
    "#wz-so .so-back{border:1.5px solid #E5E7EB;background:#fff;color:#14213D;border-radius:12px;padding:8px 12px;font-family:inherit;font-weight:700;font-size:14px;cursor:pointer}",
    "#wz-so h1{font-size:22px;color:#14213D;margin:0;font-weight:800}",
    "#wz-so .so-lab{font-size:12px;font-weight:800;color:#6B7280;text-transform:uppercase;letter-spacing:.06em;margin:16px 0 6px}",
    "#wz-so input[type=date]{-webkit-appearance:none;appearance:none;display:block;min-width:0;max-width:100%;height:50px;text-align:left}",
    "#wz-so input[type=date]::-webkit-date-and-time-value{text-align:left}",
    "#wz-so input[type=text],#wz-so input[type=date]{width:100%;box-sizing:border-box;background:#fff;border:1.5px solid #E5E7EB;border-radius:14px;padding:13px 14px;font:inherit;font-size:16px;color:#1A1A1A}",
    "#wz-so .so-btn{display:block;width:100%;box-sizing:border-box;background:#E8604C;color:#fff;font-weight:800;text-align:center;padding:15px;border:0;border-radius:16px;font-family:inherit;font-weight:800;font-size:16px;cursor:pointer;margin-top:14px}",
    "#wz-so .so-btn.alt{background:#fff;color:#14213D;border:2px solid #14213D}",
    "#wz-so .so-btn[disabled]{opacity:.55}",
    "#wz-so .so-card{display:block;width:100%;box-sizing:border-box;text-align:left;border:0;border-radius:18px;padding:16px;margin-bottom:10px;color:#fff;background:linear-gradient(135deg,#14213D,#2C3E6B);cursor:pointer;font:inherit}",
    "#wz-so .so-card b{display:block;font-size:18px}#wz-so .so-card span{font-size:13px;opacity:.85}",
    "#wz-so .so-row{display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #E5E7EB;border-radius:14px;padding:10px 12px;margin-bottom:8px;font-weight:700;font-size:15px}",
    "#wz-so .so-row input{width:22px;height:22px;accent-color:#E8604C;margin-left:auto}",
    "#wz-so .so-note{font-size:12.5px;color:#6B7280;line-height:1.4;margin-top:8px}",
    "#wz-so .so-hero{border-radius:18px;padding:16px;color:#fff;background:linear-gradient(135deg,#14213D,#2C3E6B);margin-bottom:12px}",
    "#wz-so .so-hero b{font-size:20px;display:block}#wz-so .so-hero span{font-size:13px;opacity:.88;display:block;margin-top:3px}",
    "#wz-so .so-tabs{display:flex;gap:6px;margin:6px 0 10px}",
    "#wz-so .so-tabs button{flex:1;border:0;border-radius:12px;padding:9px;font-family:inherit;font-weight:800;font-size:13px;background:#EEF0F4;color:#6B7280;cursor:pointer}",
    "#wz-so .so-tabs button.on{background:#14213D;color:#fff}",
    "#wz-so .so-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:4px}",
    "#wz-so .so-grid button{padding:0;border:0;background:#EEF0F4;border-radius:8px;overflow:hidden;aspect-ratio:1;cursor:pointer}",
    "#wz-so .so-grid img{width:100%;height:100%;object-fit:cover;display:block}",
    "#wz-so .so-empty{text-align:center;color:#6B7280;padding:30px 10px;font-size:14px;line-height:1.5}",
    "#wz-so .so-link{background:none;border:0;color:#9BA5C2;text-decoration:underline;font:inherit;font-size:12.5px;cursor:pointer;margin-top:18px}",
    "#wz-so-v{position:fixed;inset:0;z-index:100001;background:rgba(11,19,40,.94);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px}",
    "#wz-so-v img{max-width:100%;max-height:76vh;border-radius:12px}",
    "#wz-so-v .vb{display:flex;gap:10px;margin-top:14px}",
    "#wz-so-v button{border:0;border-radius:12px;padding:11px 16px;font-family:inherit;font-weight:800;font-size:14px;cursor:pointer;background:#fff;color:#14213D}",
    "#wz-so-v button.del{background:#E8604C;color:#fff}",
    "#account-modal{z-index:100002!important}",
    "#wz-so-toast{position:fixed;left:50%;bottom:calc(30px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);max-width:88vw;z-index:100003;background:#14213D;color:#fff;font:700 14px/1.35 system-ui,sans-serif;padding:12px 18px;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,.25);opacity:0;transition:opacity .25s;pointer-events:none;text-align:center}",
    "#wz-so-entry{display:flex;align-items:center;gap:10px;width:100%;box-sizing:border-box;margin:0 0 12px;padding:12px 14px;border-radius:16px;border:1.5px solid #E8604C;background:#FCEAE7;color:#C64A38;font-family:inherit;font-weight:800;font-size:15px;cursor:pointer}"
  ].join("\n");
  function addCss() {
    if (document.getElementById("wz-so-css")) return;
    var s = document.createElement("style"); s.id = "wz-so-css"; s.textContent = CSS; document.head.appendChild(s);
  }

  // ---- écran de base ----
  function root() {
    addCss();
    var r = document.getElementById("wz-so");
    if (!r) { r = document.createElement("div"); r.id = "wz-so"; document.body.appendChild(r); }
    return r;
  }
  function closeAll() { var r = document.getElementById("wz-so"); if (r) r.remove(); var v = document.getElementById("wz-so-v"); if (v) v.remove(); }
  function frame(title, backFn, bodyHtml) {
    var r = root();
    r.innerHTML = '<div class="so-in"><div class="so-top"><button class="so-back" id="so-back">←</button><h1>' + esc(title) + '</h1></div>' + bodyHtml + '</div>';
    r.scrollTop = 0;
    r.querySelector("#so-back").onclick = backFn || closeAll;
    return r;
  }

  var openAfterLogin = false;
  // ---- liste des soirées ----
  async function listScreen() {
    if (!realUser()) { openAfterLogin = true; toast("Connecte-toi pour créer ou rejoindre une soirée."); openAccount(); return; }
    var r = frame("Mes soirées", closeAll,
      '<button class="so-btn" id="so-new" style="margin-top:0">＋ Créer une soirée</button><div id="so-list" class="so-empty">Chargement…</div>');
    r.querySelector("#so-new").onclick = createScreen;
    var box = r.querySelector("#so-list");
    try {
      var snap = await DB().collection("soirees").where("members", "array-contains", realUser().uid).get();
      var arr = snap.docs.map(function (d) { var x = d.data(); x.id = d.id; return x; });
      arr.sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); });
      if (!arr.length) { box.innerHTML = "Aucune soirée pour l'instant.<br>Crée la première et invite tes amis !"; return; }
      box.className = ""; box.innerHTML = "";
      arr.forEach(function (s) {
        var b = document.createElement("button"); b.className = "so-card";
        b.innerHTML = "<b>" + esc(s.name) + "</b><span>" + esc(fmtDate(s.date)) + " · " + (s.members ? s.members.length : 1) + " personne" + ((s.members && s.members.length > 1) ? "s" : "") + "</span>";
        b.onclick = function () { albumScreen(s.id); };
        box.appendChild(b);
      });
    } catch (e) { console.error(e); box.textContent = "Impossible de charger tes soirées pour l'instant."; }
  }

  // ---- création + invitation ----
  async function createScreen() {
    var u = realUser(); if (!u) return;
    var today = new Date(); var iso = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");
    var r = frame("Nouvelle soirée", listScreen,
      '<div class="so-lab">Nom</div><input type="text" id="so-name" maxlength="60" placeholder="Anniversaire de Léa">' +
      '<div class="so-lab">Date</div><input type="date" id="so-date" value="' + iso + '">' +
      '<div class="so-lab">Lieu (facultatif)</div><input type="text" id="so-place" maxlength="80" placeholder="Chez Léa, Paris 11e">' +
      '<div class="so-lab">Tes amis sur Whazup</div><div id="so-fr"><div class="so-note">Chargement…</div></div>' +
      '<div class="so-note">🔒 Seules les personnes invitées voient l\'album. Tout le monde voit toutes les photos.</div>' +
      '<button class="so-btn" id="so-go">Créer la soirée</button>');
    var friends = [];
    try { friends = (window.__loadFriendsList ? await window.__loadFriendsList() : []) || []; } catch (e) {}
    var fr = r.querySelector("#so-fr");
    if (!friends.length) fr.innerHTML = '<div class="so-note">Tu n\'as pas encore d\'amis sur Whazup : crée la soirée, puis envoie-leur le lien d\'invitation.</div>';
    else {
      fr.innerHTML = "";
      friends.forEach(function (f) {
        var nm = (window.__niceName ? window.__niceName(null, f.email) : "") || f.email || "Ami";
        var row = document.createElement("label"); row.className = "so-row";
        row.innerHTML = "<span>" + esc(nm) + '</span><input type="checkbox" value="' + esc(f.uid) + '">';
        fr.appendChild(row);
      });
    }
    r.querySelector("#so-go").onclick = async function () {
      var name = r.querySelector("#so-name").value.trim();
      var date = r.querySelector("#so-date").value;
      var place = r.querySelector("#so-place").value.trim();
      if (!name) { toast("Donne un nom à la soirée."); return; }
      if (!date) { toast("Choisis la date de la soirée."); return; }
      var members = [u.uid];
      r.querySelectorAll("#so-fr input:checked").forEach(function (c) { if (members.indexOf(c.value) < 0) members.push(c.value); });
      if (members.length > MAX_MEMBERS) { toast("50 personnes maximum par soirée."); return; }
      var btn = r.querySelector("#so-go"); btn.disabled = true; btn.textContent = "Création…";
      var id = newId();
      try {
        await DB().collection("soirees").doc(id).set({ ownerUid: u.uid, ownerName: myName(), name: name, date: date, place: place, members: members, createdAt: Date.now() });
        albumScreen(id, true);
      } catch (e) { console.error(e); btn.disabled = false; btn.textContent = "Créer la soirée"; toast("Création impossible pour le moment."); }
    };
  }

  async function shareInvite(s) {
    var url = LINK + s.id;
    var text = "Rejoins la soirée « " + s.name + " » sur Whazup pour voir et partager les photos : " + url;
    try { if (navigator.share) { await navigator.share({ title: "Soirée " + s.name, text: "Rejoins la soirée « " + s.name + " » sur Whazup pour voir et partager les photos.", url: url }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text); toast("✓ Lien d'invitation copié."); }
    catch (e) { try { prompt("Copie ce lien d'invitation :", url); } catch (x) {} }
  }

  // ---- album ----
  async function albumScreen(id, justCreated) {
    var u = realUser(); if (!u) { listScreen(); return; }
    var r = frame("Soirée", listScreen, '<div class="so-empty">Chargement…</div>');
    var s;
    try {
      var d = await DB().collection("soirees").doc(id).get();
      if (!d.exists) { toast("Cette soirée n'existe plus."); return listScreen(); }
      s = d.data(); s.id = id;
    } catch (e) { console.error(e); toast("Impossible d'ouvrir la soirée."); return listScreen(); }
    if ((s.members || []).indexOf(u.uid) < 0) { toast("Tu n'as pas accès à cette soirée."); return listScreen(); }

    var photos = [], tab = "all";
    async function load() {
      var snap = await DB().collection("soirees").doc(id).collection("photos").get();
      photos = snap.docs.map(function (p) { var x = p.data(); x._id = p.id; return x; });
      photos.sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    }
    try { await load(); } catch (e) { console.error(e); }
    var isOwner = s.ownerUid === u.uid;

    function draw() {
      var mine = photos.filter(function (p) { return p.ownerUid === u.uid; });
      var shown = tab === "mine" ? mine : photos;
      var nPeople = (s.members || []).length;
      var html =
        '<div class="so-hero"><b>' + esc(s.name) + '</b><span>' + esc(fmtDate(s.date)) + (s.place ? " · " + esc(s.place) : "") + '</span>' +
        '<span>' + nPeople + ' personne' + (nPeople > 1 ? "s" : "") + ' · ' + photos.length + ' photo' + (photos.length > 1 ? "s" : "") + '</span></div>' +
        '<button class="so-btn alt" id="so-inv" style="margin-top:0">🔗 Inviter quelqu\'un</button>' +
        '<button class="so-link" id="so-copy" style="display:block;margin:8px auto 0">Copier seulement le lien</button>' +
        '<div class="so-tabs"><button data-t="all" class="' + (tab === "all" ? "on" : "") + '">Toutes</button><button data-t="mine" class="' + (tab === "mine" ? "on" : "") + '">Les miennes (' + mine.length + ')</button></div>' +
        (shown.length ? '<div class="so-grid" id="so-grid"></div>' : '<div class="so-empty">' + (tab === "mine" ? "Tu n'as pas encore ajouté de photo." : "Aucune photo pour l'instant.<br>Ajoute les premières !") + '</div>') +
        '<input type="file" id="so-file" accept="image/*" multiple style="display:none">' +
        '<button class="so-btn" id="so-add">📸 Ajouter mes photos</button>' +
        '<div class="so-note" id="so-msg"></div>' +
        (isOwner ? '<div style="text-align:center"><button class="so-link" id="so-del">Supprimer cette soirée</button></div>' : "");
      var rr = frame(s.name, listScreen, html);
      rr.querySelector("#so-inv").onclick = function () { shareInvite(s); };
      rr.querySelector("#so-copy").onclick = async function () {
        try { await navigator.clipboard.writeText(LINK + s.id); toast("✓ Lien copié."); }
        catch (e) { try { prompt("Copie ce lien :", LINK + s.id); } catch (x) {} }
      };
      rr.querySelectorAll(".so-tabs button").forEach(function (b) { b.onclick = function () { tab = b.getAttribute("data-t"); draw(); }; });
      var grid = rr.querySelector("#so-grid");
      if (grid) shown.forEach(function (p) {
        var b = document.createElement("button"); var im = document.createElement("img");
        im.loading = "lazy"; im.alt = ""; im.src = p.photoUrl; b.appendChild(im);
        b.onclick = function () { viewer(p); }; grid.appendChild(b);
      });
      rr.querySelector("#so-add").onclick = function () { rr.querySelector("#so-file").click(); };
      rr.querySelector("#so-file").onchange = function (ev) { upload(ev.target.files, rr); };
      var del = rr.querySelector("#so-del");
      if (del) del.onclick = removeAlbum;
    }
    async function upload(files, rr) {
      files = Array.prototype.slice.call(files || []);
      if (!files.length) return;
      var have = photos.filter(function (p) { return p.ownerUid === u.uid; }).length;
      var room = MAX_PHOTOS - have;
      if (room <= 0) { toast("Tu as déjà ajouté " + MAX_PHOTOS + " photos à cette soirée."); return; }
      if (files.length > room) { files = files.slice(0, room); toast("Seulement " + room + " photo" + (room > 1 ? "s" : "") + " de plus possible" + (room > 1 ? "s" : "") + " (30 maximum par personne)."); }
      var msg = rr.querySelector("#so-msg"), ok = 0;
      for (var i = 0; i < files.length; i++) {
        msg.textContent = "Envoi " + (i + 1) + " / " + files.length + "…";
        try {
          var f = files[i];
          if (window.__compressImage) f = await window.__compressImage(f);
          var pid = newId().slice(0, 10);
          var ref = STORE().ref().child("souvenirs/" + u.uid + "/soiree-" + id + "-" + pid + ".jpg");
          await ref.put(f, { contentType: "image/jpeg" });
          var url = await ref.getDownloadURL();
          await DB().collection("soirees").doc(id).collection("photos").doc(pid).set({ ownerUid: u.uid, ownerName: myName(), photoUrl: url, createdAt: Date.now() });
          ok++;
        } catch (e) { console.error(e); toast("Une photo n'a pas pu être envoyée."); }
      }
      try { await load(); } catch (e) {}
      draw();
      if (ok) toast("✓ " + ok + " photo" + (ok > 1 ? "s ajoutées" : " ajoutée"));
    }
    function viewer(p) {
      var v = document.createElement("div"); v.id = "wz-so-v";
      var canDel = p.ownerUid === u.uid || isOwner;
      v.innerHTML = '<img src="' + esc(p.photoUrl) + '" alt=""><div class="so-note" style="color:#fff;opacity:.8">Photo de ' + esc(p.ownerName || "un participant") + '</div><div class="vb"><button id="v-x">Fermer</button>' + (canDel ? '<button class="del" id="v-d">Supprimer</button>' : "") + '</div>';
      document.body.appendChild(v);
      v.querySelector("#v-x").onclick = function () { v.remove(); };
      var d = v.querySelector("#v-d");
      if (d) d.onclick = async function () {
        if (!confirm("Supprimer cette photo de la soirée ?")) return;
        try {
          await DB().collection("soirees").doc(id).collection("photos").doc(p._id).delete();
          try { await STORE().refFromURL(p.photoUrl).delete(); } catch (e) {}
          v.remove(); await load(); draw();
        } catch (e) { console.error(e); toast("Suppression impossible."); }
      };
    }
    async function removeAlbum() {
      if (!confirm("Supprimer la soirée « " + s.name + " » et toutes ses photos pour tout le monde ?")) return;
      try {
        for (var i = 0; i < photos.length; i++) {
          await DB().collection("soirees").doc(id).collection("photos").doc(photos[i]._id).delete();
          try { await STORE().refFromURL(photos[i].photoUrl).delete(); } catch (e) {}
        }
        await DB().collection("soirees").doc(id).delete();
        toast("Soirée supprimée."); listScreen();
      } catch (e) { console.error(e); toast("Suppression impossible."); }
    }
    draw();
    if (justCreated) {
      toast("✓ Soirée créée. Invite maintenant les personnes qui n'ont pas Whazup.");
    }
  }

  // ---- arrivée par un lien d'invitation ----
  function readParam() {
    try {
      var q = new URLSearchParams(location.search), id = (q.get("soiree") || "").trim();
      if (!/^[a-z0-9]{10,40}$/.test(id)) return;
      try { localStorage.setItem(PENDING, id); } catch (e) {}
      q.delete("soiree");
      var qs = q.toString();
      history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
    } catch (e) {}
  }
  function pendingId() { try { return localStorage.getItem(PENDING) || ""; } catch (e) { return ""; } }
  function clearPending() { try { localStorage.removeItem(PENDING); } catch (e) {} }

  var handling = false;
  async function handlePending() {
    var id = pendingId(); if (!id || handling) return;
    var cu = AUTH().currentUser; if (!cu) return; // la connexion (même anonyme) arrive juste après
    handling = true;
    try {
      var ref = DB().collection("soirees").doc(id), d = await ref.get();
      if (!d.exists) { clearPending(); toast("Cette soirée n'existe plus."); return; }
      var s = d.data(); s.id = id;
      var u = realUser();
      if (!u) {
        var r = frame("Tu es invité(e) 🎉", closeAll,
          '<div class="so-hero"><b>' + esc(s.name) + '</b><span>' + esc(fmtDate(s.date)) + '</span><span>Invitation de ' + esc(s.ownerName || "ton ami") + '</span></div>' +
          '<div class="so-note" style="font-size:14px">Crée ton compte Whazup (gratuit) ou connecte-toi pour voir et ajouter les photos de la soirée.</div>' +
          '<button class="so-btn" id="so-login">Me connecter ou créer mon compte</button>');
        r.querySelector("#so-login").onclick = function () { closeAll(); openAccount(); };
        return;
      }
      if ((s.members || []).indexOf(u.uid) < 0) {
        if ((s.members || []).length >= MAX_MEMBERS) { clearPending(); toast("Cette soirée est complète."); return; }
        await ref.update({ members: FV().arrayUnion(u.uid) });
        toast("✓ Tu as rejoint la soirée « " + s.name + " »");
      }
      clearPending();
      albumScreen(id);
    } catch (e) { console.error(e); toast("Impossible de rejoindre la soirée pour le moment."); }
    finally { handling = false; }
  }

  // ---- bouton dans le carnet ----
  function inject() {
    var scr = document.getElementById("souvenirs-screen");
    if (!scr || scr.querySelector("#wz-so-entry")) return;
    var tabs = scr.querySelector("#wz-ctabs") || scr.querySelector("#souvenirs-city-tabs");
    if (!tabs) return;
    addCss();
    var b = document.createElement("button"); b.id = "wz-so-entry"; b.type = "button";
    b.innerHTML = "<span>🎉</span><span>Mes soirées partagées</span><span style=\"margin-left:auto\">›</span>";
    b.onclick = listScreen;
    tabs.parentNode.insertBefore(b, tabs);
  }

  window.__wzOpenSoirees = listScreen;
  window.__wzSoireesHandlePending = handlePending;
  readParam();
  try { new MutationObserver(inject).observe(document.body, { childList: true, subtree: true }); } catch (e) {}
  try { inject(); } catch (e) {}
  try {
    var wait = setInterval(function () {
      try { AUTH().onAuthStateChanged(function () { handlePending(); if (openAfterLogin && realUser()) { openAfterLogin = false; listScreen(); } }); clearInterval(wait); } catch (e) {}
    }, 300);
    setTimeout(function () { clearInterval(wait); }, 20000);
  } catch (e) {}
})();
