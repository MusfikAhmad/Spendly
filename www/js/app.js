'use strict';
/* ===================== UI plumbing ===================== */
let M=todayStr().slice(0,7),tab='home',lastAdded=null,insRange=12,insYear=+M.slice(0,4),shown=120;
const F={scope:'m',type:'all',cat:'',acc:'',q:''};
const ch={};
const buzz=(n=8)=>{try{navigator.vibrate&&navigator.vibrate(n)}catch(e){}};
const shake=el=>{if(!el)return;el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake')};

/* ----- toasts ----- */
function toast(msg,o={}){
  const host=$('#toasts');while(host.children.length>=2)host.firstChild.remove();
  const t=document.createElement('div');t.className='toast'+(o.kind==='err'?' err':'');
  t.innerHTML='<span>'+esc(_(msg))+'</span>'+(o.action?'<button>'+esc(_(o.action))+'</button>':'');
  host.appendChild(t);let done=false;
  const hide=()=>{if(done)return;done=true;t.classList.add('out');setTimeout(()=>t.remove(),220)};
  if(o.action)t.querySelector('button').onclick=()=>{hide();o.fn&&o.fn()};
  setTimeout(hide,o.ms||(o.action?5500:3200));
}

/* ----- sheets (bottom sheets on phones). One history entry is used for "a sheet is open",
         so the Android Back button closes the top sheet instead of leaving the app ----- */
const sheetStack=[];let histOn=false,ignorePop=0;
function openSheet(html,opts={}){
  const ov=document.createElement('div');ov.className='overlay';
  const sh=document.createElement('div');sh.className='sheet '+(opts.cls||'');sh.setAttribute('role','dialog');sh.setAttribute('aria-modal','true');
  sh.innerHTML=sx(html);ov.appendChild(sh);$('#sheets').appendChild(ov);
  const api={el:sh,closed:false,viaPop:false,
    async request(viaPop){
      if(api.closed)return true;
      if(opts.guard){const ok=await opts.guard();if(!ok)return false}
      api.viaPop=!!viaPop;api.close();return true},
    close(r){
      if(api.closed)return;api.closed=true;
      const i=sheetStack.indexOf(api);if(i>=0)sheetStack.splice(i,1);
      ov.classList.remove('in');setTimeout(()=>ov.remove(),300);
      setTimeout(()=>{if(!sheetStack.length&&histOn&&!api.viaPop){histOn=false;ignorePop++;history.back()}},0);
      opts.onClose&&opts.onClose(r)}};
  sheetStack.push(api);
  if(!histOn){history.pushState({sh:1},'');histOn=true}
  requestAnimationFrame(()=>requestAnimationFrame(()=>ov.classList.add('in')));
  ov.addEventListener('mousedown',e=>{if(e.target===ov)api.request()});
  ov.addEventListener('touchend',e=>{if(e.target===ov){e.preventDefault();api.request()}});
  sh.addEventListener('click',e=>{if(e.target.closest('.close'))api.request()});
  // swipe the header down to dismiss
  const hd=sh.querySelector('.sheet-h');
  if(hd){let y0=null,dy=0;
    hd.addEventListener('pointerdown',e=>{if(e.target.closest('button'))return;y0=e.clientY;dy=0;sh.classList.add('drag');try{hd.setPointerCapture(e.pointerId)}catch(x){}});
    hd.addEventListener('pointermove',e=>{if(y0==null)return;dy=Math.max(0,e.clientY-y0);sh.style.transform='translateY('+dy+'px)'});
    const end=()=>{if(y0==null)return;y0=null;sh.classList.remove('drag');sh.style.transform='';if(dy>110)api.request()};
    hd.addEventListener('pointerup',end);hd.addEventListener('pointercancel',end)}
  if(opts.focus)setTimeout(()=>{const f=sh.querySelector(opts.focus);f&&f.focus()},320);
  return api}
window.addEventListener('popstate',async()=>{
  if(ignorePop>0){ignorePop--;return}
  histOn=false;const top=sheetStack[sheetStack.length-1];if(!top)return;
  const ok=await top.request(true);
  if(!ok||sheetStack.length){history.pushState({sh:1},'');histOn=true}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&sheetStack.length)sheetStack[sheetStack.length-1].request()});
const head=t=>'<div class="sheet-h"><span class="grab"></span><h2>'+esc(_(t))+'</h2><button class="ib close" aria-label="Close" type="button">✕</button></div>';

function choose({title,text,options}){return new Promise(res=>{let out=null;
  const sh=openSheet('<div class="dlg-b"><h2>'+esc(_(title))+'</h2>'+(text?'<p class="sub">'+esc(_(text))+'</p>':'')+'</div><div class="dlg-opts">'+options.map((o,i)=>'<button type="button" class="btn '+(o.kind||'')+'" data-i="'+i+'">'+esc(_(o.label))+'</button>').join('')+'</div>',{cls:'dlg',onClose:()=>res(out)});
  sh.el.addEventListener('click',e=>{const b=e.target.closest('button[data-i]');if(b){out=options[+b.dataset.i].id;sh.close()}})})}
const ask=o=>choose({title:o.title,text:o.text,options:[{id:true,label:o.ok||'OK',kind:o.danger?'danger fill':'pri'},{id:false,label:o.cancel||'Cancel'}]}).then(v=>v===true);
function askSelect({title,text,options,ok}){return new Promise(res=>{let out=null;
  const sh=openSheet('<div class="dlg-b"><h2>'+esc(_(title))+'</h2><p class="sub">'+esc(_(text))+'</p><select id="asSel">'+options.map(o=>'<option value="'+esc(o.v)+'">'+esc(o.label)+'</option>').join('')+'</select></div><div class="dlg-opts"><button type="button" class="btn pri" id="asOk">'+esc(_(ok||'OK'))+'</button><button type="button" class="btn close">'+esc(_('Cancel'))+'</button></div>',{cls:'dlg',onClose:()=>res(out)});
  $('#asOk',sh.el).onclick=()=>{out=$('#asSel',sh.el).value;sh.close()}})}

/* ----- theme & charts ----- */
function applyTheme(){
  const r=document.documentElement;if(D.theme==='auto')delete r.dataset.theme;else r.dataset.theme=D.theme;
  const cs=getComputedStyle(r);Chart.defaults.color=cs.getPropertyValue('--mut').trim();Chart.defaults.borderColor=cs.getPropertyValue('--bd').trim();
  const mc=document.querySelector('meta[name=theme-color]');if(mc)mc.content=cs.getPropertyValue('--bg').trim()||'#5b5bf0'}
function resetCharts(){for(const k in ch){ch[k].destroy();delete ch[k]}}
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const baseOpt=()=>({responsive:true,maintainAspectRatio:false,animation:{duration:reduceMotion?0:600,easing:'easeOutCubic'}});
const money=c=>' '+fmt(c.raw);

/* ----- animated numbers ----- */
function num(sel,v,cls){
  const el=typeof sel==='string'?$(sel):sel;if(!el)return;
  const from=el._v==null?0:el._v;el._v=v;cancelAnimationFrame(el._r);
  if(cls!=null)el.className=cls;
  if(reduceMotion||from===v){el.textContent=fmt(v);return}
  const t0=performance.now();
  const step=t=>{const p=Math.min(1,(t-t0)/480),e=1-Math.pow(1-p,3);el.textContent=fmt(from+(v-from)*e);if(p<1)el._r=requestAnimationFrame(step)};
  el._r=requestAnimationFrame(step)}

/* ----- segmented controls ----- */
function setSeg(seg,val){const btns=$$('button',seg);let i=btns.findIndex(b=>b.dataset.v===String(val));if(i<0)i=0;
  seg.style.setProperty('--i',i);btns.forEach((b,k)=>b.classList.toggle('on',k===i))}

/* ===================== render ===================== */
const TABNAME={home:'Overview',act:'Activity',ins:'Insights',wal:'Money'};
function render(){
  $('#hi').textContent=S.name?_('Hi, {n} 👋',{n:S.name}):'Spendly';
  $('#pageSub').textContent=_(TABNAME[tab]);
  paintAcctBtn();
  renderHome();renderAct();renderIns();renderWal();
}
function paintAcctBtn(){
  $('#acctFace').textContent=D.user?(D.user.name||D.user.email||'•').trim().charAt(0).toUpperCase():'☁';
  $('#acctDot').hidden=!(D.user&&D.err)}

function renderHome(){
  $('#monthbar').hidden=!(tab==='home'||(tab==='act'&&F.scope==='m'));
  const st=monthStats(M),[y,mo]=M.split('-').map(Number),dim=new Date(y,mo,0).getDate(),td=todayStr(),isCur=M===td.slice(0,7),elapsed=isCur?+td.slice(8):dim;
  $('#mo').textContent=mname(M);$('#heroMo').textContent=new Date(M+'-15').toLocaleDateString(loc(),{month:'long'});
  $('#goNow').classList.toggle('show',!isCur);
  num('#kSpent',st.sp);num('#kInc',st.inc);
  num('#kBal',st.inc-st.sp,st.inc-st.sp>=0?'pos':'neg');
  const left=S.budget?S.budget-st.sp:null;
  $('#k4l').textContent=S.budget?_('Budget left'):_('Avg / day');
  num('#k4',S.budget?left:st.sp/Math.max(elapsed,1),left!==null&&left<0?'neg':'');
  const p=S.budget?st.sp/S.budget*100:0,bar=$('#heroBar');
  requestAnimationFrame(()=>{bar.style.width=Math.min(p,100)+'%';bar.style.background=p>100?'var(--bad)':p>=80?'var(--warn)':'var(--ac)'});
  $('#heroTxt').innerHTML=S.budget?(p>100?'<span class="neg">'+esc(_('Over budget by {x}',{x:fmt(st.sp-S.budget)}))+'</span>':esc(_('{p}% of your {b} budget',{p:Math.round(p),b:fmt(S.budget)}))):'<a href="#" id="setBud" style="color:var(--ac)">'+esc(_('Set a monthly budget'))+'</a>';
  renderPlan();

  const ids=Object.keys(st.bc).sort((a,b)=>st.bc[b]-st.bc[a]);
  $('#cv1').hidden=!ids.length;$('#em1').hidden=!!ids.length;
  if(ids.length){
    const data={labels:ids.map(i=>cat(i).emoji+' '+cname(cat(i))),datasets:[{data:ids.map(i=>st.bc[i]),backgroundColor:ids.map(i=>cat(i).color),borderWidth:2,borderColor:css('--card')}]};
    if(!ch.c1){ch.c1=new Chart($('#c1'),{type:'doughnut',data,options:{...baseOpt(),cutout:'62%',plugins:{legend:{position:'bottom',labels:{boxWidth:10}},tooltip:{callbacks:{label:c=>money(c)+' ('+Math.round(c.raw/Math.max(1,ch.c1._sum)*100)+'%)'}}},
      onClick:(e,el)=>{if(el.length){F.cat=ch.c1._ids[el[0].index];F.scope='m';F.type='all';buzz();showTab('act')}}}})}
    else{ch.c1.data=data;ch.c1.update()}
    ch.c1._ids=ids;ch.c1._sum=st.sp}
  const daily=Array(dim).fill(0);
  for(const t of S.tx)if(t.type==='e'&&t.date.startsWith(M))daily[+t.date.slice(8)-1]+=base(t);
  let run=0;const cum=daily.map((v,i)=>{run+=v;return isCur&&i+1>elapsed?null:run}),ac=css('--ac');
  const ds=[{label:_('Spent'),data:cum,borderColor:ac,backgroundColor:ac+'33',fill:true,tension:.3,pointRadius:0}];
  if(S.budget)ds.push({label:_('Budget'),data:Array(dim).fill(S.budget),borderColor:'#ef4444',borderDash:[6,4],pointRadius:0,fill:false});
  const d3={labels:daily.map((_x,i)=>i+1),datasets:ds};
  if(!ch.c3)ch.c3=new Chart($('#c3'),{type:'line',data:d3,options:{...baseOpt(),interaction:{mode:'index',intersect:false},plugins:{legend:{position:'bottom',labels:{boxWidth:10}},tooltip:{callbacks:{label:c=>' '+c.dataset.label+': '+fmt(c.raw)}}},scales:{y:{beginAtZero:true,ticks:{callback:v=>fmt(v)}}}}});
  else{ch.c3.data=d3;ch.c3.update()}
  // budgets
  const all=S.cats.map(c=>c.id).concat(ids.filter(i=>!S.cats.some(c=>c.id===i)));
  const rows=all.filter(i=>st.bc[i]||cat(i).limit).sort((a,b)=>(st.bc[b]||0)-(st.bc[a]||0));
  $('#bg').innerHTML=rows.map(i=>{const c=cat(i),v=st.bc[i]||0,pc=c.limit?v/c.limit*100:(st.sp?v/st.sp*100:0),over=c.limit&&v>c.limit,warn=c.limit&&!over&&pc>=80;
    return '<div><div class="bl"><span>'+c.emoji+' '+esc(cname(c))+'</span><span class="'+(over?'neg':warn?'warn':'')+'">'+esc(fmt(v))+(c.limit?' / '+esc(fmt(c.limit)):' · '+Math.round(pc)+'%')+'</span></div><div class="bar"><i data-w="'+Math.min(pc,100)+'" style="background:'+(over?'var(--bad)':warn?'var(--warn)':c.color)+'"></i></div></div>'}).join('')||'<p class="sub">'+esc(_('Nothing to show yet. Spending and category budgets appear here.'))+'</p>';
  requestAnimationFrame(()=>$$('#bg .bar i').forEach(i=>i.style.width=i.dataset.w+'%'));
}

/* ----- Activity ----- */
function filtered(){const q=F.q.trim().toLowerCase();
  return S.tx.filter(t=>(F.scope==='all'||t.date.startsWith(M))&&(F.type==='all'||t.type===F.type)&&(!F.cat||t.cat===F.cat)&&(!F.acc||t.acc===F.acc||t.to===F.acc)&&
    (!q||(t.note||'').toLowerCase().includes(q)||(t.type==='e'&&(cat(t.cat).name.toLowerCase().includes(q)||cname(cat(t.cat)).toLowerCase().includes(q)))||acc(t.acc).name.toLowerCase().includes(q)))
    .sort((a,b)=>b.date.localeCompare(a.date)||(b.u||0)-(a.u||0)||String(b.id).localeCompare(String(a.id)))}
function txRow(t){
  const a=acc(t.acc),multi=S.accs.length>1;let ic,color,title,sub,amt,cls,alt='';
  if(t.type==='t'){const to=acc(t.to);ic='⇄';color='var(--ac)';title=t.note||_('Transfer');sub=a.name+' → '+to.name;amt=fmt(t.amt,a.cur);cls='';if(to.cur!==a.cur)alt='→ '+fmt(t.amt2||t.amt,to.cur)}
  else if(t.type==='i'){ic='💰';color='#22c55e';title=t.note||_('Income');sub=_('Income')+(multi?' · '+a.name:'');amt='+'+fmt(t.amt,a.cur);cls='pos'}
  else{const c=cat(t.cat);ic=c.emoji;color=c.color;title=t.note||cname(c);sub=cname(c)+(multi?' · '+a.name:'');amt='−'+fmt(t.amt,a.cur);cls='neg'}
  return '<div class="tx'+(t.id===lastAdded?' new':'')+'" data-id="'+esc(t.id)+'" role="button" tabindex="0"><div class="ic" style="background:'+color+'33">'+ic+'</div><div class="m"><div class="t">'+esc(title)+(t.rid?'<span class="rep" title="'+esc(_('Repeating'))+'">↻</span>':'')+(t.pic?'<span class="rep" title="'+esc(_('Receipt'))+'">📎</span>':'')+'</div><div class="sub">'+esc(sub)+'</div></div><b class="'+cls+'">'+esc(amt)+(alt?'<span class="alt">'+esc(alt)+'</span>':'')+'</b></div>'}
function renderAct(){
  $('#monthbar').hidden=!(tab==='home'||(tab==='act'&&F.scope==='m'));
  setSeg($('#fScope'),F.scope);
  $('#fCat').innerHTML='<option value="">'+esc(_('All categories'))+'</option>'+S.cats.map(c=>'<option value="'+esc(c.id)+'"'+(F.cat===c.id?' selected':'')+'>'+c.emoji+' '+esc(cname(c))+'</option>').join('');
  $('#fAcc').innerHTML='<option value="">'+esc(_('All wallets'))+'</option>'+S.accs.map(a=>'<option value="'+esc(a.id)+'"'+(F.acc===a.id?' selected':'')+'>'+esc(a.name)+'</option>').join('');
  $('#fAcc').parentElement.style.gridTemplateColumns=S.accs.length>1?'':'1fr 1fr';$('#fAcc').hidden=S.accs.length<2;
  $('#fType').value=F.type;if($('#q').value!==F.q)$('#q').value=F.q;
  const r=filtered();let sp=0,inc=0;for(const t of r){if(t.type==='e')sp+=base(t);else if(t.type==='i')inc+=base(t)}
  const anyF=F.cat||F.type!=='all'||F.acc||F.q;
  $('#fSum').innerHTML=esc((F.scope==='m'?mname(M):_('All time'))+' · '+_(r.length===1?'{n} item':'{n} items',{n:r.length})+(r.length?' · '+_('spent {x}',{x:fmt(sp)})+(inc?' · '+_('income {x}',{x:fmt(inc)}):''):''))+(anyF?' · <a href="#" id="clrF" style="color:var(--ac)">'+esc(_('clear filters'))+'</a>':'');
  if(!r.length){$('#ls').innerHTML='<div class="empty"><p>'+esc(S.tx.length?_('Nothing matches these filters.'):_('No transactions yet.'))+'</p><button class="btn pri" data-act="add">'+esc(_('Add a transaction'))+'</button></div>';return}
  let html='',day='',dayTot=0,buf=[];
  const flush=()=>{if(buf.length)html+='<div class="day"><span>'+new Date(day+'T12:00').toLocaleDateString(loc(),{weekday:'short',day:'numeric',month:'short'})+'</span><span>'+(dayTot?(dayTot<0?'−':'+')+esc(fmt(Math.abs(dayTot))):'')+'</span></div>'+buf.join('');buf=[];dayTot=0};
  for(const t of r.slice(0,shown)){if(t.date!==day){flush();day=t.date}buf.push(txRow(t));if(t.type==='e')dayTot-=base(t);else if(t.type==='i')dayTot+=base(t)}
  flush();
  if(r.length>shown)html+='<button class="btn more" id="more">'+esc(_('Show {n} more',{n:Math.min(120,r.length-shown)}))+'</button>';
  $('#ls').innerHTML=html;
  if(lastAdded){const id=lastAdded;lastAdded=null;setTimeout(()=>{const el=$('.tx[data-id="'+CSS.escape(id)+'"]');el&&el.scrollIntoView&&el.scrollIntoView({block:'nearest',behavior:reduceMotion?'auto':'smooth'})},60)}
}

/* ----- Insights ----- */
function renderIns(){
  setSeg($('#iRange'),insRange);
  const mm=monthMap(),cur=todayStr().slice(0,7),ms=[];for(let i=insRange-1;i>=0;i--)ms.push(shiftM(cur,-i));
  const data={labels:ms.map(mshort),datasets:[{label:_('Income'),data:ms.map(m=>(mm[m]||{inc:0}).inc),backgroundColor:ms.map(m=>m===M?'#16a34a':'#22c55e99'),borderRadius:5},{label:_('Expenses'),data:ms.map(m=>(mm[m]||{sp:0}).sp),backgroundColor:ms.map(m=>m===M?'#dc2626':'#ef444499'),borderRadius:5}]};
  if(tab==='ins'||ch.c2){
    if(!ch.c2)ch.c2=new Chart($('#c2'),{type:'bar',data,options:{...baseOpt(),plugins:{legend:{position:'bottom',labels:{boxWidth:10}},tooltip:{callbacks:{label:c=>' '+c.dataset.label+': '+fmt(c.raw)}}},scales:{y:{beginAtZero:true,ticks:{callback:v=>fmt(v)}}},onClick:(e,el)=>{if(el.length){M=ch.c2._ms[el[0].index];F.cat='';buzz();showTab('home')}}}});
    else{ch.c2.data=data;ch.c2.update()}
    ch.c2._ms=ms}
  $('#yLbl').textContent=insYear.toLocaleString(loc(),{useGrouping:false});
  let sp=0,inc=0,months=0;const bc={};
  for(const t of S.tx){if(t.type==='t'||!t.date.startsWith(insYear+'-'))continue;const v=base(t);if(t.type==='e'){sp+=v;bc[t.cat]=(bc[t.cat]||0)+v}else inc+=v}
  for(let m=1;m<=12;m++){const k=insYear+'-'+pad(m);if(mm[k]&&mm[k].sp>0)months++}
  $('#yKpi').innerHTML='<div><span class="sub">'+esc(_('Spent'))+'</span><b class="neg">'+esc(fmt(sp))+'</b></div><div><span class="sub">'+esc(_('Income'))+'</span><b class="pos">'+esc(fmt(inc))+'</b></div><div><span class="sub">'+esc(_('Avg / month'))+'</span><b>'+esc(fmt(months?sp/months:0))+'</b></div>';
  const top=Object.keys(bc).sort((a,b)=>bc[b]-bc[a]).slice(0,5);
  $('#yCats').innerHTML=top.map(i=>{const c=cat(i),p=sp?bc[i]/sp*100:0;return '<div><div class="bl"><span>'+c.emoji+' '+esc(cname(c))+'</span><span>'+esc(fmt(bc[i]))+' · '+Math.round(p)+'%</span></div><div class="bar"><i data-w="'+p+'" style="background:'+c.color+'"></i></div></div>'}).join('')||'<p class="sub">'+esc(_('No spending recorded in {y}.',{y:insYear}))+'</p>';
  let rows='';for(let m=12;m>=1;m--){const k=insYear+'-'+pad(m),o=mm[k];if(!o)continue;const net=o.inc-o.sp;
    rows+='<div class="tx" data-month="'+k+'" role="button" tabindex="0"><div class="m"><div class="t">'+esc(new Date(k+'-15').toLocaleDateString(loc(),{month:'long'}))+(k===M?' <span class="rep">● '+esc(_('selected'))+'</span>':'')+'</div><div class="sub">'+esc(_('Spent'))+' '+esc(fmt(o.sp))+' · '+esc(_('Income'))+' '+esc(fmt(o.inc))+'</div></div><b class="'+(net>=0?'pos':'neg')+'">'+(net>=0?'+':'−')+esc(fmt(Math.abs(net)))+'</b></div>'}
  $('#yTbl').innerHTML=rows||'<p class="sub">'+esc(_('No months with data in {y}.',{y:insYear}))+'</p>';
  requestAnimationFrame(()=>$$('#yCats .bar i').forEach(i=>i.style.width=i.dataset.w+'%'));
}

/* ----- Money: wallets, goals, loans, repeating ----- */
const FREQ={daily:'Every day',weekly:'Every week',monthly:'Every month',yearly:'Every year'};
function renderWal(){
  let tot=0;for(const a of S.accs)tot+=balance(a)*rate(a.cur);
  num('#wTot',tot,tot<0?'big neg':'big');
  const miss=S.accs.filter(needsRate);
  $('#wTotSub').innerHTML=esc(_(S.accs.length===1?'{n} wallet · shown in {c}':'{n} wallets · shown in {c}',{n:S.accs.length,c:S.cur}))+(miss.length?' · <span class="warn">'+esc(_('set exchange rate for {c}',{c:miss.map(a=>a.cur).filter((v,i,x)=>x.indexOf(v)===i).join(', ')}))+'</span>':'');
  $('#wXfer').hidden=S.accs.length<2;
  $('#wList').innerHTML=S.accs.map(a=>{const b=balance(a),conv=a.cur!==S.cur;
    return '<div class="tx" data-wal="'+esc(a.id)+'" role="button" tabindex="0"><div class="ic" style="background:var(--acs)">'+esc(a.emoji)+'</div><div class="m"><div class="t">'+esc(a.name)+'</div><div class="sub">'+esc(a.cur)+(needsRate(a)?' · <span class="warn">'+esc(_('needs exchange rate'))+'</span>':'')+'</div></div><b class="'+(b<0?'neg':'')+'">'+esc(fmt(b,a.cur))+(conv?'<span class="alt">≈ '+esc(fmt(b*rate(a.cur)))+'</span>':'')+'</b></div>'}).join('');
  renderGoals();renderDebts();
  const rs=S.rec.slice().sort((a,b)=>(b.on-a.on)||occ(a,a.n).localeCompare(occ(b,b.n)));
  $('#rList').innerHTML=rs.map(r=>{const c=r.type==='i'?{emoji:'💰',color:'#22c55e',name:_('Income')}:{...cat(r.cat),name:cname(cat(r.cat))},a=acc(r.acc);
    return '<div class="tx" data-rec="'+esc(r.id)+'" role="button" tabindex="0"><div class="ic" style="background:'+c.color+'33">'+c.emoji+'</div><div class="m"><div class="t">'+esc(r.note||c.name)+'</div><div class="sub">'+esc(_(FREQ[r.freq]))+' · '+esc(r.on?_('next {d}',{d:occ(r,r.n)}):_('ended or paused'))+'</div></div><b class="'+(r.type==='i'?'pos':'neg')+'">'+(r.type==='i'?'+':'−')+esc(fmt(r.amt,a.cur))+'</b></div>'}).join('')||'<p class="sub">'+esc(_('Rent, salary, subscriptions… set them once and they are added for you on time.'))+'</p>';
}

/* ----- tabs ----- */
function showTab(t){
  tab=t;$$('.tab').forEach(s=>s.classList.toggle('on',s.id==='tab-'+t));
  $$('.tb').forEach(b=>b.classList.toggle('on',b.dataset.tab===t));
  render();window.scrollTo({top:0});
  if(t==='ins'&&ch.c2)ch.c2.resize()}
