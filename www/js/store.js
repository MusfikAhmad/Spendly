'use strict';
/* ===== helpers ===== */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const esc=t=>String(t==null?'':t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const pad=n=>String(n).padStart(2,'0');
const dstr=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseD=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const isDate=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!isNaN(parseD(s));
const todayStr=()=>dstr(new Date());
const clone=o=>JSON.parse(JSON.stringify(o));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const reduceMotion=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ===== constants ===== */
const KEY='spendly2',OLD_KEY='spendly1',DEV_KEY='spendly2_dev',PREV_KEY='spendly2_prev';
const CURRENCIES=['BDT','USD','EUR','GBP','INR','PKR','AED','SAR','JPY','CAD','AUD','SGD','MYR','CNY','TRY','QAR','KWD'];
const WALLET_EMOJI=['💵','🏦','📱','💳','👛','🪙'];
const defCats=()=>[['Food','🍔','#f97316'],['Transport','🚌','#3b82f6'],['Bills','💡','#eab308'],['Shopping','🛍️','#ec4899'],['Health','💊','#10b981'],['Fun','🎬','#8b5cf6'],['Education','📚','#06b6d4'],['Other','📦','#94a3b8']].map((c,i)=>({id:'c'+i,name:c[0],emoji:c[1],color:c[2],limit:0,u:0}));
const freshState=()=>({v:2,name:'',cur:'BDT',budget:0,su:0,cats:defCats(),accs:[{id:'a0',name:'Cash',emoji:'💵',cur:'BDT',open:0,u:0}],rates:{},tx:[],rec:[],goals:[],debts:[],del:{}});

/* ===== validate / migrate ===== */
function normalize(o,stats){
  stats=stats||{};stats.dropped=0;
  const s=freshState();
  s.name=String(o.name||'').slice(0,40);
  s.cur=/^[A-Z]{3}$/.test(o.cur||'')?o.cur:'BDT';
  s.budget=Math.max(0,+o.budget||0);s.su=+o.su||0;
  if(Array.isArray(o.cats)&&o.cats.length)s.cats=o.cats.map((c,i)=>({id:String(c.id||'c'+i),name:String(c.name||'Category').slice(0,30),emoji:String(c.emoji||'⭐').slice(0,4),color:/^#[0-9a-f]{6}$/i.test(c.color)?c.color:'#94a3b8',limit:Math.max(0,+c.limit||0),u:+c.u||0}));
  if(Array.isArray(o.accs)&&o.accs.length)s.accs=o.accs.map((a,i)=>({id:String(a.id||'a'+i),name:String(a.name||'Wallet').slice(0,30),emoji:String(a.emoji||'💵').slice(0,4),cur:/^[A-Z]{3}$/.test(a.cur||'')?a.cur:s.cur,open:+a.open||0,u:+a.u||0}));
  else s.accs[0].cur=s.cur;
  s.rates={};if(o.rates&&typeof o.rates==='object')for(const k in o.rates)if(+o.rates[k]>0)s.rates[k]=+o.rates[k];
  const accIds=new Set(s.accs.map(a=>a.id)),a0=s.accs[0].id,seen=new Set();
  for(const t of Array.isArray(o.tx)?o.tx:[]){
    let id=String(t&&t.id);if(/^\d+$/.test(id))id='t'+id;
    const ok=t&&'eit'.includes(t.type)&&Number.isFinite(+t.amt)&&+t.amt>0&&isDate(t.date)&&!seen.has(id);
    if(!ok){stats.dropped++;continue}
    seen.add(id);
    const x={id,type:t.type,amt:+t.amt,cat:t.type==='e'?String(t.cat||''):'',acc:accIds.has(t.acc)?t.acc:a0,date:t.date,note:String(t.note||'').slice(0,200),u:+t.u||0};
    if(t.type==='t'){if(!accIds.has(t.to)||t.to===x.acc){stats.dropped++;continue}x.to=t.to;x.amt2=+t.amt2>0?+t.amt2:x.amt}
    if(t.rid)x.rid=String(t.rid);if(t.smp)x.smp=1;if(t.pic)x.pic=1;
    s.tx.push(x);
  }
  for(const r of Array.isArray(o.rec)?o.rec:[]){
    if(!r||!'ei'.includes(r.type)||!(+r.amt>0)||!isDate(r.start)||!['daily','weekly','monthly','yearly'].includes(r.freq))continue;
    s.rec.push({id:String(r.id||uid('r')),type:r.type,amt:+r.amt,cat:String(r.cat||''),acc:accIds.has(r.acc)?r.acc:a0,note:String(r.note||'').slice(0,200),freq:r.freq,start:r.start,end:isDate(r.end)?r.end:'',n:Math.max(0,+r.n||0),on:r.on!==false,u:+r.u||0});
  }
  const hist=h=>(Array.isArray(h)?h:[]).filter(x=>x&&isDate(x.d)&&Number.isFinite(+x.amt)&&+x.amt!==0).map(x=>({d:x.d,amt:+x.amt}));
  for(const g of Array.isArray(o.goals)?o.goals:[]){if(!g||!(+g.target>0))continue;
    s.goals.push({id:String(g.id||uid('g')),name:String(g.name||'Goal').slice(0,40),emoji:String(g.emoji||'🎯').slice(0,4),target:+g.target,due:isDate(g.due)?g.due:'',hist:hist(g.hist),u:+g.u||0})}
  for(const b of Array.isArray(o.debts)?o.debts:[]){if(!b||!(+b.amt>0)||!['lent','borrowed'].includes(b.dir))continue;
    s.debts.push({id:String(b.id||uid('b')),who:String(b.who||'Someone').slice(0,40),dir:b.dir,amt:+b.amt,date:isDate(b.date)?b.date:todayStr(),due:isDate(b.due)?b.due:'',note:String(b.note||'').slice(0,120),pay:hist(b.pay).filter(x=>x.amt>0),u:+b.u||0})}
  s.del={};if(o.del&&typeof o.del==='object')for(const k in o.del)if(+o.del[k]>0)s.del[k]=+o.del[k];
  return s;
}
function migrate(o,stats){
  if(!o||typeof o!=='object')return null;
  if(o.v===2)return normalize(o,stats);
  // v1 -> v2: transactions get a default wallet, ids get a prefix
  return normalize({name:o.name,cur:o.cur,budget:o.budget,cats:o.cats,tx:(o.tx||[]).map(t=>({...t,acc:'a0'}))},stats);
}
function parseBackup(text,stats){
  let o;try{o=JSON.parse(text)}catch(e){throw new Error('That file is not valid JSON.')}
  if(o&&o.app==='spendly'&&o.data)o=o.data;
  if(!o||!Array.isArray(o.tx))throw new Error('That file does not look like a Spendly backup.');
  return migrate(o,stats);
}

/* ===== state: S = your data (synced), D = this device only ===== */
let S,D,lsOK=true;
function loadAll(){
  let had=false;
  try{
    const raw=localStorage.getItem(KEY);
    if(raw){S=migrate(JSON.parse(raw));had=true}
    else{const old=localStorage.getItem(OLD_KEY);if(old){const o=JSON.parse(old);S=migrate(o);had=true;try{D0=o.theme}catch(e){}}}
  }catch(e){S=null}
  S=S||freshState();
  try{D=JSON.parse(localStorage.getItem(DEV_KEY))||{}}catch(e){D={}}
  D={theme:'auto',lang:'en',lock:{on:false,h:'',s:'',bio:false,tries:0,until:0},rem:{bills:false,daily:false},assist:{auto:false},user:null,auto:true,last:0,err:'',lastAcc:'',lastCat:'',dev:uid('d'),...D};
  D.lock={on:false,h:'',s:'',bio:false,tries:0,until:0,...D.lock};D.rem={bills:false,daily:false,...D.rem};D.assist={auto:false,...D.assist};
  if(typeof D0!=='undefined'&&D0&&!localStorage.getItem(DEV_KEY))D.theme=D0;
  return had;
}
let D0;
function saveDev(){try{localStorage.setItem(DEV_KEY,JSON.stringify(D))}catch(e){}}
function persist(sync=true){
  try{localStorage.setItem(KEY,JSON.stringify(S));lsOK=true}
  catch(e){if(lsOK&&typeof toast==='function')toast('Could not save on this device. Export a backup now.',{kind:'err'});lsOK=false}
  mirrorSoon();
  if(typeof remindersSoon==='function')remindersSoon();
  if(sync&&typeof syncSoon==='function')syncSoon();
}
/* second copy in the app's private files folder (native only) in case WebView storage is cleared */
const FS=()=>window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.Filesystem;
let mirrorT;
function mirrorSoon(){clearTimeout(mirrorT);mirrorT=setTimeout(async()=>{const fs=FS();if(!fs)return;try{await fs.writeFile({path:'spendly-data.json',data:JSON.stringify({app:'spendly',v:2,saved:Date.now(),data:S}),directory:'DATA',encoding:'utf8'})}catch(e){}},700)}
async function recoverFromFile(){
  const fs=FS();if(!fs)return false;
  try{const r=await fs.readFile({path:'spendly-data.json',directory:'DATA',encoding:'utf8'});const s=parseBackup(typeof r.data==='string'?r.data:'');if(s.tx.length||s.rec.length){S=s;persist(false);return true}}catch(e){}
  return false;
}
/* one-slot safety copy before anything that replaces your data, so it can be undone */
function snapshot(){try{localStorage.setItem(PREV_KEY,JSON.stringify(S))}catch(e){}}
function restoreSnapshot(){try{const raw=localStorage.getItem(PREV_KEY);if(!raw)return false;S=migrate(JSON.parse(raw));persist();return true}catch(e){return false}}

/* ===== lookups & money ===== */
const acc=id=>S.accs.find(a=>a.id===id)||S.accs[0];
const OTHER={id:'',name:'Other',emoji:'📦',color:'#94a3b8',limit:0};
const cat=id=>S.cats.find(c=>c.id===id)||OTHER;
const rate=c=>c===S.cur?1:(S.rates[c]>0?S.rates[c]:1);
const needsRate=a=>a.cur!==S.cur&&!(S.rates[a.cur]>0);
const base=t=>t.amt*rate(acc(t.acc).cur);
const loc=()=>(typeof D==='object'&&D&&D.lang==='bn')?'bn-BD':undefined;
const parseNum=v=>{const x=String(v==null?'':v).replace(/[০-৯]/g,c=>'০১২৩৪৫৬৭৮৯'.indexOf(c)).replace(/[,\s]/g,'');const n=parseFloat(x);return isNaN(n)?NaN:n};
const fmt=(n,cur)=>{cur=cur||S.cur;const a=Math.abs(n),d=cur==='JPY'||a>=1000||Math.abs(n-Math.round(n))<.005?0:2;
  try{return new Intl.NumberFormat(loc(),{style:'currency',currency:cur,maximumFractionDigits:d,minimumFractionDigits:d}).format(n)}catch(e){return cur+' '+n.toFixed(d)}};
const mname=m=>new Date(m+'-15').toLocaleDateString(loc(),{month:'long',year:'numeric'});
const mshort=m=>new Date(m+'-15').toLocaleDateString(loc(),{month:'short'});
const shiftM=(m,d)=>{const t=new Date(m+'-15');t.setMonth(t.getMonth()+d);return dstr(t).slice(0,7)};
const round2=n=>Math.round(n*100)/100;

function monthStats(m){let sp=0,inc=0;const bc={};
  for(const t of S.tx){if(t.type==='t'||!t.date.startsWith(m))continue;const v=base(t);if(t.type==='e'){sp+=v;bc[t.cat]=(bc[t.cat]||0)+v}else inc+=v}
  return {sp,inc,bc}}
function monthMap(){const mm={};
  for(const t of S.tx){if(t.type==='t')continue;const m=t.date.slice(0,7),o=mm[m]||(mm[m]={sp:0,inc:0,n:0});o.n++;if(t.type==='e')o.sp+=base(t);else o.inc+=base(t)}
  return mm}
function balance(a){let b=a.open||0;
  for(const t of S.tx){if(t.type==='e'&&t.acc===a.id)b-=t.amt;else if(t.type==='i'&&t.acc===a.id)b+=t.amt;else if(t.type==='t'){if(t.acc===a.id)b-=t.amt;if(t.to===a.id)b+=(t.amt2||t.amt)}}
  return b}
const isEmptyData=s=>!s.tx.length&&!s.rec.length&&!(s.goals||[]).length&&!(s.debts||[]).length;

/* ===== edits with tombstones (so deletes survive a sync) ===== */
function tomb(id){S.del[id]=Date.now()}
function removeTx(id){const i=S.tx.findIndex(t=>t.id===id);if(i<0)return null;const [t]=S.tx.splice(i,1);tomb(id);return t}
function restoreTx(t){delete S.del[t.id];t.u=Date.now();S.tx.push(t)}
function moveCategory(from,to){const now=Date.now();for(const t of S.tx)if(t.cat===from){t.cat=to;t.u=now}for(const r of S.rec)if(r.cat===from){r.cat=to;r.u=now}}
function moveWallet(from,to){const now=Date.now();
  for(const t of S.tx){let ch=false;if(t.acc===from){t.acc=to;ch=true}if(t.to===from){t.to=to;ch=true}if(ch){t.u=now}}
  for(const r of S.rec)if(r.acc===from){r.acc=to;r.u=now}
  // a transfer that now starts and ends in the same wallet is meaningless: drop it
  for(const t of S.tx.slice())if(t.type==='t'&&t.acc===t.to)removeTx(t.id)}

/* ===== repeating transactions ===== */
function occ(r,k){const [y,m,d]=r.start.split('-').map(Number);
  if(r.freq==='daily')return dstr(new Date(y,m-1,d+k));
  if(r.freq==='weekly')return dstr(new Date(y,m-1,d+7*k));
  if(r.freq==='monthly'){const t=new Date(y,m-1+k,1),dim=new Date(t.getFullYear(),t.getMonth()+1,0).getDate();return dstr(new Date(t.getFullYear(),t.getMonth(),Math.min(d,dim)))}
  const dim=new Date(y+k,m,0).getDate();return dstr(new Date(y+k,m-1,Math.min(d,dim)))}
function runRecurring(){
  const td=todayStr();let added=0,changed=false;
  for(const r of S.rec){
    if(!r.on)continue;let g=0;
    while(g++<800){const d=occ(r,r.n);
      if(r.end&&d>r.end){r.on=false;changed=true;break}
      if(d>td)break;
      const id='t'+r.id+'_'+d; // same id on every device, so a sync never doubles it
      if(!S.tx.some(t=>t.id===id)&&!S.del[id])S.tx.push({id,type:r.type,amt:r.amt,cat:r.cat,acc:r.acc,date:d,note:r.note,rid:r.id,u:0});
      r.n++;r.u=Date.now();added++;changed=true}
    if(r.on&&r.end&&occ(r,r.n)>r.end){r.on=false;changed=true}
  }
  if(changed)persist();
  return added}

/* ===== merge two copies of your data (used by Drive sync and import) ===== */
function mergeData(A,B){
  const out=(A.su||0)>=(B.su||0)?clone(A):clone(B);
  const del={};for(const k in B.del)del[k]=B.del[k];for(const k in A.del)del[k]=Math.max(del[k]||0,A.del[k]);
  const cutoff=Date.now()-120*864e5;for(const k in del)if(del[k]<cutoff)delete del[k];
  for(const col of ['tx','cats','accs','rec','goals','debts']){
    const map=new Map();
    for(const it of [].concat(A[col],B[col])){const ex=map.get(it.id);
      if(!ex)map.set(it.id,clone(it));
      else{const win=(it.u||0)>(ex.u||0)?clone(it):ex;if(col==='rec')win.n=Math.max(it.n,ex.n);map.set(it.id,win)}}
    out[col]=[...map.values()].filter(it=>!(del[it.id]>(it.u||0)));
  }
  out.goals=out.goals||[];out.debts=out.debts||[];
  if(!out.accs.length)out.accs=clone(A.accs.length?A.accs:B.accs);
  if(!out.cats.length)out.cats=defCats();
  const ids=new Set(out.accs.map(a=>a.id));
  for(const t of out.tx){if(!ids.has(t.acc))t.acc=out.accs[0].id;if(t.type==='t'&&!ids.has(t.to))t.to=out.accs.find(a=>a.id!==t.acc)?.id||t.acc}
  out.rates={...B.rates,...A.rates,...out.rates};
  out.del=del;return out}

/* ===== CSV ===== */
function toCSV(rows){return rows.map(r=>r.map(v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"').join(',')).join('\r\n')}
function parseCSV(text){
  text=text.replace(/^\uFEFF/,'');const rows=[];let row=[],f='',q=false;
  for(let i=0;i<text.length;i++){const c=text[i];
    if(q){if(c==='"'){if(text[i+1]==='"'){f+='"';i++}else q=false}else f+=c}
    else if(c==='"')q=true;
    else if(c===','){row.push(f);f=''}
    else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(f);f='';if(row.some(x=>x!==''))rows.push(row);row=[]}
    else f+=c}
  row.push(f);if(row.some(x=>x!==''))rows.push(row);return rows}
function exportRows(){
  const rows=[['date','type','category','amount','note','wallet','currency','to_wallet','amount_in']];
  for(const t of S.tx.slice().sort((a,b)=>a.date.localeCompare(b.date))){const a=acc(t.acc);
    rows.push([t.date,t.type==='i'?'income':t.type==='t'?'transfer':'expense',t.type==='e'?cat(t.cat).name:'',t.amt,t.note||'',a.name,a.cur,t.type==='t'?acc(t.to).name:'',t.type==='t'?(t.amt2||t.amt):''])}
  return rows}
function importCSV(text){
  const rows=parseCSV(text);if(rows.length<2)throw new Error('The CSV has no rows.');
  const h=rows[0].map(x=>x.trim().toLowerCase()),ix=n=>h.indexOf(n),iw=ix('wallet')>=0?ix('wallet'):ix('account');
  if(ix('date')<0||ix('amount')<0)throw new Error('The CSV needs at least "date" and "amount" columns.');
  const sig=t=>[t.date,t.type,t.cat,t.acc,t.amt,t.note].join('|'),have=new Set(S.tx.map(sig));
  const res={added:0,skipped:0,dupes:0,cats:0,wallets:0},now=Date.now(),pal=['#14b8a6','#f43f5e','#84cc16','#a855f7','#0ea5e9','#f59e0b'];
  const g=(r,n)=>{const i=typeof n==='number'?n:ix(n);return i>=0&&r[i]!=null?r[i].trim():''};
  const walletBy=(name,cur)=>{if(!name)return S.accs[0];let a=S.accs.find(x=>x.name.toLowerCase()===name.toLowerCase());
    if(!a){a={id:uid('a'),name:name.slice(0,30),emoji:'💵',cur:/^[A-Za-z]{3}$/.test(cur)?cur.toUpperCase():S.cur,open:0,u:now};S.accs.push(a);res.wallets++}return a};
  for(let k=1;k<rows.length;k++){const r=rows[k];
    const date=g(r,'date'),amt=parseFloat(g(r,'amount').replace(/,/g,''));
    if(!isDate(date)||!(amt>0)){res.skipped++;continue}
    const ty=g(r,'type').toLowerCase(),type=ty.startsWith('i')?'income':ty.startsWith('t')?'transfer':'expense',a=walletBy(g(r,iw),g(r,'currency'));
    const t={id:uid('t')+k,type:type[0]==='i'?'i':type[0]==='t'?'t':'e',amt,cat:'',acc:a.id,date,note:g(r,'note').slice(0,200),u:now};
    if(t.type==='e'){const cn=g(r,'category')||'Other';let c=S.cats.find(x=>x.name.toLowerCase()===cn.toLowerCase());
      if(!c){c={id:uid('c'),name:cn.slice(0,30),emoji:'⭐',color:pal[S.cats.length%pal.length],limit:0,u:now};S.cats.push(c);res.cats++}t.cat=c.id}
    if(t.type==='t'){const to=walletBy(g(r,'to_wallet'),'');if(to.id===a.id){res.skipped++;continue}t.to=to.id;t.amt2=parseFloat(g(r,'amount_in').replace(/,/g,''))>0?parseFloat(g(r,'amount_in').replace(/,/g,'')):amt}
    const s=sig(t);if(have.has(s)){res.dupes++;continue}have.add(s);S.tx.push(t);res.added++}
  return res}
