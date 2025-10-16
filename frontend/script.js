const API = "https://aureumflow.yourname.repl.co";
const DAY_REWARD = 1000;
let currentUser = localStorage.getItem("aureum_user") || "";
let tcInstance = null;

// helper to get ?ref= in URL
function q(name){ return new URLSearchParams(location.search).get(name); }

document.addEventListener("DOMContentLoaded", () => {
  initUI();
  const ref = q("ref");
  if (!localStorage.getItem("aureum_ref") && ref) localStorage.setItem("aureum_ref", ref);
  if (currentUser) {
    document.getElementById("walletAddr").textContent = currentUser;
    registerUser(currentUser);
    updateLoop();
  }
  setupNav();
  setInterval(updateLoop, 5000);
});

function initUI(){
  document.getElementById("connectBtn").addEventListener("click", connectWallet);
  document.getElementById("changeWalletBtn")?.addEventListener("click", connectWallet);
  document.getElementById("mineBtn").addEventListener("click", () => {
    document.getElementById("mineMsg").textContent = "Mining runs automatically (accrues continuously). Balance will update shortly.";
  });
}

// TonConnect attempt, fallback to prompt
async function connectWallet(){
  try {
    if (window.TonConnect) {
      tcInstance = new TonConnect({ manifestUrl: location.origin + "/manifest.json" });
      const transport = window.TonConnectTransportWeb; // some builds include transports
    }
  } catch(e){ tcInstance = null; }

  if (tcInstance && typeof tcInstance.connect === "function") {
    try {
      const session = await tcInstance.connect();
      // TonConnect returns array of accounts; adapt to SDK used in your bundle
      const account = session?.account || session?.account?.address || session?.address || null;
      if (account) {
        finishConnect(account);
        return;
      }
    } catch(e){}
  }

  // fallback prompt
  const addr = prompt("Enter your wallet address (TON address):");
  if (addr) finishConnect(addr.trim());
}

async function finishConnect(addr){
  currentUser = addr;
  localStorage.setItem("aureum_user", currentUser);
  document.getElementById("walletAddr").textContent = currentUser;
  // register with ref if any
  const ref = localStorage.getItem("aureum_ref");
  await fetch(`${API}/api/register`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ user_id: currentUser, ref: ref })
  });
  showInvite(currentUser);
  updateLoop();
}

function showInvite(user){
  const inviteBlock = document.getElementById("inviteBlock");
  const link = `${location.origin}/?ref=${encodeURIComponent(user)}`;
  document.getElementById("inviteLink").href = link;
  document.getElementById("inviteLink").textContent = link;
  inviteBlock.style.display = "block";
}

async function updateLoop(){
  if (!currentUser) return;
  try {
    const res = await fetch(`${API}/api/balance/${encodeURIComponent(currentUser)}`);
    const j = await res.json();
    if (j.ok) {
      document.getElementById("balance").textContent = Number(j.balance).toFixed(2);
      const acc = Number(j.accumulated_today||0);
      const percent = Math.min(100, (acc / DAY_REWARD) * 100);
      document.getElementById("progressFill").style.width = percent + "%";
      document.getElementById("progressText").textContent = `${Math.round(acc) } / ${DAY_REWARD} AUR today`;
    }
  } catch(e){
    console.error(e);
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
