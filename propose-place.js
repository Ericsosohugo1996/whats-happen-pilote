// ---- proposer mon établissement (professionnels : bars, lieux, associations) ----
(function () {
  "use strict";

  function ensureProposePlaceUI() {
    const btn = document.getElementById("propose-place-btn");
    if (!btn || btn.dataset.bound) return;
    btn.dataset.bound = "1";

    const form = document.getElementById("propose-place-form");
    const confirmEl = document.getElementById("propose-place-confirm");
    const errorEl = document.getElementById("propose-place-error");
    const nameInput = document.getElementById("propose-place-name");
    const categoryInput = document.getElementById("propose-place-category");
    const cityInput = document.getElementById("propose-place-city");
    const addressInput = document.getElementById("propose-place-address");
    const descriptionInput = document.getElementById("propose-place-description");
    const emailInput = document.getElementById("propose-place-email");
    const submitBtn = document.getElementById("propose-place-submit");

    btn.addEventListener("click", function () {
      confirmEl.style.display = "none";
      form.style.display = form.style.display === "none" ? "block" : "none";
    });

    submitBtn.addEventListener("click", function () {
      const name = nameInput.value.trim();
      const city = cityInput.value.trim();
      errorEl.style.display = "none";
      if (!name || !city) {
        errorEl.textContent = "Merci d'indiquer au moins le nom du lieu et la ville.";
        errorEl.style.display = "block";
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "Envoi…";
      const user = (typeof auth !== "undefined" && auth.currentUser) ? auth.currentUser : null;
      db.collection("place_requests").add({
        name: name,
        category: categoryInput.value,
        city: city,
        address: addressInput.value.trim() || null,
        description: descriptionInput.value.trim() || null,
        contactEmail: emailInput.value.trim() || null,
        userUid: user ? user.uid : null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      }).then(function () {
        form.style.display = "none";
        confirmEl.style.display = "block";
        nameInput.value = "";
        cityInput.value = "";
        addressInput.value = "";
        descriptionInput.value = "";
        emailInput.value = "";
        categoryInput.value = "Bar";
      }).catch(function (err) {
        errorEl.textContent = "Erreur lors de l'envoi, réessayez plus tard.";
        errorEl.style.display = "block";
        console.error("Erreur proposition de lieu :", err);
      }).finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Envoyer ma proposition";
      });
    });
  }

  if (document.readyState !== "loading") {
    ensureProposePlaceUI();
  } else {
    document.addEventListener("DOMContentLoaded", ensureProposePlaceUI);
  }
  setInterval(ensureProposePlaceUI, 800);
})();
