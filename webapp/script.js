
async function postJSON(url, data={}){
  const r = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  return r.json();
}
function show(id, msg){ const e=document.getElementById(id); if(e) e.textContent=msg; }

async function init(){
  // status + countdown
  try{
    const s = await fetch('/status'); const js = await s.json();
    if(js.ok){
      show('airdrop-status', js.status==='open'?'الأيردروب مفتوح ✅':'الأيردروب مقفول 🔒');
      if(js.opens_at) startCountdown(js.opens_at);
    }
  }catch(e){ show('airdrop-status','خطأ في الاتصال') }

  // auto register if Telegram WebApp provided user
  try{
    if(window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe && Telegram.WebApp.initDataUnsafe.user){
      const u = Telegram.WebApp.initDataUnsafe.user;
      const payload = {telegram_id:u.id, username: u.username||u.first_name||'', init_data: (Telegram.WebApp.initData||'')};
      show('status','جاري التسجيل التلقائي...');
      const res = await postJSON('/register', payload);
      if(res.ok){ show('status','تم التسجيل تلقائياً ✅'); document.getElementById('refLink').value = location.origin + '/?ref='+res.user.ref; document.getElementById('refCount').textContent = res.user.ref_count||0; show('balance', res.user.balance); }
      else show('status','خطأ: '+(res.error||JSON.stringify(res)));
    }
  }catch(e){}

  // tasks
  try{
    const t = await fetch('/tasks'); const jt = await t.json();
    if(jt.ok){
      const list = document.getElementById('tasksList'); list.innerHTML='';
      jt.tasks.forEach(task=>{
        const div=document.createElement('div'); div.className='task';
        div.innerHTML = `<div><strong>${task.title}</strong><div style="font-size:13px;color:#94a3b8">${task.desc}</div></div><div><button data-id="${task.id}">${task.reward} AUR</button></div>`;
        list.appendChild(div);
        div.querySelector('button').addEventListener('click', async ()=>{
          const uid = document.getElementById('telegram_id').value || prompt('ادخل Telegram ID لاثبات الحساب');
          if(!uid){ alert('تحتاج ID'); return; }
          const res = await postJSON('/task/complete', {user_id:uid, task_id: task.id});
          alert(res.ok?('تم استلام '+task.reward+' AUR'):(res.error||'خطأ'));
          if(res.ok) show('balance', res.balance);
        });
      });
    }
  }catch(e){ document.getElementById('tasksList').textContent='غير متاح الآن' }

  // UI handlers
  document.getElementById('registerBtn').addEventListener('click', async ()=>{
    const payload = {telegram_id: document.getElementById('telegram_id').value.trim(), wallet: document.getElementById('wallet').value.trim()};
    show('status','جاري التسجيل...');
    const res = await postJSON('/register', payload);
    if(!res.ok){ show('status','خطأ: '+(res.error||JSON.stringify(res))); return; }
    show('status','تم التسجيل ✅'); document.getElementById('refLink').value = location.origin + '/?ref='+res.user.ref; document.getElementById('refCount').textContent = res.user.ref_count||0; show('balance', res.user.balance);
  });

  document.getElementById('claimBtn').addEventListener('click', async ()=>{
    const uid = document.getElementById('telegram_id').value.trim() || prompt('ادخل Telegram ID');
    const amount = parseFloat(document.getElementById('claimAmount').value || 1);
    if(!uid){ alert('ID مطلوب'); return; }
    show('status','جاري طلب الأيردروب...');
    const res = await postJSON('/claim', {user_id: uid, amount: amount});
    if(res.ok){ show('status','تمت العملية ✅'); show('balance', res.balance); } else { show('status','خطأ: '+(res.error||JSON.stringify(res))); }
  });
}

function startCountdown(iso){
  try{
    const target = new Date(iso); const el = document.getElementById('countdown');
    function tick(){ const now=new Date(); const diff=target-now; if(diff<=0){ el.textContent='الأيردروب بدأ!'; return;} const d=Math.floor(diff/86400000), h=Math.floor((diff%86400000)/3600000), m=Math.floor((diff%3600000)/60000), s=Math.floor((diff%60000)/1000); el.textContent=`${d} يوم ${h} ساعة ${m} دقيقة ${s} ثانية`; setTimeout(tick,1000); }
    tick();
  }catch(e){}
}

window.addEventListener('load', init);
