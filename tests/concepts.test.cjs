const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const read=name=>fs.readFileSync('dist/'+name,'utf8');
function page(){const dom=new JSDOM(read('index.html'),{url:'https://example.test/cad-math/',runScripts:'outside-only'}),w=dom.window;w.scrollTo=()=>{};w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=()=>{};for(const name of ['study-core.js','book-data.js','workbook-data.js','study-plan.js','concept-data.js','textbook.js'])vm.runInContext(read(name),dom.getInternalVMContext());return dom;}
test('all 541 concept sections retain their complete text, math, links and order in easy reading',()=>{
 const dom=page(),ctx=dom.getInternalVMContext(),book=vm.runInContext('BOOK',ctx),doc=dom.window.document;
 const parsed=html=>{const el=doc.createElement('div');el.innerHTML=html;return el;};
 const normalize=s=>s.replace(/\s/g,'');let total=0;
 for(const u of book)for(const[sidx,s]of u.sections.entries()){
  const transformed=dom.window.CAD_CONCEPTS[u.id-1].sections[sidx],original=parsed(s.bodyH),easy=parsed((transformed.custom?'':transformed.summaryH)+transformed.bodyH);
  assert.equal(normalize(easy.textContent),normalize(original.textContent),`text ${u.id}.${sidx}`);
  assert.deepEqual([...easy.querySelectorAll('.katex')].map(n=>n.outerHTML),[...original.querySelectorAll('.katex')].map(n=>n.outerHTML),`math ${u.id}.${sidx}`);
  assert.deepEqual([...easy.querySelectorAll('a')].map(n=>[n.href,n.textContent]),[...original.querySelectorAll('a')].map(n=>[n.href,n.textContent]),`links ${u.id}.${sidx}`);
  total++;
 }
 assert.equal(total,541);dom.window.close();
});
test('reading modes, next-concept focus and examples work without changing answers or progress',()=>{
 const dom=page(),w=dom.window,d=w.document,ctx=dom.getInternalVMContext();vm.runInContext('openStudy(plans[0].id)',ctx);
 const before=JSON.stringify(w.CadMath.snapshot());assert.equal(d.querySelectorAll('.concept-card[open]').length,1);
 assert.match(d.querySelector('.concept-takeaway').textContent,/셀 때/);
 d.querySelector('[data-concept-mode="original"]').click();assert.equal(d.body.dataset.conceptMode,'original');assert.equal(d.querySelector('[data-concept-mode="original"]').getAttribute('aria-pressed'),'true');assert.equal(w.localStorage.getItem('cad-math-concept-mode-v1'),'original');
 d.querySelector('[data-concept-next="concept-1-1"]').click();assert.equal(d.querySelector('#concept-1-0').open,false);assert.equal(d.querySelector('#concept-1-1').open,true);assert.equal(d.activeElement,d.querySelector('#concept-1-1>summary'));
 d.querySelector('[data-concept-mode="easy"]').click();assert.equal(d.body.dataset.conceptMode,'easy');assert.ok(d.querySelector('.concept-mini-example ol li'));assert.equal(JSON.stringify(w.CadMath.snapshot()),before);
 vm.runInContext("go(1,'learn')",ctx);assert.equal(d.querySelectorAll('.concept-card').length,4);assert.ok(d.querySelector('.concept-visual'));dom.window.close();
});
