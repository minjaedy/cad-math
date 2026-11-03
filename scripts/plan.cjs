const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.join(__dirname,'..'),ctx=vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(root,'dist/book-data.js'),'utf8'),ctx);
vm.runInContext(fs.readFileSync(path.join(root,'dist/workbook-data.js'),'utf8'),ctx);
const book=vm.runInContext('BOOK',ctx),sessions=[];
const split=(length,n,i)=>Array.from({length},(_,k)=>k).filter(k=>Math.min(n-1,Math.floor(k*n/length))===i);
for(const u of book){
 const reading=u.sections.reduce((n,s)=>n+s.body.length/240+1.1,0);
 const examples=u.examples.reduce((n,e)=>n+e.steps.length*.6+1,0);
 const solving=u.problems.reduce((n,p)=>n+({basic:2.5,application:4,challenge:6}[p.level])*(1+(u.volume-1)*.025)+(p.type==='written'?2:0),0);
 const count=Math.max(2,Math.ceil((reading+examples+solving)/30));
 for(let i=0;i<count;i++){
  const problems=split(u.problems.length,count,i);
  // Meet every concept before attempting the unit's first questions; later days revisit it.
  const sections=i===0?Array.from({length:u.sections.length},(_,k)=>k):split(u.sections.length,count,i);if(!sections.length)sections.push(u.sections.length-1);
  const exampleIndices=split(u.examples.length,count,i);if(!exampleIndices.length)exampleIndices.push(i%u.examples.length);
  sessions.push({id:`u${u.id}d${i+1}`,unit:u.id,part:i+1,parts:count,sections,examples:exampleIndices,problems,minutes:30});
 }
}
fs.writeFileSync(path.join(root,'dist/study-plan.js'),'window.CAD_STUDY_PLAN='+JSON.stringify(sessions)+';\n');
console.log(`Study plan: ${sessions.length} sessions, ~30 minutes each; all original and added examples and questions included.`);
