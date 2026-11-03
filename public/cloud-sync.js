(()=>{
 const API=window.CAD_SERVICE_URL,core=window.CadStudy,$=id=>document.getElementById(id);
 const KEY='cad-math-space-key-v1',QUEUE='cad-math-pending-v1',DEVICE='cad-math-device-v1';
 const read=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||'null')??f;}catch{return f;}};
 let token=read(KEY,''),queue=read(QUEUE,{}),device=read(DEVICE,''),busy=false,started=false,timer,revision=Date.now(),cloudRevision='',publicKey='';
 if(!device){device=crypto.randomUUID();localStorage.setItem(DEVICE,JSON.stringify(device));}
 const connected=()=>!!token;
 function status(message,error=false){$('sync-status').textContent=message;$('sync-state').textContent=message;$('sync-state').classList.toggle('is-error',error);if(window.CadMath&&connected())$('save-status').textContent=message;$('sync-copy').hidden=!token;$('sync-open-link').hidden=!!token;}
 const stash=()=>localStorage.setItem(QUEUE,JSON.stringify(queue));
 const values=()=>Object.fromEntries(Object.entries(queue).map(([k,v])=>[k,v.value]));
 async function api(path,method='GET',data){const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);try{const r=await fetch(API+path,{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data),cache:'no-store',signal:controller.signal});const x=await r.json();if(!r.ok)throw Error(x.error||'연결 실패');return x;}finally{clearTimeout(timeout);}}
 function schedule(patch){for(const[k,value]of Object.entries(patch))queue[k]={value,revision:++revision};try{stash();}catch{status('저장 공간이 부족해요. 학습 기록을 파일로 보관해 주세요.',true);}clearTimeout(timer);timer=setTimeout(sync,450);}
 window.addEventListener('cad-record-change',e=>schedule(e.detail));
 async function sync(){if(!token||busy||!navigator.onLine)return;busy=true;
  try{
   if(!started){const remote=await api('/state'),local=core.flat(window.CadMath.snapshot()),cloud=core.flat(remote);for(const[k,v]of Object.entries(local))if(cloud[k]===undefined&&!queue[k])queue[k]={value:v,revision:++revision};stash();window.CadMath.receive(core.apply(remote,values()),{initial:true});started=true;}
   if(Object.keys(queue).length){status('기기에 저장됨 · 서버에 저장 중');const pending=Object.entries(core.clone(queue));while(pending.length){const sent={};let size=0;while(pending.length&&(size<100000||!Object.keys(sent).length)){const[k,v]=pending.shift();sent[k]=v;size+=JSON.stringify(v).length;}await api('/state','PATCH',Object.fromEntries(Object.entries(sent).map(([k,v])=>[k,v.value])));for(const[k,v]of Object.entries(sent))if(queue[k]?.revision===v.revision)delete queue[k];stash();}}
   const remote=await api('/state'+(cloudRevision?'?since='+cloudRevision:''));if(!remote.unchanged){const merged=core.apply(remote,values()),current=window.CadMath.snapshot();if(JSON.stringify(merged.records||{})!==JSON.stringify(current.records)||JSON.stringify(merged.daily||{})!==JSON.stringify(current.daily))window.CadMath.receive(merged);}cloudRevision=remote.revision||'';status(Object.keys(queue).length?'기기에 저장됨 · 추가 변경 저장 중':'서버에 저장됨 · 두 기기에서 이어서');
  }catch(e){status('기기에 저장됨 · 연결되면 다시 동기화',true);}finally{busy=false;if(Object.keys(queue).length&&navigator.onLine){clearTimeout(timer);timer=setTimeout(sync,5000);}}
 }
 async function connect(link){let key='';try{const u=new URL(link);if(u.origin!==location.origin||u.pathname!==location.pathname)throw Error();key=new URLSearchParams(u.hash.slice(1)).get('connect')||'';}catch{throw Error('이 앱의 공유 학습 링크를 붙여넣어 주세요.');}if(!/^[A-Za-z0-9_-]{43}$/.test(key))throw Error('학습 링크를 확인해 주세요.');token=key;localStorage.setItem(KEY,JSON.stringify(token));started=false;cloudRevision='';await sync();prepareInstall().catch(()=>{});}
 const incoming=new URLSearchParams(location.hash.slice(1)).get('connect');if(incoming&&/^[A-Za-z0-9_-]{43}$/.test(incoming)){token=incoming;localStorage.setItem(KEY,JSON.stringify(token));history.replaceState(null,'',location.pathname+location.search);}
 async function prepareInstall(){if(!token||!('serviceWorker'in navigator))return;const reg=await navigator.serviceWorker.ready;const worker=reg.active;if(!worker)return;const channel=new MessageChannel();channel.port1.onmessage=()=>{document.querySelector('link[rel="manifest"]').href='./manifest.webmanifest?installed=1';channel.port1.close();};worker.postMessage({type:'CAD_CONNECT',key:token},[channel.port2]);}
 document.addEventListener('click',e=>{const action=e.target.closest('[data-action]')?.dataset.action;if(action==='sync')$('sync-dialog').showModal();if(action==='reminder')openReminders();});
 $('sync-retry').onclick=sync;
 $('sync-copy').onclick=async()=>{const url=location.origin+location.pathname+'#connect='+token;try{await navigator.clipboard.writeText(url);$('sync-status').textContent='학습 링크를 복사했어요. 다른 기기에서 열면 같은 진도를 사용해요.';}catch{$('sync-link-output').value=url;$('sync-link-output').hidden=false;$('sync-link-output').select();}};
 $('sync-connect').onclick=async()=>{try{await connect($('sync-link-input').value);$('sync-link-input').value='';}catch(e){$('sync-status').textContent=e.message;}};
 function openReminders(){const ios=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1),installed=matchMedia('(display-mode: standalone)').matches||navigator.standalone;const supported='serviceWorker'in navigator&&'PushManager'in window&&'Notification'in window;
  $('reminder-dialog').showModal();$('reminder-message').textContent=!token?'기기 연결에서 공유 학습 링크를 먼저 열어 주세요.':ios&&!installed?'홈 화면에 앱을 추가한 다음 앱에서 알림을 켜 주세요.':!supported?'이 브라우저에서는 앱 알림을 지원하지 않아요.':Notification.permission==='denied'?'기기 설정에서 CAD 수학의 알림 권한을 켜 주세요.':'매일 오전 11시 학습 · 밤 10시까지 못 끝낸 날에만 알려요.';
  $('reminder-enable').disabled=!token||!supported||(ios&&!installed);if(token&&supported)api('/config').then(x=>publicKey=x.publicKey).catch(()=>{});
 }
 $('reminder-enable').onclick=async()=>{const button=$('reminder-enable');button.disabled=true;try{
  const permission=await Notification.requestPermission();if(permission!=='granted')throw Error('알림을 허용해야 받을 수 있어요.');if(!publicKey)publicKey=(await api('/config')).publicKey;
  const reg=await navigator.serviceWorker.ready,key=Uint8Array.from(atob(publicKey.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));let subscription=await reg.pushManager.getSubscription();if(!subscription)subscription=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:key});
  await api('/subscription','POST',{id:device,subscription:subscription.toJSON()});localStorage.setItem('cad-math-reminders-v1','on');$('reminder-message').textContent='이 기기의 알림이 켜졌어요. 오늘 공부를 끝내면 밤 10시 알림은 생략돼요.';
 }catch(e){$('reminder-message').textContent=e.message;}finally{button.disabled=false;}};
 $('reminder-disable').onclick=async()=>{try{await api('/subscription','DELETE',{id:device});const reg=await navigator.serviceWorker.ready;await(await reg.pushManager.getSubscription())?.unsubscribe();localStorage.removeItem('cad-math-reminders-v1');$('reminder-message').textContent='이 기기의 학습 알림을 껐어요.';}catch{$('reminder-message').textContent='연결 후 다시 꺼 주세요. 기기 설정에서도 알림을 끌 수 있어요.'}};
 window.addEventListener('online',sync);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync();});
 setInterval(()=>{if(document.visibilityState==='visible')sync();},15000);
 status(token?'학습 기록을 연결하고 있어요.':'이 기기에 저장 · 기기 연결로 진도 공유');sync();prepareInstall().catch(()=>{});
 if(location.hash==='#daily')window.CadMath.start();
})();
