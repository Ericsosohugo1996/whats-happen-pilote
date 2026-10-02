// friends.js — Système d'amis Whazup
// Deux façons de devenir ami : (1) lien d'invitation partagé, acceptation en un clic ;
// (2) recherche d'un ami par email dans l'appli, avec demande à accepter/refuser.
// Sert de base à la fonctionnalité "Qu'est-ce qu'on fait ?" (sondage de groupe), ajoutée ensuite.
(function () {
  "use strict";

  function tt(key) { return (typeof t === "function") ? t(key) : key; }

  function friendPairId(uidA, uidB) {
    return [uidA, uidB].sort().join("_");
  }

  // ---- annuaire minimal (email → profil), pour permettre la recherche d'un ami ----
  async function upsertPublicProfile(user) {
    if (!user || user.isAnonymous || !user.email) return;
    try {
      await db.collection("publicProfiles").doc(user.uid).set(
        { email: user.email, updatedAt: Date.now() },
        { merge: true }
      );
    } catch (err) {
      console.error("Erreur de mise à jour du profil public :", err);
    }
  }

  async function findUserByEmail(email) {
    const normalized = (email || "").trim().toLowerCase();
    if (!normalized) return null;
    const snap = await db.collection("publicProfiles").where("email", "==", normalized).limit(1).get();
    if (snap.empty) return null;
    return { uid: snap.docs[0].id, email: snap.docs[0].data().email };
  }

  // ---- amis déjà confirmés ----
  async function loadFriends() {
    const user = auth.currentUser;
    if (!user) return [];
    try {
      const snap = await db.collection("friendships").where("members", "array-contains", user.uid).get();
      return snap.docs.map(function (d) {
        const data = d.data();
        const otherUid = data.members.find(function (m) { return m !== user.uid; });
        const info = (data.memberInfo && data.memberInfo[otherUid]) || {};
        return { uid: otherUid, email: info.email || tt("Ami Whazup"), since: data.createdAt || 0 };
      }).sort(function (a, b) { return b.since - a.since; });
    } catch (err) {
      console.error("Erreur de chargement des amis :", err);
      return null;
    }
  }

  async function createFriendship(otherUid, otherEmail) {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return false;
    if (otherUid === user.uid) return false;
    const pairId = friendPairId(user.uid, otherUid);
    const memberInfo = {};
    memberInfo[user.uid] = { email: user.email || "" };
    memberInfo[otherUid] = { email: otherEmail || "" };
    try {
      await db.collection("friendships").doc(pairId).set({
        members: [user.uid, otherUid].sort(),
        memberInfo: memberInfo,
        createdAt: Date.now(),
      });
      return true;
    } catch (err) {
      console.error("Erreur lors de l'ajout d'ami :", err);
      return false;
    }
  }

  async function removeFriend(otherUid) {
    const user = auth.currentUser;
    if (!user) return;
    const pairId = friendPairId(user.uid, otherUid);
    try {
      await db.collection("friendships").doc(pairId).delete();
    } catch (err) {
      console.error("Erreur lors du retrait d'ami :", err);
    }
  }

  // ---- demandes d'amis envoyées depuis l'appli (recherche par email) ----
  async function sendFriendRequest(toUid, toEmail) {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return false;
    if (toUid === user.uid) return false;
    try {
      const existingFriend = await db.collection("friendships").doc(friendPairId(user.uid, toUid)).get();
      if (existingFriend.exists) return "already-friends";
      await db.collection("friendRequests").add({
        fromUid: user.uid,
        fromEmail: user.email || "",
        toUid: toUid,
        toEmail: toEmail || "",
        status: "pending",
        createdAt: Date.now(),
      });
      return true;
    } catch (err) {
      console.error("Erreur lors de l'envoi de la demande d'ami :", err);
      return false;
    }
  }

  async function loadReceivedRequests() {
    const user = auth.currentUser;
    if (!user) return [];
    try {
      const snap = await db.collection("friendRequests")
        .where("toUid", "==", user.uid)
        .where("status", "==", "pending")
        .get();
      return snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
    } catch (err) {
      console.error("Erreur de chargement des demandes reçues :", err);
      return null;
    }
  }

  async function respondToRequest(requestId, fromUid, fromEmail, accept) {
    try {
      if (accept) {
        const ok = await createFriendship(fromUid, fromEmail);
        if (!ok) return false;
      }
      await db.collection("friendRequests").doc(requestId).update({ status: accept ? "accepted" : "declined" });
      return true;
    } catch (err) {
      console.error("Erreur lors de la réponse à la demande d'ami :", err);
      return false;
    }
  }

  // ---- lien d'invitation (alternative à la recherche par email) ----
  function inviteLink() {
    const user = auth.currentUser;
    if (!user) return null;
    const email = encodeURIComponent(user.email || "");
    return "https://whazup.fr/?ami=" + user.uid + (email ? "&nom=" + email : "");
  }

  function shareInviteLink() {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      alert(tt("Connecte-toi avec un vrai compte pour inviter des amis."));
      return;
    }
    const link = inviteLink();
    const text = tt("Rejoins-moi sur Whazup pour qu'on organise nos sorties ensemble ! ") + link;
    if (navigator.share) {
      navigator.share({ title: "Whazup", text: text }).catch(function () {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(function () {
        if (typeof showShareToast === "function") showShareToast(tt("✓ Lien copié ! Envoie-le à un ami."));
      }).catch(function () {});
    }
  }
  // ---- invitation d'un ami pas encore inscrit sur Whazup ----
  async function recordPendingInvite(toEmail) {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return false;
    const normalized = (toEmail || "").trim().toLowerCase();
    if (!normalized) return false;
    try {
      await db.collection("pendingFriendInvites").doc(normalized + "_" + user.uid).set({
        fromUid: user.uid,
        fromEmail: user.email || "",
        toEmail: normalized,
        createdAt: Date.now(),
      });
      return true;
    } catch (err) {
      console.error("Erreur lors de l'enregistrement de l'invitation :", err);
      return false;
    }
  }

  // Dès qu'un compte réel se connecte, on regarde si quelqu'un l'a déjà invité avant qu'il
  // n'ait de compte : si oui, on devient amis tout de suite, sans lien à rouvrir.
  async function resolvePendingInvites(user) {
    if (!user || user.isAnonymous || !user.email) return;
    const normalized = user.email.trim().toLowerCase();
    try {
      const snap = await db.collection("pendingFriendInvites").where("toEmail", "==", normalized).get();
      for (const doc of snap.docs) {
        const data = doc.data();
        if (data.fromUid !== user.uid) {
          await createFriendship(data.fromUid, data.fromEmail);
        }
        await doc.ref.delete();
      }
    } catch (err) {
      console.error("Erreur lors de la résolution des invitations en attente :", err);
    }
  }

  function openInviteMailto(toEmail) {
    const user = auth.currentUser;
    const link = inviteLink();
    const subject = encodeURIComponent(tt("Rejoins-moi sur Whazup !"));
    const intro = (user && user.email ? user.email + " " : "") + tt("t'invite à rejoindre Whazup, pour organiser vos sorties ensemble : ");
    const body = encodeURIComponent(intro + link);
    window.location.href = "mailto:" + encodeURIComponent(toEmail) + "?subject=" + subject + "&body=" + body;
  }
  function checkFriendInviteLink() {
    const params = new URLSearchParams(window.location.search);
    const otherUid = params.get("ami");
    if (!otherUid) return;
    const otherEmail = params.get("nom") || "";
    const user = auth.currentUser;
    if (user && otherUid === user.uid) {
      history.replaceState({}, "", window.location.pathname);
      return;
    }
    const overlay = document.createElement("div");
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;";
    overlay.innerHTML = '<div style="background:#fff;border-radius:20px;padding:20px;max-width:380px;width:100%;text-align:center;">' +
      '<div style="font-size:32px;margin-bottom:10px;">👋</div>' +
      '<div style="font-size:15px;font-weight:700;color:#14213D;margin-bottom:6px;">' + (otherEmail || tt("Un utilisateur Whazup")) + '</div>' +
      '<div style="font-size:13px;color:#666;margin-bottom:16px;">' + tt("souhaite devenir ton ami sur Whazup, pour organiser des sorties ensemble.") + '</div>' +
      '<button id="friend-invite-accept" style="width:100%;padding:12px;border-radius:999px;border:none;background:linear-gradient(90deg,#F2864B,#E85D3D);color:#fff;font-size:13px;font-weight:700;margin-bottom:8px;cursor:pointer;">' + tt("Accepter") + '</button>' +
      '<button id="friend-invite-dismiss" style="width:100%;padding:12px;border-radius:999px;border:1px solid #ddd;background:#fff;color:#666;font-size:13px;cursor:pointer;">' + tt("Plus tard") + '</button>' +
      '</div>';
    document.body.appendChild(overlay);
    function closeOverlay() {
      overlay.remove();
      history.replaceState({}, "", window.location.pathname);
    }
    document.getElementById("friend-invite-dismiss").addEventListener("click", closeOverlay);
    document.getElementById("friend-invite-accept").addEventListener("click", async function () {
      const btn = document.getElementById("friend-invite-accept");
      btn.textContent = "...";
      btn.disabled = true;
      if (window.__authReady) await window.__authReady;
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.isAnonymous) {
        closeOverlay();
        alert(tt("Connecte-toi avec un vrai compte pour devenir ami, puis rouvre ce lien."));
        return;
      }
      const ok = await createFriendship(otherUid, otherEmail);
      if (ok) {
        btn.textContent = tt("✓ Ami ajouté !");
        setTimeout(closeOverlay, 1200);
      } else {
        btn.textContent = tt("Accepter");
        btn.disabled = false;
        alert(tt("Impossible d'ajouter cet ami pour le moment."));
      }
    });
  }

  // ---- écran "Mes amis" ----
  async function renderFriendsScreen() {
    const existing = document.getElementById("friends-screen");
    if (existing) existing.remove();
    const screen = document.createElement("div");
    screen.id = "friends-screen";
    screen.style.cssText = "position:fixed;inset:0;background:linear-gradient(165deg, #0E1526 0%, #141C36 55%, #1B1440 100%);z-index:9998;overflow-y:auto;padding:16px 16px 84px;";
    screen.innerHTML =
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">' +
        '<button id="friends-close-btn" style="border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#fff;border-radius:999px;padding:8px 14px;font-size:12px;">' + tt("← Retour") + '</button>' +
        '<div style="font-family:\'Fraunces\', Georgia, serif; font-size:17px;font-weight:600;color:#fff;flex:1;">👥 ' + tt("Mes amis") + '</div>' +
        '<button id="friends-invite-btn" style="border:none;background:linear-gradient(90deg,#F2864B,#E85D3D);color:#fff;border-radius:999px;padding:8px 12px;font-size:11.5px;font-weight:700;white-space:nowrap;">🔗 ' + tt("Lien") + '</button>' +
      '</div>' +
      '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:14px;margin-bottom:16px;">' +
        '<div style="color:#fff;font-size:12.5px;font-weight:700;margin-bottom:8px;">' + tt("Ajouter un ami par email") + '</div>' +
        '<div style="display:flex;gap:8px;">' +
          '<input id="friend-search-input" type="email" placeholder="' + tt("email@exemple.com") + '" style="flex:1;border:none;border-radius:999px;padding:10px 14px;font-size:12.5px;font-family:inherit;">' +
          '<button id="friend-search-btn" style="border:none;background:#14213D;color:#fff;border-radius:999px;padding:10px 16px;font-size:12.5px;font-weight:700;white-space:nowrap;">' + tt("Chercher") + '</button>' +
        '</div>' +
        '<div id="friend-search-result" style="margin-top:10px;"></div>' +
      '</div>' +
      '<div id="friend-requests-block" style="display:none;margin-bottom:16px;">' +
        '<div style="color:#fff;font-size:12.5px;font-weight:700;margin-bottom:8px;">' + tt("Demandes reçues") + '</div>' +
        '<div id="friend-requests-list"></div>' +
      '</div>' +
      '<div id="proposals-block" style="margin-bottom:16px;"></div>' +
      '<div style="color:#fff;font-size:12.5px;font-weight:700;margin-bottom:8px;">' + tt("Mes amis") + '</div>' +
      '<div id="friends-list">' + tt("Chargement...") + '</div>';
    document.body.appendChild(screen);

    document.getElementById("friends-close-btn").addEventListener("click", function () { screen.remove(); });
    document.getElementById("friends-invite-btn").addEventListener("click", shareInviteLink);

    if (typeof window.__renderProposalsBlock === "function") {
      window.__renderProposalsBlock(document.getElementById("proposals-block"));
    }
    function doSearch() {
      const input = document.getElementById("friend-search-input");
      const resultEl = document.getElementById("friend-search-result");
      const email = input.value.trim();
      if (!email) return;
      resultEl.innerHTML = '<div style="color:#9BA5C2;font-size:12px;">' + tt("Recherche...") + '</div>';
      findUserByEmail(email).then(function (found) {
        const user = auth.currentUser;
               if (!found) {
          resultEl.innerHTML = '<div style="background:rgba(255,255,255,0.06);border-radius:12px;padding:10px 12px;">' +
            '<div style="color:#9BA5C2;font-size:12px;margin-bottom:8px;">' + tt("Cette personne n'a pas encore de compte Whazup.") + '</div>' +
            '<button id="friend-invite-new-btn" style="width:100%;border:none;background:linear-gradient(90deg,#F2864B,#E85D3D);color:#fff;border-radius:999px;padding:9px 12px;font-size:12px;font-weight:700;cursor:pointer;">📤 ' + tt("Lui proposer Whazup") + '</button>' +
            '</div>';
          document.getElementById("friend-invite-new-btn").addEventListener("click", async function () {
            const btn = document.getElementById("friend-invite-new-btn");
            btn.textContent = "...";
            btn.disabled = true;
            await recordPendingInvite(email);
            openInviteMailto(email);
            btn.textContent = tt("✓ Invitation envoyée !");
          });
          return;
        }
        if (user && found.uid === user.uid) {
          resultEl.innerHTML = '<div style="color:#9BA5C2;font-size:12px;">' + tt("C'est ton propre email !") + '</div>';
          return;
        }
        resultEl.innerHTML = '<div style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.06);border-radius:12px;padding:10px 12px;">' +
          '<div style="flex:1;color:#fff;font-size:12.5px;">' + found.email + '</div>' +
          '<button id="friend-send-request-btn" style="border:none;background:linear-gradient(90deg,#F2864B,#E85D3D);color:#fff;border-radius:999px;padding:7px 12px;font-size:11.5px;font-weight:700;white-space:nowrap;">' + tt("Envoyer") + '</button>' +
          '</div>';
        document.getElementById("friend-send-request-btn").addEventListener("click", async function () {
          const btn = document.getElementById("friend-send-request-btn");
          btn.textContent = "...";
          btn.disabled = true;
          const outcome = await sendFriendRequest(found.uid, found.email);
          if (outcome === true) {
            btn.textContent = tt("✓ Envoyée");
          } else if (outcome === "already-friends") {
            btn.textContent = tt("Déjà ami");
          } else {
            btn.textContent = tt("Envoyer");
            btn.disabled = false;
            alert(tt("Impossible d'envoyer la demande pour le moment."));
          }
        });
      });
    }
    document.getElementById("friend-search-btn").addEventListener("click", doSearch);
    document.getElementById("friend-search-input").addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); doSearch(); }
    });

    // Demandes reçues
    const requests = await loadReceivedRequests();
    if (requests && requests.length) {
      const block = document.getElementById("friend-requests-block");
      const listEl = document.getElementById("friend-requests-list");
      block.style.display = "block";
      listEl.innerHTML = requests.map(function (r) {
        return '<div class="friend-request-row" data-id="' + r.id + '" data-uid="' + r.fromUid + '" data-email="' + r.fromEmail + '" style="display:flex;align-items:center;gap:10px;background:rgba(139,108,242,0.12);border:1px solid rgba(139,108,242,0.35);border-radius:14px;padding:12px 14px;margin-bottom:10px;">' +
          '<div style="flex:1;color:#fff;font-size:12.5px;">' + r.fromEmail + '</div>' +
          '<button class="friend-accept-btn" style="border:none;background:linear-gradient(90deg,#F2864B,#E85D3D);color:#fff;border-radius:999px;padding:7px 12px;font-size:11px;font-weight:700;">' + tt("Accepter") + '</button>' +
          '<button class="friend-decline-btn" style="border:1px solid rgba(255,255,255,0.2);background:transparent;color:#9BA5C2;border-radius:999px;padding:7px 12px;font-size:11px;">' + tt("Refuser") + '</button>' +
          '</div>';
      }).join("");
      listEl.querySelectorAll(".friend-accept-btn").forEach(function (btn) {
        btn.addEventListener("click", async function () {
          const row = btn.closest(".friend-request-row");
          await respondToRequest(row.dataset.id, row.dataset.uid, row.dataset.email, true);
          renderFriendsScreen();
        });
      });
      listEl.querySelectorAll(".friend-decline-btn").forEach(function (btn) {
        btn.addEventListener("click", async function () {
          const row = btn.closest(".friend-request-row");
          await respondToRequest(row.dataset.id, row.dataset.uid, row.dataset.email, false);
          renderFriendsScreen();
        });
      });
    }

    // Liste d'amis
    const listEl = document.getElementById("friends-list");
    const friends = await loadFriends();
    if (friends === null) {
      listEl.innerHTML = '<div style="text-align:center;color:#9BA5C2;padding:40px 0;">' + tt("Connexion impossible pour l'instant.") + '<br>' + tt("Vérifie ta connexion internet et réessaie.") + '</div>';
      return;
    }
    if (!friends.length) {
      listEl.innerHTML = '<div style="text-align:center;color:#9BA5C2;padding:40px 0;">' + tt("Tu n'as pas encore d'amis sur Whazup.") + '<br>' + tt("Cherche un email ci-dessus, ou envoie ton lien d'invitation !") + '</div>';
      return;
    }
    listEl.innerHTML = friends.map(function (f) {
      return '<div class="friend-row" data-uid="' + f.uid + '" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;margin-bottom:10px;">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#A57CF7,#8B6CF2);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;flex-shrink:0;">' + (f.email ? f.email[0].toUpperCase() : "?") + '</div>' +
        '<div style="flex:1;color:#fff;font-size:13px;">' + f.email + '</div>' +
        '<button class="friend-remove-btn" data-uid="' + f.uid + '" style="border:none;background:transparent;color:#E85D3D;font-size:11.5px;font-weight:700;cursor:pointer;">' + tt("Retirer") + '</button>' +
      '</div>';
    }).join("");

    listEl.querySelectorAll(".friend-remove-btn").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        if (!confirm(tt("Retirer cet ami ?"))) return;
        await removeFriend(btn.dataset.uid);
        renderFriendsScreen();
      });
    });
  }

  function bindFriendsButton() {
    const btn = document.getElementById("btn-open-friends");
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        const closeBtn = document.getElementById("btn-account-close");
        if (closeBtn) closeBtn.click();
        renderFriendsScreen();
      });
    }
    // Accès direct depuis le bandeau du haut, sans passer par "Mon compte".
    const headerBtn = document.getElementById("btn-friends-header");
    if (headerBtn && !headerBtn.dataset.bound) {
      headerBtn.dataset.bound = "1";
      headerBtn.addEventListener("click", function () {
        renderFriendsScreen();
      });
    }
  }

  function initFriends() {
    bindFriendsButton();
       function run() {
      checkFriendInviteLink();
      if (auth.currentUser) { upsertPublicProfile(auth.currentUser); resolvePendingInvites(auth.currentUser); }
      auth.onAuthStateChanged(function (user) { upsertPublicProfile(user); resolvePendingInvites(user); });
    } 
    if (window.__authReady) { window.__authReady.then(run); } else { run(); }
  }
  if (document.readyState !== "loading") {
    initFriends();
  } else {
    document.addEventListener("DOMContentLoaded", initFriends);
  }

  window.__renderFriendsScreen = renderFriendsScreen;
  window.__loadFriendsList = loadFriends;
})();
