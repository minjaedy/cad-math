// Shared concept presentation for daily study and the full textbook.
const conceptKey='cad-math-concept-mode-v1';
let conceptMode='easy';try{if(localStorage.getItem(conceptKey)==='original')conceptMode='original';}catch{}
document.body.dataset.conceptMode=conceptMode;
function conceptToolbar(){return `<div class="concept-toolbar"><span>개념 읽기</span><div role="group" aria-label="개념 설명 방식"><button type="button" data-concept-mode="easy" aria-pressed="${conceptMode==='easy'}">쉽게 읽기</button><button type="button" data-concept-mode="original" aria-pressed="${conceptMode==='original'}">원문 보기</button></div></div>`;}
function conceptPicture(kind){
 const tiles=items=>`<div class="concept-tiles">${items.map(([a,b])=>`<div><strong>${a}</strong><span>${b}</span></div>`).join('')}</div>`;
 const pictures={
  numbers:()=>tiles([['1, 2, 3…','몇 개 있나요? · 자연수'],['0','하나도 없어요 · 영'],['−1, −2…','기준보다 아래예요 · 음수'],['½','하나를 나눈 양이에요 · 분수']]),
  fractions:()=>`<div class="fraction-example"><span>전체를 똑같이 4칸으로 나눠요.</span><div class="fraction-bar" role="img" aria-label="네 칸 중 세 칸을 채운 그림. 사분의 삼."><i></i><i></i><i></i><i class="empty"></i></div><p><strong>3 / 4</strong> = 네 칸 중 세 칸</p><small>분모 4: 전체 칸 수 · 분자 3: 고른 칸 수</small></div>`,
  distance:()=>`<div class="concept-distance" role="img" aria-label="수직선에서 마이너스 4와 플러스 4는 각각 0에서 네 칸 떨어져 있습니다."><div class="distance-labels"><span>−4</span><span>0</span><span>4</span></div><div class="distance-track"><i></i><i></i><i></i></div><div class="distance-labels"><span>← 거리 4 →</span><span>← 거리 4 →</span></div><p>방향은 달라도 <strong>거리는 같아요.</strong></p></div>`,
  distribute:()=>`<div class="concept-equations"><p><b>−2(x − 3)</b><span>괄호 안 두 항에 각각 −2를 곱해요.</span></p><p><b>(−2) × x + (−2) × (−3)</b><span>부호도 함께 곱해요.</span></p><p><b>−2x + 6</b><span>음수 × 음수 = 양수</span></p></div>`,
  equation:()=>`<div class="concept-equations"><p><b>2x + 3 = 11</b><span>양변에서 3을 빼요.</span></p><p><b>2x = 8</b><span>양변을 2로 나눠요.</span></p><p><b>x = 4</b><span>확인: 2 × 4 + 3 = 11</span></p></div>`,
  coordinates:()=>`<svg class="concept-coordinate" viewBox="0 0 300 185" role="img" aria-label="원점에서 오른쪽으로 2, 위로 3 이동하면 좌표 2, 3입니다."><path class="coordinate-grid" d="M50 20V150M90 20V150M130 20V150M170 20V150M210 20V150M250 20V150M50 30H265M50 70H265M50 110H265"/><path class="coordinate-axis" d="M35 150H275M50 165V15"/><path class="coordinate-move" d="M50 150H130V30"/><circle cx="130" cy="30" r="5"/><text x="34" y="178">0</text><text x="84" y="173">1</text><text x="124" y="173">2</text><text x="29" y="36">3</text><text x="142" y="34">(2, 3)</text><text x="168" y="99">가로 2 → 세로 3</text><text x="278" y="155">x</text><text x="35" y="13">y</text></svg>`,
  proportion:()=>tiles([['정비례','x가 2배 → y도 2배 · 비가 일정'],['반비례','x가 2배 → y는 ½배 · 곱이 일정']]),
  scale:()=>tiles([['길이 2배','한 방향: 2'],['넓이 4배','두 방향: 2 × 2'],['부피 8배','세 방향: 2 × 2 × 2']])
 };
 return pictures[kind]?`<details class="concept-visual"><summary>그림으로 먼저 이해하기 <span aria-hidden="true">＋</span></summary><div>${pictures[kind]()}</div></details>`:'';
}
function conceptOverview(u){const data=window.CAD_CONCEPTS?.[u.id-1];return `${conceptToolbar()}<aside class="concept-intro"><span class="concept-eyebrow">먼저 이렇게 생각해요</span><div class="rich">${u.entryH}</div></aside>${conceptPicture(data?.picture)}`;}
function conceptSymbols(u){
 const text=u.sections.map(s=>s.body).join(' '),items=[
  [/[Σ∑]|\\sum/,'Σ · 시그마','아래와 위에 적힌 범위에 따라 항들을 더한다는 뜻이에요.'],
  [/≠|\\ne(?!w)/,'≠','같지 않다는 뜻이에요. b ≠ 0은 b가 0이면 안 된다는 조건이에요.'],
  [/≈|\\approx/,'≈','정확히 같지는 않지만 가까운 값이라는 뜻이에요.'],
  [/≤|\\le(?:q)?\b/,'≤','작거나 같다는 뜻이에요. 경계값도 포함해요.'],
  [/≥|\\ge(?:q)?\b/,'≥','크거나 같다는 뜻이에요. 경계값도 포함해요.'],
  [/∈|\\in\b/,'∈','어떤 집합에 속한다는 뜻이에요. x ∈ A는 x가 A의 원소라는 말이에요.'],
  [/lim|극한/,'lim · 극한','입력이 어떤 값에 가까워질 때 출력이 어디로 향하는지 읽는 기호예요.'],
  [/∂|\\partial/,'∂ · 편미분','여러 변수 중 한 변수만 바꿔 가며 변화율을 구할 때 쓰는 기호예요.'],
  [/∫|\\int/,'∫ · 적분','범위 안의 작은 기여를 연속적으로 모아 더하는 계산을 나타내요. 정확한 대상과 범위는 식의 조건을 함께 읽어요.']
 ].filter(([re])=>re.test(text));
 return items.length?`<details class="concept-symbols"><summary>낯선 기호 풀어 읽기 <span>${items.length}개</span></summary><dl>${items.map(([,symbol,meaning])=>`<div><dt>${esc(symbol)}</dt><dd>${esc(meaning)}</dd></div>`).join('')}</dl></details>`:'';
}
function conceptSection(u,i,{open=true,tag=''}={}){
 const s=u.sections[i],data=window.CAD_CONCEPTS?.[u.id-1]?.sections[i],next=u.sections[i+1],id=`concept-${u.id}-${i}`;
 return `<details class="concept-card" id="${id}" ${open?'open':''}><summary><span class="concept-number">${String(i+1).padStart(2,'0')}</span><span class="concept-heading"><span>${esc(s.title)}</span>${tag?`<small>${esc(tag)}</small>`:''}</span><span class="concept-chevron" aria-hidden="true"></span></summary><div class="concept-content"><div class="concept-easy">${data?.summaryH?`<div class="concept-takeaway"><span class="concept-eyebrow">핵심 요약</span><div class="rich">${data.summaryH}</div></div>`:''}<div class="concept-explanation rich">${data?.bodyH??s.bodyH}</div></div><div class="concept-original rich">${s.bodyH}</div>${next?`<button type="button" class="concept-next" data-concept-next="concept-${u.id}-${i+1}"><span>다음 개념</span><strong>${esc(next.title)}</strong><span aria-hidden="true">→</span></button>`:''}</div></details>`;
}
function conceptExample(u,index=0){const e=u.examples[index]||u.examples[0];return `<details class="concept-mini-example"><summary><span>짧은 예제로 연결하기</span><span aria-hidden="true">＋</span></summary><div class="concept-example-content"><div class="rich">${e.promptH}</div><ol>${e.stepsH.map(s=>`<li><div class="rich">${s}</div></li>`).join('')}</ol><div class="concept-example-answer rich"><span class="concept-eyebrow">그래서 답은</span>${e.answerH}</div></div></details>`;}
function conceptQuickCheck(u){const q=window.CAD_CONCEPTS?.[u.id-1]?.check;return q?`<aside class="concept-quick-check"><span class="concept-eyebrow">잠깐, 머릿속으로 확인해요</span><p>${esc(q[0])}</p><details><summary>설명 확인하기</summary><p>${esc(q[1])}</p></details></aside>`:'';}
function learn(u){return `${conceptOverview(u)}<div class="prereqs">먼저 확인할 내용 ${u.prerequisites.length?u.prerequisites.map(n=>`<button data-unit="${n}">${String(n).padStart(3,'0')} ${esc(BOOK[n-1]?.title||'')}</button>`).join(''):'기본적인 숫자 읽기부터 함께 시작합니다.'}</div>${conceptSymbols(u)}<article class="concept-list" aria-label="단원 개념">${u.sections.map((s,i)=>conceptSection(u,i,{open:i===0})).join('')}</article>${conceptQuickCheck(u)}${conceptExample(u)}${LABS[u.id]?labHTML(LABS[u.id]):''}<aside class="connection"><span class="small-label">CAD와 연결하면</span><div class="rich">${u.connectionH}</div></aside><section class="checkpoint"><h2>이제 설명할 수 있나요?</h2><ul>${u.checkpoint.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p>헷갈리는 부분은 위의 개념과 예제를 다시 살펴보세요.</p></section><div class="section-end"><button class="primary" data-tab="examples">한 단계씩 예제 풀기 →</button></div>`;}
document.addEventListener('click',e=>{
 const mode=e.target.closest('[data-concept-mode]');if(mode){conceptMode=mode.dataset.conceptMode;document.body.dataset.conceptMode=conceptMode;try{localStorage.setItem(conceptKey,conceptMode);}catch{}document.querySelectorAll('[data-concept-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.conceptMode===conceptMode)));}
 const next=e.target.closest('[data-concept-next]');if(next){const target=document.getElementById(next.dataset.conceptNext);if(target){next.closest('.concept-card').open=false;target.open=true;target.querySelector('summary').focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}}
});
