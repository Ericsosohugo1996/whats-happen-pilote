// souvenirs.js — Carnet de souvenirs Whazup
(function () {
  "use strict";

  const storage = firebase.storage();

  function souvenirsCollection() {
    const user = auth.currentUser;
    if (!user) return null;
    return db.collection("users").doc(user.uid).collection("souvenirs");
  }

  function uid4() {
    return Math.random().toString(36).slice(2, 10);
  }

  async function saveSouvenir({ file, text, placeName, placeId, lat, lng }) {
    const user = auth.currentUser;
    if (!user) {
      alert("Connecte-toi pour enregistrer un souvenir.");
      return null;
    }
    const col = souvenirsCollection();
    const id = uid4();
    let photoUrl = "";
    if (file) {
      const ref = storage.ref().child("souvenirs/" + user.uid + "/" + id + ".jpg");
      await ref.put(file);
      photoUrl = await ref.getDownloadURL();
    }
    const data = {
      id: id,
      text: text || "",
      placeName: placeName || "",
      placeId: placeId || "",
      lat: lat || null,
      lng: lng || null,
      photoUrl: photoUrl,
      createdAt: Date.now(),
    };
    await col.doc(id).set(data);
    return data;
  }

  async function loadSouvenirs() {
    const col = souvenirsCollection();
    if (!col) return [];
    const snap = await col.orderBy("createdAt", "desc").get();
    return snap.docs.map(function (d) { return d.data(); });
  }

  function openAddSouvenirModal(prefill) {
    prefill = prefill || {};
    const existing = document.getElementById("souvenir-modal");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "souvenir-modal";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:flex-end;justify-content:center;";
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:24px 24px 0 0;padding:20px;width:100%;max-width:420px;max-height:85vh;overflow-y:auto;">
        <div style="font-size:16px;font-weight:800;color:#14213D;margin-bottom:12px;">📸 Ajouter un souvenir${prefill.placeName ? " — " + prefill.placeName : ""}</div>
        <input type="file" id="souvenir-photo-input" accept="image/*" capture="environment" style="margin-bottom:12px;width:100%;" />
        <div id="souvenir-photo-preview" style="margin-bottom:12px;"></div>
        <textarea id="souvenir-text-input" placeholder="Écris ta pensée du moment..." style="width:100%;min-height:90px;border:1px solid #ddd;border-radius:12px;padding:10px;font-family:inherit;font-size:14px;margin-bottom:14px;"></textarea>
        <div style="display:flex;gap:10px;">
          <button id="souvenir-cancel-btn" style="flex:1;padding:12px;border-radius:999px;border:1px solid #ddd;background:#fff;color:#333;font-size:13px;">Annuler</button>
          <button id="souvenir-save-btn" style="flex:1;padding:12px;border-radius:999px;border:none;background:#14213D;color:#fff;font-size:13px;font-weight:600;">Enregistrer</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const photoInput = document.getElementById("souvenir-photo-input");
    const preview = document.getElementById("souvenir-photo-preview");
    let selectedFile = null;
    photoInput.addEventListener("change", function () {
      selectedFile = photoInput.files[0] || null;
      if (selectedFile) {
        const url = URL.createObjectURL(selectedFile);
        preview.innerHTML = '<img src="' + url + '" style="width:100%;border-radius:12px;max-height:220px;object-fit:cover;" />';
      }
    });

    document.getElementById("souvenir-cancel-btn").addEventListener("click", function () {
      overlay.remove();
    });

    document.getElementById("souvenir-save-btn").addEventListener("click", async function () {
      const btn = document.getElementById("souvenir-save-btn");
      btn.textContent = "Enregistrement...";
      btn.disabled = true;
      const text = document.getElementById("souvenir-text-input").value;
      try {
        await saveSouvenir({
          file: selectedFile,
          text: text,
          placeName: prefill.placeName,
          placeId: prefill.placeId,
          lat: prefill.lat,
          lng: prefill.lng,
        });
        overlay.remove();
        if (window.__renderSouvenirsScreen) window.__renderSouvenirsScreen();
      } catch (err) {
        console.error("Erreur souvenir:", err);
        alert("Erreur lors de l'enregistrement, réessaie.");
        btn.textContent = "Enregistrer";
        btn.disabled = false;
      }
    });
  }

  function ensureFloatingButton() {
    if (document.getElementById("souvenir-fab")) return;
    const btn = document.createElement("button");
    btn.id = "souvenir-fab";
    btn.textContent = "📸";
    btn.style.cssText = "position:fixed;right:18px;bottom:90px;width:54px;height:54px;border-radius:999px;background:#E85D3D;color:#fff;font-size:22px;border:none;box-shadow:0 4px 14px rgba(0,0,0,0.3);z-index:500;";
    btn.addEventListener("click", function () {
      if (window.state && state.userPos) {
        openAddSouvenirModal({ lat: state.userPos.lat, lng: state.userPos.lng });
      } else {
        openAddSouvenirModal({});
      }
    });
    document.body.appendChild(btn);
  }

    const GRADIENTS = [
    "linear-gradient(135deg,#F4A261,#E85D3D)",
    "linear-gradient(135deg,#457B9D,#1D3557)",
    "linear-gradient(135deg,#2f8a90,#1c5f66)",
    "linear-gradient(135deg,#9D4EDD,#5A189A)",
    "linear-gradient(135deg,#E76F51,#BC6C25)",
  ];

    function gradientFor(id) {
    id = id || "x";
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return GRADIENTS[hash % GRADIENTS.length];
  }

  function groupByMonth(list) {
    const groups = {};
    list.forEach(function (s) {
      const d = new Date(s.createdAt);
      const key = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });
    return groups;
  }

  function openSouvenirDetail(s) {
    const existing = document.getElementById("souvenir-detail-modal");
    if (existing) existing.remove();
    const dateStr = new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const overlay = document.createElement("div");
    overlay.id = "souvenir-detail-modal";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;";
    overlay.innerHTML = '<div style="background:#fff;border-radius:20px;padding:20px;max-width:380px;width:100%;max-height:80vh;overflow-y:auto;">' +
      (s.photoUrl ? '<img src="' + s.photoUrl + '" style="width:100%;border-radius:14px;margin-bottom:12px;max-height:260px;object-fit:cover;" />' : '<div style="width:100%;height:140px;border-radius:14px;margin-bottom:12px;background:' + gradientFor(s.id) + ';"></div>') +
      '<div style="font-size:11px;color:#aaa;margin-bottom:6px;">' + dateStr + (s.placeName ? " · " + s.placeName : "") + '</div>' +
      (s.text ? '<div style="font-size:14px;color:#333;font-style:italic;line-height:1.5;">"' + s.text + '"</div>' : '') +
      '<button id="souvenir-detail-close" style="margin-top:16px;width:100%;padding:11px;border-radius:999px;border:1px solid #ddd;background:#fff;color:#333;font-size:13px;">Fermer</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById("souvenir-detail-close").addEventListener("click", function () { overlay.remove(); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });
  }

  async function renderSouvenirsScreen() {
    const existing = document.getElementById("souvenirs-screen");
    if (existing) existing.remove();

    const screen = document.createElement("div");
    screen.id = "souvenirs-screen";
    screen.style.cssText = "position:fixed;inset:0;background:#fff;z-index:9998;overflow-y:auto;padding:16px;";
    screen.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><button id="souvenirs-close-btn" style="border:none;background:#f0f0f0;border-radius:999px;padding:8px 14px;font-size:12px;">← Retour</button><div style="font-size:16px;font-weight:800;color:#14213D;">📖 Mes souvenirs</div></div><div id="souvenirs-list">Chargement...</div>';
    document.body.appendChild(screen);

    document.getElementById("souvenirs-close-btn").addEventListener("click", function () {
      screen.remove();
    });

    const list = await loadSouvenirs();
    const listEl = document.getElementById("souvenirs-list");
    if (!list.length) {
      listEl.innerHTML = '<div style="text-align:center;color:#888;padding:40px 0;">Aucun souvenir pour l\'instant.<br>Appuie sur 📸 pour en ajouter un !</div>';
      return;
    }

    const groups = groupByMonth(list);
    let html = "";
    Object.keys(groups).forEach(function (monthKey) {
      const items = groups[monthKey];
      html += '<div style="font-size:10px;color:#aaa;font-weight:700;margin:18px 0 8px;text-transform:uppercase;">' + monthKey + ' · ' + items.length + ' souvenir' + (items.length > 1 ? 's' : '') + '</div>';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
      items.forEach(function (s) {
        const dateShort = new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
        if (s.photoUrl) {
          html += '<div class="souvenir-card" data-id="' + s.id + '" style="border-radius:14px;overflow:hidden;position:relative;height:130px;cursor:pointer;background-image:url(\'' + s.photoUrl + '\');background-size:cover;background-position:center;">' +
            '<div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.6), transparent 60%);"></div>' +
            '<div style="position:absolute;bottom:6px;left:8px;right:8px;"><div style="color:#fff;font-size:10px;font-weight:700;">' + (s.placeName || "Souvenir libre") + '</div><div style="color:rgba(255,255,255,0.8);font-size:8.5px;">' + dateShort + '</div></div></div>';
        } else {
          html += '<div class="souvenir-card" data-id="' + s.id + '" style="border-radius:14px;overflow:hidden;position:relative;height:130px;cursor:pointer;background:' + gradientFor(s.id) + ';">' +
            '<div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.35), transparent 60%);"></div>' +
            '<div style="position:absolute;bottom:6px;left:8px;right:8px;"><div style="color:#fff;font-size:10px;font-weight:700;">' + (s.placeName || "Souvenir libre") + '</div><div style="color:rgba(255,255,255,0.8);font-size:8.5px;">' + dateShort + '</div></div></div>';
        }
      });
      html += '</div>';
    });
    listEl.innerHTML = html;

    listEl.querySelectorAll(".souvenir-card").forEach(function (card) {
      card.addEventListener("click", function () {
        const id = card.getAttribute("data-id");
        const s = list.find(function (x) { return x.id === id; });
        if (s) openSouvenirDetail(s);
      });
    });
  }

  window.__openAddSouvenirModal = openAddSouvenirModal;
  window.__renderSouvenirsScreen = renderSouvenirsScreen;
  function ensureDetailLink() {
    const btn = document.getElementById("btn-add-souvenir-detail");
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        const ev = window.allEvents ? allEvents().find(function (e) { return e.id === state.currentEventId; }) : null;
        if (ev) {
          openAddSouvenirModal({ placeName: ev.title, placeId: ev.id, lat: ev.lat, lng: ev.lng });
        } else {
          openAddSouvenirModal({});
        }
      });
    }
  }
   function ensureAccountLink() {
    const link = document.getElementById("btn-open-souvenirs");
    if (link && !link.dataset.bound) {
      link.dataset.bound = "1";
      link.addEventListener("click", function () {
        document.getElementById("btn-account-close")?.click();
        renderSouvenirsScreen();
      });
    }
  }

   function initSouvenirs() {
    ensureFloatingButton();
    ensureAccountLink();
    setInterval(ensureAccountLink, 800);
    ensureDetailLink();
    setInterval(ensureDetailLink, 800);
  }
  if (document.readyState !== "loading") {
    initSouvenirs();
  } else {
    document.addEventListener("DOMContentLoaded", initSouvenirs);
  } 
})();
