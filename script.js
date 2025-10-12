const tg = window.Telegram ? window.Telegram.WebApp : null;
if(tg) tg.expand();

function showScreen(name){
  document.querySelectorAll('.container').forEach(c=>c.classList.add('hidden'));
  document.getElementById(name+'Screen').classList.remove('hidden');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.querySelector(`.nav-item[data-screen="${name}"]`).classList.add('active');
}

document.querySelectorAll('.nav-item').forEach(item=>{item.addEventListener('click', ()=> showScreen(item.dataset.screen));});

function connectWalletPrompt(){const addr=prompt('Enter your TON wallet address:');if(!addr) return;document.getElementById('walletAddr').innerText=addr;sendToBot({action:'connect_wallet', wallet: addr});}
document.getElementById('connectBtn').addEventListener('click', connectWalletPrompt);
document.getElementById('changeWalletBtn').addEventListener('click', connectWalletPrompt);

document.getElementById('mineBtn').addEventListener('click', ()=>{sendToBot({action:'mine'});document.getElementById('mineMsg').innerText='Mining request sent...';});

document.querySelectorAll('.task').forEach(t=>{t.addEventListener('click', ()=>{const id=t.dataset.id;if(id==='invite'){openInvite();return;}sendToBot({action:'task', task_id: id});alert('Task submitted — reward will be processed by the bot.');});});

function openInvite(){if(!tg){alert('Open inside Telegram to use invite');return;}const username=tg.initDataUnsafe&&tg.initDataUnsafe.user&&tg.initDataUnsafe.user.username?tg.initDataUnsafe.user.username:null;if(!username){alert('Set a Telegram username in your profile to use invites.');return;}const invite=`https://t.me/AureumToken_bot?start=${username}`;sendToBot({action:'invite', ref: username});tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(invite)}&text=${encodeURIComponent('Join Aureum and earn tokens! 💎')}`);}

function sendToBot(obj){if(!tg){alert('Open this page inside Telegram WebApp to interact with the bot.');return;}tg.sendData(JSON.stringify(obj));}

showScreen('home');
