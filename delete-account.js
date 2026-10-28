// Bouton « Supprimer mon compte » dans la fenêtre « Mon compte » (exigé par l'App Store et Google Play).
// Efface les données de l'utilisateur (favoris, souvenirs + photos, amis, demandes, propositions, profil)
// puis son compte. Pour tout annuler : retirer la ligne <script src="delete-account.js"> dans index.html.
(function () {
  "use strict";

  var CSS =
    "#wz-del-open{display:block;margin:14px auto 2px;background:none;border:0;color:#9BA5C2;font:inherit;font-size:12.5px;text-decoration:underline;cursor:pointer;padding:6px 10px}" +
    "#wz-del-panel{margin-top:12px;padding:14px;border:1px solid #F1C9C2;background:#FFF5F3;border-radius:16px;font-size:13px;color:#14213D;line-height:1.45}" +
    "#wz-del-panel.hidden{display:none}" +
    "#wz-del-panel b{display:block;margin-bottom:6px;font-size:14px}" +
    "#wz-del-pass{width:100%;box-sizing:border-box;margin:10px 0 0;border:1px solid #DCE3E6;border-radius:999px;padding:10px 14px;font:inherit;font-size:13px}" +
    "#wz-del-msg{margin:10px 0 0;font-size:12.5px;color:#c0392b;min-height:1em}" +
    "#wz-del-msg.ok{color:#1d7a46}" +
    "#wz-del-go{display:block;width:100%;margin-top:12px;border:0;border-radius:999px;padding:12px;background:#c0392b;color:#fff;font:inherit;font-weight:700;font-size:14px;cursor:pointer}" +
    "#wz-del-go:disabled{opacity:.55;cursor:default}" +
    "#wz-del-cancel{display:block;width:100%;margin-top:8px;border:1px solid #DCE3E6;border-radius:999px;padding:11px;background:#fff;color:#14213D;font:inherit;font-weight:600;font-size:13.5px;cursor:pointer}";

  function $(id) { return document.getElementById(id); }

  function setMsg(text, ok) {
    var m = $("wz-del-msg");
    if (!m) return;
    m.textContent = text || "";
    m.className = ok ? "ok" : "";
  }

  // Supprime tous les documents d'une requête, par lots, sans jamais faire échouer l'ensemble.
  function delQuery(q, failures, label) {
    return q.get().then(function (snap) {
      var jobs = [];
      snap.forEach(function (d) {
        jobs.push(d.ref.delete().catch(function (e) { failures.push(label + " : " + (e && e.code || e)); }));
      });
      return Promise.all(jobs);
    }).catch(function (e) { failures.push(label + " (lecture) : " + (e && e.code || e)); });
  }

  function delDoc(ref, failures, label) {
    return ref.delete().catch(function (e) { failures.push(label + " : " + (e && e.code || e)); });
  }

  function reauth(user, password) {
    var providers = (user.providerData || []).map(function (p) { return p.providerId; });
    if (providers.indexOf("password") !== -1) {
      if (!password) return Promise.reject({ code: "wz/need-password" });
      var cred = firebase.auth.EmailAuthProvider.credential(user.email, password);
      return user.reauthenticateWithCredential(cred);
    }
    if (providers.indexOf("google.com") !== -1) {
      return user.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider());
    }
    return Promise.resolve(); // compte anonyme : pas de ré-authentification possible
  }

  function deleteEverything(user) {
    var db = firebase.firestore();
    var storage = firebase.storage();
    var uid = user.uid;
    var failures = [];
    var me = db.collection("users").doc(uid);

    // 1) Souvenirs : photos (Storage) puis documents
    return me.collection("souvenirs").get().then(function (snap) {
      var jobs = [];
      snap.forEach(function (d) {
        jobs.push(storage.ref().child("souvenirs/" + uid + "/" + d.id + ".jpg").delete().catch(function () {}));
        jobs.push(d.ref.delete().catch(function (e) { failures.push("souvenirs : " + (e && e.code || e)); }));
      });
      return Promise.all(jobs);
    }).catch(function (e) { failures.push("souvenirs (lecture) : " + (e && e.code || e)); })
      // 1b) Photos restantes éventuelles dans le dossier de l'utilisateur
      .then(function () {
        return storage.ref().child("souvenirs/" + uid).listAll().then(function (res) {
          return Promise.all(res.items.map(function (it) { return it.delete().catch(function () {}); }));
        }).catch(function () {});
      })
      // 2) Sous-collection « interests » de l'utilisateur
      .then(function () { return delQuery(me.collection("interests"), failures, "interests"); })
      // 3) Partages, amis, demandes, propositions
      .then(function () { return delQuery(db.collection("sharedPhotos").where("ownerUid", "==", uid), failures, "sharedPhotos"); })
      .then(function () { return delQuery(db.collection("friendships").where("members", "array-contains", uid), failures, "friendships"); })
      .then(function () { return delQuery(db.collection("friendRequests").where("fromUid", "==", uid), failures, "friendRequests(envoyées)"); })
      .then(function () { return delQuery(db.collection("friendRequests").where("toUid", "==", uid), failures, "friendRequests(reçues)"); })
      .then(function () { return delQuery(db.collection("pendingFriendInvites").where("fromUid", "==", uid), failures, "pendingFriendInvites"); })
      .then(function () { return delQuery(db.collection("outingProposals").where("fromUid", "==", uid), failures, "outingProposals"); })
      // 4) Profils puis document principal
      .then(function () { return delDoc(db.collection("publicProfiles").doc(uid), failures, "publicProfiles"); })
      .then(function () { return delDoc(db.collection("profilePhotos").doc(uid), failures, "profilePhotos"); })
      .then(function () { return delDoc(me, failures, "users"); })
      .then(function () { return failures; });
  }

  function run() {
    var user = firebase.auth().currentUser;
    if (!user) { setMsg("Tu n'es pas connecté."); return; }
    var go = $("wz-del-go");
    var passEl = $("wz-del-pass");
    var password = passEl ? passEl.value : "";
    go.disabled = true;
    setMsg("Vérification…");
    reauth(user, password).then(function () {
      setMsg("Suppression en cours, ne ferme pas la page…");
      return deleteEverything(user);
    }).then(function (failures) {
      if (failures && failures.length) {
        // On n'efface pas le compte si une donnée n'a pas pu être supprimée : on prévient plutôt.
        console.error("Suppression incomplète :", failures);
        setMsg("Certaines données n'ont pas pu être effacées. Ton compte est conservé : écris-nous à whazup.contact@gmail.com et nous terminerons la suppression.");
        go.disabled = false;
        return null;
      }
      return firebase.auth().currentUser.delete().then(function () {
        setMsg("Ton compte et tes données ont été supprimés.", true);
        try { localStorage.clear(); } catch (e) {}
        setTimeout(function () { location.reload(); }, 1800);
      });
    }).catch(function (e) {
      go.disabled = false;
      var c = e && e.code;
      if (c === "wz/need-password") setMsg("Saisis ton mot de passe pour confirmer.");
      else if (c === "auth/wrong-password" || c === "auth/invalid-credential" || c === "auth/invalid-login-credentials") setMsg("Mot de passe incorrect.");
      else if (c === "auth/popup-closed-by-user" || c === "auth/cancelled-popup-request") setMsg("Confirmation annulée.");
      else if (c === "auth/requires-recent-login") setMsg("Par sécurité, déconnecte-toi, reconnecte-toi, puis recommence.");
      else { console.error(e); setMsg("La suppression a échoué. Réessaie, ou écris-nous à whazup.contact@gmail.com."); }
    });
  }

  function build() {
    var logout = $("btn-account-logout");
    if (!logout || $("wz-del-open")) return !!$("wz-del-open");
    if (!$("wz-del-css")) {
      var st = document.createElement("style");
      st.id = "wz-del-css";
      st.textContent = CSS;
      document.head.appendChild(st);
    }
    var open = document.createElement("button");
    open.type = "button";
    open.id = "wz-del-open";
    open.textContent = "Supprimer mon compte";

    var panel = document.createElement("div");
    panel.id = "wz-del-panel";
    panel.className = "hidden";
    panel.innerHTML =
      "<b>Supprimer définitivement ton compte ?</b>" +
      "Tes favoris, souvenirs (photos comprises), amis, demandes et propositions seront effacés. Cette action est irréversible." +
      '<input type="password" id="wz-del-pass" placeholder="Ton mot de passe" autocomplete="current-password" style="display:none">' +
      '<div id="wz-del-msg" role="status"></div>' +
      '<button type="button" id="wz-del-go">Oui, tout supprimer</button>' +
      '<button type="button" id="wz-del-cancel">Annuler</button>';

    logout.insertAdjacentElement("afterend", open);
    open.insertAdjacentElement("afterend", panel);

    open.onclick = function () {
      var user = firebase.auth().currentUser;
      var isPwd = user && (user.providerData || []).some(function (p) { return p.providerId === "password"; });
      $("wz-del-pass").style.display = isPwd ? "block" : "none";
      $("wz-del-pass").value = "";
      setMsg("");
      $("wz-del-go").disabled = false;
      panel.classList.remove("hidden");
      open.style.display = "none";
    };
    $("wz-del-cancel").onclick = function () {
      panel.classList.add("hidden");
      open.style.display = "block";
      setMsg("");
    };
    $("wz-del-go").onclick = run;
    return true;
  }

  function init() {
    try {
      if (build()) return;
      var tries = 0;
      var t = setInterval(function () {
        tries++;
        if (build() || tries > 40) clearInterval(t);
      }, 500);
    } catch (e) { console.error("delete-account.js", e); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
