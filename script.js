function calculate() {
  const distance = parseFloat(document.getElementById("distance").value);
  const efficiency = 6.7; // Updated efficiency to 6.7 km/l
  const pricePerLitre = parseFloat(document.getElementById("fuel-price").value);
  const fuelConsumption = parseFloat(document.getElementById("fuel-consumption").value);

  if (!isNaN(distance)) {
    // Calculate the cost of the trip using the km/l efficiency
    const litresUsed = distance / efficiency;
    const cost = litresUsed * pricePerLitre;
    const totalCost = cost + (cost * (fuelConsumption / 100));
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
          <span class="result-value">₵${pricePerLitre} per litre</span>
        </div>
        <div class="result-item">
          <span class="result-label">Fuel Consumption:</span>
          <span class="result-value">${fuelConsumption}%</span>
        </div>
        <div class="result-item">
          <span class="result-label">Litres Used:</span>
          <span class="result-value">${litresUsed.toFixed(2)} litres</span>
        </div>
        <div class="result-item">
          <span class="result-label">Litres for 100 km:</span>
          <span class="result-value">${litresFor100km} litres</span>
        </div>
      </div>
    `;
    document.getElementById("result").innerHTML = resultHtml; // Corrected to innerHTML
    // Calculate the number of litres for 100km

  } else {
    alert("Please enter a valid number for distance.");
  }
}

async function getGoilPetrolPrice() {
  try {
    const response = await fetch('https://cedirates.com/api/fuel-prices');
    const data = await response.json();

    // Find GOIL's fuel prices
    const goil = data.find(company => company.name.toLowerCase() === 'goil');

    if (goil && goil.petrol) {
      console.log(`GOIL Petrol Price: ₵${goil.petrol}`);
      return goil.petrol;
    } else {
      console.log('GOIL petrol price not found.');
      return null;
    }
  } catch (error) {
    console.error('Error fetching fuel prices:', error);
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  try {

    const petrolPrice = await getGoilPetrolPrice();
    if (petrolPrice) {
      document.getElementById("fuel-price").value = petrolPrice;
    }
  } catch (error) {
    console.error('Could not get the current petrol price from the internet:', error);
  }
}
);
document.getElementById("calculator").addEventListener("submit", calculate);
document.getElementById("fuel-consumption").addEventListener("input", calculate);

function showPopup(resultHtml) {
  const popup = document.getElementById("result-popup");
  const resultContent = document.getElementById("result-content");
  resultContent.innerHTML = resultHtml;
  popup.classList.remove("hidden");
}

function closePopup() {
  const popup = document.getElementById("result-popup");
  popup.classList.add("hidden");
}