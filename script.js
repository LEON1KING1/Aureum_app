let balance = 0;
let mining = false;
let miningInterval;
let mineStartTime;
const miningDuration = 24 * 60 * 60 * 1000;
const rewardTotal = 1000;

function updateBalanceDisplay() {
  document.getElementById("balance").textContent = balance.toFixed(0);
}

document.getElementById("mineBtn").addEventListener("click", () => {
  if (mining) return;
  mining = true;
  mineStartTime = Date.now();
  document.getElementById("mineMsg").textContent = "⛏️ Mining started...";

  miningInterval = setInterval(() => {
    const elapsed = Date.now() - mineStartTime;
    const progress = Math.min(elapsed / miningDuration, 1);
    balance = progress * rewardTotal;
    updateBalanceDisplay();

    if (progress >= 1) {
      clearInterval(miningInterval);
      document.getElementById("mineMsg").textContent = "✅ 1000 AUR Mined! Come back in 24h.";
      mining = false;
    }
  }, 1000);
});

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    const screen = item.getAttribute("data-screen");
    document.querySelectorAll(".container").forEach(c => c.classList.add("hidden"));
    document.getElementById(screen + "Screen").classList.remove("hidden");
  });
});
