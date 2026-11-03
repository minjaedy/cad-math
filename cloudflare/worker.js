import {firebase} from './firebase.js';
import {buildPushRequest} from './web-push.js';
import {validPatch,koreaDate} from './validation.js';
const json=(value,status=200)=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const digest=async value=>new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
async function authorized(request,env){if(typeof env.LEARNING_KEY!=='string'||env.LEARNING_KEY.length!==43)return false;const actual=request.headers.get('Authorization')||'',expected='Bearer '+env.LEARNING_KEY;if(actual.length!==expected.length)return false;const a=await digest(actual),b=await digest(expected);return a.reduce((n,x,i)=>n|(x^b[i]),0)===0;}
async function body(request){const text=await request.text();if(text.length>1500000)throw Error('Request too large');return JSON.parse(text);}
export async function runReminder(env,now=new Date(),load=firebase,transport=fetch){
 const{day,hour}=koreaDate(now);await env.DB.prepare('DELETE FROM deliveries WHERE created_at < ?').bind(Date.now()-7*86400000).run();
 if(hour!==22)return{sent:0};const state=await load(env);if(state?.daily?.days?.[day])return{sent:0,completed:true};
 const devices=(await env.DB.prepare('SELECT id,subscription FROM devices LIMIT 50').all()).results;let sent=0;
 for(const d of devices){const claim=await env.DB.prepare('INSERT OR IGNORE INTO deliveries(device_id,day,created_at) VALUES(?,?,?)').bind(d.id,day,Date.now()).run();if(!claim.meta.changes)continue;
  try{const push=await buildPushRequest(env,JSON.parse(d.subscription),JSON.stringify({title:'오늘의 30분, 아직 남아 있어요',body:'개념과 문제를 조금씩 이어가요. 하던 곳부터 시작할 수 있어요.',tag:'cad-math-'+day,url:env.APP_URL+'#daily'}),'cad-math-'+day);const r=await transport(push.endpoint,{method:'POST',headers:{...push.headers,TTL:'7200'},body:push.body});
   if(r.status===404||r.status===410)await env.DB.prepare('DELETE FROM devices WHERE id=?').bind(d.id).run();
   await env.DB.prepare('UPDATE deliveries SET status=? WHERE device_id=? AND day=?').bind(r.ok?'sent':'failed-'+r.status,d.id,day).run();if(r.ok)sent++;
  }catch{await env.DB.prepare("UPDATE deliveries SET status='failed' WHERE device_id=? AND day=?").bind(d.id,day).run();}
 }return{sent};
}
export default{
 async fetch(request,env){const origin=request.headers.get('Origin'),url=new URL(request.url);let response;
  if(origin&&origin!==env.APP_ORIGIN)return json({error:'Origin not allowed'},403);
  if(request.method==='OPTIONS')response=new Response(null,{status:204});
  else if(url.pathname==='/health')response=json({ok:true,app:'cad-math',version:'20261103',studyTime:'11:00',reminderTime:'22:00',timeZone:'Asia/Seoul'});
  else if(!await authorized(request,env))response=json({error:'연결된 학습 공간이 필요해요.'},401);
  else try{
   if(url.pathname==='/state'&&request.method==='GET'){const since=url.searchParams.get('since');const revision=since?await firebase(env,'GET',undefined,'revision'):null;response=since&&revision&&String(revision)===since?json({unchanged:true,revision}):json(await firebase(env)||{});}
   else if(url.pathname==='/state'&&request.method==='PATCH'){const patch=await body(request);if(!validPatch(patch))response=json({error:'Invalid learning update'},400);else{await firebase(env,'PATCH',{...patch,revision:{'.sv':'timestamp'}});response=json({ok:true});}}
   else if(url.pathname==='/config'&&request.method==='GET')response=json({publicKey:env.VAPID_PUBLIC_KEY,reminderTime:'22:00'});
   else if(url.pathname==='/subscription'&&request.method==='POST'){const data=await body(request);if(!/^[a-f0-9-]{36}$/.test(data.id||''))throw Error('Invalid device');await buildPushRequest(env,data.subscription,'{}');const count=await env.DB.prepare('SELECT count(*) AS n FROM devices').first();const old=await env.DB.prepare('SELECT id FROM devices WHERE id=?').bind(data.id).first();if(count.n>=50&&!old)return json({error:'기기 연결 한도에 도달했어요.'},409);await env.DB.prepare('INSERT INTO devices(id,subscription,created_at,updated_at) VALUES(?,?,?,?) ON CONFLICT(id) DO UPDATE SET subscription=excluded.subscription,updated_at=excluded.updated_at').bind(data.id,JSON.stringify(data.subscription),Date.now(),Date.now()).run();response=json({ok:true});}
   else if(url.pathname==='/subscription'&&request.method==='DELETE'){const data=await body(request);await env.DB.prepare('DELETE FROM devices WHERE id=?').bind(data.id||'').run();response=json({ok:true});}
   else response=json({error:'Not found'},404);
  }catch(e){console.error('cad-math request failed',url.pathname,e.message?.startsWith('Firebase')?e.message:'request error');response=json({error:'연결을 완료하지 못했어요. 잠시 뒤 다시 시도해 주세요.'},503);}
  const headers=new Headers(response.headers);headers.set('Access-Control-Allow-Origin',env.APP_ORIGIN);headers.set('Access-Control-Allow-Headers','Authorization,Content-Type');headers.set('Access-Control-Allow-Methods','GET,PATCH,POST,DELETE,OPTIONS');headers.set('Vary','Origin');return new Response(response.body,{status:response.status,headers});
 },
 async scheduled(event,env,ctx){ctx.waitUntil(runReminder(env));}
};
