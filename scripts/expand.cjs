const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {profiles}=require('../source/extra-profiles.cjs');
const root=path.join(__dirname,'..'),ctx=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'dist/book-data.js'),'utf8'),ctx);const book=vm.runInContext('BOOK',ctx);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),h=s=>'<p>'+esc(s)+'</p>',display=v=>Number.isInteger(v)?String(v):Number(v.toPrecision(8)).toString();
const render=p=>({...p,promptH:h(p.prompt),hintsH:p.hints.map(h),stepsH:p.steps.map(h),answerH:h(p.answer),alternateH:h(p.alternate)});
const extra=book.map(u=>{
 const problems=[2,4,6,8].map(n=>{const v=profiles[u.id](n);return render({level:'application',type:'numeric',prompt:v.prompt,values:v.values,labels:v.values.map((_,i)=>v.values.length===1?'답':`${i+1}번째 값`),hints:['문장에 주어진 조건과 구할 값을 구분해 적어 보세요.',v.steps[0]],steps:v.steps,answer:v.values.map(display).join(', '),alternate:'해설의 각 식에 원래 조건을 다시 대입하고 부호·단위·입력 순서를 확인하세요.'});});
 for(const n of [12,14]){const v=profiles[u.id](n),wrong=display(v.values[0]+1);problems.push(render({level:'challenge',type:'written',prompt:n===12?`${v.prompt}\n한 학생은 첫 번째 답이 ${wrong}이라고 주장했습니다. 이 주장이 틀린 이유를 계산으로 보이고, 올바른 답과 그 풀이 과정을 설명하세요.`:`${v.prompt}\n최종 답만 쓰지 말고, 사용한 정의·성질을 밝히고 각 계산이 성립하는 이유와 검산 과정을 설명하세요.`,hints:['주어진 조건을 식이나 도형 관계로 옮긴 다음, 풀이의 각 단계가 뜻하는 것을 설명하세요.',v.steps[0]],steps:[...v.steps,n===12?`주장된 첫 번째 값 ${wrong}은 올바른 ${display(v.values[0])}과 다릅니다. 위 계산의 조건과 결과를 직접 대조하여 반박합니다.`:'해설의 출발 조건에서 결론까지 이어지는 식을 직접 쓰고 결과를 대조합니다.'],answer:v.values.map(display).join(', ')+' — 수치뿐 아니라 조건과 계산 이유를 함께 설명해야 합니다.',rubric:['주어진 조건과 구할 대상을 구분해 적었다.','해설의 정의·성질을 사용해 올바른 계산을 전개했다.','모든 답을 구하고 해설과 대조하여 부호·단위 또는 조건을 확인했다.'],alternate:'가능하면 그림, 표, 원식 대입 등 다른 표현으로 같은 결과를 확인하세요. 다른 풀이를 사용했다면 해설과 논리적으로 같은 결론인지 확인합니다.'}));}
 const v=profiles[u.id](10),example={prompt:v.prompt,steps:v.steps,answer:v.values.map(display).join(', '),check:'원래 조건과 식에 결과를 대조하고 단위와 부호를 확인하세요.'};for(const k of ['prompt','answer','check'])example[k+'H']=h(example[k]);example.stepsH=example.steps.map(h);
 return{unit:u.id,problems,examples:[example]};
});
fs.writeFileSync(path.join(root,'dist/workbook-data.js'),'const CAD_EXTRA_WORKBOOK='+JSON.stringify(extra)+';for(const extra of CAD_EXTRA_WORKBOOK){BOOK[extra.unit-1].problems.push(...extra.problems);BOOK[extra.unit-1].examples.push(...extra.examples);}\n');
console.log('Expanded workbook: +864 exercises (+576 numeric, +288 written), +144 worked examples.');
