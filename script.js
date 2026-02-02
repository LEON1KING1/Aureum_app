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
    if (tg) {
        tg.ready();
        tg.expand();
    }

    const user = tg?.initDataUnsafe?.user || { id: 123456, username: "Aureum_User" };

    try {
        let dbUser = await getUser(user.id);
        
        if (!dbUser) {
            const ageBonus = Math.floor(2000000000 / user.id) || 1000;
            dbUser = {
                telegram_id: user.id,
                username: user.username || `User_${user.id}`,
                balance: ageBonus,
                last_mine: 0
            };
            await upsertUser(dbUser);
            mineMsg.innerHTML = `<span style="color:#ffd700">🎁 Welcome Bonus: +${ageBonus.toLocaleString()}</span>`;
        }

        currentUser = dbUser;
        updateUI();
        startCountdown();
    } catch (e) {
        console.error(e);
        mineMsg.textContent = "⚠️ DB Sync Error";
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
    mineMsg.textContent = "⛏️ Mining AUR...";

    try {
        const newBalance = Number(currentUser.balance || 0) + 500;
        
        await updateBalance(currentUser.telegram_id, newBalance);
        await updateLastMine(currentUser.telegram_id, now);
        
        currentUser.balance = newBalance;
        currentUser.last_mine = now;
        
        updateUI();
        mineBtn.classList.remove("mining-flash");
        mineMsg.textContent = "✅ Mined +500 AUR!";
        startCountdown();
    } catch (e) {
        mineMsg.textContent = "❌ Save Error";
        mineBtn.disabled = false;
        mineBtn.classList.remove("mining-flash");
    }
};

async function completeTask(reward) {
    if (!currentUser) return;
    try {
        const newBalance = Number(currentUser.balance) + reward;
        await updateBalance(currentUser.telegram_id, newBalance);
        currentUser.balance = newBalance;
        updateUI();
        tg?.showScanQrPopup({ text: `Task Complete! +${reward} AUR` });
        setTimeout(() => tg?.closeScanQrPopup(), 2000);
    } catch (e) {
        console.error(e);
    }
}

function startCountdown() {
    if (timerInterval) clearInterval(timerInterval);
    const updateTimer = () => {
        const now = Date.now();
        const diff = COOLDOWN - (now - Number(currentUser?.last_mine || 0));
        if (diff <= 0) {
            clearInterval(timerInterval);
            mineBtn.disabled = false;
            mineMsg.textContent = "⚡ Ready to mine";
        } else {
            mineBtn.disabled = true;
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            mineMsg.textContent = `⏳ Next mine: ${h}h ${m}m ${s}s`;
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
            try {
                const top = await getTopHolders(10);
                leadersList.innerHTML = top.map((u, i) => `
                    <div class="task" style="cursor:default">
                        <div><b>#${i+1}</b> ${u.username}</div>
                        <div class="task-reward">${Number(u.balance).toLocaleString()}</div>
                    </div>
                `).join('');
            } catch (e) {
                leadersList.innerHTML = "Sync Error";
            }
        }
    });
});

document.querySelectorAll('.task').forEach((task, index) => {
    task.onclick = () => {
        const reward = index === 0 ? 700 : 1000;
        completeTask(reward);
    };
});

initApp();