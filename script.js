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
      <h2>Trip Cost Calculation</h2>
      <p class="result-line">Distance: ${distance} km</p>
      <p class="result-line">Fuel Efficiency: ${efficiency} km/l</p>
      <p class="result-line">Fuel Price: ₵${pricePerLitre} per litre</p>
      <p class="result-line">Fuel Consumption: ${fuelConsumption} %</p>
      <p class="result-line">Litres Used: ${litresUsed.toFixed(2)} litres</p>
      <p class="result-line">Total Cost: ₵${formattedCost}</p>
      <p class="result-line">Litres for 100 km: ${litresFor100km} litres</p>
    </div>
    `;
    document.getElementById("result").innerHtml = resultHtml; // Corrected to innerHTML
    // Calculate the number of litres for 100km
    console.log(`Litres for 100 km: ${litresFor100km} litres`);

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