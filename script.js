// ===============================
// Supabase Config
// ===============================
const SUPABASE_URL = "https://gtqmfriduegesrqydhqi.supabase.co";
const SUPABASE_KEY = "sb_publishable_-NdU_DRwfWjVWcBPjcGXWQ_cLGaSLr9";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ===============================
// Constants
// ===============================
const COOLDOWN = 12 * 60 * 60 * 1000; // 12 hours
const MINE_REWARD = 500;
const REFERRAL_REWARD = 5000;
const REFERRAL_TARGET = 10;

// ===============================
// State
// ===============================
let currentUser = null;
let countdownInterval = null;

// ===============================
// Elements
// ===============================
const mineBtn = document.getElementById("mineBtn");
const balanceEl = document.getElementById("balance");
const mineMsg = document.getElementById("mineMsg");

// ===============================
// Utils
// ===============================
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function updateUI() {
  balanceEl.textContent = currentUser?.balance ?? 0;
}

// ===============================
// Init App (Auto Register Telegram User)
// ===============================
async function initApp() {
  if (!window.Telegram || !Telegram.WebApp) {
    alert("This app works only inside Telegram WebApp.");
    return;
  }

  Telegram.WebApp.ready();
  const tgUser = Telegram.WebApp.initDataUnsafe?.user;

  if (!tgUser) {
    alert("User data not available.");
    return;
  }

  const userId = tgUser.id.toString();

  let { data: existingUser, error } = await supabaseClient
    .from("users")
    .select("*")
    .eq("telegram_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching user:", error);
    return;
  }

  if (!existingUser) {
    const { data: newUser, error: createError } = await supabaseClient
      .from("users")
      .insert({
        telegram_id: userId,
        username: tgUser.username || null,
        first_name: tgUser.first_name || "",
        last_name: tgUser.last_name || "",
        balance: 0,
        last_mine: null,
        referrals_count: 0,
        invited_by: null
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating user:", createError);
      return;
    }

    currentUser = newUser;
  } else {
    currentUser = existingUser;
  }

  localStorage.setItem("currentUserId", userId);

  handleReferral();
  updateUI();
  startMiningCountdown();
}

// ===============================
// Mining Countdown
// ===============================
function startMiningCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);

  countdownInterval = setInterval(() => {
    const lastMine = currentUser.last_mine
      ? new Date(currentUser.last_mine).getTime()
      : null;

    const now = Date.now();

    if (!lastMine || now - lastMine >= COOLDOWN) {
      mineBtn.disabled = false;
      mineMsg.textContent = "⚡ Ready to mine";
    } else {
      const remaining = COOLDOWN - (now - lastMine);
      mineBtn.disabled = true;
      mineMsg.textContent = `⏳ Next mining in ${formatTime(remaining)}`;
    }
  }, 1000);
}

// ===============================
// Mine Action
// ===============================
async function mine() {
  if (mineBtn.disabled) return;

  mineBtn.disabled = true;
  mineBtn.classList.add("mining-flash");
  mineMsg.textContent = "⛏️ Mining...";

  setTimeout(async () => {
    const newBalance = (currentUser.balance || 0) + MINE_REWARD;
    const now = new Date().toISOString();

    const { data, error } = await supabaseClient
      .from("users")
      .update({
        balance: newBalance,
        last_mine: now
      })
      .eq("telegram_id", currentUser.telegram_id)
      .select()
      .single();

    if (error) {
      console.error("Error mining:", error);
      mineMsg.textContent = "❌ Error mining";
      mineBtn.disabled = false;
      mineBtn.classList.remove("mining-flash");
      return;
    }

    currentUser = data;
    updateUI();
    mineMsg.textContent = `✅ Mining complete! +${MINE_REWARD} AUR`;
    mineBtn.classList.remove("mining-flash");
    startMiningCountdown();
  }, 2000);
}

// ===============================
// Referral Handling
// ===============================
async function handleReferral() {
  const params = new URLSearchParams(window.location.search);
  const inviterId = params.get("ref");

  if (!inviterId || inviterId === currentUser.telegram_id) return;
  if (currentUser.invited_by) return;

  await supabaseClient
    .from("users")
    .update({ invited_by: inviterId })
    .eq("telegram_id", currentUser.telegram_id);

  const { data: inviter } = await supabaseClient
    .from("users")
    .select("referrals_count, balance")
    .eq("telegram_id", inviterId)
    .single();

  if (!inviter) return;

  const newCount = (inviter.referrals_count || 0) + 1;
  let newBalance = inviter.balance;

  if (newCount === REFERRAL_TARGET) {
    newBalance += REFERRAL_REWARD;
  }

  await supabaseClient
    .from("users")
    .update({
      referrals_count: newCount,
      balance: newBalance
    })
    .eq("telegram_id", inviterId);
}

// ===============================
// Events
// ===============================
mineBtn.addEventListener("click", mine);

document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".container").forEach(c =>
      c.classList.add("hidden")
    );
    document.querySelectorAll(".nav-item").forEach(n =>
      n.classList.remove("active")
    );

    item.classList.add("active");
    const target = item.getAttribute("data-screen");
    document.getElementById(`${target}Screen`).classList.remove("hidden");
  });
});

// ===============================
// Start App
// ===============================
document.addEventListener("DOMContentLoaded", initApp);
