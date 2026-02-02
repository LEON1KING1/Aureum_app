import { getUser, upsertUser, updateBalance, updateLastMine, getTopHolders } from './supabase.js';

const tg = window.Telegram.WebApp;
const balanceEl = document.getElementById("balance");
const mineBtn = document.getElementById("mineBtn");
const mineMsg = document.getElementById("mineMsg");
const leadersList = document.getElementById("leadersList");

const COOLDOWN = 12 * 60 * 60 * 1000;
let currentUser = null;

// تهيئة TonConnect
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://aureumtokenn-ui.github.io/Aureum_app/tonconnect-manifest.json',
    buttonRootId: 'ton-connect'
});

async function initApp() {
    tg.ready();
    tg.expand();

    const user = tg.initDataUnsafe?.user;
    if (!user) {
        mineMsg.textContent = "Please use Telegram";
        return;
    }

    // جلب أو إنشاء مستخدم (سيستم DOGS)
    let dbUser = await getUser(user.id);
    if (!dbUser) {
        const ageBonus = Math.floor(5000000000 / user.id); // حساب البونص بناء على ID
        dbUser = {
            telegram_id: user.id,
            username: user.username || `User_${user.id}`,
            balance: ageBonus,
            last_mine: null
        };
        await upsertUser(dbUser);
        mineMsg.textContent = `🎁 Welcome! Account age bonus: +${ageBonus}`;
    }

    currentUser = dbUser;
    renderUI();
    startCountdown();
}

function renderUI() {
    balanceEl.textContent = currentUser.balance.toLocaleString();
}

// منطق التعدين
mineBtn.addEventListener("click", async () => {
    const now = Date.now();
    if (currentUser.last_mine && now - currentUser.last_mine < COOLDOWN) return;

    mineBtn.disabled = true;
    mineBtn.classList.add("mining-flash");
    mineMsg.textContent = "⛏️ Mining...";

    setTimeout(async () => {
        const newBalance = currentUser.balance + 500;
        await updateBalance(currentUser.telegram_id, newBalance);
        await updateLastMine(currentUser.telegram_id, now);
        
        currentUser.balance = newBalance;
        currentUser.last_mine = now;
        
        renderUI();
        mineBtn.classList.remove("mining-flash");
        mineMsg.textContent = "✅ +500 AUR Mined!";
        startCountdown();
    }, 2000);
});

function startCountdown() {
    const update = () => {
        const now = Date.now();
        const diff = COOLDOWN - (now - (currentUser.last_mine || 0));
        if (diff <= 0) {
            mineBtn.disabled = false;
            mineMsg.textContent = "⚡ Ready to mine";
        } else {
            mineBtn.disabled = true;
            const h = Math.floor(diff/3600000);
            const m = Math.floor((diff%3600000)/60000);
            mineMsg.textContent = `⏳ Next mine in ${h}h ${m}m`;
        }
    };
    update();
    setInterval(update, 60000);
}

// التنقل ولوحة الصدارة
document.querySelectorAll(".nav-item").forEach(item => {
    item.addEventListener("click", async () => {
        const screen = item.getAttribute("data-screen");
        document.querySelectorAll(".container").forEach(c => c.classList.add("hidden"));
        document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
        item.classList.add("active");
        document.getElementById(`${screen}Screen`).classList.remove("hidden");

        if (screen === 'leaderboard') {
            const top = await getTopHolders(10);
            leadersList.innerHTML = top.map((u, i) => `
                <div class="task">
                    <div><b>#${i+1}</b> ${u.username}</div>
                    <div class="task-reward">${u.balance} AUR</div>
                </div>
            `).join('');
        }
    });
});

initApp();