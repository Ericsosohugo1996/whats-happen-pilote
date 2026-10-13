// Écran « Où sors-tu ce soir ? » : rangée de villes populaires juste sous « Me localiser ».
// Les boutons utilisent la même mécanique que les villes des régions (class chip-btn + data-city).
(function () {
  // moment de la journée (heure du téléphone) : sert au titre « Où sors-tu … ? »
  function moment() {
    try {
      var h = new Date().getHours();
      var m = h >= 18 ? "soir" : h >= 12 ? "aprem" : h >= 5 ? "matin" : "nuit";
      document.body.setAttribute("data-wz-moment", m);
    } catch (e) {}
  }
  moment();
  setInterval(moment, 60000);
  var POP = ["paris", "lyon", "marseille", "bordeaux", "lille", "toulouse", "nantes", "nice", "strasbourg", "montpellier", "rennes", "grenoble"];
  function ensure() {
    try {
      if (!document.body.classList.contains("wz-nocity")) return;
      var sep = document.getElementById("wz-locate-sep");
      if (!sep || document.getElementById("wz-pop-cities")) return;
      if (typeof CITIES === "undefined") return;
      var wrap = document.createElement("div");
      wrap.id = "wz-pop-cities";
      var lab = document.createElement("div");
      lab.className = "wz-pop-label";
      lab.textContent = "Villes populaires";
      var row = document.createElement("div");
      row.className = "wz-pop-row";
      POP.forEach(function (k) {
        if (!CITIES[k]) return;
        var b = document.createElement("button");
        b.type = "button";
        b.className = "chip-btn wz-pop";
        b.setAttribute("data-city", k);
        b.textContent = CITIES[k].name;
        row.appendChild(b);
      });
      wrap.appendChild(lab);
      wrap.appendChild(row);
      sep.parentNode.insertBefore(wrap, sep.nextSibling);
    } catch (e) {}
  }
  function regionsBtn() {
    try {
      if (!document.body.classList.contains("wz-nocity")) return;
      var acc = document.getElementById("region-accordion");
      if (!acc || document.getElementById("wz-regions-btn")) return;
      var b = document.createElement("button");
      b.type = "button"; b.id = "wz-regions-btn";
      b.innerHTML = '<span>Toutes les régions</span><span class="wz-arr">▾</span>';
      b.addEventListener("click", function () { document.body.classList.toggle("wz-regions"); });
      acc.parentNode.insertBefore(b, acc);
    } catch (e) {}
  }
  ensure(); regionsBtn();
  setInterval(function () { ensure(); regionsBtn(); }, 1000);

  // quand on choisit une ville, l'accueil de la ville s'affiche depuis le HAUT de la page (et non à mi-hauteur)
  function toTop() { try { window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; } catch (e) {} }
  document.addEventListener("click", function (e) {
    try {
      if (!e.target.closest(".chip-btn[data-city]")) return;
      [0, 60, 200, 500, 1000].forEach(function (ms) { setTimeout(toTop, ms); });
    } catch (x) {}
  }, true);
})();
