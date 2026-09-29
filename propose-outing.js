// propose-outing.js — "Qu'est-ce qu'on fait ?" : proposer un événement/lieu à ses amis Whazup
// et recueillir leurs réponses (Oui / Peut-être / Non). Sondage simple, sans suggestion automatique.
(function () {
  "use strict";

  function currentEvent() {
    if (typeof allEvents !== "function" || !state || !state.currentEventId) return null;
    return allEvents().find(function (e) { return e.id === state.currentEventId; }) || null;
  }

  async function createProposal(ev, toUids) {
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return false;
    try {
      await db.collection("outingProposals").add({
        fromUid: user.uid,
        fromEmail: user.email || "",
        toUids: toUids,
        eventId: ev.id,
        eventTitle: ev.title || "",
        eventDate: ev.date || "",
        eventCity: ev.city || "",
        responses: {},
        createdAt: Date.now(),
      });
      return true;
    } catch (err) {
      console.error("Erreur lors de l'envoi de la proposition :", err);
      return false;
    }
  }

  async function respondToProposal(proposalId, answer) {
    const user = auth.currentUser;
    if (!user) return false;
    try {
      const field = "responses." + user.uid;
      await db.collection("outingProposals").doc(proposalId).update({ [field]: answer });
      return true;
    } catch (err) {
      console.error("Erreur lors de la réponse à la proposition :", err);
      return false;
    }
  }

  async function loadReceivedProposals() {
    const user = auth.currentUser;
    if (!user) return [];
    try {
      const snap = await db.collection("outingProposals").where("toUids", "array-contains", user.uid).get();
      return snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); })
        .sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    } catch (err) {
      console.error("Erreur de chargement des propositions reçues :", err);
      return null;
    }
  }

  async function loadSentProposals() {
    const user = auth.currentUser;
    if (!user) return [];
    try {
      const snap = await db.collection("outingProposals").where("fromUid", "==", user.uid).get();
      return snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); })
        .sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
    } catch (err) {
      console.error("Erreur de chargement des propositions envoyées :", err);
      return null;
    }
  }

  // ---- petite fenêtre : choisir à qui proposer l'événement courant ----
  async function openProposeModal() {
    const ev = currentEvent();
    if (!ev) return;
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      alert("Connecte-toi avec un vrai compte pour proposer une sortie à tes amis.");
      return;
    }
    if (typeof window.__loadFriendsList !== "function") return;
    const friends = await window.__loadFriendsList();
    const existing = document.getElementById("propose-outing-modal");
    if (existing) existing.remove();
    const overlay = document.createElement("div");
    overlay.id = "propose-outing-modal";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;";
    if (!friends || !friends.length) {
      overlay.innerHTML = '<div style="background:#fff;border-radius:20px;padding:20px;max-width:380px;width:100%;text-align:center;">' +
        '<div style="font-size:32px;margin-bottom:10px;">👥</div>' +
        '<div style="font-size:14px;color:#14213D;font-weight:700;margin-bottom:8px;">Pas encore d\'amis sur Whazup</div>' +
        '<div style="font-size:12.5px;color:#666;margin-bottom:16px;">Ajoute des amis pour pouvoir leur proposer cette sortie.</div>' +
        '<button id="propose-outing-close" style="width:100%;padding:12px;border-radius:999px;border:1px solid #ddd;background:#fff;color:#666;font-size:13px;cursor:pointer;">Fermer</button>' +
        '</div>';
      document.body.appendChild(overlay);
      document.getElementById("propose-outing-close").addEventListener("click", function () { overlay.remove(); });
      return;
    }
    overlay.innerHTML = '<div style="background:#fff;border-radius:20px;padding:20px;max-width:380px;width:100%;">' +
      '<div style="font-size:14px;color:#14213D;font-weight:700;margin-bottom:4px;">👥 Proposer à mes amis</div>' +
      '<div style="font-size:12px;color:#666;margin-bottom:14px;">' + (ev.title || "") + '</div>' +
      '<div id="propose-outing-friends" style="max-height:240px;overflow-y:auto;margin-bottom:14px;">' +
      friends.map(function (f) {
        return '<label style="display:flex;align-items:center;gap:10px;padding:8px 4px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#14213D;">' +
          '<input type="checkbox" class="propose-outing-check" value="' + f.uid + '" style="width:16px;height:16px;">' +
          (f.email || "Ami Whazup") +
          '</label>';
      }).join("") +
      '</div>' +
      '<button id="propose-outing-send" style="width:100%;padding:12px;border-radius:999px;border:none;background:linear-gradient(90deg,#F2864B,#E85D3D);color:#fff;font-size:13px;font-weight:700;margin-bottom:8px;cursor:pointer;">Envoyer</button>' +
      '<button id="propose-outing-cancel" style="width:100%;padding:12px;border-radius:999px;border:1px solid #ddd;background:#fff;color:#666;font-size:13px;cursor:pointer;">Annuler</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById("propose-outing-cancel").addEventListener("click", function () { overlay.remove(); });
    document.getElementById("propose-outing-send").addEventListener("click", async function () {
      const checked = Array.from(overlay.querySelectorAll(".propose-outing-check:checked")).map(function (c) { return c.value; });
      if (!checked.length) return;
      const btn = document.getElementById("propose-outing-send");
      btn.textContent = "Envoi...";
      btn.disabled = true;
      const ok = await createProposal(ev, checked);
      if (ok) {
        overlay.remove();
        if (typeof showShareToast === "function") showShareToast("✓ Proposition envoyée à " + checked.length + " ami(s) !");
      } else {
        btn.textContent = "Envoyer";
        btn.disabled = false;
        alert("Impossible d'envoyer la proposition pour le moment.");
      }
    });
  }

  function __ensureProposeButton() {
    if (document.getElementById("btn-propose-outing")) return;
    const tiles = document.querySelector(".action-tiles");
    if (!tiles) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "action-tile";
    btn.id = "btn-propose-outing";
    btn.innerHTML = '<span class="tile-icon">👥</span><span class="tile-label">Proposer</span>';
    btn.onclick = openProposeModal;
    tiles.appendChild(btn);
  }

  document.addEventListener("DOMContentLoaded", __ensureProposeButton);
  document.addEventListener("click", function (e) {
    if (e.target.closest(".event-card, .surprise-card, #surprise-card, .itin-stop")) {
      setTimeout(__ensureProposeButton, 50);
    }
  });

  // ---- rendu de la liste "Propositions" (reçues + envoyées), utilisé dans l'écran "Mes amis" ----
  function answerLabel(a) {
    if (a === "yes") return "✅ Oui";
    if (a === "maybe") return "🤔 Peut-être";
    if (a === "no") return "❌ Non";
    return "⏳ En attente";
  }

  async function renderProposalsBlock(container) {
    container.innerHTML = "Chargement...";
    const [received, sent] = await Promise.all([loadReceivedProposals(), loadSentProposals()]);
    const user = auth.currentUser;
    if (received === null || sent === null) {
      container.innerHTML = '<div style="text-align:center;color:#9BA5C2;padding:20px 0;font-size:12.5px;">Connexion impossible pour l\'instant.</div>';
      return;
    }
    let html = "";
    if (received.length) {
      html += '<div style="color:#fff;font-size:12.5px;font-weight:700;margin-bottom:8px;">On te propose</div>';
      html += received.map(function (p) {
        const myAnswer = (p.responses && p.responses[user.uid]) || null;
        return '<div class="proposal-row" data-id="' + p.id + '" style="background:rgba(139,108,242,0.12);border:1px solid rgba(139,108,242,0.35);border-radius:14px;padding:12px 14px;margin-bottom:10px;">' +
          '<div style="color:#fff;font-size:13px;font-weight:700;margin-bottom:2px;">' + (p.eventTitle || "Sortie") + '</div>' +
          '<div style="color:#9BA5C2;font-size:11px;margin-bottom:8px;">Proposé par ' + (p.fromEmail || "un ami") + '</div>' +
          (myAnswer
            ? '<div style="color:#fff;font-size:12px;">Ta réponse : ' + answerLabel(myAnswer) + ' <button class="proposal-change-btn" style="margin-left:8px;border:none;background:transparent;color:#9BA5C2;font-size:11px;text-decoration:underline;cursor:pointer;">Changer</button></div>'
            : '<div style="display:flex;gap:6px;">' +
              '<button class="proposal-answer-btn" data-answer="yes" style="flex:1;border:none;border-radius:999px;padding:7px 0;background:#2ecc71;color:#fff;font-size:11px;font-weight:700;cursor:pointer;">✅ Oui</button>' +
              '<button class="proposal-answer-btn" data-answer="maybe" style="flex:1;border:none;border-radius:999px;padding:7px 0;background:#f39c12;color:#fff;font-size:11px;font-weight:700;cursor:pointer;">🤔 Peut-être</button>' +
              '<button class="proposal-answer-btn" data-answer="no" style="flex:1;border:none;border-radius:999px;padding:7px 0;background:#e74c3c;color:#fff;font-size:11px;font-weight:700;cursor:pointer;">❌ Non</button>' +
              '</div>') +
          '</div>';
      }).join("");
    }
    if (sent.length) {
      html += '<div style="color:#fff;font-size:12.5px;font-weight:700;margin:14px 0 8px;">Tes propositions</div>';
      html += sent.map(function (p) {
        const responses = p.responses || {};
        const counts = { yes: 0, maybe: 0, no: 0 };
        Object.keys(responses).forEach(function (uid) { if (counts[responses[uid]] !== undefined) counts[responses[uid]]++; });
        const answered = Object.keys(responses).length;
        const total = (p.toUids || []).length;
        return '<div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:12px 14px;margin-bottom:10px;">' +
          '<div style="color:#fff;font-size:13px;font-weight:700;margin-bottom:2px;">' + (p.eventTitle || "Sortie") + '</div>' +
          '<div style="color:#9BA5C2;font-size:11px;">✅ ' + counts.yes + '  🤔 ' + counts.maybe + '  ❌ ' + counts.no + '  ·  ' + answered + '/' + total + ' ont répondu</div>' +
          '</div>';
      }).join("");
    }
    if (!html) {
      html = '<div style="text-align:center;color:#9BA5C2;padding:20px 0;font-size:12.5px;">Aucune proposition pour l\'instant.<br>Ouvre un événement et appuie sur "👥 Proposer" pour en envoyer une à tes amis.</div>';
    }
    container.innerHTML = html;

    container.querySelectorAll(".proposal-answer-btn").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        const row = btn.closest(".proposal-row");
        await respondToProposal(row.dataset.id, btn.dataset.answer);
        renderProposalsBlock(container);
      });
    });
    container.querySelectorAll(".proposal-change-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const row = btn.closest(".proposal-row");
        row.querySelector("div:last-child").outerHTML =
          '<div style="display:flex;gap:6px;">' +
          '<button class="proposal-answer-btn" data-answer="yes" style="flex:1;border:none;border-radius:999px;padding:7px 0;background:#2ecc71;color:#fff;font-size:11px;font-weight:700;cursor:pointer;">✅ Oui</button>' +
          '<button class="proposal-answer-btn" data-answer="maybe" style="flex:1;border:none;border-radius:999px;padding:7px 0;background:#f39c12;color:#fff;font-size:11px;font-weight:700;cursor:pointer;">🤔 Peut-être</button>' +
          '<button class="proposal-answer-btn" data-answer="no" style="flex:1;border:none;border-radius:999px;padding:7px 0;background:#e74c3c;color:#fff;font-size:11px;font-weight:700;cursor:pointer;">❌ Non</button>' +
          '</div>';
        row.querySelectorAll(".proposal-answer-btn").forEach(function (b) {
          b.addEventListener("click", async function () {
            await respondToProposal(row.dataset.id, b.dataset.answer);
            renderProposalsBlock(container);
          });
        });
      });
    });
  }

  window.__renderProposalsBlock = renderProposalsBlock;
})();

