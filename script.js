// ── State ──
let fromCoords = null;
let toCoords = null;
let routeDistanceKm = null;
let searchTimeout = null;
let currentMode = "route"; // "route" or "manual"
let tripType = "oneway";   // "oneway" or "roundtrip"
let drivingCondition = "mixed"; // "city", "mixed", "highway"

const CONDITION_MULTIPLIERS = { highway: 1.0, mixed: 0.85, city: 0.70 };

// ── Distance: get effective distance in km ──
function getDistance() {
  if (currentMode === "route") return routeDistanceKm;
  return parseFloat(document.getElementById("distance").value) || null;
}

// ── Calculation ──
function calculate() {
  const resultEl = document.getElementById("result");
  const fuelPriceEl = document.getElementById("fuel-price");
  const efficiencyEl = document.getElementById("fuel-efficiency");

  // Clear errors
  document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
  document.querySelectorAll(".error-msg").forEach(el => el.remove());

  const rawDistance = getDistance();
  const pricePerLitre = parseFloat(fuelPriceEl.value);
  const baseEfficiency = parseFloat(efficiencyEl.value);
  const bufferPercent = parseInt(document.getElementById("buffer").value, 10);

  let hasError = false;

  if (!rawDistance || rawDistance <= 0) {
    if (currentMode === "manual") {
      showFieldError(document.getElementById("distance"), "Enter a valid distance");
    }
    hasError = true;
  }
  if (isNaN(pricePerLitre) || pricePerLitre <= 0) {
    showFieldError(fuelPriceEl, "Enter a valid fuel price");
    hasError = true;
  }
  if (isNaN(baseEfficiency) || baseEfficiency <= 0) {
    showFieldError(efficiencyEl, "Enter a valid efficiency");
    hasError = true;
  }

  if (hasError) {
    resultEl.innerHTML = "";
    resultEl.classList.remove("show");
    return;
  }

  const tripMultiplier = tripType === "roundtrip" ? 2 : 1;
  const conditionMultiplier = CONDITION_MULTIPLIERS[drivingCondition];
  const tripDistance = rawDistance * tripMultiplier;
  const adjustedEfficiency = baseEfficiency * conditionMultiplier;
  const litresUsed = tripDistance / adjustedEfficiency;
  const baseCost = litresUsed * pricePerLitre;
  const bufferAmount = baseCost * (bufferPercent / 100);
  const totalCost = baseCost + bufferAmount;

  const tripLabel = tripType === "roundtrip" ? "Round-trip" : "One-way";
  const condLabel = drivingCondition.charAt(0).toUpperCase() + drivingCondition.slice(1);

  const resultHtml = `
    <div class="result-wrapper">
      <h2>Trip Cost Breakdown</h2>
      <div class="result-item highlight">
        <span class="result-label">Estimated Total:</span>
        <span class="result-value">₵${totalCost.toFixed(2)}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Trip Distance:</span>
        <span class="result-value">${tripDistance.toFixed(1)} km <small>(${tripLabel})</small></span>
      </div>
      <div class="result-item">
        <span class="result-label">Driving:</span>
        <span class="result-value">${condLabel}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Adjusted Efficiency:</span>
        <span class="result-value">${adjustedEfficiency.toFixed(1)} km/l</span>
      </div>
      <div class="result-item">
        <span class="result-label">Fuel Price:</span>
        <span class="result-value">₵${pricePerLitre.toFixed(2)}/l</span>
      </div>
      <div class="result-item">
        <span class="result-label">Fuel Needed:</span>
        <span class="result-value">${litresUsed.toFixed(2)} litres</span>
      </div>
      <div class="result-item">
        <span class="result-label">Base Fuel Cost:</span>
        <span class="result-value">₵${baseCost.toFixed(2)}</span>
      </div>
      ${bufferPercent > 0 ? `
      <div class="result-item">
        <span class="result-label">Buffer (${bufferPercent}%):</span>
        <span class="result-value">+₵${bufferAmount.toFixed(2)}</span>
      </div>` : ""}
    </div>
  `;
  resultEl.innerHTML = resultHtml;
  resultEl.classList.add("show");
}

function showFieldError(inputEl, message) {
  inputEl.classList.add("input-error");
  const msg = document.createElement("span");
  msg.className = "error-msg";
  msg.textContent = message;
  inputEl.parentNode.appendChild(msg);
}

// ── Geocoding (Nominatim / OpenStreetMap) ──
async function searchPlaces(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json" }
  });
  if (!res.ok) throw new Error(`Nominatim: ${res.status}`);
  return res.json();
}

async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`;
  const res = await fetch(url, {
    headers: { "Accept": "application/json" }
  });
  if (!res.ok) throw new Error(`Reverse geocode: ${res.status}`);
  return res.json();
}

// ── Routing (OSRM – free, no key) ──
async function getRouteDistance(from, to) {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OSRM: ${res.status}`);
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes.length) throw new Error("No route found");
  return data.routes[0].distance / 1000; // metres → km
}

// ── Location Input Setup ──
function setupLocationInput(inputId, suggestionsId, setCoords) {
  const input = document.getElementById(inputId);
  const suggestionsEl = document.getElementById(suggestionsId);

  input.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    setCoords(null);
    const query = input.value.trim();
    if (query.length < 3) {
      suggestionsEl.innerHTML = "";
      suggestionsEl.classList.add("hidden");
      return;
    }
    searchTimeout = setTimeout(async () => {
      try {
        const results = await searchPlaces(query);
        renderSuggestions(results, suggestionsEl, input, setCoords);
      } catch (e) {
        console.error("Search error:", e);
      }
    }, 400);
  });

  input.addEventListener("blur", () => {
    setTimeout(() => suggestionsEl.classList.add("hidden"), 200);
  });
  input.addEventListener("focus", () => {
    if (suggestionsEl.children.length > 0) suggestionsEl.classList.remove("hidden");
  });
}

function renderSuggestions(results, suggestionsEl, inputEl, setCoords) {
  suggestionsEl.innerHTML = "";
  if (results.length === 0) {
    suggestionsEl.innerHTML = '<div class="suggestion-item no-result">No places found</div>';
    suggestionsEl.classList.remove("hidden");
    return;
  }
  results.forEach(place => {
    const item = document.createElement("div");
    item.className = "suggestion-item";
    item.setAttribute("role", "option");
    item.textContent = place.display_name;
    item.addEventListener("mousedown", e => {
      e.preventDefault();
      inputEl.value = place.display_name;
      setCoords({ lat: parseFloat(place.lat), lon: parseFloat(place.lon) });
      suggestionsEl.classList.add("hidden");
      tryFetchRoute();
    });
    suggestionsEl.appendChild(item);
  });
  suggestionsEl.classList.remove("hidden");
}

// ── Route Fetching ──
async function tryFetchRoute() {
  if (!fromCoords || !toCoords) return;
  const routeInfoEl = document.getElementById("route-info");
  const routeTextEl = document.getElementById("route-distance-text");
  const loadingEl = document.getElementById("route-loading");

  routeInfoEl.classList.remove("hidden");
  routeTextEl.textContent = "Calculating route…";
  loadingEl.classList.remove("hidden");

  try {
    routeDistanceKm = await getRouteDistance(fromCoords, toCoords);
    routeTextEl.textContent = `📏 ${routeDistanceKm.toFixed(1)} km via road`;
    calculate();
  } catch (e) {
    routeTextEl.textContent = "Could not find a driving route";
    routeDistanceKm = null;
    console.error("Route error:", e);
  } finally {
    loadingEl.classList.add("hidden");
  }
}

// ── Geolocation ("Use my location") ──
function setupGeolocation() {
  const btn = document.getElementById("use-my-location");
  if (!btn) return;
  btn.addEventListener("click", () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    btn.classList.add("loading");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        fromCoords = { lat, lon };
        try {
          const place = await reverseGeocode(lat, lon);
          document.getElementById("from-location").value =
            place.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        } catch {
          document.getElementById("from-location").value = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        }
        btn.classList.remove("loading");
        tryFetchRoute();
      },
      (err) => {
        btn.classList.remove("loading");
        console.error("Geolocation error:", err);
        alert("Could not get your location. Please allow location access.");
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  });
}

// ── Fuel Price Fetch ──
async function getGoilPetrolPrice() {
  try {
    const response = await fetch("https://cedirates.com/api/fuel-prices");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const goil = data.find(c => c.name.toLowerCase() === "goil");
    return goil && goil.petrol ? goil.petrol : null;
  } catch (error) {
    console.error("Error fetching fuel prices:", error);
    return null;
  }
}

function setFuelPriceLoading(loading) {
  const el = document.getElementById("fuel-price");
  const indicator = document.getElementById("price-loading");
  if (loading) {
    el.disabled = true;
    if (indicator) indicator.classList.remove("hidden");
  } else {
    el.disabled = false;
    if (indicator) indicator.classList.add("hidden");
  }
}

// ── UI Interactions ──
function setupModeTabs() {
  document.querySelectorAll(".mode-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".mode-tab").forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      currentMode = tab.dataset.mode;
      document.getElementById("route-mode").classList.toggle("hidden", currentMode !== "route");
      document.getElementById("manual-mode").classList.toggle("hidden", currentMode !== "manual");
      if (currentMode === "manual") {
        document.getElementById("distance").focus();
      }
      calculate();
    });
  });
}

function setupTripType() {
  document.querySelectorAll(".toggle-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".toggle-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      tripType = btn.dataset.trip;
      calculate();
    });
  });
}

function setupConditionCards() {
  document.querySelectorAll(".condition-card").forEach(card => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".condition-card").forEach(c => c.classList.remove("active"));
      card.classList.add("active");
      drivingCondition = card.dataset.condition;
      calculate();
    });
  });
}

function setupBufferSlider() {
  const slider = document.getElementById("buffer");
  const display = document.getElementById("buffer-value");
  slider.addEventListener("input", () => {
    display.textContent = slider.value;
    calculate();
  });
}

function setupDarkMode() {
  const toggle = document.getElementById("dark-mode-toggle");
  if (!toggle) return;
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark" || (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
    document.body.classList.add("dark");
    toggle.checked = true;
  }
  toggle.addEventListener("change", () => {
    document.body.classList.toggle("dark", toggle.checked);
    localStorage.setItem("theme", toggle.checked ? "dark" : "light");
  });
}

// ── Init ──
document.addEventListener("DOMContentLoaded", async () => {
  setupModeTabs();
  setupTripType();
  setupConditionCards();
  setupBufferSlider();
  setupDarkMode();
  setupGeolocation();

  setupLocationInput("from-location", "from-suggestions", coords => { fromCoords = coords; });
  setupLocationInput("to-location", "to-suggestions", coords => { toCoords = coords; });

  // Real-time calculation on fuel inputs & manual distance
  document.querySelectorAll("#fuel-price, #fuel-efficiency, #distance").forEach(input => {
    input.addEventListener("input", () => {
      if (getDistance()) calculate();
    });
  });

  // Form submit
  document.getElementById("calculator").addEventListener("submit", e => {
    e.preventDefault();
    calculate();
  });

  // Fetch live fuel price
  setFuelPriceLoading(true);
  try {
    const petrolPrice = await getGoilPetrolPrice();
    if (petrolPrice) {
      document.getElementById("fuel-price").value = petrolPrice;
    }
  } catch (error) {
    console.error("Could not get the current petrol price:", error);
  } finally {
    setFuelPriceLoading(false);
  }
});