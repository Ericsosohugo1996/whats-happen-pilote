// ---- petit indicateur météo (icône + température) à côté du nom de la ville ----
const WEATHER_COASTAL_CITIES = ["st", "ram", "ste", "lcv", "mart", "marseille", "brest"];

function weatherCodeToInfo(code) {
  if ([0, 1].includes(code)) return { icon: "☀️" };
  if ([2, 3].includes(code)) return { icon: "☁️" };
  if ([45, 48].includes(code)) return { icon: "🌫️" };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { icon: "🌧️" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { icon: "❄️" };
  if ([95, 96, 99].includes(code)) return { icon: "⛈️" };
  return { icon: "🌡️" };
}

function weatherCurrentCoords() {
  if (state.userPos) return state.userPos;
  const c = CITIES[state.city];
  return c ? { lat: c.lat, lng: c.lng } : null;
}

async function loadSeaTemperature(coords) {
  try {
    const url = "https://marine-api.open-meteo.com/v1/marine?latitude=" + coords.lat + "&longitude=" + coords.lng + "&current=sea_surface_temperature";
    const res = await fetch(url);
    const data = await res.json();
    const seaTemp = data.current && data.current.sea_surface_temperature;
    return (seaTemp !== undefined && seaTemp !== null) ? Math.round(seaTemp) : null;
  } catch (e) {
    console.error("Erreur température de l'eau :", e);
    return null;
  }
}

async function loadWeather() {
  const coords = weatherCurrentCoords();
  const el = document.getElementById("weather-mini");
  if (!coords || !el) return;
  try {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + coords.lat + "&longitude=" + coords.lng + "&current=temperature_2m,weather_code&timezone=auto";
    const res = await fetch(url);
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const info = weatherCodeToInfo(data.current.weather_code);
        window.__weatherOutdoor = info.outdoor;
    let text = " " + info.icon + " " + temp + "°C";
    if (!state.userPos && WEATHER_COASTAL_CITIES.includes(state.city)) {
      const seaTemp = await loadSeaTemperature(coords);
      if (seaTemp !== null) text += " · 🌊 " + seaTemp + "°C";
    }
    el.textContent = text;
  } catch (e) {
    console.error("Erreur météo :", e);
  }
}

let __lastWeatherKey = null;
function maybeReloadWeather() {
  const coords = weatherCurrentCoords();
  const key = coords ? coords.lat + "," + coords.lng + "," + state.city : null;
  if (key && key !== __lastWeatherKey) {
    __lastWeatherKey = key;
    loadWeather();
  }
}

const __renderDiscoverBaseWeather = renderDiscover;
renderDiscover = function () {
  __renderDiscoverBaseWeather();
  maybeReloadWeather();
};

setTimeout(maybeReloadWeather, 1500);
