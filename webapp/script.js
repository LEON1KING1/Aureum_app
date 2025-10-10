let balance = 100;
let lastMineTime = localStorage.getItem("lastMineTime") || null;

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });
  document.getElementById(pageId).classList.add("active");
}

function updateBalance() {
  document.getElementById("balance").innerText = `Aureum: ${balance} 💎`;
}

function mine() {
  const now = Date.now();
  if (lastMineTime && now - lastMineTime < 24 * 60 * 60 * 1000) {
    const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - (now - lastMineTime)) / (1000 * 60 * 60));
    document.getElementById("mining-status").innerText = `⏳ You can mine again in ${hoursLeft} hours.`;
    return;
  }

  balance += 50; //
  lastMineTime = now;
  localStorage.setItem("lastMineTime", lastMineTime);
  updateBalance();
  document.getElementById("mining-status").innerText = "✅ You mined 50 Aureum!";
}


updateBalance();
