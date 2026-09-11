// ---- partager un événement avec un ami ----
function buildShareText(ev) {
  const dateLabel = typeof formatDate === "function" ? formatDate(ev.date) : ev.date;
  let text = ev.title + "\n" + dateLabel;
  if (ev.time) text += " · " + ev.time;
  if (ev.place) text += "\n" + ev.place;
  text += "\n\nDécouvert sur Whazup : https://whazup.fr";
  return text;
}

function showShareToast(message) {
  let toast = document.getElementById("share-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "share-toast";
    toast.style.cssText =
      "position:fixed; left:50%; bottom:90px; transform:translateX(-50%); background:#14213D; color:#fff; padding:10px 16px; border-radius:10px; font-size:13px; z-index:9999; box-shadow:0 8px 20px rgba(0,0,0,0.25); transition:opacity .3s;";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = "1";
  toast.style.display = "block";
  clearTimeout(window.__shareToastTimer);
  window.__shareToastTimer = setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => { toast.style.display = "none"; }, 300);
  }, 2500);
}

async function shareCurrentEvent() {
  const ev = allEvents().find((e) => e.id === state.currentEventId);
  if (!ev) return;
  const text = buildShareText(ev);
  if (navigator.share) {
    try {
      await navigator.share({ title: ev.title, text: text });
    } catch (e) {}
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showShareToast("✓ Lien copié ! Collez-le dans votre message.");
  } catch (e) {
    showShareToast("Impossible de copier automatiquement.");
  }
}

function __ensureShareButton() {
  if (document.getElementById("btn-share")) return;
  const ctaRow = document.querySelector(".cta-row");
  if (!ctaRow) return;
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-outline";
  btn.id = "btn-share";
  btn.textContent = "📤";
  btn.onclick = shareCurrentEvent;
  ctaRow.appendChild(btn);
}

document.addEventListener("DOMContentLoaded", __ensureShareButton);
document.addEventListener("click", (e) => {
  if (e.target.closest(".event-card, .surprise-card, #surprise-card, .itin-stop")) {
    setTimeout(__ensureShareButton, 50);
  }
}, true);
