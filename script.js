const API_BASE = location.origin; // backend runs on same Replit origin

function q(name){ return new URLSearchParams(location.search).get(name); }

let currentUser = localStorage.getItem("aureum_user") || "";
if (!currentUser && q("ref")) {
  localStorage.setItem("aureum_ref", q("ref"));
}

document.addEventListener("DOMContentLoaded", () => {
  initUI();
  if (currentUser) {
    fetchBalance(currentUser);
    showInvite(currentUser);
  }
  setupNav();
});

function initUI(){
  document.getElementById("connectBtn").addEventListener("click", connectWallet);
  document.getElementById("changeWalletBtn").addEventListener("click", connectWallet);
  document.getElementById("mineBtn").addEventListener("click", handleMine);
  document.querySelectorAll(".task").forEach(t => t.addEventListener("click", () => {
    const id = t.getAttribute("data-id");
    if (id === "invite") return shareInvite();
    // open link handled in HTML, claim off-chain (manual)
    alert("Open the link and follow the instructions, then press OK to claim reward.");
  }));
}

async function connectWallet(){
  const addr = prompt("Enter your wallet address (TON address or any unique id):");
  if (!addr) return;
  currentUser = addr.trim();
  localStorage.setItem("aureum_user", currentUser);
  const ref = localStorage.getItem("aureum_ref");
  try {
    const res = await fetch(`${API_BASE}/api/register`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({user_id: currentUser, ref: ref})
    });
    const j = await res.json();
    if (j.ok) {
      document.getElementById("walletAddr").textContent = currentUser;
      fetchBalance(currentUser);
      showInvite(currentUser);
      alert("Wallet registered.");
    } else {
      alert("Register error: " + (j.error || JSON.stringify(j)));
    }
  } catch (e) { alert("Network error"); }
}

async function fetchBalance(user){
  try {
    const res = await fetch(`${API_BASE}/api/balance/${encodeURIComponent(user)}`);
    const j = await res.json();
    if (j.ok) {
      document.getElementById("balance").textContent = j.balance;
      localStorage.setItem("aur_balance", j.balance);
    }
  } catch (e) {}
}

function showInvite(user){
  const inviteBlock = document.getElementById("inviteBlock");
  const link = `${location.origin}/?ref=${encodeURIComponent(user)}`;
  document.getElementById("inviteLink").href = link;
  document.getElementById("inviteLink").textContent = link;
  inviteBlock.style.display = "block";
}

async function handleMine(){
  if (!currentUser) { alert("Connect your wallet first."); return; }
  const btn = document.getElementById("mineBtn");
  btn.classList.add("mining-flash");
  document.getElementById("mineMsg").textContent = "⛏️ Checking...";
  try {
    const res = await fetch(`${API_BASE}/api/mine`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({user_id: currentUser})
    });
    const j = await res.json();
    if (j.ok) {
      document.getElementById("balance").textContent = j.balance;
      localStorage.setItem("aur_balance", j.balance);
      document.getElementById("mineMsg").textContent = `✅ Mined +${j.reward} AUR`;
    } else {
      if (j.error === "cooldown" && j.remaining) {
        const hrs = Math.ceil(j.remaining/3600);
        document.getElementById("mineMsg").textContent = `⏳ Cooldown: ${hrs}h left`;
      } else {
        document.getElementById("mineMsg").textContent = `Error: ${j.error || 'unable'}`;
      }
    }
  } catch (e) {
    document.getElementById("mineMsg").textContent = "Network error";
  } finally {
    setTimeout(()=>{ btn.classList.remove("mining-flash"); }, 800);
  }
}

function shareInvite(){
  if (!currentUser) { alert("Connect wallet to get invite link."); return; }
  const link = `${location.origin}/?ref=${encodeURIComponent(currentUser)}`;
  if (navigator.share) {
    navigator.share({title:"Join Aureum", text:"Join Aureum and earn AUR", url: link});
  } else {
    prompt("Copy this invite link:", link);
  }
}

function setupNav(){
  document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", () => {
      document.querySelectorAll(".container").forEach(c => c.classList.add("hidden"));
      document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
      item.classList.add("active");
      const target = item.getAttribute("data-screen");
      document.getElementById(`${target}Screen`).classList.remove("hidden");
    });
  });
}
