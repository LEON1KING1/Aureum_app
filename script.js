document.addEventListener('DOMContentLoaded', () => {

    function generateUserId() {
        let id = localStorage.getItem("aur_user_id");
        if (!id) { id = crypto.randomUUID(); localStorage.setItem("aur_user_id", id); }
        return id;
    }
    const userUUID = generateUserId();

    const tonConnect = new TonConnect({ manifestUrl: 'tonconnect-manifest.json' });

    const mineBtn = document.getElementById("mineBtn");
    const balanceEl = document.getElementById("balance");
    const mineMsg = document.getElementById("mineMsg");
    const connectBtn = document.getElementById("connectBtn");
    const walletAddrEl = document.getElementById("walletAddr");
    const changeWalletBtn = document.getElementById("changeWalletBtn");
    const leadersContainer = document.getElementById("leaders");
    const inviteBtn = document.getElementById('inviteBtn');

    const COOLDOWN = 12 * 60 * 60 * 1000;
    let mining = false;
    let countdownInterval = null;

    let user = createUserIfNotExist(userUUID);
    if(balanceEl) balanceEl.textContent = user.balance;
    if(walletAddrEl) walletAddrEl.textContent = user.wallet;

    function formatTime(ms){
        const totalSeconds = Math.floor(ms/1000);
        const h = String(Math.floor(totalSeconds/3600)).padStart(2,"0");
        const m = String(Math.floor((totalSeconds%3600)/60)).padStart(2,"0");
        const s = String(totalSeconds%60).padStart(2,"0");
        return `${h}:${m}:${s}`;
    }

    function startLiveCountdown(){
        if(!mineBtn||!mineMsg) return;
        if(countdownInterval) clearInterval(countdownInterval);
        countdownInterval=setInterval(()=>{
            const lastMine=user.lastMine||0;
            const now=Date.now();
            const remaining=COOLDOWN-(now-lastMine);
            if(remaining<=0){mineBtn.disabled=false; mineMsg.textContent="⚡ Ready to mine";}
            else{mineBtn.disabled=true; mineMsg.textContent=`⏳ Next mining in ${formatTime(remaining)}`;}
        },1000);
    }

    if(mineBtn){
        mineBtn.addEventListener("click",()=>{
            if(mining) return;
            const lastMine=user.lastMine||0;
            const now=Date.now();
            if(now-lastMine<COOLDOWN) return;
            mining=true; mineBtn.disabled=true; mineBtn.classList.add("mining-flash"); mineMsg.textContent="⛏️ Mining...";
            setTimeout(()=>{
                mineBtn.classList.remove("mining-flash");
                user.balance+=500;
                user.lastMine=Date.now();
                saveUser(userUUID,user);
                if(balanceEl) balanceEl.textContent=user.balance;
                mineMsg.textContent="✅ Mining complete! +500 AUR";
                mining=false; startLiveCountdown(); updateLeaderboard();
            },2000);
        });
    }

    async function connectWallet(){
        try{
            const wallet = await tonConnect.connect();
            user.wallet = wallet.account.address;
            saveUser(userUUID,user);
            if(walletAddrEl) walletAddrEl.textContent = wallet.account.address;
        } catch(err){console.error(err);}
    }
    if(connectBtn) connectBtn.addEventListener('click',connectWallet);
    if(changeWalletBtn) changeWalletBtn.addEventListener('click',connectWallet);

    function completeTask(taskId,conditionMet=true){
        if(!user.tasks[taskId] && conditionMet){
            user.tasks[taskId] = true;
            let reward = (taskId==='invite')?5000:500;
            user.balance+=reward;
            saveUser(userUUID,user);
            if(balanceEl) balanceEl.textContent=user.balance;
            updateLeaderboard();
        }
    }

    function addReferral(newUUID){
        if(!user.referrals.includes(newUUID)){
            user.referrals.push(newUUID);
            user.balance+=500;
            saveUser(userUUID,user);
            const newUser = createUserIfNotExist(newUUID);
            newUser.balance+=500;
            saveUser(newUUID,newUser);
            updateLeaderboard();
        }
    }

    inviteBtn.addEventListener('click',()=>{
        const referralLink = `https://t.me/AureumToken_bot?start=${userUUID}`;
        window.location.href = referralLink;
    });

    function updateLeaderboard(){
        if(!leadersContainer) return;
        const users = Object.values(getAllUsers());
        users.sort((a,b)=>b.balance-a.balance);
        leadersContainer.innerHTML='';
        users.forEach((u,i)=>{
            const div=document.createElement('div');
            div.className='task';
            div.innerHTML=`<div>${i+1}. ${u.wallet||'Anonymous'}</div><div class="task-reward">${u.balance}</div>`;
            leadersContainer.appendChild(div);
        });
    }

    document.querySelectorAll(".nav-item").forEach(item=>{
        item.addEventListener("click",()=>{
            document.querySelectorAll(".container").forEach(c=>c.classList.add("hidden"));
            document.querySelectorAll(".nav-item").forEach(n=>n.classList.remove("active"));
            item.classList.add("active");
            const target=item.getAttribute("data-screen");
            document.getElementById(`${target}Screen`).classList.remove("hidden");
        });
    });

    startLiveCountdown();
    updateLeaderboard();

});
