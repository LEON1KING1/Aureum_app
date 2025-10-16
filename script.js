// script.js (frontend for GitHub Pages; communicates with Telegram WebApp)
const BOT_USERNAME = "AureumToken_bot";
const DAY_REWARD = 1000;

let tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
let currentUser = null;
function q(name){ return new URLSearchParams(location.search).get(name); }

document.addEventListener("DOMContentLoaded", () => {
  initUI();
  if (tg) {
    tg.expand();
    const init = tg.initDataUnsafe || {};
    const usr = init.user || null;
    if (usr) {
      currentUser = `tg:${usr.id}`;
      showInvite(usr.username || usr.id);
      // auto-register with bot (via WebApp.sendData)
      sendToBot({ action: "register", user: currentUser, ref: q("ref") || null });
    }
  } else {
    // not inside Telegram: allow manual wallet (less secure)
    currentUser = localStorage.getItem("aureum_wallet") || null;
    if (currentUser) showInvite(currentUser);
  }
  setInterval(requestBalanceFromBot, 7000);
});

function initUI(){
  document.getElementById("connectBtn").addEventListener("click", connectHandler);
  document.getElementById("mineBtn").addEventListener("click", () => {
    requestBalanceFromBot();
    document.getElementById("mineMsg").textContent = "Requested latest balance from bot...";
  });
}

function connectHandler(){
  if (tg) {
    const init = tg.initDataUnsafe || {};
    const usr = init.user || null;
    if (usr) {
      currentUser = `tg:${usr.id}`;
      showInvite(usr.username || usr.id);
      sendToBot({ action: "register", user: currentUser, ref: q("ref") || null });
      return;
    }
  }
  const addr = prompt("Enter your TON wallet address (or unique id):");
  if (addr) {
    currentUser = addr.trim();
    localStorage.setItem("aureum_wallet", currentUser);
    showInvite(currentUser);
    alert("Manual registration: open the Aureum bot and send the same id or open site inside Telegram for automatic registration.");
  }
}

function showInvite(id){
  const link = `https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(id)}`;
  document.getElementById("inviteLink").href = link;
  document.getElementById("inviteLink").textContent = link;
  document.getElementById("inviteBlock").style.display = "block";
}

function sendToBot(payload){
  const data = JSON.stringify(payload);
  if (tg && typeof tg.sendData === "function") {
    tg.sendData(data);
  } else {
    alert("Open this page inside Telegram to connect automatically.\nOr message the bot with this JSON:\n\n" + data);
  }
}

// request the bot to reply with the latest calculated balance (bot will reply inside chat)
function requestBalanceFromBot(){
  if (!currentUser) return;
  sendToBot({ action: "get_balance", user: currentUser });
}

// share invite via native share or copy
function shareInvite(){
  if (!currentUser) return alert("Connect first");
  const link = `https://t.me/${BOT_USERNAME}?start=${encodeURIComponent(currentUser)}`;
  if (navigator.share) navigator.share({ title:"Join Aureum", text:"Join Aureum and earn AUR", url: link });
  else prompt("Copy invite link:", link);
}
