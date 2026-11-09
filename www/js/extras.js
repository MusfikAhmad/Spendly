'use strict';
/* ===================== Receipt photos (kept in IndexedDB on this phone) ===================== */
function idb(){return new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('no storage'));const r=indexedDB.open('spendly_pics',1);r.onupgradeneeded=()=>r.result.createObjectStore('p');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
const idbDo=(mode,fn)=>idb().then(db=>new Promise((res,rej)=>{const tx=db.transaction('p',mode),rq=fn(tx.objectStore('p'));tx.oncomplete=()=>res(rq&&rq.result);tx.onerror=()=>rej(tx.error);tx.onabort=()=>rej(tx.error)}));
const picPut=(id,blob)=>idbDo('readwrite',s=>s.put(blob,id));
const picGet=id=>idbDo('readonly',s=>s.get(id)).catch(()=>null);
const picDel=id=>idbDo('readwrite',s=>s.delete(id)).catch(()=>{});
const picKeys=()=>idbDo('readonly',s=>s.getAllKeys()).catch(()=>[]);
async function cleanPics(){ // drop photos of transactions that were deleted a while ago
  const keys=await picKeys(),have=new Set(S.tx.map(t=>t.id));
  for(const k of keys)if(!have.has(k)&&!(S.del[k]&&Date.now()-S.del[k]<3*864e5))picDel(k)}
async function compressImage(file,max=1280,q=.72){
  const url=URL.createObjectURL(file);
  try{const img=await new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>rej(new Error('Could not read that image.'));i.src=url});
    const k=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
    c.getContext('2d').drawImage(img,0,0,c.width,c.height);
    return await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('Could not compress the image.')),'image/jpeg',q))}
  finally{URL.revokeObjectURL(url)}}
async function openPic(id){
  const b=await picGet(id);
  const sh=openSheet(head('Receipt')+'<div class="sheet-b" id="pB"></div>',{});
  const box=$('#pB',sh.el);
  if(!b){box.innerHTML='<p class="sub">'+esc(_('This receipt is not on this phone. Receipts are not included in backups.'))+'</p>';return}
  const u=URL.createObjectURL(b);box.innerHTML='<img alt="" style="width:100%;border-radius:14px" src="'+u+'">';sh.el.addEventListener('transitionend',()=>{},{once:true})}

/* ===================== PDF report (drawn on a canvas, so Bengali text works too) ===================== */
function buildPdf(pages){
  const enc=new TextEncoder(),chunks=[],offs=[];let len=0;
  const push=b=>{if(typeof b==='string')b=enc.encode(b);chunks.push(b);len+=b.length};
  push('%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n');
  const N=pages.length;
  offs[1]=len;push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  offs[2]=len;push('2 0 obj\n<< /Type /Pages /Kids ['+pages.map((p,i)=>(3+3*i)+' 0 R').join(' ')+'] /Count '+N+' >>\nendobj\n');
  pages.forEach((p,i)=>{const pg=3+3*i,ct=pg+1,im=pg+2,c='q 595 0 0 842 0 0 cm /Im0 Do Q';
    offs[pg]=len;push(pg+' 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 '+im+' 0 R >> >> /Contents '+ct+' 0 R >>\nendobj\n');
    offs[ct]=len;push(ct+' 0 obj\n<< /Length '+c.length+' >>\nstream\n'+c+'\nendstream\nendobj\n');
    offs[im]=len;push(im+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+p.w+' /Height '+p.h+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+p.jpeg.length+' >>\nstream\n');push(p.jpeg);push('\nendstream\nendobj\n')});
  const total=3*N+3,xr=len;let x='xref\n0 '+total+'\n0000000000 65535 f \n';
  for(let n=1;n<total;n++)x+=String(offs[n]).padStart(10,'0')+' 00000 n \n';
  push(x+'trailer\n<< /Size '+total+' /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF\n');
  const out=new Uint8Array(len);let o=0;for(const c of chunks){out.set(c,o);o+=c.length}return out}
function reportModel(m){
  const st=monthStats(m),mm=monthMap(),cur=m;
  const cats=Object.keys(st.bc).sort((a,b)=>st.bc[b]-st.bc[a]).map(i=>({name:cname(cat(i)),emoji:cat(i).emoji,amt:st.bc[i],pct:st.sp?st.bc[i]/st.sp*100:0,color:cat(i).color,limit:cat(i).limit||0}));
  const months=[];for(let i=5;i>=0;i--){const k=shiftM(cur,-i);months.push({label:mshort(k),inc:(mm[k]||{inc:0}).inc,sp:(mm[k]||{sp:0}).sp})}
  const rows=S.tx.filter(t=>t.date.startsWith(m)).sort((a,b)=>a.date.localeCompare(b.date)).map(t=>{const a=acc(t.acc);
    return {date:t.date,cat:t.type==='t'?_('Transfer'):t.type==='i'?_('Income'):cname(cat(t.cat)),wallet:a.name,note:t.note||'',amt:t.amt,cur:a.cur,sign:t.type==='e'?'−':t.type==='i'?'+':'',kind:t.type}});
  return {title:mname(m),income:st.inc,spent:st.sp,balance:st.inc-st.sp,budget:S.budget,cats,months,rows}}
async function renderReport(m){
  const R=reportModel(m),W=1240,H=1754,P=80,FONT="'Noto Sans Bengali','Noto Sans',system-ui,sans-serif",pages=[];
  const mk=()=>{const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,W,H);return {c,x}};
  const T=(x,s,px,py,o={})=>{x.font=(o.w||400)+' '+(o.s||28)+'px '+FONT;x.fillStyle=o.col||'#171a26';x.textAlign=o.a||'left';x.textBaseline='alphabetic';let str=String(s);
    if(o.max){while(x.measureText(str).width>o.max&&str.length>1)str=str.slice(0,-1);if(str!==String(s))str=str.slice(0,-1)+'…'}x.fillText(str,px,py)};
  const rr=(x,px,py,w,h,r,col)=>{x.fillStyle=col;x.beginPath();x.moveTo(px+r,py);x.arcTo(px+w,py,px+w,py+h,r);x.arcTo(px+w,py+h,px,py+h,r);x.arcTo(px,py+h,px,py,r);x.arcTo(px,py,px+w,py,r);x.closePath();x.fill()};
  const foot=(x,n)=>T(x,_('Made with Spendly')+' · '+new Date().toLocaleDateString(loc())+' · '+n,W/2,H-50,{s:22,col:'#8a91a6',a:'center'});
  // page 1: summary
  let {c,x}=mk();
  T(x,_('Spending report'),P,130,{s:56,w:700});T(x,R.title+' · '+S.cur,P,185,{s:30,col:'#68708a'});
  const bw=(W-2*P-60)/3;
  [[_('Income'),R.income,'#16a34a'],[_('Spent'),R.spent,'#dc2626'],[_('Balance'),R.balance,R.balance>=0?'#16a34a':'#dc2626']].forEach((b,i)=>{
    const bx=P+i*(bw+30);rr(x,bx,240,bw,150,22,'#f3f4fa');T(x,b[0],bx+28,296,{s:26,col:'#68708a'});T(x,fmt(b[1]),bx+28,358,{s:42,w:700,col:b[2],max:bw-50})});
  let y=440;
  if(R.budget){const p=Math.min(R.spent/R.budget,1.2);T(x,_('Budget')+': '+fmt(R.budget)+' · '+Math.round(R.spent/R.budget*100)+'%',P,y,{s:28});
    rr(x,P,y+20,W-2*P,22,11,'#e3e6f0');rr(x,P,y+20,Math.max(22,(W-2*P)*Math.min(p,1)),22,11,R.spent>R.budget?'#dc2626':'#5b5bf0');y+=100}
  T(x,_('Spending by category'),P,y+30,{s:36,w:700});y+=80;
  if(!R.cats.length)T(x,_('No spending in this month yet.'),P,y+10,{s:28,col:'#68708a'});
  for(const k of R.cats.slice(0,9)){
    T(x,k.emoji+' '+k.name,P,y+8,{s:28,max:380});rr(x,P+400,y-16,430,26,13,'#e3e6f0');rr(x,P+400,y-16,Math.max(26,430*k.pct/100),26,13,k.color);
    T(x,fmt(k.amt),W-P,y+8,{s:28,a:'right',w:600});T(x,Math.round(k.pct)+'%',P+850,y+8,{s:26,col:'#68708a'});y+=62}
  y=Math.max(y+40,1130);
  T(x,_('Income vs expenses'),P,y,{s:36,w:700});
  const top=Math.max(1,...R.months.map(m=>Math.max(m.inc,m.sp))),base0=H-200,ch=base0-(y+60),cw=(W-2*P)/6;
  R.months.forEach((m,i)=>{const bx=P+i*cw+cw/2;
    const hi=ch*m.inc/top,hs=ch*m.sp/top;rr(x,bx-52,base0-hi,44,Math.max(hi,2),6,'#22c55e');rr(x,bx+8,base0-hs,44,Math.max(hs,2),6,'#ef4444');
    T(x,m.label,bx,base0+40,{s:26,a:'center',col:'#68708a'})});
  x.fillStyle='#22c55e';x.fillRect(P,base0+80,18,18);T(x,_('Income'),P+28,base0+96,{s:24,col:'#68708a'});x.fillStyle='#ef4444';x.fillRect(P+170,base0+80,18,18);T(x,_('Expenses'),P+198,base0+96,{s:24,col:'#68708a'});
  foot(x,1);pages.push(c);
  // following pages: every transaction
  const per=38;
  for(let s0=0;s0<Math.max(R.rows.length,0);s0+=per){
    ({c,x}=mk());T(x,_('All transactions')+' · '+R.title,P,120,{s:38,w:700});
    let yy=190;T(x,_('Date'),P,yy,{s:24,col:'#8a91a6'});T(x,_('Category'),P+190,yy,{s:24,col:'#8a91a6'});T(x,_('Note'),P+520,yy,{s:24,col:'#8a91a6'});T(x,_('Amount'),W-P,yy,{s:24,col:'#8a91a6',a:'right'});yy+=18;
    for(const r of R.rows.slice(s0,s0+per)){yy+=38;x.fillStyle='#eef0f6';x.fillRect(P,yy-30,W-2*P,1);
      T(x,r.date,P,yy,{s:24});T(x,r.cat+' · '+r.wallet,P+190,yy,{s:24,max:310});T(x,r.note,P+520,yy,{s:24,max:400});
      T(x,r.sign+fmt(r.amt,r.cur),W-P,yy,{s:24,a:'right',w:600,col:r.kind==='e'?'#dc2626':r.kind==='i'?'#16a34a':'#171a26'})}
    foot(x,pages.length+1);pages.push(c)}
  const out=[];
  for(const cv of pages){const d=cv.toDataURL('image/jpeg',.85).split(',')[1],bin=atob(d),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);out.push({jpeg:u,w:cv.width,h:cv.height})}
  return out}
async function exportBinary(name,bytes,mime){
  const P=window.Capacitor&&Capacitor.Plugins;
  if(P&&P.Filesystem&&P.Share){
    try{let b='';for(let i=0;i<bytes.length;i+=0x8000)b+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));
      const f=await P.Filesystem.writeFile({path:name,data:btoa(b),directory:'CACHE'});await P.Share.share({title:name,url:f.uri});return}
    catch(e){if(/cancel|dismiss/i.test(String(e&&e.message||e)))return}}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([bytes],{type:mime}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
async function shareReport(){
  const b=$('#rpt');if(b){b.disabled=true;b.innerHTML='<span class="spin"></span>'+esc(_('Preparing…'))}
  try{const pages=await renderReport(M);await exportBinary('spendly-report-'+M+'.pdf',buildPdf(pages),'application/pdf')}
  catch(e){toast(e.message||_('Could not create the report.'),{kind:'err'})}
  finally{if(b){b.disabled=false;b.textContent=_('Share PDF report')}}}

/* ===================== App lock (PIN + optional fingerprint) ===================== */
let lockedNow=false,authBusy=false,hiddenAt=0;
const lockState=()=>({locked:lockedNow,on:!!D.lock.on});
async function sha(str){
  if(window.crypto&&crypto.subtle){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(str));return Array.from(new Uint8Array(b)).map(x=>x.toString(16).padStart(2,'0')).join('')}
  let h=5381;for(const c of str)h=((h<<5)+h+c.charCodeAt(0))>>>0;return 'x'+h.toString(16)}
const pinHash=(pin,salt)=>sha(salt+':'+pin);
const BIO=()=>window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.BiometricAuthNative;
async function bioAvailable(){try{return !!(BIO()&&(await BIO().checkBiometry()).isAvailable)}catch(e){return false}}
function keypad(host,{len,bio,onDone,onBio}){
  let v='';
  host.innerHTML='<div class="dots">'+'<i></i>'.repeat(len)+'</div><div class="msg" aria-live="polite"></div><div class="pad">'+
    [1,2,3,4,5,6,7,8,9].map(n=>'<button type="button" data-k="'+n+'">'+n+'</button>').join('')+
    (bio?'<button type="button" data-k="bio" aria-label="'+esc(_('Use fingerprint'))+'">☝</button>':'<span></span>')+'<button type="button" data-k="0">0</button><button type="button" data-k="del" aria-label="'+esc(_('Delete'))+'">⌫</button></div>';
  const dots=$$('.dots i',host),msg=$('.msg',host);
  const paint=()=>dots.forEach((d,i)=>d.classList.toggle('on',i<v.length));
  host.onclick=async e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.k;buzz(4);
    if(k==='del'){v=v.slice(0,-1);paint();return}
    if(k==='bio'){onBio&&onBio();return}
    if(v.length>=len)return;v+=k;paint();
    if(v.length===len){const pin=v;const ok=await onDone(pin);if(ok===false){shake($('.dots',host));buzz(30);v='';setTimeout(paint,200)}}};
  return {msg:t=>{msg.textContent=t},reset(){v='';paint()}}}
function showLock(){
  if(lockedNow||!D.lock.on)return;lockedNow=true;
  const el=document.createElement('div');el.id='lock';el.innerHTML='<div class="lk"><div class="logo">💸</div><h2>Spendly</h2><div id="lkPad"></div></div>';document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('in'));
  const kp=keypad($('#lkPad',el),{len:D.lock.len||4,bio:D.lock.bio&&!!BIO(),onBio:()=>tryBio(),
    async onDone(pin){
      if(D.lock.until>Date.now()){kp.msg(_('Try again in {s} seconds',{s:Math.ceil((D.lock.until-Date.now())/1000)}));return false}
      if(await pinHash(pin,D.lock.s)===D.lock.h){unlock();return true}
      D.lock.tries++;if(D.lock.tries%5===0)D.lock.until=Date.now()+Math.min(300,30*Math.pow(2,D.lock.tries/5-1))*1000;saveDev();
      kp.msg(D.lock.until>Date.now()?_('Too many tries. Wait {s} seconds',{s:Math.ceil((D.lock.until-Date.now())/1000)}):_('Wrong PIN'));return false}});
  window._kp=kp;if(D.lock.bio)setTimeout(tryBio,250)}
function unlock(){
  lockedNow=false;D.lock.tries=0;D.lock.until=0;saveDev();
  const el=$('#lock');if(el){el.classList.remove('in');setTimeout(()=>el.remove(),260)}
  if(pendingLink){const u=pendingLink;pendingLink='';lastLink={u:'',t:0};setTimeout(()=>handleLink(u),300)}}
async function tryBio(){
  if(!D.lock.bio||!BIO()||authBusy)return;authBusy=true;
  try{await BIO().internalAuthenticate({reason:_('Unlock Spendly'),cancelTitle:_('Use PIN'),androidTitle:'Spendly',allowDeviceCredential:false});authBusy=false;unlock()}
  catch(e){authBusy=false}}
function showCover(on){let c=$('#cover');if(on&&!c){c=document.createElement('div');c.id='cover';c.innerHTML='<div class="logo">💸</div>';document.body.appendChild(c)}else if(!on&&c)c.remove()}
function lockOnHide(){if(D.lock.on&&!authBusy&&!lockedNow){hiddenAt=Date.now();showCover(true)}}
function lockOnShow(){showCover(false);if(D.lock.on&&!authBusy&&hiddenAt&&Date.now()-hiddenAt>20000)showLock();hiddenAt=0}
function askPin(title,len,hint){return new Promise(res=>{let out=null;
  const sh=openSheet(head(title)+'<div class="sheet-b pinb"><div id="pnPad"></div>'+(hint?'<p class="sub" style="text-align:center">'+esc(hint)+'</p>':'')+'</div>',{cls:'pinsheet',onClose:()=>res(out)});
  const kp=keypad($('#pnPad',sh.el),{len,onDone:pin=>{out=pin;sh.close();return true}});window._kp2=kp})}
async function setupLock(){
  const len=await choose({title:'App lock',text:'Choose a PIN length. If you forget the PIN you will have to reinstall the app (a Drive or file backup keeps your data).',options:[{id:4,label:'4-digit PIN',kind:'pri'},{id:6,label:'6-digit PIN'},{id:0,label:'Cancel'}]});
  if(!len)return false;
  const a=await askPin(_('Create a PIN'),len);if(!a)return false;
  const b=await askPin(_('Confirm your PIN'),len);if(!b)return false;
  if(a!==b){toast(_('The PINs did not match. Try again.'),{kind:'err'});return false}
  const salt=uid('s');D.lock={...D.lock,on:true,len,s:salt,h:await pinHash(a,salt),tries:0,until:0,bio:false};saveDev();
  if(await bioAvailable()&&await ask({title:'Use your fingerprint too?',text:'You can always unlock with your PIN.',ok:'Use fingerprint'})){D.lock.bio=true;saveDev()}
  toast(_('App lock is on'));return true}
async function verifyPin(title){
  const pin=await askPin(_(title),D.lock.len||4);if(!pin)return false;
  if(await pinHash(pin,D.lock.s)===D.lock.h)return true;toast(_('Wrong PIN'),{kind:'err'});return false}

/* ===================== Reminders & budget alerts ===================== */
const LN=()=>window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.LocalNotifications;
async function notifPermission(ask){try{let p=await LN().checkPermissions();if(p.display!=='granted'&&ask)p=await LN().requestPermissions();return p.display==='granted'}catch(e){return false}}
let remT;
function remindersSoon(){clearTimeout(remT);remT=setTimeout(scheduleReminders,1500)}
async function scheduleReminders(){
  if(!LN())return;
  try{
    const pend=await LN().getPending();if(pend.notifications&&pend.notifications.length)await LN().cancel({notifications:pend.notifications});
    if(!(D.rem.bills||D.rem.daily)||!(await notifPermission(false)))return;
    const list=[],now=Date.now();
    if(D.rem.daily)list.push({id:1,title:_('Log today’s spending'),body:_('Add what you spent today in Spendly.'),schedule:{on:{hour:21,minute:0},allowWhileIdle:true}});
    if(D.rem.bills)for(const r of S.rec){if(!r.on)continue;let k=r.n,g=0,c=0;
      while(g++<40&&c<3){const d=occ(r,k++);if(r.end&&d>r.end)break;const at=parseD(d);at.setDate(at.getDate()-1);at.setHours(9,0,0,0);if(at.getTime()<=now)continue;if(at.getTime()>now+45*864e5)break;
        let h=7;for(const ch of r.id+d)h=(h*31+ch.charCodeAt(0))>>>0;
        list.push({id:100+(h%2000000000),title:_('Bill due tomorrow'),body:(r.note||(r.type==='e'?cname(cat(r.cat)):_('Income')))+': '+fmt(r.amt,acc(r.acc).cur),schedule:{at,allowWhileIdle:true}});c++}}
    if(list.length)await LN().schedule({notifications:list});
  }catch(e){}}
async function notifyNow(title,body){if(!LN()||!(await notifPermission(false)))return;try{await LN().schedule({notifications:[{id:2+Math.floor(Math.random()*90),title,body,schedule:{at:new Date(Date.now()+1200)}}]})}catch(e){}}
/* call with the month's stats from before a new/edited expense; warns when 80% / 100% is crossed */
function budgetAlerts(before,month){
  const after=monthStats(month),msgs=[],cross=(a,b,lim,label)=>{if(!lim)return;const pa=a/lim,pb=b/lim;
    if(pa<1&&pb>=1)msgs.push(_('{n} budget used up',{n:label}));else if(pa<.8&&pb>=.8&&pb<1)msgs.push(_('{n} budget is 80% used',{n:label}))};
  cross(before.sp,after.sp,S.budget,_('Monthly'));
  for(const c of S.cats)cross(before.bc[c.id]||0,after.bc[c.id]||0,c.limit,cname(c));
  if(msgs.length){const m=msgs.join(' · ');toast('⚠ '+m,{ms:6500});buzz([30,60,30]);if(document.hidden)notifyNow('Spendly',m)}}

/* ===================== Plan card + Ask AI ===================== */
function renderPlan(){
  const card=$('#planCard');if(!card)return;
  if(M!==todayStr().slice(0,7)){card.hidden=true;return}
  const c=coach(),L=[];card.hidden=false;
  if(c.perDay!=null){
    if(c.room<0)L.push('<span class="neg">'+esc(_('You are {x} over your plan this month.',{x:fmt(-c.room)}))+'</span>');
    else L.push(esc(_('You can spend about {x} a day for the next {n} days.',{x:fmt(c.perDay),n:c.daysLeft}))+(c.bills?' <span class="sub">'+esc(_('(after {y} of bills still due)',{y:fmt(c.bills)}))+'</span>':''));
    if(c.plan&&c.projected>c.plan)L.push(esc(_('At this pace you will spend {p}, which is {d} over.',{p:fmt(c.projected),d:fmt(c.projected-c.plan)})));
    if(c.usedEstimate)L.push('<span class="sub">'+esc(_('Based on your recent months. Set a budget in Settings for a firmer plan.'))+'</span>')}
  else L.push(esc(_('Set a monthly budget and Spendly will tell you how much you can spend each day.'))+' <a href="#" id="setBud2" style="color:var(--ac)">'+esc(_('Set budget'))+'</a>');
  if(c.incomeRef>0)L.push(esc(_('Try to set aside {x} this month. So far: {y}.',{x:fmt(c.saveTarget),y:fmt(c.savedSoFar)}))+(c.goalNeed>0?' <span class="sub">'+esc(_('Your goals need about {g} a month.',{g:fmt(c.goalNeed)}))+'</span>':''));
  $('#planBody').innerHTML=L.map(x=>'<p>'+x+'</p>').join('')}
async function copyText(text){
  try{if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(text);return true}}catch(e){}
  const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;opacity:0';document.body.appendChild(ta);ta.select();let ok=false;try{ok=document.execCommand('copy')}catch(e){}ta.remove();return ok}
function openAsk(){
  const qs=[['How much should I save this month?','How much should I save this month, and how can I reach my goals?'],['How much can I spend per day?','How much can I safely spend per day for the rest of this month?'],['Where can I cut spending?','Looking at my categories, where can I realistically cut spending?']];
  const sh=openSheet(head('Ask an AI assistant')+'<div class="sheet-b"><p class="sub">Spendly puts a short summary of your numbers below (no notes, no wallet names). Send it to Gemini or any assistant to get advice. Nothing leaves your phone until you tap Share.</p>'+
    '<div class="chips" id="aqQ" style="margin:10px 0">'+qs.map((q,i)=>'<button type="button" class="chip" data-i="'+i+'" style="--cc:var(--ac);--cb:var(--acs)">'+esc(_(q[0]))+'</button>').join('')+'</div>'+
    '<textarea id="aqT" rows="11" style="width:100%;min-height:200px;border-radius:12px;border:1px solid var(--bd);background:var(--bg);color:var(--tx);padding:10px;font:13px/1.45 ui-monospace,monospace"></textarea></div>'+
    '<div class="sheet-f"><button class="btn" id="aqC" type="button">Copy</button><button class="btn pri" id="aqS" type="button">Share…</button></div>');
  const q=s=>$(s,sh.el),ta=q('#aqT');ta.value=aiSnapshot();
  q('#aqQ').onclick=e=>{const b=e.target.closest('.chip');if(b){ta.value=aiSnapshot(qs[+b.dataset.i][1]);$$('.chip',sh.el).forEach(c=>c.classList.toggle('on',c===b))}};
  q('#aqC').onclick=async()=>toast(await copyText(ta.value)?_('Copied. Paste it into your assistant.'):_('Could not copy.'));
  q('#aqS').onclick=async()=>{const P=window.Capacitor&&Capacitor.Plugins;
    try{if(P&&P.Share)await P.Share.share({title:'Spendly summary',text:ta.value});else if(navigator.share)await navigator.share({text:ta.value});else toast(await copyText(ta.value)?_('Copied. Paste it into your assistant.'):_('Could not copy.'))}
    catch(e){if(!/cancel|dismiss|abort/i.test(String(e&&e.message||e)))toast(_('Could not share.'),{kind:'err'})}}}

/* ===================== Savings goals ===================== */
const GOAL_EMOJI=['🎯','🏠','🚗','✈️','📱','🎓','💍','🛟'];
const goalSaved=g=>g.hist.reduce((a,x)=>a+x.amt,0);
function renderGoals(){
  $('#gList').innerHTML=S.goals.map(g=>{const sv=goalSaved(g),p=Math.min(100,sv/g.target*100);
    return '<div class="tx goal" data-goal="'+esc(g.id)+'" role="button" tabindex="0"><div class="ic" style="background:var(--acs)">'+esc(g.emoji)+'</div><div class="m"><div class="t">'+esc(g.name)+'</div><div class="bar"><i data-w="'+p+'" style="background:'+(p>=100?'var(--ok)':'var(--ac)')+'"></i></div><div class="sub">'+esc(fmt(sv))+' / '+esc(fmt(g.target))+(g.due?' · '+esc(_('by {d}',{d:g.due})):'')+'</div></div><b>'+Math.round(p)+'%</b></div>'}).join('')||'<p class="sub">'+esc(_('Saving for something? Set a target and track your progress.'))+'</p>';
  requestAnimationFrame(()=>$$('#gList .bar i').forEach(i=>i.style.width=i.dataset.w+'%'))}
function openGoal(id){
  const ex=id&&S.goals.find(g=>g.id===id);if(id&&!ex)return;
  const G=ex?{...ex,hist:ex.hist.map(h=>({...h})),target:String(ex.target)}:{name:'',emoji:'🎯',target:'',due:'',hist:[],start:''};
  const html=head(ex?'Edit goal':'New goal')+'<div class="sheet-b"><label for="gName">What are you saving for?</label><input id="gName" maxlength="40" autocomplete="off" placeholder="Laptop, Hajj, Emergency fund…">'+
   '<label>Icon</label><div class="chips" id="gEm">'+GOAL_EMOJI.map(e=>'<button type="button" class="chip" data-e="'+e+'" style="--cc:var(--ac);--cb:var(--acs)">'+e+'</button>').join('')+'</div>'+
   '<label for="gTarget">Target amount ('+esc(S.cur)+')</label><input id="gTarget" type="text" inputmode="decimal">'+
   '<label for="gDue">Target date (optional)</label><input id="gDue" type="date">'+
   (ex?'<div id="gProg" class="note"></div><label for="gAmt">Add or take out money</label><div class="row"><input id="gAmt" type="text" inputmode="decimal" placeholder="Amount" style="flex:1"><button class="btn pri" id="gAdd" type="button">Add</button><button class="btn" id="gOut" type="button">Take out</button></div>'
     :'<label for="gStart">Already saved (optional)</label><input id="gStart" type="text" inputmode="decimal">')+'</div>'+
   '<div class="sheet-f">'+(ex?'<button class="btn danger" id="gDel" type="button">Delete</button>':'')+'<button class="btn pri" id="gSave" type="button">'+(ex?'Save':'Create goal')+'</button></div>';
  const sh=openSheet(html,{focus:ex?null:'#gName'}),el=sh.el,q=s=>$(s,el);
  q('#gName').value=G.name;q('#gTarget').value=G.target;q('#gDue').value=G.due||'';
  const paint=()=>{$$('#gEm .chip',el).forEach(c=>c.classList.toggle('on',c.dataset.e===G.emoji));
    if(ex){const sv=G.hist.reduce((a,x)=>a+x.amt,0),tg=parseNum(q('#gTarget').value)||0,left=Math.max(0,tg-sv);let need='';
      const due=q('#gDue').value;if(due&&left>0){const m=Math.max(1,(new Date(due)-new Date())/(30.4*864e5));need=' · '+_('about {x} a month to get there',{x:fmt(left/m)})}
      q('#gProg').textContent=_('Saved {a} of {b}',{a:fmt(sv),b:fmt(tg)})+need}};
  paint();
  q('#gEm').onclick=e=>{const c=e.target.closest('.chip');if(c){G.emoji=c.dataset.e;paint()}};
  q('#gTarget').oninput=paint;q('#gDue').onchange=paint;
  const move=sign=>{const a=parseNum(q('#gAmt').value);if(!(a>0)){shake(q('#gAmt'));return}
    const sv=G.hist.reduce((x,h)=>x+h.amt,0);if(sign<0&&a>sv){toast(_('You only have {x} saved.',{x:fmt(sv)}));return}
    G.hist.push({d:todayStr(),amt:sign*a});q('#gAmt').value='';buzz(10);paint()};
  if(ex){q('#gAdd').onclick=()=>move(1);q('#gOut').onclick=()=>move(-1)}
  q('#gSave').onclick=()=>{const name=q('#gName').value.trim(),target=parseNum(q('#gTarget').value),due=q('#gDue').value;
    if(!name){shake(q('#gName'));return}if(!(target>0)){shake(q('#gTarget'));return}
    const now=Date.now();
    if(ex){Object.assign(ex,{name,emoji:G.emoji,target,due:isDate(due)?due:'',hist:G.hist,u:now})}
    else{const st=parseNum(q('#gStart').value);S.goals.push({id:uid('g'),name,emoji:G.emoji,target,due:isDate(due)?due:'',hist:st>0?[{d:todayStr(),amt:st}]:[],u:now})}
    persist();sh.close();render();toast(ex?_('Goal saved'):_('Goal created'))};
  const d=q('#gDel');if(d)d.onclick=async()=>{if(!(await ask({title:'Delete this goal?',ok:'Delete',danger:true})))return;
    S.goals=S.goals.filter(g=>g.id!==ex.id);tomb(ex.id);persist();await sh.request();render();toast(_('Goal deleted'))}}

/* ===================== Loans & debts ===================== */
function renderDebts(){
  const owed=S.debts.filter(b=>b.dir==='lent').reduce((a,b)=>a+debtLeft(b),0),owe=S.debts.filter(b=>b.dir==='borrowed').reduce((a,b)=>a+debtLeft(b),0);
  $('#dSum').innerHTML=(owed||owe)?'<span class="pos">'+esc(_('Owed to you {x}',{x:fmt(owed)}))+'</span> · <span class="neg">'+esc(_('You owe {x}',{x:fmt(owe)}))+'</span>':'';
  const td=todayStr();
  $('#dList').innerHTML=S.debts.slice().sort((a,b)=>(debtLeft(a)===0)-(debtLeft(b)===0)||(a.due||'9').localeCompare(b.due||'9')).map(b=>{const left=debtLeft(b),done=left===0,late=!done&&b.due&&b.due<td;
    return '<div class="tx" data-debt="'+esc(b.id)+'" role="button" tabindex="0" style="'+(done?'opacity:.55':'')+'"><div class="ic" style="background:var(--acs)">'+(b.dir==='lent'?'↗':'↙')+'</div><div class="m"><div class="t">'+esc(b.who)+'</div><div class="sub">'+esc(done?_('Settled'):b.dir==='lent'?_('owes you'):_('you owe'))+(b.due&&!done?' · '+(late?'<span class="neg">'+esc(_('overdue since {d}',{d:b.due}))+'</span>':esc(_('due {d}',{d:b.due}))):'')+'</div></div><b class="'+(done?'':b.dir==='lent'?'pos':'neg')+'">'+esc(fmt(left))+'</b></div>'}).join('')||'<p class="sub">'+esc(_('Money you lent or borrowed. Record it here so nothing is forgotten.'))+'</p>'}
function openDebt(id){
  const ex=id&&S.debts.find(b=>b.id===id);if(id&&!ex)return;
  const B=ex?{...ex,pay:ex.pay.map(p=>({...p})),amt:String(ex.amt)}:{dir:'lent',who:'',amt:'',date:todayStr(),due:'',note:'',pay:[]};
  const html=head(ex?'Edit loan':'New loan')+'<div class="sheet-b"><div class="seg" id="bSeg" style="--n:2"><i class="thumb"></i><button type="button" data-v="lent">I lent money</button><button type="button" data-v="borrowed">I borrowed</button></div>'+
   '<label for="bWho">Person</label><input id="bWho" maxlength="40" autocomplete="off">'+
   '<label for="bAmt">Amount ('+esc(S.cur)+')</label><input id="bAmt" type="text" inputmode="decimal">'+
   '<div class="two"><div><label for="bDate">Date</label><input id="bDate" type="date"></div><div><label for="bDue">Due (optional)</label><input id="bDue" type="date"></div></div>'+
   '<label for="bNote">Note</label><input id="bNote" maxlength="120" autocomplete="off" placeholder="Optional">'+
   (ex?'<div id="bProg" class="note"></div><label for="bPay">Record a payment</label><div class="row"><input id="bPay" type="text" inputmode="decimal" placeholder="Amount" style="flex:1"><button class="btn pri" id="bAdd" type="button">Add payment</button></div><button class="btn block" id="bSettle" type="button" style="margin-top:8px">Mark as settled</button>':'')+'</div>'+
   '<div class="sheet-f">'+(ex?'<button class="btn danger" id="bDel" type="button">Delete</button>':'')+'<button class="btn pri" id="bSave" type="button">'+(ex?'Save':'Add loan')+'</button></div>';
  const sh=openSheet(html,{focus:ex?null:'#bWho'}),el=sh.el,q=s=>$(s,el);
  q('#bWho').value=B.who;q('#bAmt').value=B.amt;q('#bDate').value=B.date;q('#bDue').value=B.due||'';q('#bNote').value=B.note||'';
  const left=()=>Math.max(0,(parseNum(q('#bAmt').value)||0)-B.pay.reduce((a,x)=>a+x.amt,0));
  const paint=()=>{setSeg(q('#bSeg'),B.dir);if(ex)q('#bProg').textContent=_('Paid back {a} · {b} left',{a:fmt(B.pay.reduce((a,x)=>a+x.amt,0)),b:fmt(left())})};
  paint();
  q('#bSeg').onclick=e=>{const b=e.target.closest('button');if(b){B.dir=b.dataset.v;paint()}};
  q('#bAmt').oninput=paint;
  if(ex){
    q('#bAdd').onclick=()=>{const a=parseNum(q('#bPay').value);if(!(a>0)){shake(q('#bPay'));return}if(a>left()+0.005){toast(_('That is more than the amount left ({x}).',{x:fmt(left())}));return}B.pay.push({d:todayStr(),amt:a});q('#bPay').value='';buzz(10);paint()};
    q('#bSettle').onclick=()=>{const l=left();if(l>0){B.pay.push({d:todayStr(),amt:round2(l)});buzz(10);paint()}}}
  q('#bSave').onclick=()=>{const who=q('#bWho').value.trim(),amt=parseNum(q('#bAmt').value),date=q('#bDate').value,due=q('#bDue').value;
    if(!who){shake(q('#bWho'));return}if(!(amt>0)){shake(q('#bAmt'));return}if(!isDate(date)){shake(q('#bDate'));return}
    const o={dir:B.dir,who,amt,date,due:isDate(due)?due:'',note:q('#bNote').value.trim(),pay:B.pay,u:Date.now()};
    if(ex)Object.assign(ex,o);else S.debts.push({id:uid('b'),...o});
    persist();sh.close();render();toast(ex?_('Loan saved'):_('Loan added'))};
  const d=q('#bDel');if(d)d.onclick=async()=>{if(!(await ask({title:'Delete this loan?',ok:'Delete',danger:true})))return;
    S.debts=S.debts.filter(b=>b.id!==ex.id);tomb(ex.id);persist();await sh.request();render();toast(_('Loan deleted'))}}
