// ---- filtre par temps disponible : ajuste le rayon de recherche ----
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("#time-presets .chip-btn").forEach((b) => {
    b.onclick = () => {
      const km = Number(b.dataset.timeRadius);
      state.radiusKm = km;
      document.getElementById("radius-range").value = km;
      document.getElementById("radius-value").textContent = formatRadius(km);
      document.querySelectorAll("#radius-presets .chip-btn").forEach((x) => x.classList.remove("active"));
      document.querySelectorAll("#time-presets .chip-btn").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      renderDiscover();
    };
  });
});
