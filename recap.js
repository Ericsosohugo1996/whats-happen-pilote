// recap.js — Whazup Récap : résumé animé façon "Wrapped"
(function () {
  "use strict";

  const SLIDE_BG = [
    "linear-gradient(160deg, #0d1730 0%, #1a2550 55%, #2b1f4a 100%)",
    "linear-gradient(160deg, #E85D3D 0%, #c1440e 100%)",
    "linear-gradient(160deg, #2A9D8F 0%, #1c5f66 100%)",
    "linear-gradient(160deg, #9D4EDD 0%, #5A189A 100%)",
    "linear-gradient(160deg, #14213D 0%, #E85D3D 100%)",
  ];

  async function buildRecapData() {
    const user = auth.currentUser;
    if (!user) return null;
    const snap = await db.collection("users").doc(user.uid).collection("souvenirs").get();
    const list = snap.docs.map(function (d) { return d.data(); });
    if (!list.length) return null;

    const cityCounts = {};
    list.forEach(function (s) {
      const key = s.city || "autre";
      cityCounts[key] = (cityCounts[key] || 0) + 1;
    });
    const cityKeys = Object.keys(cityCounts).sort(function (a, b) { return cityCounts[b] - cityCounts[a]; });
    const topCityKey = cityKeys[0];
    const topCityName = (topCityKey !== "autre" && CITIES[topCityKey]) ? CITIES[topCityKey].name : "Autre";
    const withPhoto = list.filter(function (s) { return s.photoUrl; });
    const sorted = list.slice().sort(function (a, b) { return a.createdAt - b.createdAt; });
    const firstDate = new Date(sorted[0].createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

    return {
      total: list.length,
      cityCount: cityKeys.length,
      topCityName: topCityName,
      topCityCount: cityCounts[topCityKey],
      photoCount: withPhoto.length,
      firstDate: firstDate,
      samplePhoto: withPhoto.length ? withPhoto[Math.floor(Math.random() * withPhoto.length)].photoUrl : null,
    };
  }

  function slideHTML(index, data) {
    const bg = SLIDE_BG[index % SLIDE_BG.length];
    let content = "";
    if (index === 0) {
      content =
        '<div style="font-size:13px; color:rgba(255,255,255,0.6); font-weight:700; letter-spacing:2px; text-transform:uppercase; margin-bottom:16px;">✨ WHAZUP RÉCAP</div>' +
        '<div style="font-family:Georgia, serif; font-size:32px; color:#fff; font-weight:600; line-height:1.3;">Ton aventure<br>depuis ' + data.firstDate + '</div>';
    } else if (index === 1) {
      content =
        '<div style="font-size:80px; font-weight:800; color:#fff; line-height:1;">' + data.total + '</div>' +
        '<div style="font-size:18px; color:rgba(255,255,255,0.85); margin-top:12px;">souvenir' + (data.total > 1 ? "s" : "") + ' capturé' + (data.total > 1 ? "s" : "") + '</div>';
    } else if (index === 2) {
      content =
        '<div style="font-size:80px; font-weight:800; color:#fff; line-height:1;">' + data.cityCount + '</div>' +
        '<div style="font-size:18px; color:rgba(255,255,255,0.85); margin-top:12px;">ville' + (data.cityCount > 1 ? "s" : "") + ' explorée' + (data.cityCount > 1 ? "s" : "") + '</div>';
    } else if (index === 3) {
      content =
        '<div style="font-size:15px; color:rgba(255,255,255,0.7); margin-bottom:10px;">Ta ville chouchou</div>' +
        '<div style="font-family:Georgia, serif; font-size:38px; color:#fff; font-weight:600;">' + data.topCityName + '</div>' +
        '<div style="font-size:15px; color:rgba(255,255,255,0.7); margin-top:10px;">' + data.topCityCount + ' souvenir' + (data.topCityCount > 1 ? "s" : "") + '</div>';
    } else {
      content =
        (data.samplePhoto ? '<img src="' + data.samplePhoto + '" style="width:100%; max-width:260px; border-radius:20px; box-shadow:0 20px 50px rgba(0,0,0,0.4); margin-bottom:20px;" />' : '<div style="font-size:60px; margin-bottom:16px;">📖</div>') +
        '<div style="font-family:Georgia, serif; font-size:24px; color:#fff; font-weight:600;">Continue l\'aventure</div>' +
        '<div style="font-size:14px; color:rgba(255,255,255,0.75); margin-top:8px;">Whazup, découvre. explore. profite.</div>';
    }
    return '<div class="recap-slide" style="position:absolute; inset:0; background:' + bg + '; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:40px 30px; opacity:0; transition:opacity .4s ease;">' + content + '</div>';
  }

  async function openRecap() {
    const data = await buildRecapData();
    if (!data) {
      alert("Ajoute au moins un souvenir pour débloquer ton récap Whazup !");
      return;
    }
    const total = 5;
    const overlay = document.createElement("div");
    overlay.id = "recap-overlay";
    overlay.style.cssText = "position:fixed; inset:0; z-index:99999; overflow:hidden;";
    let html = '<div style="position:absolute; top:14px; left:14px; right:14px; display:flex; gap:5px; z-index:10;">';
    for (let i = 0; i < total; i++) {
      html += '<div class="recap-bar" data-i="' + i + '" style="flex:1; height:3px; border-radius:2px; background:rgba(255,255,255,0.25); overflow:hidden;"><div class="recap-bar-fill" style="width:0%; height:100%; background:#fff;"></div></div>';
    }
    html += '</div>';
    html += '<button id="recap-close" style="position:absolute; top:12px; right:14px; z-index:11; background:none; border:none; color:#fff; font-size:22px; cursor:pointer;">✕</button>';
    for (let i = 0; i < total; i++) html += slideHTML(i, data);
    html += '<div style="position:absolute; bottom:30px; left:20px; right:20px; z-index:10; display:flex; justify-content:center;"><button id="recap-share-btn" style="display:none; padding:12px 24px; border-radius:999px; border:none; background:#fff; color:#14213D; font-size:13px; font-weight:700; cursor:pointer;">🔗 Partager mon récap</button></div>';
    overlay.innerHTML = html;
    document.body.appendChild(overlay);

    const slides = overlay.querySelectorAll(".recap-slide");
    const bars = overlay.querySelectorAll(".recap-bar-fill");
    let current = 0;
    let timer = null;

    function showSlide(i) {
      slides.forEach(function (s, idx) { s.style.opacity = idx === i ? "1" : "0"; });
      bars.forEach(function (b, idx) {
        b.style.transition = "none";
        b.style.width = idx < i ? "100%" : "0%";
      });
      if (i === total - 1) {
        document.getElementById("recap-share-btn").style.display = "block";
      }
      void bars[i].offsetWidth;
      bars[i].style.transition = "width 4s linear";
      bars[i].style.width = "100%";
      clearTimeout(timer);
      if (i < total - 1) {
        timer = setTimeout(function () { showSlide(i + 1); }, 4000);
      }
    }

    overlay.addEventListener("click", function (e) {
      if (e.target.id === "recap-close" || e.target.id === "recap-share-btn") return;
      const rect = overlay.getBoundingClientRect();
      const x = e.clientX - rect.left;
      if (x < rect.width / 2) {
        current = Math.max(0, current - 1);
      } else {
        current = Math.min(total - 1, current + 1);
      }
      showSlide(current);
    });

    document.getElementById("recap-close").addEventListener("click", function () {
      clearTimeout(timer);
      overlay.remove();
    });

    document.getElementById("recap-share-btn").addEventListener("click", function (e) {
      e.stopPropagation();
      const link = "https://whazup.fr/index.html";
      const text = "J'ai " + data.total + " souvenirs sur Whazup dans " + data.cityCount + " ville(s) ! ✨";
      if (navigator.share) {
        navigator.share({ title: "Mon Whazup Récap", text: text, url: link }).catch(function () {});
      } else {
        navigator.clipboard.writeText(text + " " + link).then(function () {
          alert("Texte copié, prêt à partager !");
        });
      }
    });

    showSlide(0);
  }

  window.__openRecap = openRecap;
})();
