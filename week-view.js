// ---- vue 30 jours : remplace les 4 compteurs par une bande de jours cliquables et défilable ----
const WEEKDAY_LABELS_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTH_LABELS_SHORT = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
const WEEK_VIEW_DAYS = 30;

const __matchesPeriodBase = matchesPeriod;
matchesPeriod = function (ev, period) {
  if (period && /^\d{4}-\d{2}-\d{2}$/.test(period)) {
    if (ev.isPlace) return true;
    return ev.date === period;
  }
  return __matchesPeriodBase(ev, period);
};

function updateStatsBanner(events) {
  const banner = document.getElementById("stats-banner");
  if (!banner) return;
  const days = [];
  for (let i = 0; i < WEEK_VIEW_DAYS; i++) {
    const d = new Date(Date.now() + i * 86400000);
    const iso = d.toISOString().slice(0, 10);
    const count = events.filter(function (ev) {
      return !ev.isPlace && ev.date === iso;
    }).length;
    days.push({
      iso: iso,
      label: WEEKDAY_LABELS_SHORT[d.getDay()],
      dateLabel: d.getDate() + " " + MONTH_LABELS_SHORT[d.getMonth()],
      count: count,
    });
  }
  const selected =
    state.selectedPeriod && /^\d{4}-\d{2}-\d{2}$/.test(state.selectedPeriod) ? state.selectedPeriod : null;

  banner.innerHTML =
    '<div class="week-strip-hint">← glissez pour voir plus loin →</div>' +
    '<div class="week-strip">' +
    days
      .map(function (d) {
        const active = d.iso === selected;
        return (
          '<button type="button" class="week-day-btn' +
          (active ? " active" : "") +
          '" data-date="' +
          d.iso +
          '"><span class="week-day-label">' +
          d.label +
          '</span><span class="week-day-date">' +
          d.dateLabel +
          '</span><span class="week-day-count">' +
          d.count +
          "</span></button>"
        );
      })
      .join("") +
    "</div>";

  banner.querySelectorAll(".week-day-btn").forEach(function (btn) {
    btn.onclick = function () {
      const clickedDate = btn.dataset.date;
      state.selectedPeriod = state.selectedPeriod === clickedDate ? null : clickedDate;
      renderDiscover();
    };
  });
}
