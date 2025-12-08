‏document.addEventListener("DOMContentLoaded", () => {
‏  const savedBalance = localStorage.getItem("aur_balance");
‏  if (savedBalance) document.getElementById("balance").textContent = savedBalance;
‏});
‏
‏const mineBtn = document.getElementById("mineBtn");
‏const balanceEl = document.getElementById("balance");
‏const mineMsg = document.getElementById("mineMsg");
‏let mining = false;
‏
‏mineBtn.addEventListener("click", async () => {
‏  if (mining) return;
‏  mining = true;
‏
‏  mineBtn.classList.add("mining-flash");
‏  let seconds = 3;
‏  mineMsg.textContent = `⛏️ Mining... ${seconds}s`;
‏
‏  const countdown = setInterval(() => {
‏    seconds--;
‏    mineMsg.textContent = `⛏️ Mining... ${seconds}s`;
‏    if (seconds <= 0) {
‏      clearInterval(countdown);
‏      mineMsg.textContent = "✅ Mining complete! +10 AUR";
‏      mineBtn.classList.remove("mining-flash");
‏
‏      let balance = parseInt(balanceEl.textContent);
‏      balance += 10;
‏      balanceEl.textContent = balance;
‏      localStorage.setItem("aur_balance", balance);
‏
‏      mining = false;
‏    }
‏  }, 1000);
‏});
‏
‏document.querySelectorAll(".nav-item").forEach(item => {
‏  item.addEventListener("click", () => {
‏    document.querySelectorAll(".container").forEach(c => c.classList.add("hidden"));
‏    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
‏    item.classList.add("active");
‏    const target = item.getAttribute("data-screen");
‏    document.getElementById(`${target}Screen`).classList.remove("hidden");
‏  });
‏});