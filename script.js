document.addEventListener("DOMContentLoaded", () => {
  const savedBalance = localStorage.getItem("aur_balance");
  if (savedBalance) balanceEl.textContent = savedBalance;

  startLiveCountdown();
});

const mineBtn = document.getElementById("mineBtn");
const balanceEl = document.getElementById("balance");
const mineMsg = document.getElementById("mineMsg");

const COOLDOWN = 12 * 60 * 60 * 1000; // 12 hours
let mining = false;
let countdownInterval = null;

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function startLiveCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    const lastMine = localStorage.getItem("aur_last_mine");
    if (!lastMine) {
      mineBtn.disabled = false;
      mineMsg.textContent = "⚡ Ready to mine";
      return;
    }

    const now = Date.now();
    const remaining = COOLDOWN - (now - lastMine);

    if (remaining <= 0) {
      clearInterval(countdownInterval);
      mineBtn.disabled = false;
      mineMsg.textContent = "⚡ Ready to mine";
    } else {
      mineBtn.disabled = true;
      mineMsg.textContent = `⏳ Next mining in ${formatTime(remaining)}`;
    }
  }, 1000);
}

mineBtn.addEventListener("click", () => {
  if (mining) return;

  const lastMine = localStorage.getItem("aur_last_mine");
  const now = Date.now();

  if (lastMine && now - lastMine < COOLDOWN) return;

  mining = true;
  mineBtn.disabled = true;
  mineBtn.classList.add("mining-flash");
  mineMsg.textContent = "⛏️ Mining...";

  setTimeout(() => {
    mineBtn.classList.remove("mining-flash");

    let balance = parseInt(balanceEl.textContent || "0");
    balance += 10;
    balanceEl.textContent = balance;

    localStorage.setItem("aur_balance", balance);
    localStorage.setItem("aur_last_mine", Date.now());

    mineMsg.textContent = "✅ Mining complete! +10 AUR";
    mining = false;

    startLiveCountdown();
  }, 2000); // 
});

// navigation
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".container").forEach(c => c.classList.add("hidden"));
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    item.classList.add("active");
    const target = item.getAttribute("data-screen");
    document.getElementById(`${target}Screen`).classList.remove("hidden");
  });
});
