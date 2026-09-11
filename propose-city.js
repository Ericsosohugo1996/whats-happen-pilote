// ---- proposer ma ville ----
function __ensureProposeCityUI() {
  if (document.getElementById("propose-city-block")) return;
  const hint = document.getElementById("locate-hint");
  if (!hint || !hint.parentNode) return;
  const block = document.createElement("div");
  block.id = "propose-city-block";
  block.style.cssText = "margin-top:12px;";
  block.innerHTML =
    '<button type="button" id="propose-city-btn" style="width:100%; padding:12px; border-radius:12px; border:1px dashed rgba(255,255,255,0.4); background:transparent; color:#fff; font-size:13px; font-weight:500; cursor:pointer;">🏙️ Votre ville n\'est pas là ? Proposez-la</button>' +
    '<div id="propose-city-form" style="display:none; margin-top:10px; background:rgba(255,255,255,0.08); border-radius:12px; padding:14px;">' +
      '<input type="text" id="propose-city-input" placeholder="Nom de votre ville" style="width:100%; padding:10px; border-radius:8px; border:none; margin-bottom:8px; font-size:13px; box-sizing:border-box;">' +
      '<input type="email" id="propose-city-email" placeholder="Votre email (optionnel, pour être prévenu)" style="width:100%; padding:10px; border-radius:8px; border:none; margin-bottom:6px; font-size:13px; box-sizing:border-box;">' +
      '<p id="propose-city-error" style="display:none; color:#ffb3ab; font-size:12px; margin:0 0 8px;"></p>' +
      '<button type="button" id="propose-city-submit" style="width:100%; padding:11px; border-radius:10px; border:none; background:#E8604C; color:#fff; font-size:13px; font-weight:600; cursor:pointer;">Envoyer</button>' +
    '</div>' +
    '<div id="propose-city-confirm" style="display:none; margin-top:10px; background:rgba(46,204,113,0.15); border-radius:12px; padding:12px 14px; font-size:12.5px; color:#fff;">✓ Merci ! Votre ville a bien été notée, on vous préviendra si elle est ajoutée.</div>';
  hint.parentNode.insertBefore(block, hint);

  const btn = block.querySelector("#propose-city-btn");
  const form = block.querySelector("#propose-city-form");
  const confirmEl = block.querySelector("#propose-city-confirm");
  const errorEl = block.querySelector("#propose-city-error");
  const cityInput = block.querySelector("#propose-city-input");
  const emailInput = block.querySelector("#propose-city-email");
  const submitBtn = block.querySelector("#propose-city-submit");

  btn.onclick = () => {
    confirmEl.style.display = "none";
    form.style.display = form.style.display === "none" ? "block" : "none";
  };

  submitBtn.onclick = () => {
    const cityName = cityInput.value.trim();
    errorEl.style.display = "none";
    if (!cityName) {
      errorEl.textContent = "Merci d'indiquer le nom d'une ville.";
      errorEl.style.display = "block";
      return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = "Envoi…";
    db.collection("city_requests").add({
      city: cityName,
      email: emailInput.value.trim() || null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    }).then(() => {
      form.style.display = "none";
      confirmEl.style.display = "block";
      cityInput.value = "";
      emailInput.value = "";
    }).catch((err) => {
      errorEl.textContent = "Erreur lors de l'envoi. Réessayez plus tard.";
      errorEl.style.display = "block";
      console.error("Erreur proposition de ville :", err);
    }).finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = "Envoyer";
    });
  };
}

setTimeout(__ensureProposeCityUI, 300);
