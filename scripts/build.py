from pathlib import Path
import re,json,hashlib,shutil,base64,subprocess

ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
# Delete only this generated directory after checking its exact resolved path.
assert DIST.resolve()==ROOT.resolve()/'dist' and not DIST.is_symlink()
if DIST.exists():shutil.rmtree(DIST)
DIST.mkdir()
original=(ROOT/'source/textbook.html').read_text(encoding='utf-8-sig')
js=re.search(r'<script[^>]*>([\s\S]*?)</script>',original)[1]
data,logic=js.split('\n',1)
css=re.search(r'<style[^>]*>([\s\S]*?)</style>',original)[1]
fonts=DIST/'fonts';fonts.mkdir(exist_ok=True)
def extract_font(m):
    raw=base64.b64decode(m[1]);name=hashlib.sha256(raw).hexdigest()[:16]+'.woff2'
    (fonts/name).write_bytes(raw)
    return 'url(./fonts/'+name+')'
css=re.sub(r'url\(data:font/woff2;base64,([^)]*)\)',extract_font,css)
html=re.sub(r'<style[^>]*>[\s\S]*?</style>','<link rel="stylesheet" href="./textbook.css"><link rel="stylesheet" href="./app.css"><link rel="stylesheet" href="./study.css">',original,count=1)
html=re.sub(r'<script[^>]*>[\s\S]*?</script>','<script src="./study-core.js" defer></script><script src="./book-data.js" defer></script><script src="./workbook-data.js" defer></script><script src="./study-plan.js" defer></script><script src="./textbook.js" defer></script><script src="./app.js" defer></script><script src="./service-config.js" defer></script><script src="./cloud-sync.js" defer></script>',html,count=1)
html=html.replace('width=device-width,initial-scale=1','width=device-width,initial-scale=1,viewport-fit=cover')
head='''<meta name="app-version" content="VERSION"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="CAD 수학"><meta name="apple-mobile-web-app-status-bar-style" content="default"><link rel="manifest" href="./manifest.webmanifest"><link rel="icon" type="image/png" sizes="32x32" href="./icons/icon-32.png"><link rel="icon" type="image/png" sizes="192x192" href="./icons/icon-192.png"><link rel="apple-touch-icon" sizes="180x180" href="./icons/apple-touch-icon.png"><script src="./theme.js"></script>'''
html=html.replace('</head>',head+'</head>')
html=html.replace('<title>처음부터 이해하는 CAD 수학 · 144단원 전자교재</title>','<title>처음부터, CAD 수학</title>')
html=html.replace('href="./index.html" download="수학에서-CAD까지-144단원.html"','href="./textbook-offline.html" download="수학에서-CAD까지-144단원.html"')
html=html.replace('<div class="topbar-actions">','<div class="topbar-actions"><button id="install-button" class="app-install">앱 설치</button><button id="theme-button" aria-label="화면 테마 변경">◐</button>')
html=html.replace('기기 간 자동 동기화는 없습니다.','공유 학습 링크로 연결한 기기에서는 진도·답안·노트가 서버에 저장되어 이어집니다. 연결이 끊기면 기기에 먼저 저장하고, 인터넷에 다시 연결되면 동기화합니다. 학습 기록은 파일로도 보관할 수 있습니다.')
html=html.replace('답안·정답 확인·서술형 자기점검·노트·마지막 단원은 현재 브라우저에 저장됩니다.','답안·정답 확인·서술형 자기점검·노트·마지막 단원은 이 기기에 자동 저장됩니다.')
html=html.replace('↓ 오프라인 HTML 책 저장','↓ 원본 교재 HTML 저장')
html=html.replace('</body>',(ROOT/'public/app-ui.html').read_text(encoding='utf-8')+'</body>')
logic=logic.replace("let state={unit:1,tab:'learn',view:'unit',results:{},drafts:{},notes:{},font:18},saveOK=true;", "let state={unit:1,tab:'learn',view:'home',results:{},drafts:{},notes:{},font:18},saveOK=true;")

old="function save(){try{localStorage.setItem(KEY,JSON.stringify(state));}catch{saveOK=false;}$('#save-status').textContent=saveOK?'이 브라우저에 자동 저장':'현재 브라우저에서는 저장할 수 없어요';}"
new="function save(){try{localStorage.setItem(KEY,JSON.stringify(state));saveOK=true;}catch{saveOK=false;}$('#save-status').textContent=saveOK?'이 기기에 자동 저장':'기기에 저장하지 못했어요. 학습 기록을 파일로 보관해 주세요.';}"
assert old in logic
logic=logic.replace(old,new)
logic=logic.replace('slice(0,100000)','slice(0,20000)')
logic=logic.replace('data-note="${n}" rows="5"','data-note="${n}" rows="5" maxlength="20000"')
logic=logic.replace('rows="4" aria-label=','rows="4" maxlength="20000" aria-label=')
logic=logic.replace('name="answer-${i}" aria-label=','name="answer-${i}" maxlength="160" aria-label=')
logic=logic.replace('현재 브라우저에 저장됩니다. 중요한 기록은 왼쪽 아래에서 파일로 저장하세요.','이 기기에 먼저 저장하고, 학습 공간에 연결하면 서버에도 저장해요. 다른 기기에서는 같은 학습 링크를 열어 주세요.')


logic=logic.replace("['unit','home','prep','mistakes']", "['unit','home','prep','mistakes','daily','bank']")
logic=logic.replace("if(state.view==='home')html=home();", "if(state.view==='home')html=dailyHome();else if(state.view==='daily')html=dailyLesson();else if(state.view==='bank')html=workbookHome();")
logic=logic.replace('function home(){','function courseCatalogue(){')
logic=logic.replace('restore();save();}', 'restore();save();dailyAfterRender();}')
logic=logic.replace('nav();const count=', 'dailyCheckProgress();nav();const count=')
logic=logic.replace("for(const k of ['drafts','notes','results'])state[k]={...state[k],...clean[k]};render();", "for(const k of ['drafts','notes','results'])state[k]={...state[k],...clean[k]};if(data.daily){const d=cleanDaily(data.daily);for(const k of ['checks','completed','days'])state.daily[k]={...state.daily[k],...d[k]};}render();")
logic=logic.replace("function go(n,tab='learn'){if(n<1||n>144)return;", "function go(n,tab='learn'){if(n<1||n>144)return;if(!unitUnlocked(n)){studyNotice('현재 단원의 모든 문제를 완료하면 다음 단원이 열려요.');return;}")
logic=logic.replace("/8'", "/'+BOOK[state.unit-1].problems.length").replace("+'/8'", "+'/'+BOOK[state.unit-1].problems.length")
logic=logic.replace("unitCount(u.id)+'/8'", "unitCount(u.id)+'/'+u.problems.length")
logic=logic.replace('${unitCount(u.id)}/8', '${unitCount(u.id)}/${u.problems.length}')
logic=logic.replace('풀이 예제 4개', '풀이 예제 ${u.examples.length}개').replace('기본·응용·심화 8문제','기본·응용·심화 ${u.problems.length}문제')
logic=logic.replace('네 가지 상황을 함께 풀어봅니다.', '풀이 과정을 따라가며 이해해요.')
logic=logic.replace('기본 3문제로 계산을 익히고, 응용 3문제로 조건을 해석합니다. 마지막 심화 2문제는 여러 관점을 연결하거나 이유를 설명하는 문제입니다.', '기본·응용·심화 문제로 단계적으로 연습해요. 숫자 답은 자동 채점하고, 서술형은 풀이와 기준표를 비교해 자기점검합니다.')
logic=logic.replace("function save(){", "function save(){window.CadMath?.changed();")
end=logic.rfind('render();')
logic=logic[:end]+(ROOT/'public/study-adapter.js').read_text(encoding='utf-8')+'\n'+logic[end:]
html=html.replace('<div class="topbar-actions">', '<div class="topbar-actions"><button id="study-home-button" aria-label="오늘의 학습">오늘</button><button id="focus-button" aria-pressed="false">집중</button>')
html=html.replace('<button id="install-button"', '<button id="install-button"')

for name,value in [('index.html',html),('textbook.css',css),('book-data.js',data),('textbook.js',logic),('textbook-offline.html',original)]:
    (DIST/name).write_text(value,encoding='utf-8')
for p in (ROOT/'public').rglob('*'):
    if p.is_file() and p.name not in ['app-ui.html','sw-template.js','study-adapter.js']:
        target=DIST/p.relative_to(ROOT/'public');target.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(p,target)


subprocess.run(['node',str(ROOT/'scripts/expand.cjs')],check=True)
subprocess.run(['node',str(ROOT/'scripts/plan.cjs')],check=True)

digest=hashlib.sha256((ROOT/'public/sw-template.js').read_bytes())
for p in sorted(DIST.rglob('*')):
    if p.is_file() and p.name not in ['app-sw.js','version.json']:digest.update(p.relative_to(DIST).as_posix().encode()+p.read_bytes())
version='20261103-'+digest.hexdigest()[:12]
(DIST/'index.html').write_text(html.replace('VERSION',version),encoding='utf-8')
(DIST/'version.json').write_text(json.dumps({'version':version}),encoding='utf-8')
assets=['./'+p.relative_to(DIST).as_posix() for p in sorted(DIST.rglob('*')) if p.is_file() and p.name not in ['app-sw.js','textbook-offline.html']]
sw=(ROOT/'public/sw-template.js').read_text(encoding='utf-8').replace('__VERSION__',version).replace('__ASSETS__',json.dumps(assets))
(DIST/'app-sw.js').write_text(sw,encoding='utf-8')
(DIST/'.nojekyll').touch()
print('Built',version,'-',len(assets),'offline assets; original textbook preserved.')
