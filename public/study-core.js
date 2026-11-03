(function(root){
 const day=(date=new Date())=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
 const done=(plan,state)=>!!state.daily?.checks?.[plan.id+'-concept']&&!!state.daily?.checks?.[plan.id+'-example']&&plan.problems.every(i=>['correct','reviewed'].includes(state.results?.[`${plan.unit}-${i}`]));
 function next(plans,state){return plans.find(p=>!state.daily?.completed?.[p.id])||null;}
 function streak(days,today=day()){
  let cursor=new Date(today+'T00:00:00Z'),count=0;
  if(!days?.[today])cursor.setUTCDate(cursor.getUTCDate()-1);
  while(days?.[cursor.toISOString().slice(0,10)]){count++;cursor.setUTCDate(cursor.getUTCDate()-1);}
  return count;
 }
 const clone=x=>JSON.parse(JSON.stringify(x));
 function snapshot(s){return{records:clone({results:s.results,drafts:s.drafts,notes:s.notes}),daily:clone(s.daily||{checks:{},completed:{},days:{}}),position:{unit:s.unit,tab:s.tab,view:s.view,session:s.session||''}};}
 function flat(s){const o={};for(const k of ['results','drafts','notes'])for(const[key,v]of Object.entries(s.records?.[k]||{}))o[`records/${k}/${key}`]=v;for(const k of ['checks','completed','days'])for(const[key,v]of Object.entries(s.daily?.[k]||{}))o[`daily/${k}/${key}`]=v;if(s.position)o.position=s.position;return o;}
 function diff(a,b){const old=flat(a),now=flat(b),out={};for(const[k,v]of Object.entries(now))if(JSON.stringify(v)!==JSON.stringify(old[k]))out[k]=v;return out;}
 function apply(s,patch){const out=clone(s||{});for(const[path,value]of Object.entries(patch)){const keys=path.split('/');let target=out;keys.slice(0,-1).forEach(k=>target=target[k]??={});target[keys.at(-1)]=clone(value);}return out;}
 const api={day,done,next,streak,clone,snapshot,flat,diff,apply};
 if(typeof module!=='undefined')module.exports=api;else root.CadStudy=api;
})(typeof window==='undefined'?globalThis:window);
