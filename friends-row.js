// friends-row.js — rangée de ronds d'amis sur l'accueil + "Proposer une sortie" à un ami.
// Pour tout annuler : retirer la ligne <script src="friends-row.js"> dans index.html.
(function () {
  "use strict";
  var PUSH = "https://whazup-push-reminder.ericbrunebarbe.workers.dev/";
  var COLORS = ["#9d7bf0", "#2a9d8f", "#e8655a", "#3b82c4", "#d98a2b", "#c0589a", "#5a7d3a"];
  var cache = null, cacheAt = 0, busy = false;

  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function me() { try { var u = auth.currentUser; return (u && !u.isAnonymous) ? u : null; } catch (e) { return null; } }
  function nameOf(f) {
    var n = f.name || "";
    if (!n) { try { n = window.__niceName ? window.__niceName(null, f.email) : ""; } catch (e) {} }
    return n || "Ami";
  }
  function cu(x) { return esc(String(x == null ? "" : x).replace(/'/g, "%27").replace(/"/g, "%22")); }
  function colorOf(uid) { var h = 0; for (var i = 0; i < uid.length; i++) h = (h * 31 + uid.charCodeAt(i)) >>> 0; return COLORS[h % COLORS.length]; }
  function toast(m) { try { if (typeof showShareToast === "function") return showShareToast(m); } catch (e) {} }

  var css = [
    "html body.wz-v2 #view-discover > #wz-friends-row{order:1}",
    "html body.wz-v2 #view-discover > #wz-friends-hint{order:1}",
    "#wz-friends-row{order:1;display:flex;gap:14px;padding:10px 16px 2px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch}",
    "#wz-friends-row::-webkit-scrollbar{display:none}",
    "body.wz-nocity #wz-friends-row{display:none!important}",
    "#wz-friends-row .fr{flex:none;width:62px;text-align:center;font-size:11.5px;font-weight:600;color:#14213D;background:none;border:0;padding:0;cursor:pointer;font-family:inherit}",
    ".fr-pin{width:62px;height:70px;position:relative;margin:0 auto 4px}",
    ".fr-pin .shape{position:absolute;left:3px;top:0;width:56px;height:56px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);overflow:hidden;border:3px solid #DCE3E6;background:#fff}",
    ".fr-pin.on .shape{border-color:#E8655A}",
    ".fr-pin .fr-in{position:absolute;inset:-12px;transform:rotate(45deg);display:flex;align-items:center;justify-content:center;color:#fff;font:700 22px Georgia,serif;background-size:cover;background-position:center}",
    ".fr-pin .dot{position:absolute;right:1px;top:0;width:15px;height:15px;border-radius:50%;background:#E8655A;border:2px solid #F0F6FB}",
    ".fr-pin.add .shape{border:2px dashed #E8655A}.fr-pin.add .fr-in{color:#E8655A;background:#fff;font:300 32px Inter,Helvetica,sans-serif}",
    "#wz-friends-row .fr b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}",
    "#wz-friends-hint{order:1;margin:4px 18px 6px;line-height:1.4;font-size:12px;color:#5B6B7A}",
    "#wz-fs-ov{position:fixed;inset:0;background:rgba(11,19,40,.5);z-index:99990;display:flex;align-items:flex-end;justify-content:center;animation:wzfin .2s}",
    "@keyframes wzfin{from{opacity:0}to{opacity:1}}@keyframes wzfup{from{transform:translateY(40px)}to{transform:none}}",
    "#wz-fs{background:#fff;color:#14213D;width:100%;max-width:520px;max-height:88vh;overflow:auto;border-radius:28px 28px 0 0;padding:12px 20px calc(24px + env(safe-area-inset-bottom,0px));animation:wzfup .25s;font-family:inherit}",
    "#wz-fs .grip{width:40px;height:5px;border-radius:3px;background:#DCE3E6;margin:0 auto 14px}",
    "#wz-fs .who{display:flex;align-items:center;gap:14px}",
    "#wz-fs .who strong{font:700 21px Georgia,serif;display:block}#wz-fs .who small{font-size:12px;color:#5B6B7A}",
    "#wz-fs .trio{display:grid;grid-template-columns:repeat(3,1fr);gap:5px;margin:16px 0}",
    "#wz-fs .trio i{aspect-ratio:1;border-radius:14px;background-color:#DCE3E6;background-size:cover;background-position:center}",
    "#wz-fs .none{font-size:13px;color:#5B6B7A;margin:14px 0 16px}",
    "#wz-fs .btn{display:block;width:100%;border:0;background:linear-gradient(135deg,#E8655A,#d9503f);color:#fff;font:700 15px inherit;font-family:inherit;text-align:center;padding:15px;border-radius:28px;box-shadow:0 10px 20px -8px #E8655A;cursor:pointer}",
    "#wz-fs .btn.ghost{background:#fff;color:#14213D;box-shadow:none;border:1.5px solid #DCE3E6;margin-top:10px}",
    "#wz-fs .btn[disabled]{opacity:.5}",
    "#wz-fs .lnk{display:block;text-align:center;font-size:13px;font-weight:600;color:#5B6B7A;margin-top:12px;cursor:pointer;background:none;border:0;width:100%;font-family:inherit}",
    "#wz-fs .h{font:700 21px Georgia,serif}#wz-fs .sub{font-size:12px;color:#5B6B7A;margin:3px 0 12px}",
    "#wz-fs .fl{display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap}",
    "#wz-fs .fl button{font:700 12px inherit;font-family:inherit;padding:8px 14px;border-radius:18px;border:0;background:#D7ECEF;color:#1a5a68;cursor:pointer}",
    "#wz-fs .fl button.on{background:#14213D;color:#fff}",
    "#wz-fs .ev{display:flex;gap:12px;align-items:center;padding:8px;border-radius:18px;border:1.5px solid #DCE3E6;margin-bottom:9px;cursor:pointer;position:relative;background:#fff;width:100%;text-align:left;font-family:inherit;color:#14213D}",
    "#wz-fs .ev i{width:60px;height:60px;border-radius:14px;flex:none;background-color:#D7ECEF;background-size:cover;background-position:center}",
    "#wz-fs .ev b{font-size:14px;display:block;padding-right:30px}#wz-fs .ev small{font-size:11.5px;color:#5B6B7A;display:block;margin-top:3px}",
    "#wz-fs .ev.sel{border-color:#E8655A;background:#fff4f2}",
    "#wz-fs .ev.sel:after{content:'✓';position:absolute;right:12px;top:50%;transform:translateY(-50%);width:24px;height:24px;border-radius:50%;background:#E8655A;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center}",
    "#wz-fs .card3{border-radius:20px;overflow:hidden;border:1.5px solid #DCE3E6;margin:8px 0 16px}",
    "#wz-fs .card3 i{display:block;height:100px;background-color:#D7ECEF;background-size:cover;background-position:center}#wz-fs .card3 div{padding:11px 13px;font-size:13px;line-height:1.5;background:#F0F6FB}",
    "#wz-fs .card3 em{font-style:normal;color:#E8655A;font-weight:700}"
  ].join("\n");
  var st = document.createElement("style"); st.id = "wz-friends-row-css"; st.textContent = css; document.head.appendChild(st);

  // ---------- données ----------
  async function loadData(force) {
    if (!force && cache && Date.now() - cacheAt < 60000) return cache;
    var u = me(); if (!u) return null;
    var friends = [], photos = [];
    try { friends = (window.__loadFriendsList ? await window.__loadFriendsList() : []) || []; } catch (e) {}
    try { photos = (window.__wzLoadFriendPhotos ? await window.__wzLoadFriendPhotos() : []) || []; } catch (e) {}
    var by = {};
    photos.forEach(function (p) { if (p.ownerUid && p.ownerUid !== u.uid) (by[p.ownerUid] = by[p.ownerUid] || []).push(p); });
    await Promise.all(friends.map(async function (f) {
      f.photos = by[f.uid] || [];
      f.name = (f.photos[0] && f.photos[0].ownerName) || "";
      try { var pd = await db.collection("publicProfiles").doc(f.uid).get(); var x = pd && pd.exists ? pd.data() : null; if (x) { if (x.name) f.name = x.name; if (x.photo) f.avatar = x.photo; } } catch (e) {}
    }));
    friends.sort(function (a, b) { return (b.photos.length ? 1 : 0) - (a.photos.length ? 1 : 0); });
    cache = { friends: friends }; cacheAt = Date.now();
    return cache;
  }

  // ---------- rangée ----------
  function ensureRow() {
    var v = document.getElementById("view-discover");
    if (!v) return null;
    var row = document.getElementById("wz-friends-row");
    if (!row) { row = document.createElement("div"); row.id = "wz-friends-row"; row.hidden = true; v.appendChild(row); }
    return row;
  }
  async function render(force) {
    if (busy) return; busy = true;
    try {
      var row = ensureRow(); if (!row) return;
      var hint = document.getElementById("wz-friends-hint");
      if (!me()) { row.hidden = true; if (hint) hint.remove(); return; }
      var d = await loadData(force); if (!d) { row.hidden = true; return; }
      var h = '<button type="button" class="fr" data-a="invite"><div class="fr-pin add"><div class="shape"><div class="fr-in">+</div></div></div><b>Inviter</b></button>';
      d.friends.forEach(function (f, i) {
        var n = nameOf(f), on = f.photos.length > 0;
        var bg = f.avatar ? "background-image:url('" + cu(f.avatar) + "');" : "background:" + colorOf(f.uid) + ";";
        h += '<button type="button" class="fr" data-a="friend" data-i="' + i + '"><div class="fr-pin' + (on ? " on" : "") + '"><div class="shape"><div class="fr-in" style="' + bg + '">' + (f.avatar ? "" : esc(n.charAt(0).toUpperCase() || "🙂")) + '</div></div>' + (on ? '<span class="dot"></span>' : "") + '</div><b>' + esc(n) + '</b></button>';
      });
      row.innerHTML = h; row.hidden = false;
      if (!d.friends.length) {
        if (!hint) { hint = document.createElement("div"); hint.id = "wz-friends-hint"; row.parentNode.appendChild(hint); }
        hint.textContent = "Invite un ami : vous partagez vos soirées en photos et vous vous proposez des sorties.";
      } else if (hint) hint.remove();
      row.onclick = function (e) {
        var b = e.target.closest("button.fr"); if (!b) return;
        if (b.dataset.a === "invite") { if (window.__shareInviteLink) window.__shareInviteLink(); else if (window.__renderFriendsScreen) window.__renderFriendsScreen(); return; }
        openFriend(d.friends[+b.dataset.i]);
      };
    } finally { busy = false; }
  }

  // ---------- fenêtres ----------
  function sheet(html) {
    var ov = document.getElementById("wz-fs-ov");
    if (!ov) {
      ov = document.createElement("div"); ov.id = "wz-fs-ov";
      ov.innerHTML = '<div id="wz-fs"></div>';
      ov.addEventListener("click", function (e) { if (e.target === ov) ov.remove(); });
      document.body.appendChild(ov);
    }
    var s = ov.firstChild; s.innerHTML = '<div class="grip"></div>' + html; return s;
  }
  function close() { var o = document.getElementById("wz-fs-ov"); if (o) o.remove(); }

  function openFriend(f) {
    var n = nameOf(f), on = f.photos.length > 0;
    var av = '<div class="fr-pin' + (on ? " on" : "") + '" style="margin:0 6px 0 0"><div class="shape"><div class="fr-in" style="' + (f.avatar ? "background-image:url(\'" + cu(f.avatar) + "\')" : "background:" + colorOf(f.uid)) + '">' + (f.avatar ? "" : esc(n.charAt(0).toUpperCase() || "🙂")) + '</div></div>' + (on ? '<span class="dot"></span>' : "") + '</div>';
    var sub = "";
    if (on) { var days = Math.max(0, Math.floor((Date.now() - f.photos[0].createdAt) / 86400000)); sub = "A partagé une photo " + (days === 0 ? "aujourd'hui" : "il y a " + days + " j"); } else sub = "Pas de photo cette semaine";
    var trio = on ? '<div class="trio">' + f.photos.slice(0, 3).map(function (p) { return '<i style="background-image:url(\'' + cu(p.photoUrl) + '\')"></i>'; }).join("") + '</div>' : '<div class="none">Quand ' + esc(n) + " partagera une soirée, ses photos apparaîtront ici.</div>";
    var s = sheet('<div class="who">' + av + '<div><strong>' + esc(n) + '</strong><small>' + esc(sub) + '</small></div></div>' + trio +
      '<button class="btn" id="wz-fs-prop">✈ Proposer une sortie à ' + esc(n) + '</button>' +
      (on ? '<button class="lnk" id="wz-fs-photos">Voir toutes les photos</button>' : '') + '<button class="lnk" id="wz-fs-x">Fermer</button>');
    s.querySelector("#wz-fs-x").onclick = close;
    s.querySelector("#wz-fs-prop").onclick = function () { pickEvent(f); };
    var ph = s.querySelector("#wz-fs-photos");
    if (ph) ph.onclick = function () { close(); try { showView("souvenirs"); setTimeout(function () { var b = document.querySelector('#wz-ctabs button[data-t="soir"]'); if (b) b.click(); }, 300); } catch (e) {} };
  }

  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function eventsFor(range) {
    var list = [];
    try { list = (typeof baseVisibleEvents === "function" ? baseVisibleEvents() : allEvents()); } catch (e) {}
    var now = new Date(), today = iso(now), tom = iso(new Date(now.getTime() + 86400000));
    var dow = now.getDay(), toSat = (6 - dow + 7) % 7;
    var sat = iso(new Date(now.getTime() + toSat * 86400000)), sun = iso(new Date(now.getTime() + (toSat + 1) * 86400000));
    var okd = function (e) {
      if (range === "tonight") { if (e.date !== today) return false; var m = /(\d{1,2})\s*[h:]/.exec(e.time || ""); return !m || +m[1] >= 17; }
      if (range === "tomorrow") return e.date === tom;
      return e.date === sat || e.date === sun || (dow === 0 && e.date === today);
    };
    return list.filter(function (e) { return !e.isPlace && e.date && e.title && okd(e); })
      .sort(function (a, b) { return ((b.photo && !b.photoGeneric) ? 1 : 0) - ((a.photo && !a.photoGeneric) ? 1 : 0) || (a.time || "").localeCompare(b.time || ""); })
      .slice(0, 15);
  }

  function pickEvent(f, range, chosen) {
    var n = nameOf(f);
    var ranges = [["tonight", "Ce soir"], ["tomorrow", "Demain"], ["weekend", "Week-end"]];
    if (!range) { range = "tonight"; for (var i = 0; i < ranges.length; i++) { if (eventsFor(ranges[i][0]).length) { range = ranges[i][0]; break; } } }
    var evs = eventsFor(range);
    var city = ""; try { city = CITIES[state.city].name || ""; } catch (e) {}
    var h = '<div class="h">Quelle sortie pour ' + esc(n) + ' ?</div><div class="sub">' + esc(city) + '</div><div class="fl">' +
      ranges.map(function (r) { return '<button data-r="' + r[0] + '" class="' + (r[0] === range ? "on" : "") + '">' + r[1] + '</button>'; }).join("") + '</div>';
    if (!evs.length) h += '<div class="none" style="font-size:13px;color:#5B6B7A;margin:10px 0 16px">Rien de prévu sur cette période.</div>';
    h += evs.map(function (e, i) {
      return '<button class="ev' + (chosen === e.id ? " sel" : "") + '" data-i="' + i + '"><i style="' + (e.photo ? "background-image:url('" + cu(e.photo) + "')" : "") + '"></i><div><b>' + esc(e.title) + '</b><small>' + esc((e.time ? e.time + " · " : "") + (typeof formatDate === "function" ? formatDate(e.date) : e.date)) + '</small>' + (e.place ? '<small>' + esc(e.place) + '</small>' : '') + '</div></button>';
    }).join("");
    h += '<button class="btn" id="wz-fs-go" style="margin-top:14px"' + (chosen ? "" : " disabled") + '>Continuer</button><button class="lnk" id="wz-fs-back">Retour</button>';
    var s = sheet(h);
    s.querySelectorAll(".fl button").forEach(function (b) { b.onclick = function () { pickEvent(f, b.dataset.r); }; });
    s.querySelectorAll(".ev").forEach(function (b) { b.onclick = function () { pickEvent(f, range, evs[+b.dataset.i].id); }; });
    s.querySelector("#wz-fs-back").onclick = function () { openFriend(f); };
    s.querySelector("#wz-fs-go").onclick = function () { var ev = evs.filter(function (e) { return e.id === chosen; })[0]; if (ev) confirmSend(f, ev, range); };
  }

  function link(ev) { try { return eventShareUrl(ev); } catch (e) { return "https://whazup.fr/?ev=" + encodeURIComponent(ev.id) + (ev.city ? "&v=" + encodeURIComponent(ev.city) : ""); } }
  function msg(f, ev) {
    var d = typeof formatDate === "function" ? formatDate(ev.date) : ev.date;
    return nameOf(f) + ", ça te dit ? " + ev.title + " — " + d + (ev.time ? " à " + ev.time : "") + (ev.place ? " (" + ev.place + ")" : "");
  }

  function confirmSend(f, ev, range) {
    var n = nameOf(f);
    var s = sheet('<div class="h">Envoyer à ' + esc(n) + '</div><div class="sub">' + esc(n) + ' recevra une notification dans Whazup.</div>' +
      '<div class="card3"><i style="' + (ev.photo ? "background-image:url('" + cu(ev.photo) + "')" : "") + '"></i><div>' + esc(msg(f, ev)) + '<br><em>' + esc(link(ev)) + '</em></div></div>' +
      '<button class="btn" id="wz-fs-send">Envoyer dans Whazup</button><button class="btn ghost" id="wz-fs-share">Envoyer par message (WhatsApp, SMS…)</button><button class="lnk" id="wz-fs-back">Retour</button>');
    s.querySelector("#wz-fs-back").onclick = function () { pickEvent(f, range, ev.id); };
    s.querySelector("#wz-fs-share").onclick = function () {
      var text = msg(f, ev) + "\n\n" + link(ev);
      if (navigator.share) navigator.share({ title: ev.title, text: text }).catch(function () {});
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { toast("✓ Message copié, colle-le dans ta conversation."); });
    };
    s.querySelector("#wz-fs-send").onclick = async function () {
      var b = this; b.disabled = true; b.textContent = "Envoi…";
      var u = me(); if (!u) { b.textContent = "Connecte-toi d'abord"; return; }
      try {
        await db.collection("outingProposals").add({ fromUid: u.uid, fromEmail: u.email || "", toUids: [f.uid], eventId: ev.id, eventTitle: ev.title || "", eventDate: ev.date || "", eventCity: ev.city || "", responses: {}, createdAt: Date.now() });
        try { fetch(PUSH, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ uids: [f.uid], title: "👥 Nouvelle proposition de sortie", body: (window.__niceName ? window.__niceName(u, u.email) : "") + " te propose : " + (ev.title || "une sortie") }) }).catch(function () {}); } catch (e) {}
        close(); toast("✓ Proposition envoyée à " + n + " !");
      } catch (e) { console.error(e); b.disabled = false; b.textContent = "Réessayer"; toast("Envoi impossible pour le moment."); }
    };
  }

  window.__wzFriendsRowRefresh = function () { cache = null; return render(true); };

  // ---------- démarrage ----------
  function start() {
    render();
    try { if (window.__authReady) window.__authReady.then(function () { render(true); }); } catch (e) {}
    try { auth.onAuthStateChanged(function () { cache = null; render(true); }); } catch (e) {}
    document.addEventListener("visibilitychange", function () { if (!document.hidden) render(); });
    var n = 0, t = setInterval(function () { n++; if (!document.getElementById("wz-friends-row") || n < 4) render(); if (n > 12) clearInterval(t); }, 1500);
  }
  if (document.readyState !== "loading") start(); else document.addEventListener("DOMContentLoaded", start);
})();
