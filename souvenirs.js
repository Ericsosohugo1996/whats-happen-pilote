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
    listEl.innerHTML = list.map(function (s) {
      const dateStr = new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      return '<div style="margin-bottom:18px;border-radius:16px;overflow:hidden;border:1px solid #eee;">' +
        (s.photoUrl ? '<img src="' + s.photoUrl + '" style="width:100%;height:200px;object-fit:cover;" />' : '') +
        '<div style="padding:12px;">' +
        '<div style="font-size:11px;color:#aaa;margin-bottom:4px;">' + dateStr + (s.placeName ? ' · ' + s.placeName : '') + '</div>' +
        (s.text ? '<div style="font-size:13px;color:#333;font-style:italic;">"' + s.text + '"</div>' : '') +
        '</div></div>';
    }).join('');
  }

  window.__openAddSouvenirModal = openAddSouvenirModal;
  window.__renderSouvenirsScreen = renderSouvenirsScreen;

  document.addEventListener("DOMContentLoaded", ensureFloatingButton);
  if (document.readyState !== "loading") ensureFloatingButton();
})();
