function calculate() {
  const distance = parseFloat(document.getElementById("distance").value);
  const efficiency = parseFloat(document.getElementById("fuel-consumption").value);
  const pricePerLitre = 15; // Get this data from an API

  if (!isNaN(distance)) {
    const litresUsed = distance / efficiency;
    const cost = litresUsed * pricePerLitre;
    document.getElementById("result").innerText = `Cost: GHS ${cost.toFixed(2)}`;
  } else {
    alert("Please enter a valid number");
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
  const petrolPrice = await getGoilPetrolPrice();
  if (petrolPrice) {
    document.getElementById("fuel-price").value = petrolPrice;
  }
}
);
document.getElementById("calculator").addEventListener("submit", calculate);
document.getElementById("distance").addEventListener("input", calculate);
document.getElementById("fuel-consumption").addEventListener("input", calculate);
// document.getElementById("fuel-price").addEventListener("input", calculate);