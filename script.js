document.addEventListener("DOMContentLoaded", () => {

  const mineBtn = document.getElementById("mineBtn");
  const balanceEl = document.getElementById("balance");
  const mineMsg = document.getElementById("mineMsg");
  const connectBtn = document.getElementById("connectBtn");
  const walletAddrEl = document.getElementById("walletAddr");
  const leadersEl = document.getElementById("leaders");

  const COOLDOWN = 12 * 60 * 60 * 1000;
  let mining = false;
  let countdownInterval = null;

  let userID = localStorage.getItem("aur_userID");
  if (!userID) {
    userID = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    localStorage.setItem("aur_userID", userID);
  }

  let users = JSON.parse(localStorage.getItem("aur_users") || "{}");

  if (!users[userID]) {
    users[userID] = {
      balance: 0,
      invited: [],
      wallet: null
    };
    localStorage.setItem("aur_users", JSON.stringify(users));
  }

  function updateBalance() {
    balanceEl.textContent = users[userID].balance;
  }
  updateBalance();

  function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
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
      const remaining = COOLDOWN - (Date.now() - lastMine);
      if (remaining <= 0) {
        mineBtn.disabled = false;
        mineMsg.textContent = "⚡ Ready to mine";
      } else {
        mineBtn.disabled = true;
        mineMsg.textContent = `⏳ ${formatTime(remaining)}`;
      }
    }, 1000);
  }
  startLiveCountdown();

  mineBtn.addEventListener("click", () => {
    const lastMine = localStorage.getItem("aur_last_mine");
    if (lastMine && Date.now() - lastMine < COOLDOWN) return;

    mineBtn.disabled = true;
    mineMsg.textContent = "⛏️ Mining...";

    setTimeout(() => {
      users[userID].balance += 10;
      localStorage.setItem("aur_last_mine", Date.now());
      localStorage.setItem("aur_users", JSON.stringify(users));
      updateBalance();
      startLiveCountdown();
      updateLeaderboard();
    }, 1500);
  });

  function updateLeaderboard() {
    const list = Object.values(users).sort((a, b) => b.balance - a.balance);
    leadersEl.innerHTML = list.slice(0, 100)
      .map((u, i) => `<div class="small">#${i + 1} - ${u.balance} AUR</div>`)
      .join("");
  }
  updateLeaderboard();

  // ✅ TON CONNECT (الصحيح)
  const tonConnect = new TonConnect({
    manifestUrl: "https://leon1king1.github.io/Aureum_app/tonconnect-manifest.json"
  });

  connectBtn.addEventListener("click", async () => {
    await tonConnect.connectWallet();
  });

  tonConnect.onStatusChange(wallet => {
    if (!wallet) return;
    users[userID].wallet = wallet.account.address;
    localStorage.setItem("aur_users", JSON.stringify(users));
    walletAddrEl.textContent =
      wallet.account.address.slice(0, 6) + "..." +
      wallet.account.address.slice(-4);
    connectBtn.textContent = "Wallet Connected";
  });

  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".container").forEach(c => c.classList.add("hidden"));
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      document.getElementById(item.dataset.screen + "Screen").classList.remove("hidden");
    });
  });