const API = location.origin;
let currentUser = localStorage.getItem("aureum_user") || "";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("connectBtn").addEventListener("click", connectWallet);
  document.getElementById("mineBtn").addEventListener("click", startMining);
  setInterval(updateBalance, 3000);
  if (currentUser) updateBalance();
});

async function connectWallet() {
  try {
    const tonconnect = new TonConnect();
    await tonconnect.connect();
    const wallet = tonconnect.account?.address || "";
    if (!wallet) return alert("Connection failed!");
    currentUser = wallet;
    localStorage.setItem("aureum_user", wallet);
    await fetch(`${API}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: wallet }),
    });
    document.getElementById("mineMsg").textContent = "Wallet connected ✅";
  } catch (e) {
    console.error(e);
  }
}

async function startMining() {
  if (!currentUser) return alert("Connect wallet first!");
  document.getElementById("mineMsg").textContent = "⛏️ Mining started...";
  setInterval(updateBalance, 5000);
}

async function updateBalance() {
  if (!currentUser
