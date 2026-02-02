import { getUser, upsertUser, updateBalance, updateLastMine, getTopHolders, supabase } from './supabase.js';

const tg = window.Telegram?.WebApp;
const balanceEl = document.getElementById("balance");
const mineBtn = document.getElementById("mineBtn");
const mineMsg = document.getElementById("mineMsg");
const leadersList = document.getElementById("leadersList");
const shareLinkBtn = document.getElementById("shareLinkBtn");
const referralsList = document.getElementById("referralsList");

const COOLDOWN = 12 * 60 * 60 * 1000;
const REF_REWARD = 2500;
let currentUser = null;
let timerInterval = null;

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://aureumtokenn-ui.github.io/Aureum_app/tonconnect-manifest.json',
    buttonRootId: 'ton-connect'
});

async function initApp() {
    tg?.ready();
    tg?.expand();
    const user = tg?.initDataUnsafe?.user || { id: 12345, username: "Guest" };
    const startParam = tg?.initDataUnsafe?.start_param;

    try {
        let dbUser = await getUser(user.id);
        if (!dbUser) {
            let initialBalance = Math.floor(2000000000 / user.id) || 1000;
            if (startParam && startParam.startsWith('ref_')) {
                const rid = parseInt(startParam.replace('ref_', ''));
                if (rid !== user.id) {
                    initialBalance += REF_REWARD;
                    await registerReferral(rid, user.id);
                }
            }
            dbUser = { telegram_id: user.id, username: user.username || `User_${user.id}`, balance: initialBalance, last_mine: 0 };
            await upsertUser(dbUser);
        }
        currentUser = dbUser;
        updateUI();
        startCountdown();
        loadReferrals();
    } catch (e) { console.error(e); }
}

async function registerReferral(rid, uid) {
    try {
        const { data: refObj } = await supabase.from('users').select('balance').eq('telegram_id', rid).single();
        if (refObj) await updateBalance(rid, Number(refObj.balance) + REF_REWARD);
        await supabase.from('referrals').insert([{ referrer_id: rid, referred_id: uid, timestamp: Date.now() }]);
    } catch (e) { console.error(e); }
}

async function loadReferrals() {
    try {
        const { data } = await supabase.from('referrals').select('referred_id, users!referrals_referred_id_fkey(username)').eq('referrer_id', currentUser.telegram_id);
        if (data && data.length > 0) {
            referralsList.innerHTML = data.map(r => `<div class="task" style="margin:5px 0"><span>👤 ${r.users.username}</span><span style="color:#ffd700">+${REF_REWARD}</span></div>`).join('');
        }
    } catch (e) { console.error(e); }
}

function updateUI() {
    if (currentUser) balanceEl.textContent = Math.floor(Number(currentUser.balance)).toLocaleString();
}

mineBtn.onclick = async () => {
    const now = Date.now();
    if (now - Number(currentUser.last_mine) < COOLDOWN) return;
    mineBtn.disabled = true;
    mineBtn.classList.add("mining-flash");
    try {
        const newBal = Number(currentUser.balance) + 500;
        await updateBalance(currentUser.telegram_id, newBal);
        await updateLastMine(currentUser.telegram_id, now);
        currentUser.balance = newBal; currentUser.last_mine = now;
        updateUI(); startCountdown();
        mineBtn.classList.remove("mining-flash");
    } catch (e) { mineBtn.disabled = false; }
};

function startCountdown() {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const diff = COOLDOWN - (Date.now() - Number(currentUser.last_mine));
        if (diff <= 0) { mineBtn.disabled = false; mineMsg.textContent = "⚡ Ready"; }
        else {
            mineBtn.disabled = true;
            const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
            mineMsg.textContent = `⏳ ${h}h ${m}m ${s}s`;
        }
    }, 1000);
}

shareLinkBtn.onclick = () => {
    const link = `https://t.me/AureumToken_bot/app?startapp=ref_${currentUser.telegram_id}`;
    const text = `Join Aureum! Mine tokens and get 2,500 AUR bonus! 🚀`;
    tg?.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`);
};

document.querySelectorAll(".nav-item").forEach(item => {
    item.onclick = async () => {
        const screen = item.dataset.screen;
        document.querySelectorAll(".container").forEach(c => c.classList.add("hidden"));
        document.getElementById(`${screen}Screen`).classList.remove("hidden");
        document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
        item.classList.add("active");
        if (screen === 'leaderboard') {
            const top = await getTopHolders(10);
            leadersList.innerHTML = top.map((u, i) => `<div class="task"><b>#${i+1}</b> ${u.username} <span style="color:#ffd700">${u.balance}</span></div>`).join('');
        }
    };
});

document.getElementById("taskX").onclick = () => window.open('https://x.com/Aureum_Token', '_blank');
document.getElementById("taskTG").onclick = () => window.open('https://t.me/AureumToken', '_blank');

initApp();
