const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
test('installed manifest keeps the private study connection and cannot affect another app',async()=>{
 const handlers={},stores=new Map(),base='https://example.test/cad-math/';
 const cacheFor=name=>{if(!stores.has(name))stores.set(name,new Map());const entries=stores.get(name);return{match:async key=>entries.get(String(key))?.clone(),put:async(key,response)=>entries.set(String(key),response.clone())};};
 const src=fs.readFileSync('dist/app-sw.js','utf8'),name=src.match(/const CACHE='([^']+)'/)[1];
 await cacheFor(name).put(base+'manifest.webmanifest',new Response(fs.readFileSync('dist/manifest.webmanifest','utf8')));
 vm.runInNewContext(src,{URL,Request,Response,Set,caches:{open:async name=>cacheFor(name)},self:{location:{href:base+'app-sw.js'},addEventListener:(name,fn)=>handlers[name]=fn}});
 let pending,ack=false;const key='a'.repeat(43);
 handlers.message({data:{type:'CAD_CONNECT',key},ports:[{postMessage:r=>ack=r.ok}],waitUntil:p=>pending=p});await pending;assert.equal(ack,true);
 handlers.fetch({request:{url:base+'manifest.webmanifest?installed=1',method:'GET'},respondWith:p=>pending=p});const response=await pending,manifest=await response.json();
 assert.equal(manifest.id,'/cad-math/');assert.equal(manifest.scope,'./');assert.equal(manifest.start_url,base+'?source=app#connect='+key);assert.equal(response.headers.get('Cache-Control'),'no-store');
 let caught=false;handlers.fetch({request:{url:'https://example.test/mixroom/manifest.webmanifest',method:'GET'},respondWith:()=>caught=true});assert.equal(caught,false);
 const publicManifest=await(await cacheFor(name).match(base+'manifest.webmanifest')).json();assert.ok(!publicManifest.start_url.includes(key));
});
