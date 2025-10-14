const TG = window.Telegram?window.Telegram.WebApp:null;
if(TG) TG.expand();

const BALANCE_KEY = 'aureum_balance_v1';
const USER_WALLET_KEY = 'aureum_wallet_v1';
const TASKS_KEY = 'aureum_tasks_v1';

const LINKS = {
  twitter: 'https://x.com/Aureum_Token',
  telegram: 'https://t.me/AureumToken',
  bot: 'https://t.me/AureumToken_bot'
};

let tonConnectUI = null;
if(window.TonConnectUi){
  tonConnectUI = new TonConnectUi.TonConnectUi();
}

function formatNumber(n){return n.toLocaleString();}

function loadState(){
  const b = parseInt(localStorage.getItem(BALANCE_KEY) || '0',10);
  const w = localStorage.getItem(USER_WALLET_KEY) || '';
  const tasks = JSON.parse(localStorage.getItem(TASKS_KEY) || '[]');
  const lastMine = parseInt(localStorage.getItem('aureum_lastmine')||'0',10);
  return {balance:b,wallet:w,tasks:tasks,lastMine:lastMine};
}
function saveState(state){
  localStorage.setItem(BALANCE_KEY, String(state.balance));
  localStorage.setItem(USER_WALLET_KEY, state.wallet || '');
  localStorage.setItem(TASKS_KEY, JSON.stringify(state.tasks || []));
  localStorage.setItem('aureum_lastmine', String(state.lastMine||0));
}

function showScreen(name){
  document.querySelectorAll('.container').forEach(c=>c.classList.add('hidden'));
  const el = document.getElementById(name+'Screen');
  if(el) el.classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  const nav = document.querySelector('.nav-item[data-screen="'+name+'"]');
  if(nav) nav.classList.add('active');
}

function openExternal(url){ window.open(url,'_blank'); }

async function connectWallet(){
  if(tonConnectUI){
    try{
      const session = await tonConnectUI.connect();
      const account = session.account.address || session.account;
      state.wallet = account;
      saveState(state);
      document.getElementById('walletAddr').textContent = account;
      alert('Wallet connected: ' + account);
      return;
    }catch(e){
      console.error(e);
      alert('Wallet connection cancelled or failed.');
    }
  } else {
    const addr = prompt('Paste your TON wallet address (Testnet/Mainnet):');
    if(addr){ state.wallet = addr; saveState(state); document.getElementById('walletAddr').textContent = addr; alert('Wallet saved.'); }
  }
}

function mineNow(){
  const card = document.getElementById('mainCard');
  const mineBtn = document.getElementById('mineBtn');
  const msg = document.getElementById('mineMsg');
  const now = Math.floor(Date.now()/1000);
  if(state.lastMine && (now - state.lastMine) < 24*60*60){
    const remaining = Math.max(0, 24*60*60 - (now - state.lastMine));
    msg.textContent = 'Cooldown active. Come back in ' + Math.ceil(remaining/3600) + 'h';
    return;
  }
  card.classList.add('glow');
  mineBtn.disabled = true;
  let progress = 0;
  const reward = 10;
  const tick = setInterval(()=>{
    progress += Math.random()*8 + 4;
    document.getElementById('balance').textContent = formatNumber(Math.floor(state.balance + progress));
    if(progress >= reward){
      clearInterval(tick);
      state.balance += reward;
      state.lastMine = Math.floor(Date.now()/1000);
      saveState(state);
      document.getElementById('balance').textContent = formatNumber(state.balance);
      msg.textContent = '+'+reward+' AUR added';
      setTimeout(()=>{ msg.textContent=''; }, 3000);
      card.classList.remove('glow');
      mineBtn.disabled = false;
      // sparkle
      card.animate([{filter:'drop-shadow(0 0 0px rgba(255,215,0,0))'},{filter:'drop-shadow(0 0 30px rgba(255,215,0,0.55))'},{filter:'drop-shadow(0 0 0px rgba(255,215,0,0))'}],{duration:900});
    }
  },120);
}

async function claimTask(id){
  const rewards = {subscribe:700, follow:1200, join_channel:1000, invite:500};
  const linkMap = {subscribe:LINKS.twitter, follow:LINKS.twitter, join_channel:LINKS.telegram, invite:LINKS.bot};
  const url = linkMap[id];
  if(!confirm('Open the link to complete the task?')) return;
  openExternal(url);
  setTimeout(async ()=>{
    if(!confirm('Did you complete the task? Click OK to claim reward.')) return;
    if(state.tasks.includes(id)){ alert('Task already claimed.'); return; }
    state.balance += (rewards[id]||0);
    state.tasks.push(id);
    saveState(state);
    document.getElementById('balance').textContent = formatNumber(state.balance);
    alert('Reward claimed: ' + (rewards[id]||0) + ' AUR');
  },400);
}

let state = loadState();
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('balance').textContent = formatNumber(state.balance);
  document.getElementById('walletAddr').textContent = state.wallet || 'Not connected';
  document.getElementById('connectBtn').addEventListener('click', connectWallet);
  document.getElementById('changeWalletBtn').addEventListener('click', connectWallet);
  document.getElementById('mineBtn').addEventListener('click', mineNow);
  document.querySelectorAll('.task').forEach(t=>t.addEventListener('click',()=> claimTask(t.dataset.id)));
  document.querySelectorAll('.nav-item').forEach(i=>i.addEventListener('click',()=> showScreen(i.dataset.screen)));
  setTimeout(()=> document.getElementById('splash').classList.add('hidden'), 950);
});
