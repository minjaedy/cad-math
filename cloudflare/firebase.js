let cached=null;
const encode=s=>Buffer.from(typeof s==='string'?s:JSON.stringify(s)).toString('base64url');
export async function accessToken(env){
 if(cached&&cached.until>Date.now()+120000)return cached.token;
 const account=JSON.parse(env.FIREBASE_ACCOUNT),now=Math.floor(Date.now()/1000);
 const unsigned=encode({alg:'RS256',typ:'JWT'})+'.'+encode({iss:account.client_email,scope:'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
 const key=await crypto.subtle.importKey('pkcs8',Buffer.from(account.private_key.replace(/-----[^-]+-----|\s/g,''),'base64'),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const jwt=unsigned+'.'+Buffer.from(await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(unsigned))).toString('base64url');
 const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:jwt})});
 const data=await response.json();if(!response.ok)throw Error('Firebase credential exchange failed');cached={token:data.access_token,until:Date.now()+data.expires_in*1000};return cached.token;
}
export async function firebase(env,method='GET',patch,field=''){
 if(field!==''&&field!=='revision')throw Error('Invalid Firebase field');
 const token=await accessToken(env),r=await fetch(env.FIREBASE_URL+'/learning/main'+(field?'/'+field:'')+'.json',{method,headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:patch===undefined?undefined:JSON.stringify(patch)});
 if(!r.ok)throw Error('Firebase '+r.status);return r.json();
}
