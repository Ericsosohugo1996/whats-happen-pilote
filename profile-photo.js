// profile-photo.js — photo de profil facultative, visible uniquement par tes amis.
// Pour tout annuler : retirer la ligne <script src="profile-photo.js"> dans index.html.
(function () {
  "use strict";
  function user() { try { var u = auth.currentUser; return (u && !u.isAnonymous) ? u : null; } catch (e) { return null; } }

  function resize(file) {
    return new Promise(function (ok, ko) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var S = 192, c = document.createElement("canvas"); c.width = c.height = S;
        var m = Math.min(img.width, img.height), sx = (img.width - m) / 2, sy = (img.height - m) / 2;
        c.getContext("2d").drawImage(img, sx, sy, m, m, 0, 0, S, S);
        URL.revokeObjectURL(url);
        ok(c.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = function () { URL.revokeObjectURL(url); ko(new Error("image")); };
      img.src = url;
    });
  }

  function setup() {
    var anchor = document.getElementById("account-firstname-row");
    if (!anchor || document.getElementById("account-photo-row")) return;
    var row = document.createElement("div");
    row.id = "account-photo-row";
    row.style.cssText = "display:flex;align-items:center;gap:12px;margin:8px 0 6px;";
    row.innerHTML =
      '<div id="account-photo-prev" style="width:46px;height:46px;border-radius:50%;background:#D7ECEF center/cover;display:flex;align-items:center;justify-content:center;font-size:20px;flex:none;">🙂</div>' +
      '<div style="flex:1;min-width:0;"><button type="button" id="account-photo-btn" style="border:1px solid #DCE3E6;background:#fff;color:#14213D;border-radius:999px;padding:9px 14px;font-size:13px;font-weight:700;cursor:pointer;">📷 Ajouter ma photo</button> ' +
      '<button type="button" id="account-photo-del" hidden style="border:none;background:none;color:#5B6B7A;font-size:12px;cursor:pointer;text-decoration:underline;">Retirer</button>' +
      '<div style="font-size:11px;color:#5B6B7A;margin-top:4px;">Visible uniquement par tes amis.</div></div>' +
      '<input type="file" id="account-photo-file" accept="image/*" hidden>';
    anchor.parentNode.insertBefore(row, anchor.nextSibling);
    var prev = row.querySelector("#account-photo-prev"), btn = row.querySelector("#account-photo-btn"),
        del = row.querySelector("#account-photo-del"), file = row.querySelector("#account-photo-file");

    function show(src) {
      if (src) { prev.style.backgroundImage = "url('" + src + "')"; prev.textContent = ""; btn.textContent = "📷 Changer ma photo"; del.hidden = false; }
      else { prev.style.backgroundImage = ""; prev.textContent = "🙂"; btn.textContent = "📷 Ajouter ma photo"; del.hidden = true; }
    }
    async function load() {
      var u = user(); if (!u) return;
      try { var d = await db.collection("publicProfiles").doc(u.uid).get(); var x = d && d.exists ? d.data() : null; show(x && x.photo); } catch (e) {}
    }
    btn.onclick = function () { file.click(); };
    file.onchange = async function () {
      var f = file.files && file.files[0], u = user(); if (!f || !u) return;
      btn.textContent = "…";
      try {
        var data = await resize(f);
        await db.collection("publicProfiles").doc(u.uid).set({ photo: data, updatedAt: Date.now() }, { merge: true });
        show(data);
      } catch (e) { console.error(e); show(null); alert("Impossible d'enregistrer la photo pour le moment."); }
      file.value = "";
    };
    del.onclick = async function () {
      var u = user(); if (!u) return;
      try { await db.collection("publicProfiles").doc(u.uid).set({ photo: "", updatedAt: Date.now() }, { merge: true }); show(null); } catch (e) {}
    };
    try { new MutationObserver(load).observe(document.getElementById("account-logged-in"), { attributes: true, attributeFilter: ["class"] }); } catch (e) {}
    try { if (window.__authReady) window.__authReady.then(load); } catch (e) {}
    load();
  }
  if (document.readyState !== "loading") setup(); else document.addEventListener("DOMContentLoaded", setup);
})();
