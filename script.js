// ===== Bottom Navigation Logic =====
const navItems = document.querySelectorAll(".nav-item");
const pages = {
  home: document.getElementById("homePage"),
  leaderboard: document.getElementById("leaderboardPage"),
  wallet: document.getElementById("walletPage")
};

navItems.forEach(item => {
  item.addEventListener("click", () => {
    navItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    Object.values(pages).forEach(p => p.classList.remove("active-page"));

    const page = item.dataset.page;
    pages[page].classList.add("active-page");
  });
});

// ===== TON CONNECT =====
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://LEON1KING1.github.io/Aureum_app/tonconnect-manifest.json"
});

document.getElementById("connectWallet").addEventListener("click", async () => {
  await tonConnectUI.connectWallet();
});

tonConnectUI.onStatusChange(wallet => {
  if (wallet) {
    document.getElementById("walletAddress").innerText =
      "Connected: " + wallet.account.address;
  }
});
