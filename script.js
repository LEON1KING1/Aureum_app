import { getUser, upsertUser, updateBalance, updateLastMine, getTopHolders, supabase } from './supabase.js';

const tg = window.Telegram?.WebApp;
const user = tg?.initDataUnsafe?.user;

if (!user) {
    document.body.innerHTML = "<div style='color:white;text-align:center;padding-top:100px;'>Please open from Telegram</div>";
}

const balanceEl = document.getElementById("balance");
const mineBtn = document.getElementById("mineBtn");
const mineMsg = document.getElementById("mineMsg");
const leadersList = document.getElementById("leadersList");
const shareLinkBtn = document.getElementById("shareLinkBtn");
const referralsList = document.getElementById("referralsList");

const COOLDOWN = 12 * 60 * 60 * 1000;
const REF_REWARD = 2500;
let currentUser = null;

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://aureumtokenn-ui.github.io/Aureum_app/tonconnect-manifest.json',
    buttonRootId: 'ton-connect'
});

async function initApp() {
    if (!user) return;
    tg.ready(); tg.expand();

    try {
        let dbUser = await getUser(user.id);
        if (!dbUser) {
            let initialBalance = 1000;
            const startParam = tg.initDataUnsafe?.start_param;
            if (startParam?.startsWith('ref_')) {
                const rid = parseInt(startParam.replace('ref_', ''));
                if (rid !== user.id) {
                    initialBalance += REF_REWARD;
                    await registerReferral(rid, user.id);
                }
            }
            dbUser = { telegram_id: user.id, username: user.username || user.first_name, balance: initialBalance, last_mine: 0 };
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
        const { data } = await supabase.from('referrals').select('users!referrals_referred_id_fkey(username)').eq('referrer_id', currentUser.telegram_id);
        if (data?.length > 0) {
            referralsList.innerHTML = data.map(r => `<div class="task">👤 ${r.users.username} <span style="color:#ffd700">+${REF_REWARD}</span></div>`).join('');
        }
    } catch (e) { console.error(e); }
}

async function getUserRank() {
    const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).gt('balance', currentUser.balance);
    return (count || 0) + 1;
}

function updateUI() {
    if (currentUser) balanceEl.textContent = Math.floor(Number(currentUser.balance)).toLocaleString();
}

mineBtn.onclick = async () => {
    const now = Date.now();
    if (now - Number(currentUser.last_mine) < COOLDOWN) return;
    mineBtn.disabled = true;
    try {
        const newBal = Number(currentUser.balance) + 500;
        await updateBalance(currentUser.telegram_id, newBal);
        await updateLastMine(currentUser.telegram_id, now);
        currentUser.balance = newBal; currentUser.last_mine = now;
        updateUI(); startCountdown();
    } catch (e) { mineBtn.disabled = false; }
};

function startCountdown() {
    setInterval(() => {
        const diff = COOLDOWN - (Date.now() - Number(currentUser.last_mine));
        if (diff <= 0) { mineBtn.disabled = false; mineMsg.textContent = "⚡ Ready"; }
        else {
            mineBtn.disabled = true;
            const h = Math.floor(diff/3600000), m = Math.floor((diff%3600000)/60000), s = Math.floor((diff%60000)/1000);
            mineMsg.textContent = `⏳ ${h}h ${m}m ${s}s`;
        }
    }, 1000);
}

document.querySelectorAll(".nav-item").forEach(item => {
    item.onclick = async () => {
        const screen = item.dataset.screen;
        document.querySelectorAll(".container").forEach(c => c.classList.add("hidden"));
        document.getElementById(`${screen}Screen`).classList.remove("hidden");
        document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
        item.classList.add("active");

        if (screen === 'leaderboard') {
            const userRankContainer = document.getElementById('currentUserRank');
            const rank = await getUserRank();
            userRankContainer.innerHTML = `<div style="display:flex; justify-content:space-between;"><span><b>#${rank.toLocaleString()}</b> You</span><span>${Number(currentUser.balance).toLocaleString()} AUR</span></div>`;
            
            const top100 = await getTopHolders(100);
            leadersList.innerHTML = top100.map((u, i) => `
                <div class="task" style="${u.username === currentUser.username ? 'border:1px solid #ffd700' : ''}">
                    <span>${i < 3 ? ['🥇','🥈','🥉'][i] : '#'+(i+1)} ${u.username}</span>
                    <span style="color:#ffd700">${Number(u.balance).toLocaleString()}</span>
                </div>`).join('');
        }
    };
});

shareLinkBtn.onclick = () => {
    const link = `https://t.me/AureumToken_bot/app?startapp=ref_${currentUser.telegram_id}`;
    tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Join Aureum and earn 2500 bonus points!")}`);
};

initApp();
