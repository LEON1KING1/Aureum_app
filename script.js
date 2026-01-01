```javascript
import { supabase, upsertUser, getUser, updateBalance, updateLastMine } from './supabase.js';

let usersData = JSON.parse(localStorage.getItem("usersData")) || {};
let currentUserId = localStorage.getItem("currentUserId") || null;

const mineBtn = document.getElementById("mineBtn");
const balanceEl = document.getElementById("balance");
const mineMsg = document.getElementById("mineMsg");
const COOLDOWN = 12 * 60 * 60 * 1000; // 12 hours
let mining = false;
let countdownInterval = null;

document.addEventListener("DOMContentLoaded", async () => {
  if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    const tgUser = Telegram.WebApp.initDataUnsafe.user;

    if (tgUser) {
      currentUserId = tgUser.id.toString();
      localStorage.setItem("currentUserId", currentUserId);

      if (!usersData[currentUserId]) {
        usersData[currentUserId] = {
          telegram: {
            id: tgUser.id,
            username: tgUser.username || null,
            first_name: tgUser.first_name || "",
            last_name: tgUser.last_name || ""
          },
          wallet: null,
          balance: 0,
          mining: { lastMine: null },
          tasks: {},
          referrals: [],
          invitedBy: null
        };
        localStorage.setItem("usersData", JSON.stringify(usersData));

        // Add user to supabase
        await upsertUser({
          telegram_id: currentUserId,
          username: tgUser.username || null,
          first_name: tgUser.first_name || "",
          last_name: tgUser.last_name || "",
          balance: 0,
          last_mine: null
        });
      } else {
        // Sync local with supabase data if exists
        const remoteUser = await getUser(currentUserId);
        if (remoteUser) {
          usersData[currentUserId].balance = remoteUser.balance || 0;
          usersData[currentUserId].mining.lastMine = remoteUser.last_mine;
          localStorage.setItem("usersData", JSON.stringify(usersData));
        }
      }
    }
  }

  const savedBalance = usersData[currentUserId]?.balance || 0;
  balanceEl.textContent = savedBalance;

  startLiveCountdown();
});

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `h:{m}:${s}`;
}

function startLiveCountdown() {
  if (countdownInterval) clearInterval(countdownInterval);
  countdownInterval = setInterval(() => 
    if (!currentUserId) return;

    const lastMine = usersData[currentUserId]?.mining?.lastMine;
    if (!lastMine) 
      mineBtn.disabled = false;
      mineMsg.textContent = "⚡ Ready to mine";
      return;
    

    const now = Date.now();
    const remaining = COOLDOWN - (now - lastMine);

    if (remaining <= 0) 
      clearInterval(countdownInterval);
      mineBtn.disabled = false;
      mineMsg.textContent = "⚡ Ready to mine";
     else 
      mineBtn.disabled = true;
      mineMsg.textContent = `⏳ Next mining in{formatTime(remaining)}`;
    }
  }, 1000);
}

mineBtn.addEventListener("click", async () => {
  if (mining || !currentUserId) return;

  const lastMine = usersData[currentUserId]?.mining?.lastMine;
  const now = Date.now();

  if (lastMine && now - lastMine < COOLDOWN) return;

  mining = true;
  mineBtn.disabled = true;
  mineBtn.classList.add("mining-flash");
  mineMsg.textContent = "⛏️ Mining...";

  setTimeout(async () => {
    mineBtn.classList.remove("mining-flash");

    let balance = usersData[currentUserId]?.balance || 0;
    balance += 500;
    balanceEl.textContent = balance;

    usersData[currentUserId].balance = balance;
    usersData[currentUserId].mining.lastMine = now;
    localStorage.setItem("usersData", JSON.stringify(usersData));

    // Update supabase
    await updateBalance(currentUserId, balance);
    await updateLastMine(currentUserId, now);

    mineMsg.textContent = "✅ Mining complete! +500 AUR";
    mining = false;

    startLiveCountdown();
  }, 2000);
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
```
