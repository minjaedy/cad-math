const CACHE='cad-math-shell-__VERSION__';
const ASSETS=__ASSETS__;
const base=new URL('./',self.location.href);
const allowed=new Set(ASSETS.map(p=>new URL(p,base).pathname));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS.map(p=>new Request(new URL(p,base),{cache:'reload'}))))));
self.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('cad-math-shell-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();if(event.data?.type==='CAD_CONNECT'&&/^[A-Za-z0-9_-]{43}$/.test(event.data.key||''))event.waitUntil((async()=>{const cache=await caches.open('cad-math-device-v1');await cache.put(new URL('./__private-install',base),new Response(JSON.stringify({key:event.data.key}),{headers:{'Content-Type':'application/json'}}));event.ports?.[0]?.postMessage({ok:true});})());});
self.addEventListener('fetch',event=>{
 const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==base.origin||!url.pathname.startsWith(base.pathname))return;
 if(url.pathname===new URL('./manifest.webmanifest',base).pathname){event.respondWith((async()=>{const shell=await caches.open(CACHE),saved=await shell.match(new URL('./manifest.webmanifest',base).href),response=saved||await fetch(event.request);const manifest=await response.json(),privateCache=await caches.open('cad-math-device-v1'),entry=await privateCache.match(new URL('./__private-install',base));if(entry){const data=await entry.json();if(/^[A-Za-z0-9_-]{43}$/.test(data.key||''))manifest.start_url=new URL('./?source=app#connect='+data.key,base).href;}return new Response(JSON.stringify(manifest),{headers:{'Content-Type':'application/manifest+json','Cache-Control':'no-store'}});})());return;}
 if(event.request.mode==='navigate'&&(url.pathname===base.pathname||url.pathname===new URL('./index.html',base).pathname)){
  event.respondWith((async()=>{const cache=await caches.open(CACHE),saved=await cache.match(new URL('./index.html',base).href);return saved||fetch(event.request);})());return;
 }
 if(!allowed.has(url.pathname))return;
 event.respondWith((async()=>{const cache=await caches.open(CACHE),key=new URL(url.pathname,base.origin).href,hit=await cache.match(key);if(hit)return hit;const response=await fetch(event.request);if(response.ok&&response.type==='basic')await cache.put(key,response.clone());return response;})());
});
self.addEventListener('push',event=>event.waitUntil((async()=>{
 let data={};try{data=event.data?.json()||{};}catch{}
 await self.registration.showNotification(data.title||'CAD 수학',{body:data.body||'오늘의 학습을 하던 곳부터 이어가요.',icon:new URL('./icons/icon-192.png',base).href,badge:new URL('./icons/icon-192.png',base).href,tag:data.tag||'cad-math-study',data:{url:new URL('./#daily',base).href}});
})()));
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil((async()=>{
 const target=new URL('./#daily',base).href,windows=await self.clients.matchAll({type:'window',includeUncontrolled:true});
 for(const client of windows)if(new URL(client.url).origin===base.origin&&new URL(client.url).pathname.startsWith(base.pathname)){await client.navigate(target);return client.focus();}
 return self.clients.openWindow(target);
})());});
