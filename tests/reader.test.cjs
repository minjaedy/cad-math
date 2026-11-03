const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const {JSDOM}=require('jsdom');
const dist=path.join(__dirname,'../dist'),read=n=>fs.readFileSync(path.join(dist,n),'utf8');
function reader(storage={}){
 const dom=new JSDOM(read('index.html'),{url:'https://example.test/cad-math/',runScripts:'outside-only'}),w=dom.window;
 w.scrollTo=()=>{};for(const[k,v]of Object.entries(storage))w.localStorage.setItem(k,v);
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 for(const n of ['study-core.js','book-data.js','workbook-data.js','study-plan.js','textbook.js'])vm.runInContext(read(n),dom.getInternalVMContext());
 return dom;
}
test('all 144 original lessons and formatted content are preserved exactly',()=>{
 const original=fs.readFileSync(path.join(__dirname,'../source/textbook.html'),'utf8'),first=original.match(/<script>([\s\S]*?)<\/script>/)[1].split('\n')[0];
 assert.equal(read('book-data.js'),first);const ctx=vm.createContext({});vm.runInContext(first,ctx);
 const counts=vm.runInContext('({units:BOOK.length,examples:BOOK.reduce((n,u)=>n+u.examples.length,0),questions:BOOK.reduce((n,u)=>n+u.problems.length,0)})',ctx);
 assert.equal(counts.units,144);assert.equal(counts.examples,576);assert.equal(counts.questions,1152);
 vm.runInContext(read('workbook-data.js'),ctx);assert.equal(vm.runInContext('BOOK.reduce((n,u)=>n+u.problems.length,0)',ctx),2016);assert.equal(vm.runInContext('BOOK.reduce((n,u)=>n+u.examples.length,0)',ctx),720);
 for(const file of ['book-data.js','textbook.js','app.js','theme.js','app-sw.js'])assert.doesNotThrow(()=>new vm.Script(read(file)));
});
test('practice grading and notes survive reload without signing in',()=>{
 const dom=reader(),w=dom.window,d=w.document;
 d.querySelector('[data-unit="1"]').click();d.querySelector('[data-tab="practice"]').click();
 const first=vm.runInContext('BOOK[0].problems[0]',dom.getInternalVMContext()),form=d.querySelector('[data-grade="1-0"]');
 assert.equal(first.type,'numeric');[...form.querySelectorAll('input')].forEach((el,i)=>el.value=String(first.values[i]));form.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(vm.runInContext("state.results['1-0']",dom.getInternalVMContext()),'correct');
 const note=d.querySelector('[data-note="1"]');note.value='my guest note';note.dispatchEvent(new w.Event('input',{bubbles:true}));
 const key='cad-math-full-144-v1',saved=w.localStorage.getItem(key),reloaded=reader({[key]:saved});
 assert.equal(reloaded.window.document.querySelector('[data-note="1"]').value,'my guest note');
 assert.equal(vm.runInContext("state.results['1-0']",reloaded.getInternalVMContext()),'correct');
 assert.equal(d.querySelector('#account-button'),null);
 assert.ok(![...d.scripts].some(s=>/firebase-auth|google/.test(s.src)));
 reloaded.window.close();
 dom.window.close();
});
test('export and import transfer learning records; invalid imports preserve data',async()=>{
 const dom=reader(),w=dom.window,d=w.document;let blob;
 w.URL.createObjectURL=value=>{blob=value;return 'blob:test';};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=()=>{};
 d.querySelector('[data-unit="1"]').click();d.querySelector('[data-tab="practice"]').click();d.querySelector('[data-note="1"]').value='backup note';d.querySelector('[data-note="1"]').dispatchEvent(new w.Event('input',{bubbles:true}));
 d.querySelector('#export-button').click();
 const content=await new Promise(resolve=>{const r=new w.FileReader();r.onload=()=>resolve(r.result);r.readAsText(blob);});assert.equal(JSON.parse(content).notes['1'],'backup note');
 const other=reader(),ow=other.window,od=ow.document,input=od.querySelector('#import-records');
 const imported={...JSON.parse(content),notes:{'1':'backup note','145':'invalid'},results:{'1-0':'correct','145-0':'correct'}};
 Object.defineProperty(input,'files',{configurable:true,value:[{size:100,text:async()=>JSON.stringify(imported)}]});input.dispatchEvent(new ow.Event('change',{bubbles:true}));await new Promise(resolve=>setImmediate(resolve));
 let state=JSON.parse(ow.localStorage.getItem('cad-math-full-144-v1'));assert.equal(state.notes['1'],'backup note');assert.equal(state.notes['145'],undefined);assert.equal(state.results['1-0'],'correct');
 Object.defineProperty(input,'files',{configurable:true,value:[{size:100,text:async()=>'{invalid'}]});input.dispatchEvent(new ow.Event('change',{bubbles:true}));await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(JSON.parse(ow.localStorage.getItem('cad-math-full-144-v1')),state);
 dom.window.close();other.window.close();
});
test('PWA scope, source-only deployment exclusions, and offline cache boundaries',()=>{
 const manifest=JSON.parse(read('manifest.webmanifest'));assert.equal(manifest.id,'/cad-math/');assert.equal(manifest.scope,'./');
 for(const icon of manifest.icons)assert.ok(fs.existsSync(path.join(dist,icon.src)));
 const sw=read('app-sw.js');assert.match(sw,/name.startsWith\('cad-math-shell-'\)/);assert.match(sw,/url.origin!==base.origin/);
 const list=JSON.parse(sw.match(/const ASSETS=(\[[\s\S]*?\]);/)[1]);for(const file of list)assert.ok(fs.existsSync(path.join(dist,file)),file);
 assert.ok(!list.some(x=>/source|rules|service-account|credential|node_modules/.test(x)));
});
test('worker removes only its old cache and serves a matching offline shell',async()=>{
 const handlers={},deleted=[],cache={match:async()=>new Response('saved app shell')};
 const context=vm.createContext({URL,Request,Response,Set,fetch:()=>{throw Error('Offline');},caches:{keys:async()=>['cad-math-shell-old','couple-shell-v3-icons','mixroom-shell'],delete:async name=>deleted.push(name),open:async()=>cache},self:{location:{href:'https://example.test/cad-math/app-sw.js'},addEventListener:(type,fn)=>handlers[type]=fn,clients:{claim:async()=>{}},skipWaiting:()=>{}}});
 vm.runInContext(read('app-sw.js'),context);let pending;
 handlers.activate({waitUntil:p=>pending=p});await pending;assert.deepEqual(deleted,['cad-math-shell-old']);
 handlers.fetch({request:{url:'https://example.test/cad-math/?source=app',method:'GET',mode:'navigate'},respondWith:p=>pending=p});assert.equal(await(await pending).text(),'saved app shell');
 let intercepted=false;handlers.fetch({request:{url:'https://example.test/dydy/',method:'GET',mode:'navigate'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
});
