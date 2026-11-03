const unit='(?:[1-9]|[1-9][0-9]|1[0-3][0-9]|14[0-4])';
const question=new RegExp('^records/(results|drafts)/('+unit+'-[0-9]{1,2})$'),note=new RegExp('^records/notes/'+unit+'$'),session=new RegExp('^u'+unit+'d[1-9][0-9]?$');
export function validPatch(patch){
 if(!patch||typeof patch!=='object'||Array.isArray(patch)||Object.keys(patch).length>5000)return false;
 return Object.entries(patch).every(([key,v])=>{
  const q=key.match(question);if(q)return q[1]==='results'?['correct','wrong','reviewed'].includes(v):Array.isArray(v)&&v.length<=8&&v.every(x=>typeof x==='string'&&x.length<=20000);
  if(note.test(key))return typeof v==='string'&&v.length<=20000;
  if(key==='position')return v&&Number.isInteger(v.unit)&&v.unit>=1&&v.unit<=144&&['learn','examples','practice','review'].includes(v.tab)&&['home','daily','unit','prep','mistakes','bank'].includes(v.view)&&(v.session===''||session.test(v.session));
  if(key.startsWith('daily/checks/'))return new RegExp('^u'+unit+'d[1-9][0-9]?-(concept|example)$').test(key.slice(13))&&typeof v==='boolean';
  if(key.startsWith('daily/completed/'))return session.test(key.slice(16))&&typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v);
  if(/^daily\/days\/\d{4}-\d{2}-\d{2}$/.test(key))return v===true;
  return false;
 });
}
export function koreaDate(now=new Date()){const d=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',hourCycle:'h23'}).format(now);return{day:d.slice(0,10),hour:Number(d.slice(11,13))};}
