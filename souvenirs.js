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

  function nearestCityForCoords(lat, lng) {
    let closest = null;
    let closestDist = Infinity;
    Object.keys(CITIES).forEach(function (key) {
      const c = CITIES[key];
      const d = haversineKm(lat, lng, c.lat, c.lng);
      if (d < closestDist) { closestDist = d; closest = key; }
    });
    return closest;
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
      city: (lat && lng) ? nearestCityForCoords(lat, lng) : null,
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
        <input type="file" id="souvenir-photo-input" accept="image/*" capture="environment" style="display:none;" />
        <button type="button" id="souvenir-photo-trigger" style="width:100%;padding:14px;border-radius:14px;border:2px dashed #ddd;background:#fafafa;color:#888;font-size:13px;margin-bottom:12px;cursor:pointer;">📷 Ajouter une photo (optionnel)</button>
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
    const photoTrigger = document.getElementById("souvenir-photo-trigger");
    const preview = document.getElementById("souvenir-photo-preview");
    let selectedFile = null;
    photoTrigger.addEventListener("click", function () {
      photoInput.click();
    });
    photoInput.addEventListener("change", function () {
      selectedFile = photoInput.files[0] || null;
      if (selectedFile) {
        const url = URL.createObjectURL(selectedFile);
        preview.innerHTML = '<img src="' + url + '" style="width:100%;border-radius:12px;max-height:220px;object-fit:cover;" />';
        photoTrigger.textContent = "📷 Changer la photo";
        photoTrigger.style.borderStyle = "solid";
        photoTrigger.style.borderColor = "#14213D";
        photoTrigger.style.color = "#14213D";
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

  async function deleteSouvenir(s) {
    const user = auth.currentUser;
    if (!user) return;
    await db.collection("users").doc(user.uid).collection("souvenirs").doc(s.id).delete();
    if (s.photoUrl) {
      try {
        await storage.refFromURL(s.photoUrl).delete();
      } catch (e) {
        console.error("Erreur suppression photo:", e);
      }
    }
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
      '<div style="display:flex;gap:10px;margin-top:16px;">' +
      '<button id="souvenir-detail-delete" style="flex:1;padding:11px;border-radius:999px;border:1px solid #e07a5f;background:#fff;color:#c0392b;font-size:13px;">🗑️ Supprimer</button>' +
      '<button id="souvenir-detail-close" style="flex:1;padding:11px;border-radius:999px;border:1px solid #ddd;background:#fff;color:#333;font-size:13px;">Fermer</button>' +
      '</div></div>';
    document.body.appendChild(overlay);
    document.getElementById("souvenir-detail-close").addEventListener("click", function () { overlay.remove(); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });
    document.getElementById("souvenir-detail-delete").addEventListener
