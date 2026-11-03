(()=>{
 const $=id=>document.getElementById(id),standalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;
 let deferredInstall=null,registration=null,reloading=false,toastTimer;
 const notify=text=>{$('app-toast').textContent=text;$('app-toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('app-toast').hidden=true,4000);};
 const themeMedia=matchMedia('(prefers-color-scheme: dark)');
 let theme;try{theme=localStorage.getItem('cad-math-theme-v1')||'system';}catch{theme='system';}
 function setTheme(){const actual=theme==='system'?(themeMedia.matches?'dark':'light'):theme;document.documentElement.dataset.theme=actual;document.querySelector('meta[name="theme-color"]').content=actual==='dark'?'#18231e':'#f1f3eb';$('theme-button').textContent=theme==='system'?'◐':theme==='dark'?'☾':'☀';$('theme-button').setAttribute('aria-label','화면 테마: '+({system:'기기 설정',dark:'다크',light:'라이트'}[theme])+'. 눌러서 변경');}
 $('theme-button').onclick=()=>{theme={system:'dark',dark:'light',light:'system'}[theme];try{localStorage.setItem('cad-math-theme-v1',theme);}catch{}setTheme();notify({system:'기기 화면 설정에 맞춰요',dark:'다크모드',light:'라이트모드'}[theme]);};themeMedia.addEventListener('change',setTheme);setTheme();
 document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>$(b.dataset.close).close());
 $('study-home-button').onclick=()=>window.CadMath.home();
 $('focus-button').onclick=()=>{const active=document.body.classList.toggle('focus-mode');$('focus-button').setAttribute('aria-pressed',String(active));$('focus-button').textContent=active?'집중 해제':'집중';};
 document.addEventListener('click',e=>{if(e.target.closest('[data-action="bank"]'))window.CadMath.workbook();});
 window.addEventListener('cad-study-finished',()=>notify('오늘의 목표 완료! 다음 진도가 준비됐어요.'));
 const bar=document.querySelector('.topbar');if(window.ResizeObserver)new ResizeObserver(()=>document.documentElement.style.setProperty('--topbar-height',bar.offsetHeight+'px')).observe(bar);
 window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;});
 function installText(){const ua=navigator.userAgent;if(standalone())return '이미 앱으로 실행 중이에요. 홈 화면이나 Dock에서 다시 열 수 있어요.';if(/iPhone|iPad|iPod/.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1))return 'Safari에서 공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요. 앱으로 열기 항목이 있으면 켜 주세요.';if(/Mac/.test(ua)&&/Safari/.test(ua)&&!/Chrome|CriOS/.test(ua))return 'Safari의 파일 메뉴에서 ‘Dock에 추가’를 선택하세요.';return 'Chrome 또는 Edge의 주소창 설치 아이콘을 누르거나, 브라우저 메뉴에서 ‘앱으로 설치’를 선택하세요.';}
 $('install-button').onclick=async()=>{if(deferredInstall){const event=deferredInstall;deferredInstall=null;await event.prompt();await event.userChoice;return;}$('install-instruction').textContent=installText();$('install-dialog').showModal();};
 window.addEventListener('appinstalled',()=>{deferredInstall=null;$('install-button').textContent='앱 설치됨';});if(standalone())$('install-button').hidden=true;
 function waiting(){if(registration?.waiting)$('update-banner').hidden=false;}
 if('serviceWorker'in navigator){navigator.serviceWorker.register('./app-sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
  registration=reg;waiting();const watch=worker=>worker?.addEventListener('statechange',()=>{if(worker.state==='installed'){if(navigator.serviceWorker.controller)waiting();else $('offline-status').textContent='오프라인 교재가 준비됐어요.';}});watch(reg.installing);reg.addEventListener('updatefound',()=>watch(reg.installing));navigator.serviceWorker.ready.then(()=>$('offline-status').textContent='오프라인 교재가 준비됐어요.');
 }).catch(()=>$('offline-status').textContent='오프라인 저장을 완료하지 못했어요. 온라인에서는 계속 사용할 수 있어요.');
 navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload();});
 }
 $('update-now').onclick=()=>registration?.waiting?.postMessage({type:'SKIP_WAITING'});$('update-later').onclick=()=>$('update-banner').hidden=true;
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')registration?.update().catch(()=>{});});
})();
