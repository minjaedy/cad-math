const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{JSDOM}=require('jsdom');
const guides=require('../source/concept-guides.cjs'),root=path.join(__dirname,'..'),context=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'dist/book-data.js'),'utf8'),context);
const book=vm.runInContext('BOOK',context),dom=new JSDOM(),doc=dom.window.document;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

// Only prose text creates sentence boundaries. Math, links and code are indivisible.
function sentences(paragraph){
 let flow='',positions=[];
 function walk(node){
  if(node.nodeType===3){positions.push({start:flow.length,end:flow.length+node.data.length,node});flow+=node.data;return;}
  if(node.nodeType!==1)return;
  if(node.matches('.katex,.katex-display,math,a,code,svg')){positions.push({start:flow.length,end:flow.length+1,node,atom:true});flow+='\uFFFC';return;}
  for(const child of node.childNodes)walk(child);
 }
 for(const child of paragraph.childNodes)walk(child);
 if(!flow.trim())return [paragraph.innerHTML];
 const boundaries=[0];
 // Require a space after punctuation: decimals, URLs, f(x) and matrix entries stay whole.
 for(const match of flow.matchAll(/[.!?。！？][”’」]?\s+/g))boundaries.push(match.index+match[0].length);
 if(boundaries.at(-1)!==flow.length)boundaries.push(flow.length);
 function point(offset,end){
  const p=positions.find(p=>offset>=p.start&&offset<p.end)||positions.at(-1);
  if(!p.atom)return[p.node,Math.min(offset-p.start,p.node.data.length)];
  const index=Array.prototype.indexOf.call(p.node.parentNode.childNodes,p.node);
  return[p.node.parentNode,index+(offset>=p.end?1:0)];
 }
 return boundaries.slice(1).map((end,i)=>{const range=doc.createRange();range.setStart(...point(boundaries[i]));range.setEnd(...point(end,true));const holder=doc.createElement('div');holder.append(range.cloneContents());return holder.innerHTML;}).filter(s=>s.trim());
}
function format(html,custom){
 const holder=doc.createElement('div');holder.innerHTML=html;let lead='',blocks=[];
 for(const node of holder.childNodes){
  if(node.nodeType===3){if(node.data.trim())blocks.push(esc(node.data));continue;}
  if(node.nodeType!==1)continue;
  if(node.tagName!=='P'){blocks.push(node.outerHTML);continue;}
  let parts=sentences(node);
  if(!lead&&!custom&&!blocks.length&&parts.length){lead='<p>'+parts.shift()+'</p>';}
  for(let i=0;i<parts.length;i+=2){const content=parts.slice(i,i+2).join(''),probe=doc.createElement('div');probe.innerHTML=content;const caution=/하지 마세요|안 됩니다|주의|혼동|착각|오류|0으로 나누|나눌 수 없/.test(probe.textContent);blocks.push('<p'+(caution?' class="concept-caution"':'')+'>'+content+'</p>');}
 }
 return{summaryH:custom?'<p>'+esc(custom)+'</p>':lead,bodyH:blocks.join('\n'),custom:!!custom};
}
const units=book.map(u=>{const g=guides[u.id];return{unit:u.id,sections:u.sections.map((s,i)=>format(s.bodyH,g?.summaries[i])),picture:g?.picture||'',check:g?.check||null};});
fs.writeFileSync(path.join(root,'dist/concept-data.js'),'window.CAD_CONCEPTS='+JSON.stringify(units)+';\n');
console.log(`Concept reader: ${units.length} units, ${units.reduce((n,u)=>n+u.sections.length,0)} sections; math and original text retained.`);
dom.window.close();
