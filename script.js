const API = "https://aadb8d65-6daf-4df2-9a2e-2e452f2773ea-00-25isq9j9z2aai.janeway.replit.dev";
const walletInput = document.getElementById("wallet");
const connectBtn = document.getElementById("connect");
const mineBtn = document.getElementById("mine");
const balanceEl = document.getElementById("balance");
const daysEl = document.getElementById("days");
const mainSection = document.getElementById("main-section");
const walletSection = document.getElementById("wallet-section");
const refInput = document.getElementById("refLink");
let userId = localStorage.getItem("userId");
async function fetchUser() {
  const res = await fetch(`${API}/get_user?id=${encodeURIComponent(userId)}`);
  const obj = await res.json();
  return obj;
}
async function updateDisplay() {
  const u = await fetchUser();
  balanceEl.textContent = `💰 Balance: ${u.balance}`;
  daysEl.textContent = `📅 Days mined: ${u.days_mined || 0}`;
}
connectBtn.onclick = async () => {
  const w = walletInput.value.trim();
  if (!w) {
    alert("Enter your identifier");
    return;
  }
  userId = w;
  localStorage.setItem("userId", w);
  // referral param if present
  const params = new URLSearchParams(window.location.search);
  const ref = params.get("ref");
  if (ref) {
    await fetch(`${API}/ref?ref=${encodeURIComponent(ref)}&id=${encodeURIComponent(userId)}`);
  }
  refInput.value = `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(userId)}`;
  walletSection.classList.add("hidden");
  mainSection.classList.remove("hidden");
  updateDisplay();
};
mineBtn.onclick = async () => {
  if (!userId) {
    alert("Connect first");
    return;
  }
  const res = await fetch(`${API}/mine?id=${encodeURIComponent(userId)}`);
  const data = await res.json();
  if (data.error) {
    alert(data.error);
  } else {
    alert("✅ You mined 1000 AUR!");
  }
  updateDisplay();
};
// init
if (userId) {
  walletSection.classList.add("hidden");
  mainSection.classList.remove("hidden");
  refInput.value = `${window.location.origin}${window.location.pathname}?ref=${encodeURIComponent(userId)}`;
  updateDisplay();
}
