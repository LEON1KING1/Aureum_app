import { getUser, upsertUser, updateBalance, updateLastMine, getTopHolders } from './supabase.js';

//  Telegram WebApp
const tg = window.Telegram?.WebApp;

const balanceEl = document.getElementById("balance");
const mineBtn = document.getElementById("mineBtn");
const mineMsg = document.getElementById("mineMsg");
const leadersList = document.getElementById("leadersList");

const COOLDOWN = 12 * 60 * 60 * 1000;
let currentUser = null;

// 
let tonConnectUI;
try {
    tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: 'https://aureumtokenn-ui.github.io/Aureum_app/tonconnect-manifest.json',
        buttonRootId: 'ton-connect'
    });
} catch (e) {
    console.error("TonConnect failed to load", e);
}

async function initApp() {
    if (!tg) {
        mineMsg.textContent = "Error: Open via Telegram";
        return;
    }
    
    tg.ready();
    tg.expand();

    const user = tg.initDataUnsafe?.user;
    
    if (!user || !user.id) {
        mineMsg.textContent = "Please use Telegram App";
        return;
    }

    try {
        let dbUser = await getUser(user.id);
        if (!dbUser) {
            // 
            const ageBonus = Math.floor(5000000000 / user.id); 
            dbUser = {
                telegram_id: user.id,
                username: user.username || `User_${user.id}`,
                balance: ageBonus,
                last_mine: null
            };
            await upsertUser(dbUser);
            mineMsg.textContent = `🎁 Bonus: +${ageBonus.toLocaleString()}`;
        }
        currentUser = dbUser;
        updateDisplay();
        startCountdown();
    } catch (e) {
        console.error("DB Error:", e);
        mineMsg.textContent = "Connection Error";
    }
}

function updateDisplay() {
    if (currentUser) {
        balanceEl.textContent = currentUser.balance.toLocaleString();
    }
}

mineBtn.addEventListener("click", async () => {
    if (!currentUser) return;
    const now = Date.now();
    if (currentUser.last_mine && now - currentUser.last_mine < COOLDOWN) return;

    mineBtn.disabled = true;
    mineBtn.classList.add("mining-flash");
    mineMsg.textContent = "⛏️ Mining...";

    try {
        const newBalance = (currentUser.balance || 0) + 500;
        await updateBalance(currentUser.telegram_id, newBalance);
        await updateLastMine(currentUser.telegram_id, now);
        
        currentUser.balance = newBalance;
        currentUser.last_mine = now;
        
        updateDisplay();
        mineBtn.classList.remove("mining-flash");
        mineMsg.textContent = "✅ Success! +500 AUR";
        startCountdown();
    } catch (e) {
        mineMsg.textContent = "Error saving progress";
        mineBtn.disabled = false;
    }
});

function startCountdown() {
    const timer = setInterval(() => {
        const now = Date.now();
        const diff = COOLDOWN - (now - (currentUser?.last_mine || 0));
        
        if (diff <= 0) {
            clearInterval(timer);
            mineBtn.disabled = false;
            mineMsg.textContent = "⚡ Ready to mine";
        } else {
            mineBtn.disabled = true;
            const h = Math.floor(diff/3600000);
            const m = Math.floor((diff%3600000)/60000);
            const s = Math.floor((diff%60000)/1000);
            mineMsg.textContent = `⏳ ${h}h ${m}m ${s}s`;
        }
    }, 1000);
}

// 
document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", async () => {
        const screen = item.getAttribute("data-screen");
        document.querySelectorAll(".container").forEach(c => c.classList.add("hidden"));
        document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
        item.classList.add("active");
        
        const targetScreen = document.getElementById(`${screen}Screen`);
        if (targetScreen) targetScreen.classList.remove("hidden");

        if (screen === 'leaderboard') {
            leadersList.innerHTML = "Loading...";
            try {
                const top = await getTopHolders(10);
                leadersList.innerHTML = top.map((u, i) => `
                    <div class="task" style="cursor:default">
                        <div><b>#${i+1}</b> ${u.username}</div>
                        <div class="task-reward">${u.balance.toLocaleString()}</div>
                    </div>
                `).join('');
            } catch (e) {
                leadersList.innerHTML = "Error loading leaders";
            }
        }
    });
});

initApp();