function calculate() {
  const distance = parseFloat(document.getElementById("distance").value);
  const efficiency = 6.5;
  const pricePerLitre = 15;

  if (!isNaN(distance)) {
    const litresUsed = distance / efficiency;
    const cost = litresUsed * pricePerLitre;
    document.getElementById("result").innerText = `Cost: GHS ${cost.toFixed(2)}`;
  } else {
    alert("Please enter a valid number");
  }
}