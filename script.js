function calculate() {
  const distanceEl = document.getElementById("distance");
  const fuelPriceEl = document.getElementById("fuel-price");
  const fuelConsumptionEl = document.getElementById("fuel-consumption");
  const resultEl = document.getElementById("result");

  const distance = parseFloat(distanceEl.value);
  const pricePerLitre = parseFloat(fuelPriceEl.value);
  const efficiency = parseFloat(fuelConsumptionEl.value);

  // Clear previous errors
  document.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));
  document.querySelectorAll(".error-msg").forEach(el => el.remove());

  let hasError = false;

  if (isNaN(distance) || distance <= 0) {
    showFieldError(distanceEl, "Enter a valid distance");
    hasError = true;
  }
  if (isNaN(pricePerLitre) || pricePerLitre <= 0) {
    showFieldError(fuelPriceEl, "Enter a valid fuel price");
    hasError = true;
  }
  if (isNaN(efficiency) || efficiency <= 0) {
    showFieldError(fuelConsumptionEl, "Enter a valid efficiency");
    hasError = true;
  }

  if (hasError) {
    resultEl.innerHTML = "";
    resultEl.classList.remove("show");
    return;
  }

  const litresUsed = distance / efficiency;
  const totalCost = litresUsed * pricePerLitre;
  const formattedCost = totalCost.toFixed(2);
  const litresFor100km = (100 / efficiency).toFixed(2);

  const resultHtml = `
    <div class="result-wrapper">
      <h2>Trip Cost Breakdown</h2>
      <div class="result-item highlight">
        <span class="result-label">Total Cost:</span>
        <span class="result-value">₵${formattedCost}</span>
      </div>
      <div class="result-item">
        <span class="result-label">Distance:</span>
        <span class="result-value">${distance} km</span>
      </div>
      <div class="result-item">
        <span class="result-label">Fuel Efficiency:</span>
        <span class="result-value">${efficiency} km/l</span>
      </div>
      <div class="result-item">
        <span class="result-label">Fuel Price:</span>
        <span class="result-value">₵${pricePerLitre.toFixed(2)} per litre</span>
      </div>
      <div class="result-item">
        <span class="result-label">Litres Used:</span>
        <span class="result-value">${litresUsed.toFixed(2)} litres</span>
      </div>
      <div class="result-item">
        <span class="result-label">Litres per 100 km:</span>
        <span class="result-value">${litresFor100km} litres</span>
      </div>
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

async function getGoilPetrolPrice() {
  try {
    const response = await fetch('https://cedirates.com/api/fuel-prices');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    const goil = data.find(company => company.name.toLowerCase() === 'goil');

    if (goil && goil.petrol) {
      return goil.petrol;
    }
    return null;
  } catch (error) {
    console.error('Error fetching fuel prices:', error);
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

document.addEventListener("DOMContentLoaded", async () => {
  // Set up real-time calculation on all inputs
  document.querySelectorAll("#calculator .input").forEach(input => {
    input.addEventListener("input", () => {
      const distance = document.getElementById("distance").value;
      if (distance) calculate();
    });
  });

  // Fetch live fuel price
  setFuelPriceLoading(true);
  try {
    const petrolPrice = await getGoilPetrolPrice();
    if (petrolPrice) {
      document.getElementById("fuel-price").value = petrolPrice;
    }
  } catch (error) {
    console.error('Could not get the current petrol price:', error);
  } finally {
    setFuelPriceLoading(false);
  }

  // Dark mode toggle
  const toggle = document.getElementById("dark-mode-toggle");
  if (toggle) {
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
});

document.getElementById("calculator").addEventListener("submit", (e) => {
  e.preventDefault();
  calculate();
});