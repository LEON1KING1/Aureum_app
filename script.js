import { getUser, upsertUser, updateBalance, updateLastMine, getTopHolders } from './supabase.js';

const tg = window.Telegram?.WebApp;
const balanceEl = document.getElementById("balance");
const mineBtn = document.getElementById("mineBtn");
const mineMsg = document.getElementById("mineMsg");
const leadersList = document.getElementById("leadersList");

const COOLDOWN = 12 * 60 * 60 * 1000;
let currentUser = null;
let timerInterval = null;

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://aureumtokenn-ui.github.io/Aureum_app/tonconnect-manifest.json',
    buttonRootId: 'ton-connect'
});

async function initApp() {
    tg?.ready();
    tg?.expand();

    const user = tg?.initDataUnsafe?.user || { id: 888888, username: "Tester" };

    try {
        let dbUser = await getUser(user.id);
        
        if (!dbUser) {
            const ageBonus = Math.floor(2000000000 / user.id) || 1200;
            dbUser = {
                telegram_id: user.id,
                username: user.username || `User_${user.id}`,
                balance: ageBonus,
                last_mine: 0
            };
            await upsertUser(dbUser);
            mineMsg.innerHTML = `<span style="color:#ffd700">🎁 Bonus: +${ageBonus.toLocaleString()}</span>`;
        }

        currentUser = dbUser;
        updateUI();
        startCountdown();
    } catch (e) {
        console.error("Init Error:", e);
        mineMsg.textContent = "⚠️ Database Syncing...";
    }
}

function updateUI() {
    if (currentUser && balanceEl) {
        balanceEl.textContent = Math.floor(Number(currentUser.balance)).toLocaleString();
    }
}

mineBtn.onclick = async () => {
    if (!currentUser) return;
    
    const now = Date.now();
    const lastMineTime = Number(currentUser.last_mine || 0);
    
    if (now - lastMineTime < COOLDOWN) return;

    mineBtn.disabled = true;
    mineBtn.classList.add("mining-flash");
    mineMsg.textContent = "⛏️ Mining...";

    try {
        const newBalance = Number(currentUser.balance || 0) + 500;
        
        // تحديث متزامن لضمان التنفيذ
        await Promise.all([
            updateBalance(currentUser.telegram_id, newBalance),
            updateLastMine(currentUser.telegram_id, now)
        ]);
        
        currentUser.balance = newBalance;
        currentUser.last_mine = now;
        
        updateUI();
        mineBtn.classList.remove("mining-flash");
        mineMsg.textContent = "✅ Success! +500 AUR";
        
        startCountdown();
    } catch (e) {
        console.error("Mine Error:", e);
        mineMsg.textContent = "❌ Failed to save. Check RLS.";
        mineBtn.disabled = false;
        mineBtn.classList.remove("mining-flash");
    }
};

function startCountdown() {
    if (timerInterval) clearInterval(timerInterval);

    const updateTimer = () => {
        const now = Date.now();
        const lastMine = Number(currentUser?.last_mine || 0);
        const diff = COOLDOWN - (now - lastMine);

        if (diff <= 0) {
            clearInterval(timerInterval);
            mineBtn.disabled = false;
            mineMsg.textContent = "⚡ Ready to mine";
        } else {
            mineBtn.disabled = true;
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            mineMsg.textContent = `⏳ ${h}h ${m}m ${s}s`;
        }
    };

    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", async () => {
        const screen = item.getAttribute("data-screen");
        document.querySelectorAll(".container").forEach(c => c.classList.add("hidden"));
        document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
        item.classList.add("active");
        const target = document.getElementById(`${screen}Screen`);
        if (target) target.classList.remove("hidden");

        if (screen === 'leaderboard') {
            leadersList.innerHTML = "Loading...";
            const top = await getTopHolders(10);
            leadersList.innerHTML = top.map((u, i) => `
                <div class="task" style="cursor:default">
                    <div><b>#${i+1}</b> ${u.username}</div>
                    <div class="task-reward">${Number(u.balance).toLocaleString()}</div>
                </div>
            `).join('');
        }
    });
});

initApp();