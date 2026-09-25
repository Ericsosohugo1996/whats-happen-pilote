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

  // ---- détecte automatiquement le lieu où l'on se trouve (bar, salle, événement à proximité) ----
  // ---- ville la plus proche de coordonnées données ----
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

  // ---- détecte automatiquement le lieu où l'on se trouve (bar, salle, événement à proximité) ----
  function findNearestPlace(lat, lng) {
    if (!window.allEvents || typeof haversineKm !== "function") return null;
    let closest = null;
    let closestKm = Infinity;
    allEvents().forEach(function (ev) {
      if (!ev.lat || !ev.lng) return;
      const d = haversineKm(lat, lng, ev.lat, ev.lng);
      if (d < closestKm) { closestKm = d; closest = ev; }
    });
    if (closest && closestKm <= 0.12) {
      return { placeName: closest.title, placeId: closest.id };
    }
    return null;
  }
  async function saveSouvenir({ file, text, placeName, placeId, lat, lng, category, city }) {
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
    const resolvedCity = (lat && lng) ? nearestCityForCoords(lat, lng) : (city || null);
    // Instantané météo automatique : coordonnées précises si connues, sinon coordonnées de la
    // ville sélectionnée. Best-effort — un souvenir se sauvegarde même si la météo échoue.
    let weatherIcon = null, weatherTemp = null;
    try {
      const weatherCoords = (lat && lng) ? { lat: lat, lng: lng } : (resolvedCity && CITIES[resolvedCity] ? CITIES[resolvedCity] : null);
      if (weatherCoords && typeof fetchWeatherSnapshot === "function") {
        const snap = await fetchWeatherSnapshot(weatherCoords.lat, weatherCoords.lng);
        if (snap) { weatherIcon = snap.icon; weatherTemp = snap.temp; }
      }
    } catch (e) { /* météo indisponible, on continue sans */ }
    const data = {
      id: id,
      text: text || "",
      placeName: placeName || "",
      placeId: placeId || "",
      lat: lat || null,
      lng: lng || null,
      city: resolvedCity,
      photoUrl: photoUrl,
      category: category || "",
      weatherIcon: weatherIcon,
      weatherTemp: weatherTemp,
      createdAt: Date.now(),
    };
    await col.doc(id).set(data);
    return data;
  }

  // ---- migration des anciennes photos locales (IndexedDB, pré-"Mon carnet") ----
  function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(",");
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : "image/jpeg";
    const bin = atob(parts[1]);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
    return new Blob([arr], { type: mime });
  }

  async function migrateLegacyPhotosForCity(cityKey) {
    if (typeof getPhotosForCity !== "function") return [];
    let legacyPhotos = [];
    try { legacyPhotos = await getPhotosForCity(cityKey); } catch (e) { return []; }
    if (!legacyPhotos.length) return [];
    const imported = [];
    for (const p of legacyPhotos) {
      try {
        const blob = dataUrlToBlob(p.dataUrl);
        const saved = await saveSouvenir({ file: blob, text: "", placeName: "Photo importée", category: "Autre", city: cityKey });
        if (saved) {
          imported.push(saved);
          if (typeof deletePhotoById === "function") await deletePhotoById(p.id);
        }
      } catch (e) {
        console.error("Erreur migration photo:", e);
      }
    }
    return imported;
  }

  async function loadSouvenirs() {
    const col = souvenirsCollection();
    if (!col) return [];
    const snap = await col.orderBy("createdAt", "desc").get();
    return snap.docs.map(function (d) { return d.data(); });
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

  const SOUVENIR_CATEGORIES = [
    { key: "Visite / Monument", label: "🏛️ Visite / Monument" },
    { key: "Restaurant / Bar", label: "🍸 Restaurant / Bar" },
    { key: "Plage", label: "🏖️ Plage" },
    { key: "Soirée", label: "🎉 Soirée" },
    { key: "Culture", label: "🎭 Culture" },
    { key: "Autre", label: "📍 Autre" },
  ];

  function openAddSouvenirModal(prefill) {
    prefill = prefill || {};
    const existing = document.getElementById("souvenir-modal");
    if (existing) existing.remove();

    const cityKey = prefill.lat && prefill.lng ? nearestCityForCoords(prefill.lat, prefill.lng) : (state.userPos ? nearestCityKey() : state.city);
    const cityName = (cityKey && typeof CITIES !== "undefined" && CITIES[cityKey]) ? CITIES[cityKey].name : "";
    const nowStr = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) + " · " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

    const overlay = document.createElement("div");
    overlay.id = "souvenir-modal";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:flex-end;justify-content:center;";
    overlay.innerHTML =
      '<div style="background:#fff;border-radius:24px 24px 0 0;padding:20px;width:100%;max-width:420px;max-height:88vh;overflow-y:auto;">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">' +
      '<div style="font-size:16px;font-weight:800;color:#14213D;">Ajouter un souvenir</div>' +
      '<button id="souvenir-modal-close" style="width:28px;height:28px;border-radius:50%;border:none;background:#f0f0f0;color:#666;font-size:14px;cursor:pointer;">✕</button>' +
      '</div>' +
      '<input type="file" id="souvenir-photo-input" accept="image/*" capture="environment" style="display:none;" />' +
      '<div id="souvenir-photo-preview" style="position:relative;width:100%;height:200px;border-radius:16px;overflow:hidden;background:#fafafa;border:2px dashed #ddd;display:flex;align-items:center;justify-content:center;cursor:pointer;margin-bottom:14px;">' +
      '<div id="souvenir-photo-placeholder" style="text-align:center;color:#999;">' +
      '<div style="font-size:28px;margin-bottom:4px;">📷</div>' +
      '<div style="font-size:12px;">Ajouter une photo</div>' +
      '</div>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:6px;padding:10px 12px;background:#f7f7f9;border-radius:12px;margin-bottom:14px;">' +
      '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:#333;">📍 ' + (prefill.placeName || "Souvenir libre") + '</div>' +
      (cityName ? '<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#888;">📍 ' + cityName + '</div>' : '') +
      '<div style="display:flex;align-items:center;gap:8px;font-size:12px;color:#888;">📅 ' + nowStr + '</div>' +
      '</div>' +
      '<textarea id="souvenir-text-input" placeholder="Écris ta pensée du moment..." style="width:100%;min-height:80px;border:1px solid #ddd;border-radius:12px;padding:10px;font-family:inherit;font-size:14px;margin-bottom:12px;box-sizing:border-box;"></textarea>' +
      '<div style="font-size:11px;color:#888;font-weight:700;margin-bottom:6px;">CATÉGORIE</div>' +
      '<select id="souvenir-category-input" style="width:100%;padding:11px;border-radius:12px;border:1px solid #ddd;font-size:13px;color:#333;margin-bottom:16px;background:#fff;">' +
      SOUVENIR_CATEGORIES.map(function (c) { return '<option value="' + c.key + '">' + c.label + '</option>'; }).join("") +
      '</select>' +
      '<div style="display:flex;gap:10px;">' +
      '<button id="souvenir-cancel-btn" style="flex:1;padding:12px;border-radius:999px;border:1px solid #ddd;background:#fff;color:#333;font-size:13px;">Annuler</button>' +
      '<button id="souvenir-save-btn" style="flex:2;padding:12px;border-radius:999px;border:none;background:linear-gradient(90deg,#F2864B,#E85D3D);color:#fff;font-size:13px;font-weight:700;">Enregistrer</button>' +
      '</div></div>';
    document.body.appendChild(overlay);

    const photoInput = document.getElementById("souvenir-photo-input");
    const photoPreview = document.getElementById("souvenir-photo-preview");
    let selectedFile = null;
    photoPreview.addEventListener("click", function () {
      photoInput.click();
    });
    photoInput.addEventListener("change", function () {
      selectedFile = photoInput.files[0] || null;
      if (selectedFile) {
        const url = URL.createObjectURL(selectedFile);
        photoPreview.style.border = "none";
        photoPreview.innerHTML =
          '<img src="' + url + '" style="width:100%;height:100%;object-fit:cover;" />' +
          '<button id="souvenir-photo-remove" type="button" style="position:absolute;top:8px;right:8px;width:28px;height:28px;border-radius:50%;border:none;background:rgba(0,0,0,0.55);color:#fff;font-size:13px;cursor:pointer;">✕</button>';
        document.getElementById("souvenir-photo-remove").addEventListener("click", function (e) {
          e.stopPropagation();
          selectedFile = null;
          photoInput.value = "";
          photoPreview.style.border = "2px dashed #ddd";
          photoPreview.innerHTML =
            '<div id="souvenir-photo-placeholder" style="text-align:center;color:#999;"><div style="font-size:28px;margin-bottom:4px;">📷</div><div style="font-size:12px;">Ajouter une photo</div></div>';
        });
      }
    });

    document.getElementById("souvenir-modal-close").addEventListener("click", function () {
      overlay.remove();
    });
    document.getElementById("souvenir-cancel-btn").addEventListener("click", function () {
      overlay.remove();
    });

    document.getElementById("souvenir-save-btn").addEventListener("click", async function () {
      const btn = document.getElementById("souvenir-save-btn");
      btn.textContent = "Enregistrement...";
      btn.disabled = true;
      const text = document.getElementById("souvenir-text-input").value;
      const category = document.getElementById("souvenir-category-input").value;
      try {
        await saveSouvenir({
          file: selectedFile,
          text: text,
          placeName: prefill.placeName,
          placeId: prefill.placeId,
          lat: prefill.lat,
          lng: prefill.lng,
          category: category,
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
    if (!document.getElementById("souvenir-fab")) {
      const btn = document.createElement("button");
      btn.id = "souvenir-fab";
      btn.textContent = "📸";
      btn.style.cssText = "position:fixed;right:18px;bottom:90px;width:54px;height:54px;border-radius:999px;background:#E85D3D;color:#fff;font-size:22px;border:none;box-shadow:0 4px 14px rgba(0,0,0,0.3);z-index:9999;";
      btn.addEventListener("click", function () {
        if (btn.disabled) return;
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = "…";
        let settled = false;
        // Filet de sécurité : si la géolocalisation ne répond jamais (popup
        // ignorée, permission bloquée silencieusement, etc.), on ne laisse
        // pas le bouton bloqué indéfiniment sur "…".
        const safetyTimer = setTimeout(function () {
          if (settled) return;
          settled = true;
          openAddSouvenirModal({});
          btn.disabled = false;
          btn.textContent = originalText;
        }, 6000);
        function finish() {
          if (settled) return true;
          settled = true;
          clearTimeout(safetyTimer);
          return false;
        }
        function openWithCoords(lat, lng) {
          if (finish()) return;
          const place = findNearestPlace(lat, lng) || {};
          openAddSouvenirModal({ lat: lat, lng: lng, placeName: place.placeName, placeId: place.placeId });
          btn.disabled = false;
          btn.textContent = originalText;
        }
        if (state.userPos) {
          openWithCoords(state.userPos.lat, state.userPos.lng);
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            function (pos) { openWithCoords(pos.coords.latitude, pos.coords.longitude); },
            function () {
              if (finish()) return;
              openAddSouvenirModal({});
              btn.disabled = false;
              btn.textContent = originalText;
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        } else {
          if (!finish()) {
            openAddSouvenirModal({});
            btn.disabled = false;
            btn.textContent = originalText;
          }
        }
      });
          document.body.appendChild(btn);
    }
    const oldCarnetFab = document.getElementById("souvenir-carnet-fab");
    if (oldCarnetFab) oldCarnetFab.remove();
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
    const shareLink = "https://whazup.fr/index.html?souvenir=" + (auth.currentUser ? auth.currentUser.uid : "") + "_" + s.id;
    const shareText = (s.placeName || "Un souvenir") + " sur Whazup";
    const overlay = document.createElement("div");
    overlay.id = "souvenir-detail-modal";
    overlay.style.cssText = "position:fixed;inset:0;background:rgba(10,14,26,0.85);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;";
    overlay.innerHTML =
      '<div style="width:100%;max-width:380px;max-height:88vh;overflow-y:auto;">' +
      '<div style="display:flex;justify-content:flex-end;margin-bottom:8px;">' +
      '<button id="souvenir-detail-close" style="width:30px;height:30px;border-radius:50%;border:none;background:rgba(255,255,255,0.15);color:#fff;font-size:14px;cursor:pointer;">✕</button>' +
      '</div>' +
      '<div style="background:#fff;border-radius:16px;padding:14px 14px 18px;box-shadow:0 20px 40px -12px rgba(0,0,0,0.5);">' +
      (s.photoUrl ? '<img src="' + s.photoUrl + '" style="width:100%;border-radius:10px;max-height:280px;object-fit:cover;display:block;" />' : '<div style="width:100%;height:180px;border-radius:10px;background:' + gradientFor(s.id) + ';"></div>') +
      (s.text ? '<div style="font-family:\'Fraunces\', Georgia, serif; font-style:italic; font-size:14.5px; color:#333; margin-top:14px; line-height:1.5;">' + s.text + (/[❤️😊🎉✨👍🙂😍]/.test(s.text) ? "" : " ❤️") + '</div>' : '') +
      '<div style="display:flex;align-items:center;gap:6px;margin-top:10px;font-size:11.5px;color:#999;">' + (s.placeName ? '📍 ' + s.placeName + ' · ' : '') + dateStr + (s.weatherIcon ? ' · ' + s.weatherIcon + ' ' + s.weatherTemp + '°C' : '') + '</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-around;margin-top:20px;">' +
      '<button class="souvenir-share-opt" data-net="whatsapp" style="background:none;border:none;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;color:#fff;"><span style="width:46px;height:46px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;font-size:20px;">💬</span><span style="font-size:10px;">WhatsApp</span></button>' +
      '<button class="souvenir-share-opt" data-net="instagram" style="background:none;border:none;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;color:#fff;"><span style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,#F58529,#DD2A7B,#8134AF);display:flex;align-items:center;justify-content:center;font-size:20px;">📷</span><span style="font-size:10px;">Instagram</span></button>' +
      '<button class="souvenir-share-opt" data-net="facebook" style="background:none;border:none;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;color:#fff;"><span style="width:46px;height:46px;border-radius:50%;background:#1877F2;display:flex;align-items:center;justify-content:center;font-size:20px;">f</span><span style="font-size:10px;">Facebook</span></button>' +
      '<button class="souvenir-share-opt" data-net="link" style="background:none;border:none;display:flex;flex-direction:column;align-items:center;gap:6px;cursor:pointer;color:#fff;"><span style="width:46px;height:46px;border-radius:50%;background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;font-size:20px;">🔗</span><span style="font-size:10px;">Lien</span></button>' +
      '</div>' +
      '<button id="souvenir-detail-share" style="width:100%;margin-top:18px;padding:13px;border-radius:999px;border:none;background:linear-gradient(90deg,#F2864B,#E85D3D);color:#fff;font-size:14px;font-weight:700;cursor:pointer;">Partager</button>' +
      '<button id="souvenir-detail-delete" style="width:100%;margin-top:10px;padding:10px;border-radius:999px;border:none;background:none;color:rgba(255,255,255,0.6);font-size:12px;cursor:pointer;">🗑️ Supprimer ce souvenir</button>' +
      '</div>';
    document.body.appendChild(overlay);
    document.getElementById("souvenir-detail-close").addEventListener("click", function () { overlay.remove(); });
    overlay.addEventListener("click", function (e) { if (e.target === overlay) overlay.remove(); });

    async function doShare() {
      if (navigator.share) {
        try { await navigator.share({ title: "Un souvenir Whazup", text: shareText, url: shareLink }); return; } catch (e) {}
      }
      try {
        await navigator.clipboard.writeText(shareLink);
        if (typeof showShareToast === "function") showShareToast("✓ Lien copié ! Colle-le où tu veux.");
        else alert("Lien copié ! Colle-le où tu veux le partager.");
      } catch (e) {
        prompt("Copie ce lien :", shareLink);
      }
    }

    document.getElementById("souvenir-detail-share").addEventListener("click", doShare);
    overlay.querySelectorAll(".souvenir-share-opt").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        const net = btn.dataset.net;
        if (net === "whatsapp") {
          window.open("https://wa.me/?text=" + encodeURIComponent(shareText + " " + shareLink), "_blank");
        } else if (net === "facebook") {
          window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(shareLink), "_blank");
        } else if (net === "instagram") {
          try {
            await navigator.clipboard.writeText(shareLink);
            if (typeof showShareToast === "function") showShareToast("✓ Lien copié ! Colle-le dans ta story Instagram.");
            else alert("Lien copié ! Colle-le dans ta story Instagram.");
          } catch (e) {}
        } else if (net === "link") {
          try {
            await navigator.clipboard.writeText(shareLink);
            if (typeof showShareToast === "function") showShareToast("✓ Lien copié !");
            else alert("Lien copié !");
          } catch (e) {}
        }
      });
    });

    document.getElementById("souvenir-detail-delete").addEventListener("click", async function () {
      if (!confirm("Supprimer ce souvenir définitivement ?")) return;
      const btn = document.getElementById("souvenir-detail-delete");
      btn.textContent = "Suppression...";
      btn.disabled = true;
      try {
        await deleteSouvenir(s);
        overlay.remove();
        renderSouvenirsScreen();
      } catch (err) {
        console.error("Erreur suppression:", err);
        alert("Erreur lors de la suppression, réessaie.");
        btn.textContent = "🗑️ Supprimer ce souvenir";
        btn.disabled = false;
      }
    });
  }

  function renderTripMap(cityKey, items) {
    const withCoords = items.filter(function (s) { return s.lat && s.lng; }).sort(function (a, b) { return a.createdAt - b.createdAt; });
    if (!withCoords.length) return;

    const overlay = document.createElement("div");
    overlay.id = "souvenirs-map-overlay";
    overlay.style.cssText = "position:fixed;inset:0;background:#fff;z-index:10001;display:flex;flex-direction:column;";
    const cityName = (cityKey !== "autre" && CITIES[cityKey]) ? CITIES[cityKey].name : "Autre";
    overlay.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;padding:16px;border-bottom:1px solid #eee;">' +
      '<button id="trip-map-close" style="border:none;background:#f0f0f0;border-radius:999px;padding:8px 14px;font-size:12px;">← Retour</button>' +
      '<div style="font-size:15px;font-weight:800;color:#14213D;">🗺️ Mon voyage à ' + cityName + '</div>' +
      '</div>' +
      '<div id="trip-map-canvas" style="flex:1;"></div>' +
      '<div id="trip-map-list" style="max-height:160px;overflow-y:auto;padding:12px 16px;border-top:1px solid #eee;"></div>';
    document.body.appendChild(overlay);

    document.getElementById("trip-map-close").addEventListener("click", function () {
      overlay.remove();
    });

    const map = L.map("trip-map-canvas").setView([withCoords[0].lat, withCoords[0].lng], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);

    const latlngs = [];
    withCoords.forEach(function (s) {
      const marker = L.circleMarker([s.lat, s.lng], { radius: 10, fillColor: "#E85D3D", color: "#fff", weight: 2, fillOpacity: 1 }).addTo(map);
      marker.bindPopup("<b>" + (s.placeName || "Souvenir") + "</b>");
      latlngs.push([s.lat, s.lng]);
    });
    if (latlngs.length > 1) {
      L.polyline(latlngs, { color: "#E85D3D", weight: 2, dashArray: "6,6" }).addTo(map);
      map.fitBounds(latlngs, { padding: [40, 40] });
    }

    const listEl = document.getElementById("trip-map-list");
    listEl.innerHTML = withCoords.map(function (s) {
      const dateStr = new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
      return '<div style="display:flex;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #f5f5f5;">' +
        '<div style="width:8px;height:8px;border-radius:999px;background:#E85D3D;flex-shrink:0;"></div>' +
        '<div><div style="font-size:12px;font-weight:700;color:#14213D;">' + (s.placeName || "Souvenir libre") + '</div><div style="font-size:10px;color:#888;">' + dateStr + '</div></div>' +
        '</div>';
    }).join("");
  }

  let souvenirsCurrentCity = "";

  async function renderSouvenirsScreen(preferredCityKey) {
    const existing = document.getElementById("souvenirs-screen");
    if (existing) existing.remove();

    const screen = document.createElement("div");
    screen.id = "souvenirs-screen";
       screen.style.cssText = "position:fixed;inset:0;background:linear-gradient(165deg, #0E1526 0%, #141C36 55%, #1B1440 100%);z-index:9998;overflow-y:auto;padding:16px 16px 84px;";
       screen.innerHTML = '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;"><button id="souvenirs-close-btn" style="border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#fff;border-radius:999px;padding:8px 14px;font-size:12px;">← Retour</button><div style="font-family:\'Fraunces\', Georgia, serif; font-size:17px;font-weight:600;color:#fff;flex:1;">📖 Mon carnet</div><button id="souvenirs-passport-btn" aria-label="Mon passeport des villes" style="border:1px solid rgba(255,255,255,0.12);background:rgba(255,255,255,0.06);color:#fff;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:700;">🛂</button><button id="souvenirs-recap-btn" style="border:none;background:linear-gradient(90deg,#F2864B,#E85D3D);color:#fff;border-radius:999px;padding:8px 14px;font-size:12px;font-weight:700;">✨ Récap</button></div><div id="souvenirs-city-tabs" style="display:flex;gap:8px;overflow-x:auto;margin-bottom:16px;"></div><div id="souvenirs-list">Chargement...</div>' +
      wzNavbarHtml("memorise");
    document.body.appendChild(screen); 

                 document.getElementById("souvenirs-close-btn").addEventListener("click", function () {
      screen.remove();
      if (window.__arrivalShow) __arrivalShow();
    });   

    wzNavbarBind(screen, function () { screen.remove(); });
    document.getElementById("souvenirs-recap-btn").addEventListener("click", function () {
      if (window.__openRecap) __openRecap();
    });
    document.getElementById("souvenirs-passport-btn").addEventListener("click", function () {
      renderPassportScreen();
    });

    const list = await loadSouvenirs();
    const listEl = document.getElementById("souvenirs-list");
    const tabsEl = document.getElementById("souvenirs-city-tabs");

    // Ancien album de photos locales (IndexedDB) pour la ville demandée : on propose
    // de l'importer dans "Mon carnet" pour n'avoir plus qu'un seul système.
    if (preferredCityKey) {
      let legacyCount = 0;
      try {
        const legacyPhotos = (typeof getPhotosForCity === "function") ? await getPhotosForCity(preferredCityKey) : [];
        legacyCount = legacyPhotos.length;
      } catch (e) { legacyCount = 0; }
      if (legacyCount > 0) {
        const cityLabel = (preferredCityKey !== "autre" && CITIES[preferredCityKey]) ? CITIES[preferredCityKey].name : "cette ville";
        const banner = document.createElement("div");
        banner.style.cssText = "background:rgba(242,134,75,0.12);border:1px solid rgba(242,134,75,0.35);border-radius:14px;padding:12px 14px;margin-bottom:14px;color:#fff;font-size:12.5px;";
        banner.innerHTML =
          '<div style="margin-bottom:8px;">📥 ' + legacyCount + ' ancienne' + (legacyCount > 1 ? "s photo" + "s" : " photo") + ' de ' + cityLabel + ' trouvée' + (legacyCount > 1 ? "s" : "") + ' sur cet appareil, hors de Mon carnet.</div>' +
          '<button id="souvenirs-migrate-btn" style="border:none;background:linear-gradient(90deg,#F2864B,#E85D3D);color:#fff;border-radius:999px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;">Importer dans Mon carnet</button>';
        screen.insertBefore(banner, tabsEl);
        document.getElementById("souvenirs-migrate-btn").addEventListener("click", async function () {
          const btn = document.getElementById("souvenirs-migrate-btn");
          btn.textContent = "Import en cours...";
          btn.disabled = true;
          await migrateLegacyPhotosForCity(preferredCityKey);
          renderSouvenirsScreen(preferredCityKey);
        });
      }
    }

    if (!list.length) {
      tabsEl.style.display = "none";
      listEl.innerHTML = '<div style="text-align:center;color:#9BA5C2;padding:40px 0;">Aucun souvenir pour l\'instant.<br>Appuie sur 📸 pour en ajouter un !</div>';
      return;
    }

    const cityGroups = {};
    list.forEach(function (s) {
      const key = s.city || "autre";
      if (!cityGroups[key]) cityGroups[key] = [];
      cityGroups[key].push(s);
    });
    if (preferredCityKey && !cityGroups[preferredCityKey]) cityGroups[preferredCityKey] = [];
    const cityKeys = Object.keys(cityGroups).sort(function (a, b) { return cityGroups[b].length - cityGroups[a].length; });
    if (preferredCityKey && cityGroups[preferredCityKey]) {
      souvenirsCurrentCity = preferredCityKey;
    } else if (!souvenirsCurrentCity || !cityGroups[souvenirsCurrentCity]) {
      souvenirsCurrentCity = cityKeys[0];
    }

    tabsEl.innerHTML = "";
    cityKeys.forEach(function (key) {
      const cityName = (key !== "autre" && CITIES[key]) ? CITIES[key].name : "Autre";
      const tab = document.createElement("button");
      tab.textContent = cityName;
      const active = key === souvenirsCurrentCity;
          tab.style.cssText = "padding:7px 14px;border-radius:999px;font-size:11px;font-weight:700;white-space:nowrap;cursor:pointer;" + (active ? "background:linear-gradient(90deg,#F2864B,#E85D3D);color:#fff;border:none;" : "background:rgba(255,255,255,0.06);color:#9BA5C2;border:1px solid rgba(255,255,255,0.1);");
      tab.addEventListener("click", function () {
        souvenirsCurrentCity = key;
        renderCityMemories();
      });
      tabsEl.appendChild(tab);
    });

    function renderCityMemories() {
      const items = cityGroups[souvenirsCurrentCity] || [];
      Array.from(tabsEl.children).forEach(function (tab, i) {
        const active = cityKeys[i] === souvenirsCurrentCity;
             tab.style.background = active ? "linear-gradient(90deg,#F2864B,#E85D3D)" : "rgba(255,255,255,0.06)";
        tab.style.color = active ? "#fff" : "#9BA5C2";  
      });

      const groups = groupByMonth(items);
      let html = "";
      Object.keys(groups).forEach(function (monthKey) {
        const monthItems = groups[monthKey];
          html += '<div style="font-size:10px;color:#9BA5C2;font-weight:700;margin:18px 0 8px;text-transform:uppercase;letter-spacing:0.3px;">' + monthKey + ' · ' + monthItems.length + ' souvenir' + (monthItems.length > 1 ? 's' : '') + '</div>';
        html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
        monthItems.forEach(function (s) {
          const dateShort = new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
          const bg = s.photoUrl ? "background-image:url('" + s.photoUrl + "');background-size:cover;background-position:center;" : "background:" + gradientFor(s.id) + ";";
          html += '<div class="souvenir-card" data-id="' + s.id + '" style="border-radius:14px;overflow:hidden;position:relative;height:130px;cursor:pointer;' + bg + '">' +
            '<div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.55), transparent 60%);"></div>' +
            '<div style="position:absolute;bottom:6px;left:8px;right:8px;"><div style="color:#fff;font-size:10px;font-weight:700;">' + (s.placeName || "Souvenir libre") + '</div><div style="color:rgba(255,255,255,0.8);font-size:8.5px;">' + dateShort + (s.weatherIcon ? ' · ' + s.weatherIcon + ' ' + s.weatherTemp + '°C' : '') + '</div></div></div>';
        });
        html += '</div>';
      });

           const totalVisits = items.length;
      const hasCoords = items.some(function (s) { return s.lat && s.lng; });
      html += '<div style="display:flex; gap:8px; margin-top:18px;">' +
        '<div style="flex:1; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px; text-align:center;"><div style="font-size:18px; font-weight:800; color:#fff;">' + totalVisits + '</div><div style="font-size:9px; color:#9BA5C2;">SOUVENIRS</div></div>' +
        (hasCoords ? '<button id="souvenirs-map-btn" style="flex:1; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:12px; padding:12px; text-align:center; color:#fff; cursor:pointer;"><div style="font-size:18px;">🗺️</div><div style="font-size:9px;">VOIR LA CARTE</div></button>' : '') +
        '</div>' +
        '<button id="souvenirs-ai-btn" style="width:100%; margin-top:10px; padding:13px; border-radius:999px; border:none; background:linear-gradient(90deg, #F2864B, #E85D3D); color:#fff; font-size:13px; font-weight:700; box-shadow:0 8px 18px -8px rgba(242,134,75,0.5); cursor:pointer;">✨ Enrichir Whazup</button>' +
        '<div id="souvenirs-ai-result" style="display:none; margin-top:12px; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:16px; padding:16px;"></div>';
      listEl.innerHTML = html;
      listEl.querySelectorAll(".souvenir-card").forEach(function (card) {
        card.addEventListener("click", function () {
          const id = card.getAttribute("data-id");
          const s = items.find(function (x) { return x.id === id; });
          if (s) openSouvenirDetail(s);
        });
      });
      const mapBtn = document.getElementById("souvenirs-map-btn");
      if (mapBtn) {
        mapBtn.addEventListener("click", function () {
          renderTripMap(souvenirsCurrentCity, items);
        });
      }
      const aiBtn = document.getElementById("souvenirs-ai-btn");
      if (aiBtn) {
        aiBtn.addEventListener("click", function () {
          aiBtn.textContent = "✨ Rédaction en cours...";
          aiBtn.disabled = true;
          const resultBox = document.getElementById("souvenirs-ai-result");
          const cityName = (souvenirsCurrentCity !== "autre" && CITIES[souvenirsCurrentCity]) ? CITIES[souvenirsCurrentCity].name : "cette ville";
          const sortedItems = items.slice().sort(function (a, b) { return a.createdAt - b.createdAt; });
          const aiItems = sortedItems.slice(0, 10).map(function (s) {
            const d = new Date(s.createdAt);
            return {
              title: (s.placeName || "Souvenir libre") + (s.text ? " — " + s.text : ""),
              category: "Souvenir",
              date: d.toISOString().slice(0, 10),
              time: null,
              place: cityName,
              distanceMin: 0,
            };
          });
          fetch("https://tight-hill-1359.ericbrunebarbe.workers.dev/enrich", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: aiItems,
              question: "résume mes souvenirs et visites à " + cityName + " de façon chaleureuse, comme un petit récapitulatif de voyage",
              context: { cityName: cityName, time: "" },
            }),
          })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                          resultBox.style.display = "block";
              resultBox.innerHTML =
                       '<div style="font-size:10.5px; color:#F2A57E; font-weight:700; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.3px;">✨ Whazup enrichi</div>' +
                '<div style="font-family:\'Fraunces\', Georgia, serif; font-size:13.5px; line-height:1.6; color:#fff;">' + (data.text ? whazupEnrichiToHtml(data.text) : "Une erreur est survenue, réessaie.") + "</div>";
              aiBtn.remove();
            })
            .catch(function () {
              resultBox.style.display = "block";
              resultBox.innerHTML = '<div style="color:#c0392b; font-size:13px;">Erreur lors de la génération, réessaie.</div>';
              aiBtn.textContent = "✨ Enrichir Whazup";
              aiBtn.disabled = false;
            });
        });
      }
    }

     renderCityMemories();
  }

  function stampRotation(key) {
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return (hash % 13) - 6;
  }

  async function renderPassportScreen() {
    const existing = document.getElementById("passport-screen");
    if (existing) existing.remove();

    const screen = document.createElement("div");
    screen.id = "passport-screen";
    screen.style.cssText = "position:fixed;inset:0;z-index:9998;overflow-y:auto;background:linear-gradient(165deg, #0E1526 0%, #141C36 55%, #1B1440 100%);padding:20px 16px 40px;";
       screen.innerHTML =
    '<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">' +
      '<button id="passport-close-btn" style="border:none;background:rgba(255,255,255,0.1);color:#fff;border-radius:999px;padding:8px 14px;font-size:12px;">← Retour</button>' +
      '<div style="font-size:16px;font-weight:800;color:#fff;flex:1;">🛂 Mon passeport Whazup</div>' +
      '<button id="passport-share-btn" style="border:none;background:linear-gradient(90deg,#F2864B,#E85D3D);color:#fff;border-radius:999px;padding:8px 12px;font-size:12px;font-weight:700;">🔗 Partager</button>' +
      '</div>' +
      '<div id="passport-progress" style="color:rgba(255,255,255,0.6);font-size:12px;margin:4px 0 18px;"></div>' +
      '<div id="passport-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">Chargement...</div>';
    document.body.appendChild(screen);

    document.getElementById("passport-close-btn").addEventListener("click", function () {
      screen.remove();
    });

    const list = await loadSouvenirs();
    const cityGroups = {};
    list.forEach(function (s) {
      const key = s.city;
      if (!key) return;
      if (!cityGroups[key]) cityGroups[key] = [];
      cityGroups[key].push(s);
    });

    const visitedKeys = Object.keys(cityGroups).filter(function (k) { return CITIES[k]; });
    document.getElementById("passport-progress").textContent =
      visitedKeys.length + " ville" + (visitedKeys.length > 1 ? "s" : "") + " découverte" + (visitedKeys.length > 1 ? "s" : "");

    document.getElementById("passport-share-btn").addEventListener("click", function () {
      const cityNames = visitedKeys.map(function (k) { return CITIES[k] ? CITIES[k].name : null; }).filter(Boolean);
      const totalSouvenirs = list.length;
      let text;
      if (!visitedKeys.length) {
        text = "Je découvre plein d'événements et de bonnes adresses avec Whazup ! ✨ https://whazup.fr";
      } else {
        text = "🛂 Mon passeport Whazup : " + visitedKeys.length + " ville" + (visitedKeys.length > 1 ? "s" : "") +
          " découverte" + (visitedKeys.length > 1 ? "s" : "") + " (" + cityNames.join(", ") + ") et " +
          totalSouvenirs + " souvenir" + (totalSouvenirs > 1 ? "s" : "") + " ! ✨ https://whazup.fr";
      }
      if (navigator.share) {
        navigator.share({ title: "Whazup", text: text }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(function () {
          if (typeof showShareToast === "function") showShareToast("✓ Lien copié ! Collez-le dans votre message.");
        }).catch(function () {});
      }
    });

    const sortedKeys = visitedKeys.slice().sort(function (a, b) {
      const aFirst = Math.min.apply(null, cityGroups[a].map(function (s) { return s.createdAt; }));
      const bFirst = Math.min.apply(null, cityGroups[b].map(function (s) { return s.createdAt; }));
      return aFirst - bFirst;
    });

    const gridEl = document.getElementById("passport-grid");
    if (!sortedKeys.length) {
      gridEl.style.display = "block";
      gridEl.innerHTML = '<div style="text-align:center;color:rgba(255,255,255,0.6);padding:40px 0;">Ton passeport est encore vide.<br>Ajoute un souvenir pour obtenir ton premier tampon !</div>';
      return;
    }
    gridEl.innerHTML = sortedKeys.map(function (key) {
      const cityName = CITIES[key].name;
      const items = cityGroups[key];
      const rot = stampRotation(key);
      const firstDate = new Date(Math.min.apply(null, items.map(function (s) { return s.createdAt; })));
      const dateStr = firstDate.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
      return '<div style="background:' + gradientFor(key) + ';border-radius:16px;padding:16px 10px;text-align:center;transform:rotate(' + rot + 'deg);border:3px dashed rgba(255,255,255,0.5);box-shadow:0 8px 18px -8px rgba(0,0,0,0.4);">' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.8);font-weight:700;text-transform:uppercase;letter-spacing:.04em;">Visité</div>' +
        '<div style="font-size:14px;color:#fff;font-weight:800;margin:4px 0 2px;font-family:Georgia,serif;">' + cityName + '</div>' +
        '<div style="font-size:10px;color:rgba(255,255,255,0.85);">' + items.length + ' souvenir' + (items.length > 1 ? 's' : '') + '</div>' +
        '<div style="font-size:9px;color:rgba(255,255,255,0.65);margin-top:2px;">depuis le ' + dateStr + '</div>' +
        '</div>';
    }).join("");
  }

  async function updateSouvenirsCount() {
    const btn = document.getElementById("btn-open-souvenirs");
    if (!btn) return;
    const user = auth.currentUser;
    if (!user) {
      btn.textContent = "📖 Mes souvenirs";
      return;
    }
    try {
      const col = souvenirsCollection();
      const snap = await col.get();
      btn.textContent = snap.size > 0 ? "📖 Mes souvenirs (" + snap.size + ")" : "📖 Mes souvenirs";
    } catch (e) {
      btn.textContent = "📖 Mes souvenirs";
    }
  }

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

    function ensureNavCarnetLink() {
    const btn = document.getElementById("nav-carnet-btn");
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = "1";
      btn.addEventListener("click", function () {
        renderSouvenirsScreen();
      });
    }
  }

  function ensureAccountLink() {
    const link = document.getElementById("btn-open-souvenirs");
    if (link && !link.dataset.bound) {
      link.dataset.bound = "1";
      link.addEventListener("click", function () {
        const closeBtn = document.getElementById("btn-account-close");
        if (closeBtn) closeBtn.click();
        renderSouvenirsScreen();
      });
    }
  }
  async function checkSharedSouvenirLink() {
    const params = new URLSearchParams(window.location.search);
    const shareParam = params.get("souvenir");
    if (!shareParam) return;
    const parts = shareParam.split("_");
    const ownerUid = parts[0];
    const souvenirId = parts.slice(1).join("_");
    try {
      const doc = await db.collection("users").doc(ownerUid).collection("souvenirs").doc(souvenirId).get();
      if (!doc.exists) return;
      const s = doc.data();
      const dateStr = new Date(s.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      const overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:99999;display:flex;align-items:center;justify-content:center;padding:20px;";
      overlay.innerHTML = '<div style="background:#fff;border-radius:20px;padding:20px;max-width:380px;width:100%;">' +
        '<div style="font-size:10px;color:#E85D3D;font-weight:700;margin-bottom:10px;">✨ SOUVENIR PARTAGÉ SUR WHAZUP</div>' +
        (s.photoUrl ? '<img src="' + s.photoUrl + '" style="width:100%;border-radius:14px;margin-bottom:12px;max-height:260px;object-fit:cover;" />' : '<div style="width:100%;height:140px;border-radius:14px;margin-bottom:12px;background:' + gradientFor(s.id) + ';"></div>') +
        '<div style="font-size:11px;color:#aaa;margin-bottom:6px;">' + dateStr + (s.placeName ? " · " + s.placeName : "") + '</div>' +
        (s.text ? '<div style="font-size:14px;color:#333;font-style:italic;line-height:1.5;">"' + s.text + '"</div>' : '') +
        '<button id="shared-souvenir-close" style="width:100%;margin-top:16px;padding:12px;border-radius:999px;border:none;background:#14213D;color:#fff;font-size:13px;font-weight:600;">Découvrir Whazup</button>' +
        '</div>';
      document.body.appendChild(overlay);
      document.getElementById("shared-souvenir-close").addEventListener("click", function () {
        overlay.remove();
        history.replaceState({}, "", window.location.pathname);
      });
    } catch (e) {
      console.error("Erreur souvenir partagé:", e);
    }
  }

  function initSouvenirs() {
    ensureFloatingButton();
      ensureAccountLink();
    setInterval(ensureAccountLink, 800);
    ensureNavCarnetLink();
    setInterval(ensureNavCarnetLink, 800);
    ensureDetailLink();
    setInterval(ensureDetailLink, 800);
       updateSouvenirsCount();
    setInterval(updateSouvenirsCount, 3000);
    checkSharedSouvenirLink();
  }
  if (document.readyState !== "loading") {
    initSouvenirs();
  } else {
    document.addEventListener("DOMContentLoaded", initSouvenirs);
  }

    window.__openAddSouvenirModal = openAddSouvenirModal;
  window.__renderSouvenirsScreen = renderSouvenirsScreen;
  window.__renderPassportScreen = renderPassportScreen;
})();
