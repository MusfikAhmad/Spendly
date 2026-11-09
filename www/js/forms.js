'use strict';
/* ===================== Add / edit transaction ===================== */
function openTx(id,preset={}){
  const ex=id?S.tx.find(t=>t.id===id):null;if(id&&!ex)return;
  const pf=preset.prefill||{};
  const firstOther=a=>(S.accs.find(x=>x.id!==a)||{}).id||'';
  const T=ex?{...ex,amt:String(ex.amt),amt2:ex.type==='t'?String(ex.amt2||ex.amt):'',rep:'',end:'',to:ex.to||''}
    :{type:pf.type||preset.type||'e',amt:pf.amt?String(pf.amt):'',cat:(pf.cat&&S.cats.some(c=>c.id===pf.cat))?pf.cat:(S.cats.some(c=>c.id===D.lastCat)?D.lastCat:S.cats[0].id),acc:(pf.acc&&S.accs.some(a=>a.id===pf.acc))?pf.acc:(S.accs.some(a=>a.id===D.lastAcc)?D.lastAcc:S.accs[0].id),to:'',amt2:'',date:isDate(pf.date)?pf.date:todayStr(),note:pf.note||'',rep:preset.rep||'',end:''};
  let newPic=null,rmPic=false;
  if(T.type==='t'&&(!T.to||T.to===T.acc))T.to=firstOther(T.acc);
  if(T.type==='t'&&S.accs.length<2)T.type='e';
  let manual=!!ex&&ex.type==='t'&&ex.amt2&&ex.amt2!==ex.amt;
  const repBlock=ex?(ex.rid?'<div class="note" data-for="ei">↻ Part of a repeating series. Changes here only affect this one. <button type="button" class="btn sm" id="tRule" style="margin-top:8px">Edit the repeat rule</button></div>':''):
    '<div data-for="ei"><label>Repeat</label><select id="tRep"><option value="">Does not repeat</option>'+Object.keys(FREQ).map(k=>'<option value="'+k+'">'+FREQ[k]+'</option>').join('')+'</select><div id="tEndW" hidden><label>Stop on (optional)</label><input id="tEnd" type="date"></div></div>';
  const html=head(ex?'Edit transaction':'Add transaction')+
   '<div class="sheet-b" id="tb">'+(ex?'':'<div data-for="ei"><input id="tQuick" placeholder="Type or use the keyboard mic: lunch 250 yesterday" autocomplete="off" aria-label="Quick add" style="margin-bottom:12px"></div>')+'<div class="seg" id="tSeg" style="--n:3"><i class="thumb"></i><button type="button" data-v="e">Expense</button><button type="button" data-v="i">Income</button><button type="button" data-v="t">Transfer</button></div>'+
   '<div class="amtw" id="tAmtW"><span class="cur" id="tCur"></span><input id="tAmt" type="text" inputmode="decimal" step="any" min="0" placeholder="0" autocomplete="off" aria-label="Amount"></div>'+
   '<div data-for="e"><label>Category</label><div class="chips" id="tCats">'+S.cats.map(c=>'<button type="button" class="chip" data-c="'+esc(c.id)+'" style="--cc:'+c.color+';--cb:'+c.color+'2e">'+c.emoji+' '+esc(cname(c))+'</button>').join('')+'</div></div>'+
   '<label id="tAccL" for="tAcc">Wallet</label><select id="tAcc"></select>'+
   '<div data-for="t"><label for="tTo">To wallet</label><select id="tTo"></select><div id="tRecvW" hidden><label id="tRecvL" for="tAmt2"></label><input id="tAmt2" type="text" inputmode="decimal" step="any" min="0"></div></div>'+
   '<label for="tDate">Date</label><input id="tDate" type="date"><div class="quick"><button type="button" class="pill" data-d="0">Today</button><button type="button" class="pill" data-d="-1">Yesterday</button></div>'+
   '<label for="tNote">Note</label><input id="tNote" placeholder="Optional" maxlength="120" autocomplete="off">'+'<div data-for="ei" id="tPicW"><label>Receipt photo (optional)</label><div class="row" id="tPic"></div><input type="file" id="tPicIn" accept="image/*" hidden><input type="file" id="tCamIn" accept="image/*" capture="environment" hidden></div>'+repBlock+'</div>'+
   '<div class="sheet-f">'+(ex?'<button class="btn danger" id="tDel" type="button">Delete</button>':'')+'<button class="btn pri" id="tSave" type="button">'+(ex?'Save changes':'Add')+'</button></div>';
  const sh=openSheet(html,{focus:ex?null:'#tAmt',guard:()=>(!ex&&T.amt!=='')?ask({title:'Discard this transaction?',ok:'Discard',danger:true,cancel:'Keep editing'}):true});
  const el=sh.el,q=s=>$(s,el);
  q('#tAmt').value=T.amt;q('#tDate').value=T.date;q('#tNote').value=T.note||'';
  function paint(){
    const b=q('#tb');b.dataset.t=T.type;setSeg(q('#tSeg'),T.type);q('#tSeg').dataset.t=T.type;
    $$('[data-for]',b).forEach(n=>n.hidden=!n.dataset.for.includes(T.type));
    q('#tCur').textContent=acc(T.acc).cur;
    q('#tAccL').textContent=T.type==='t'?'From wallet':'Wallet';
    $$('.chip',el).forEach(c=>c.classList.toggle('on',c.dataset.c===T.cat));
    q('#tAcc').innerHTML=S.accs.map(a=>'<option value="'+esc(a.id)+'"'+(a.id===T.acc?' selected':'')+'>'+esc(a.emoji+' '+a.name+' · '+a.cur)+'</option>').join('');
    q('#tTo').innerHTML=S.accs.filter(a=>a.id!==T.acc).map(a=>'<option value="'+esc(a.id)+'"'+(a.id===T.to?' selected':'')+'>'+esc(a.emoji+' '+a.name+' · '+a.cur)+'</option>').join('');
    const diff=T.type==='t'&&T.to&&acc(T.to).cur!==acc(T.acc).cur;q('#tRecvW').hidden=!diff;
    if(diff){q('#tRecvL').textContent='They receive ('+acc(T.to).cur+')';
      if(!manual){const a=parseNum(T.amt);T.amt2=a>0?String(round2(a*rate(acc(T.acc).cur)/rate(acc(T.to).cur))):'';q('#tAmt2').value=T.amt2}else q('#tAmt2').value=T.amt2}
    const rp=q('#tRep');if(rp)q('#tEndW').hidden=!T.rep;const pw=q('#tPicW');if(pw)pw.hidden=!'ei'.includes(T.type)||!!T.rep}
  paint();
  q('#tSeg').onclick=e=>{const b=e.target.closest('button');if(!b)return;
    if(b.dataset.v==='t'&&S.accs.length<2){toast('Add a second wallet first (Wallets tab).');return}
    T.type=b.dataset.v;if(T.type==='t'&&(!T.to||T.to===T.acc))T.to=firstOther(T.acc);buzz(6);paint()};
  q('#tAmt').oninput=e=>{T.amt=e.target.value;if(T.type==='t'&&!manual&&!q('#tRecvW').hidden)paint()};
  q('#tAmt2').oninput=e=>{T.amt2=e.target.value;manual=true};
  q('#tCats').onclick=e=>{const c=e.target.closest('.chip');if(c){T.cat=c.dataset.c;buzz(5);paint()}};
  q('#tAcc').onchange=e=>{T.acc=e.target.value;if(T.to===T.acc)T.to=firstOther(T.acc);paint()};
  q('#tTo').onchange=e=>{T.to=e.target.value;paint()};
  q('#tDate').onchange=e=>{T.date=e.target.value};
  q('#tNote').oninput=e=>{T.note=e.target.value};
  const qk=q('#tQuick');
  if(qk){qk.value=pf.note&&pf.amt?'':'';qk.oninput=e=>{const r=parseQuick(e.target.value);if(!e.target.value.trim())return;
    if(r.amt>0){T.amt=String(r.amt);q('#tAmt').value=T.amt}
    if(T.type!=='t'){T.type=r.type;if(r.type==='e'&&r.cat)T.cat=r.cat}
    T.note=r.note;q('#tNote').value=T.note;T.date=r.date;q('#tDate').value=T.date;if(r.acc)T.acc=r.acc;paint()}}
  async function paintPic(){
    const box=q('#tPic'),has=(ex&&T.pic&&!rmPic)||newPic;
    if(has){let url='';try{const b=newPic||await picGet(ex.id);if(b)url=URL.createObjectURL(b)}catch(e){}
      box.innerHTML=(url?'<img alt="" class="thumbpic" src="'+url+'" id="tThumb">':'<span class="sub">'+esc(_('Receipt saved on another device'))+'</span>')+'<button type="button" class="btn sm" id="tPicRm">'+esc(_('Remove'))+'</button>';
      const th=q('#tThumb');if(th&&ex&&!newPic)th.onclick=()=>openPic(ex.id);
      q('#tPicRm').onclick=()=>{newPic=null;rmPic=true;T.pic=0;paintPic()}}
    else box.innerHTML='<button type="button" class="btn sm" id="tCam">📷 '+esc(_('Take photo'))+'</button><button type="button" class="btn sm" id="tGal">🖼 '+esc(_('Choose'))+'</button>';
    const cam=q('#tCam'),gal=q('#tGal');if(cam)cam.onclick=()=>q('#tCamIn').click();if(gal)gal.onclick=()=>q('#tPicIn').click()}
  const onPic=async e=>{const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;
    try{newPic=await compressImage(f);rmPic=false;T.pic=1;paintPic()}catch(x){toast(x.message||_('Could not read that image.'),{kind:'err'})}};
  q('#tPicIn').onchange=onPic;q('#tCamIn').onchange=onPic;paintPic();
  el.addEventListener('click',e=>{const p=e.target.closest('[data-d]');if(!p)return;const d=new Date();d.setDate(d.getDate()+ +p.dataset.d);T.date=dstr(d);q('#tDate').value=T.date;buzz(5)});
  const rp=q('#tRep');if(rp){rp.onchange=e=>{T.rep=e.target.value;paint()};q('#tEnd').onchange=e=>{T.end=e.target.value}}
  const rule=q('#tRule');if(rule)rule.onclick=async()=>{await sh.request();openRec(ex.rid)};
  q('#tSave').onclick=()=>{
    const amt=parseNum(T.amt);
    if(!(amt>0)){shake(q('#tAmtW'));q('#tAmt').focus();buzz(25);return}
    if(!isDate(T.date)){shake(q('#tDate'));buzz(25);return}
    if(T.type==='t'&&(!T.to||T.to===T.acc)){toast('Pick two different wallets.');return}
    const now=Date.now(),a=acc(T.acc),f={type:T.type,amt,cat:T.type==='e'?T.cat:'',acc:T.acc,date:T.date,note:(T.note||'').trim()};
    if(T.type==='t'){const to=acc(T.to),a2=parseNum(T.amt2);f.to=T.to;f.amt2=to.cur===a.cur?amt:(a2>0?a2:round2(amt*rate(a.cur)/rate(to.cur)))}
    D.lastAcc=T.acc;if(T.type==='e')D.lastCat=T.cat;saveDev();
    const before=f.type==='e'?monthStats(f.date.slice(0,7)):null;M=f.date.slice(0,7);buzz(12);
    const savePic=id=>{if(rmPic){picDel(id)}if(newPic&&!T.rep)picPut(id,newPic).catch(()=>toast(_('Could not save the photo.'),{kind:'err'}))};
    if(ex){Object.assign(ex,f);if(f.type!=='t'){delete ex.to;delete ex.amt2}if(rmPic)delete ex.pic;if(newPic)ex.pic=1;if(f.type==='t'){delete ex.pic}ex.u=now;lastAdded=ex.id;savePic(ex.id);persist();sh.close();render();if(before)budgetAlerts(before,M);toast('Saved');return}
    if(T.rep&&T.type!=='t'){
      const r={id:uid('r'),type:T.type,amt,cat:f.cat,acc:T.acc,note:f.note,freq:T.rep,start:T.date,end:isDate(T.end)&&T.end>=T.date?T.end:'',n:0,on:true,u:now};
      S.rec.push(r);const n=runRecurring();persist();if(n)lastAdded='t'+r.id+'_'+T.date;
      sh.close();render();toast(n?_('Added · repeats {f}',{f:_(FREQ[r.freq]).toLowerCase()}):_('Scheduled · first one on {d}',{d:T.date}));return}
    const t={id:uid('t'),...f,u:now};if(newPic)t.pic=1;S.tx.push(t);lastAdded=t.id;savePic(t.id);persist();sh.close();render();if(before)budgetAlerts(before,M);
    toast('Added',{action:'Undo',fn:()=>{removeTx(t.id);persist();render()}});
  };
  const del=q('#tDel');
  if(del)del.onclick=async()=>{
    const row=tab==='act'?$('#ls .tx[data-id="'+CSS.escape(ex.id)+'"]'):null;
    await sh.request();
    if(row){row.classList.add('out');await sleep(210)}
    const t=removeTx(ex.id);persist();render();buzz(15);
    toast('Deleted',{action:'Undo',fn:()=>{restoreTx(t);lastAdded=t.id;persist();render()}})};
}

/* ===================== Wallets ===================== */
function openWallet(id){
  const ex=id?S.accs.find(a=>a.id===id):null;if(id&&!ex)return;
  const W=ex?{...ex,open:String(ex.open||0)}:{name:'',emoji:WALLET_EMOJI[S.accs.length%WALLET_EMOJI.length],cur:S.cur,open:'0'};
  let rt=S.rates[W.cur]?String(S.rates[W.cur]):'';
  const html=head(ex?'Edit wallet':'New wallet')+'<div class="sheet-b">'+
   '<label for="wName">Name</label><input id="wName" maxlength="30" placeholder="Cash, bKash, Bank…" autocomplete="off">'+
   '<label>Icon</label><div class="chips" id="wEm">'+WALLET_EMOJI.map(e=>'<button type="button" class="chip" data-e="'+e+'" style="--cc:var(--ac);--cb:var(--acs)">'+e+'</button>').join('')+'</div>'+
   '<label for="wCur">Currency</label><select id="wCur">'+CURRENCIES.map(c=>'<option'+(c===W.cur?' selected':'')+'>'+c+'</option>').join('')+'</select>'+
   '<div id="wRate" class="rate" hidden></div>'+
   '<label for="wOpen">Balance when you start tracking</label><input id="wOpen" type="text" inputmode="decimal" step="any"></div>'+
   '<div class="sheet-f">'+(ex&&S.accs.length>1?'<button class="btn danger" id="wDel" type="button">Delete</button>':'')+'<button class="btn pri" id="wSave" type="button">'+(ex?'Save':'Add wallet')+'</button></div>';
  const sh=openSheet(html,{focus:ex?null:'#wName'}),el=sh.el,q=s=>$(s,el);
  q('#wName').value=W.name;q('#wOpen').value=W.open;
  const paint=()=>{$$('.chip',el).forEach(c=>c.classList.toggle('on',c.dataset.e===W.emoji));
    const r=q('#wRate');r.hidden=W.cur===S.cur;if(!r.hidden){r.innerHTML='<span>1 '+esc(W.cur)+' =</span><input id="wRt" type="text" inputmode="decimal" step="any" min="0" value="'+esc(rt)+'"><span>'+esc(S.cur)+'</span>';q('#wRt').oninput=e=>{rt=e.target.value}}};
  paint();
  q('#wEm').onclick=e=>{const c=e.target.closest('.chip');if(c){W.emoji=c.dataset.e;paint()}};
  q('#wCur').onchange=e=>{W.cur=e.target.value;rt=S.rates[W.cur]?String(S.rates[W.cur]):'';paint()};
  q('#wSave').onclick=()=>{
    const name=q('#wName').value.trim();if(!name){shake(q('#wName'));q('#wName').focus();return}
    if(S.accs.some(a=>a.id!==(ex&&ex.id)&&a.name.toLowerCase()===name.toLowerCase())){toast('You already have a wallet with that name.');return}
    if(W.cur!==S.cur&&!(parseNum(rt)>0)){shake(q('#wRate'));toast('Enter the exchange rate for '+W.cur+'.');return}
    const now=Date.now(),open=parseNum(q('#wOpen').value)||0;
    if(W.cur!==S.cur){S.rates[W.cur]=parseNum(rt);S.su=now}
    if(ex){Object.assign(ex,{name,emoji:W.emoji,cur:W.cur,open,u:now})}else S.accs.push({id:uid('a'),name,emoji:W.emoji,cur:W.cur,open,u:now});
    persist();sh.close();render();toast(ex?'Wallet saved':'Wallet added')};
  const d=q('#wDel');
  if(d)d.onclick=async()=>{
    const used=S.tx.filter(t=>t.acc===ex.id||t.to===ex.id).length+S.rec.filter(r=>r.acc===ex.id).length;
    let to=null;
    if(used){to=await askSelect({title:_('Delete “{n}”?',{n:ex.name}),text:_(used>1?'{n} transactions use this wallet. Move them to:':'1 transaction uses this wallet. Move it to:',{n:used}),options:S.accs.filter(a=>a.id!==ex.id).map(a=>({v:a.id,label:a.emoji+' '+a.name+' · '+a.cur})),ok:'Move & delete'});if(!to)return}
    else if(!(await ask({title:_('Delete “{n}”?',{n:ex.name}),ok:'Delete',danger:true})))return;
    snapshot();if(to)moveWallet(ex.id,to);
    S.accs=S.accs.filter(a=>a.id!==ex.id);tomb(ex.id);persist();await sh.request();render();
    toast('Wallet deleted',{action:'Undo',fn:()=>{restoreSnapshot();render()}})};
}

/* ===================== Repeating rules ===================== */
function openRec(id){
  const r=S.rec.find(x=>x.id===id);if(!r)return;
  const R={...r,amt:String(r.amt)};
  const html=head('Repeating '+(r.type==='i'?'income':'expense'))+'<div class="sheet-b">'+
   '<p class="sub">'+FREQ[r.freq]+' since '+esc(r.start)+(r.on?' · next '+esc(occ(r,r.n)):'')+'</p>'+
   '<label for="rAmt">Amount ('+esc(acc(r.acc).cur)+')</label><input id="rAmt" type="text" inputmode="decimal" step="any" min="0">'+
   (r.type==='e'?'<label for="rCat">Category</label><select id="rCat">'+S.cats.map(c=>'<option value="'+esc(c.id)+'"'+(c.id===r.cat?' selected':'')+'>'+c.emoji+' '+esc(c.name)+'</option>').join('')+'</select>':'')+
   '<label for="rAcc">Wallet</label><select id="rAcc">'+S.accs.map(a=>'<option value="'+esc(a.id)+'"'+(a.id===r.acc?' selected':'')+'>'+esc(a.emoji+' '+a.name+' · '+a.cur)+'</option>').join('')+'</select>'+
   '<label for="rNote">Note</label><input id="rNote" maxlength="120" autocomplete="off">'+
   '<label for="rEnd">Stop on (optional)</label><input id="rEnd" type="date">'+
   '<label class="inl">Active<span class="switch"><input type="checkbox" id="rOn"><i></i></span></label>'+
   '<div class="note">Changes apply to future entries only. Entries already added stay as they are.</div></div>'+
   '<div class="sheet-f"><button class="btn danger" id="rDel" type="button">Delete rule</button><button class="btn pri" id="rSave" type="button">Save</button></div>';
  const sh=openSheet(html),el=sh.el,q=s=>$(s,el);
  q('#rAmt').value=R.amt;q('#rNote').value=R.note||'';q('#rEnd').value=R.end||'';q('#rOn').checked=r.on;
  q('#rSave').onclick=()=>{
    const amt=parseNum(q('#rAmt').value);if(!(amt>0)){shake(q('#rAmt'));return}
    const end=q('#rEnd').value;if(end&&(!isDate(end)||end<r.start)){toast('The stop date must be after the start date.');return}
    r.amt=amt;r.note=q('#rNote').value.trim();r.end=end;r.acc=q('#rAcc').value;if(r.type==='e')r.cat=q('#rCat').value;
    const on=q('#rOn').checked;
    if(on&&!r.on){let g=0;while(occ(r,r.n)<=todayStr()&&g++<5000)r.n++} // resuming skips what was missed while paused
    r.on=on;if(r.on&&r.end&&occ(r,r.n)>r.end)r.on=false;
    r.u=Date.now();persist();sh.close();render();toast('Repeat rule saved')};
  q('#rDel').onclick=async()=>{
    if(!(await ask({title:'Delete this repeat rule?',text:'No more entries will be added. Entries already added stay.',ok:'Delete rule',danger:true})))return;
    S.rec=S.rec.filter(x=>x.id!==r.id);tomb(r.id);persist();await sh.request();render();toast('Rule deleted')};
}

/* ===================== Settings (edits a draft; Save applies, ✕ discards) ===================== */
function openSettings(focusBudget){
  const d={name:S.name,cur:S.cur,budget:S.budget,theme:D.theme,lang:D.lang,rem:{...D.rem},assist:!!D.assist.auto,cats:clone(S.cats),rates:{...S.rates}},init=JSON.stringify(d),moves={};
  const html=head('Settings')+'<div class="sheet-b">'+
   '<div class="sec">Profile</div><label for="sName">Your name</label><input id="sName" maxlength="40" autocomplete="off">'+
   '<label for="sCur">Main currency</label><select id="sCur">'+CURRENCIES.map(c=>'<option'+(c===d.cur?' selected':'')+'>'+c+'</option>').join('')+'</select>'+
   '<div class="note w" id="sCurNote" hidden>Changing the currency relabels your amounts. It does not convert them.</div>'+
   '<label for="sBud">Overall monthly budget (0 = none)</label><input id="sBud" type="text" inputmode="decimal" min="0">'+
   '<div class="sec">Appearance</div><div class="seg" id="sTheme" style="--n:3"><i class="thumb"></i><button type="button" data-v="auto">Auto</button><button type="button" data-v="light">Light</button><button type="button" data-v="dark">Dark</button></div>'+
   '<div class="sec">Language</div><div class="seg" id="sLang" style="--n:2"><i class="thumb"></i><button type="button" data-v="en">English</button><button type="button" data-v="bn">বাংলা</button></div>'+
   '<div class="sec">Categories</div><div id="sCats"></div><button type="button" class="btn" id="sAddCat" style="margin-top:6px">+ Add category</button>'+
   '<div id="sRatesW"></div>'+
   '<div class="sec">Reminders</div><label class="inl">Remind me the day before a bill is due<span class="switch"><input type="checkbox" id="sRemB"><i></i></span></label><label class="inl">Daily reminder at 9 pm to log spending<span class="switch"><input type="checkbox" id="sRemD"><i></i></span></label>'+
   '<div class="sec">Assistants &amp; shortcuts</div><label class="inl">Let assistants add without asking<span class="switch"><input type="checkbox" id="sAuto"><i></i></span></label>'+
   '<p class="sub" id="sAutoInfo"></p>'+
   '<div class="sec">Security</div><div id="sSec"></div></div>'+
   '<div class="sheet-f"><button class="btn close" type="button">Cancel</button><button class="btn pri" id="sSave" type="button">Save</button></div>';
  const sh=openSheet(html,{guard:()=>JSON.stringify(d)===init?true:ask({title:'Discard your changes?',ok:'Discard',danger:true,cancel:'Keep editing'})}),el=sh.el,q=s=>$(s,el);
  q('#sName').value=d.name;q('#sBud').value=d.budget||0;setSeg(q('#sTheme'),d.theme);setSeg(q('#sLang'),d.lang);
  q('#sRemB').checked=d.rem.bills;q('#sRemD').checked=d.rem.daily;q('#sAuto').checked=d.assist;
  q('#sAutoInfo').textContent=_('Share a message like “spent 250 on lunch” to Spendly from any app, or long-press the app icon for quick shortcuts. Links like spendly://add?amount=250&category=Food&note=Lunch open a pre-filled form. They only save straight away if the switch above is on and the link ends with &auto=1.');
  q('#sLang').onclick=e=>{const b=e.target.closest('button');if(b){d.lang=b.dataset.v;setSeg(q('#sLang'),d.lang)}};
  q('#sRemB').onchange=e=>d.rem.bills=e.target.checked;q('#sRemD').onchange=e=>d.rem.daily=e.target.checked;q('#sAuto').onchange=e=>d.assist=e.target.checked;
  let bioOK=false;
  const paintSec=()=>{const b=q('#sSec');
    if(!D.lock.on){b.innerHTML='<p class="sub">'+esc(_('Ask for a PIN every time you open Spendly. This is a privacy lock, not encryption.'))+'</p><button class="btn block" id="secOn" type="button">'+esc(_('Set up app lock'))+'</button>';q('#secOn').onclick=async()=>{await setupLock();paintSec()}}
    else{b.innerHTML='<p class="sub">'+esc(_('App lock is on.'))+'</p>'+(bioOK?'<label class="inl">'+esc(_('Unlock with fingerprint'))+'<span class="switch"><input type="checkbox" id="secBio"'+(D.lock.bio?' checked':'')+'><i></i></span></label>':'')+'<div class="stack"><button class="btn block" id="secChg" type="button">'+esc(_('Change PIN'))+'</button><button class="btn danger block" id="secOff" type="button">'+esc(_('Turn off app lock'))+'</button></div>';
      const bio=q('#secBio');if(bio)bio.onchange=e=>{D.lock.bio=e.target.checked;saveDev()};
      q('#secChg').onclick=async()=>{if(!(await verifyPin('Enter your current PIN')))return;const old={...D.lock};D.lock={...D.lock,on:false};const ok=await setupLock();if(!ok){D.lock=old;saveDev()}paintSec()};
      q('#secOff').onclick=async()=>{if(await verifyPin('Enter your PIN to turn off app lock')){D.lock={...D.lock,on:false,h:'',s:'',bio:false};saveDev();toast(_('App lock is off'));paintSec()}}}};
  paintSec();bioAvailable().then(v=>{bioOK=v;paintSec()});
  const paintCats=()=>{q('#sCats').innerHTML=d.cats.map((c,i)=>'<div class="crow"><div class="l1"><input class="em" data-k="emoji" data-i="'+i+'" value="'+esc(c.emoji)+'" maxlength="4" aria-label="Emoji"><input data-k="name" data-i="'+i+'" value="'+esc(c.name)+'" maxlength="30" aria-label="Name"><input type="color" data-k="color" data-i="'+i+'" value="'+esc(c.color)+'" aria-label="Colour"><button type="button" class="ib" data-rm="'+i+'" aria-label="Delete category">✕</button></div><div class="l2"><span>Monthly budget</span><input type="text" inputmode="decimal" min="0" data-k="limit" data-i="'+i+'" value="'+(+c.limit||0)+'" style="max-width:130px"></div></div>').join('')};
  const paintRates=()=>{const curs=[...new Set(S.accs.map(a=>a.cur))].filter(c=>c!==d.cur);
    q('#sRatesW').innerHTML=curs.length?'<div class="sec">Exchange rates</div><p class="sub">Used to add up wallets in different currencies.</p>'+curs.map(c=>'<div class="rate"><span>1 '+esc(c)+' =</span><input type="text" inputmode="decimal" step="any" min="0" data-rate="'+c+'" value="'+esc(d.rates[c]||'')+'"><span>'+esc(d.cur)+'</span></div>').join(''):''};
  paintCats();paintRates();
  q('#sName').oninput=e=>d.name=e.target.value;q('#sBud').oninput=e=>d.budget=Math.max(0,parseNum(e.target.value)||0);
  q('#sCur').onchange=e=>{d.cur=e.target.value;q('#sCurNote').hidden=d.cur===S.cur;paintRates()};
  q('#sTheme').onclick=e=>{const b=e.target.closest('button');if(b){d.theme=b.dataset.v;setSeg(q('#sTheme'),d.theme)}};
  q('#sCats').oninput=e=>{const k=e.target.dataset.k;if(k)d.cats[+e.target.dataset.i][k]=k==='limit'?Math.max(0,parseNum(e.target.value)||0):e.target.value};
  q('#sRatesW').oninput=e=>{const c=e.target.dataset.rate;if(c)d.rates[c]=parseNum(e.target.value)||0};
  q('#sAddCat').onclick=()=>{d.cats.push({id:uid('c'),name:'New category',emoji:'⭐',color:'#6366f1',limit:0,u:Date.now()});paintCats();const n=$$('.crow',el).pop();n&&n.scrollIntoView({block:'center',behavior:'smooth'})};
  q('#sCats').onclick=async e=>{const b=e.target.closest('[data-rm]');if(!b)return;const i=+b.dataset.rm,c=d.cats[i];
    if(d.cats.length<=1){toast('Keep at least one category.');return}
    const feeders=Object.keys(moves).filter(k=>moves[k]===c.id),used=S.tx.filter(t=>t.cat===c.id).length+S.rec.filter(r=>r.cat===c.id).length+feeders.length;
    if(used){const to=await askSelect({title:_('Delete “{n}”?',{n:c.name}),text:'Transactions in this category will be moved to:',options:d.cats.filter((x,k)=>k!==i).map(x=>({v:x.id,label:x.emoji+' '+x.name})),ok:'Move & delete'});if(!to)return;moves[c.id]=to;feeders.forEach(k=>moves[k]=to)}
    else if(!(await ask({title:_('Delete “{n}”?',{n:c.name}),ok:'Delete',danger:true})))return;
    d.cats.splice(i,1);paintCats()};
  if(focusBudget)setTimeout(()=>q('#sBud').focus(),340);
  q('#sSave').onclick=()=>{
    if(d.cats.some(c=>!String(c.name).trim())){toast('Every category needs a name.');return}
    const now=Date.now(),keep=new Set(d.cats.map(c=>c.id)),fin=id=>{let g=0;while(moves[id]&&g++<50)id=moves[id];return keep.has(id)?id:d.cats[0].id};
    snapshot();
    for(const id of Object.keys(moves))if(!keep.has(id))moveCategory(id,fin(id));
    for(const c of S.cats)if(!keep.has(c.id))tomb(c.id);
    const sig=c=>JSON.stringify([c.name,c.emoji,c.color,c.limit]),old=new Map(S.cats.map(c=>[c.id,sig(c)]));
    S.cats=d.cats.map(c=>{const n={...c,name:String(c.name).trim().slice(0,30),emoji:(String(c.emoji).trim()||'⭐').slice(0,4)};n.u=old.get(n.id)===sig(n)?(c.u||0):now;return n});
    if(d.cur!==S.cur){if(S.accs.every(a=>a.cur===S.cur))for(const a of S.accs){a.cur=d.cur;a.u=now}S.rates={};S.cur=d.cur}
    else{const curs=new Set(S.accs.map(a=>a.cur));for(const c of curs)if(c!==S.cur&&d.rates[c]>0)S.rates[c]=d.rates[c]}
    S.name=d.name.trim();S.budget=d.budget;S.su=now;
    const themeChanged=D.theme!==d.theme;D.theme=d.theme;
    const langChanged=D.lang!==d.lang;D.lang=d.lang;
    const remOn=(d.rem.bills||d.rem.daily)&&!(D.rem.bills||D.rem.daily);D.rem={...d.rem};D.assist={...D.assist,auto:d.assist};saveDev();
    if(themeChanged){applyTheme();resetCharts()}
    if(langChanged){applyLang();resetCharts()}
    if(remOn)notifPermission(true).then(ok=>{if(!ok)toast(_('Notifications are blocked. Turn them on in Android settings to get reminders.'),{ms:6000})});
    remindersSoon();
    persist();sh.close();render();toast('Settings saved')};
}

/* ===================== Backup & account ===================== */
function fileStamp(){return todayStr()}
async function exportFile(name,text,mime){
  const P=window.Capacitor&&Capacitor.Plugins;
  if(P&&P.Filesystem&&P.Share){
    try{const f=await P.Filesystem.writeFile({path:name,data:text,directory:'CACHE',encoding:'utf8'});await P.Share.share({title:name,url:f.uri});return}
    catch(e){if(/cancel|dismiss/i.test(String(e&&e.message||e)))return}}
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type:mime}));a.download=name;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
const undoSnap=()=>{if(restoreSnapshot()){render();toast('Undone')}};
async function handleImport(name,text){
  try{
    if(/\.csv$/i.test(name)||!/^\s*[\[{]/.test(text)){
      snapshot();const r=importCSV(text);persist();render();
      toast('Imported '+r.added+(r.dupes?' · '+r.dupes+' already here':'')+(r.skipped?' · '+r.skipped+' skipped':''),{action:r.added?'Undo':null,fn:undoSnap,ms:6000});return}
    const st={},inc=parseBackup(text,st);
    const pick=await choose({title:'Import this backup?',text:inc.tx.length+' transaction'+(inc.tx.length===1?'':'s')+' in the file'+(st.dropped?' ('+st.dropped+' invalid skipped)':'')+'.',
      options:[{id:'merge',label:'Add to my data',kind:'pri'},{id:'replace',label:'Replace my data',kind:'danger'},{id:null,label:'Cancel'}]});
    if(!pick)return;
    snapshot();S=pick==='merge'?mergeData(S,inc):inc;persist();runRecurring();render();toast('Imported',{action:'Undo',fn:undoSnap,ms:6000});
  }catch(e){toast(e.message||'Could not read that file.',{kind:'err',ms:5000})}}
function pickImport(){const f=$('#fileIn');f.value='';f.click()}
function loadSample(){
  snapshot();let s=7;const r=()=>(s=(s*9301+49297)%233280)/233280,now=new Date(),a=S.accs[0].id,u=Date.now();
  for(let m=0;m<3;m++)for(let k=0;k<22;k++){const d=new Date(now.getFullYear(),now.getMonth()-m,1+Math.floor(r()*27));if(d>now)continue;const c=S.cats[Math.floor(r()*S.cats.length)];
    S.tx.push({id:uid('t')+'s'+m+'_'+k,type:'e',amt:Math.round((80+r()*r()*2500)/10)*10,cat:c.id,acc:a,date:dstr(d),note:c.name+' expense',u,smp:1})}
  for(let m=0;m<3;m++)S.tx.push({id:uid('t')+'sal'+m,type:'i',amt:45000,cat:'',acc:a,date:dstr(new Date(now.getFullYear(),now.getMonth()-m,1)),note:'Salary',u,smp:1});
  persist();render()}
function removeSample(){snapshot();for(const t of S.tx.filter(t=>t.smp))removeTx(t.id);persist();render()}
function resetAll(){
  snapshot();const now=Date.now(),del={...S.del};
  S.tx.forEach(t=>del[t.id]=now);S.rec.forEach(r=>del[r.id]=now);S.goals.forEach(g=>del[g.id]=now);S.debts.forEach(b=>del[b.id]=now);picKeys().then(ks=>ks.forEach(picDel));S.accs.forEach(a=>{if(a.id!=='a0')del[a.id]=now});S.cats.forEach(c=>{if(!/^c[0-7]$/.test(c.id))del[c.id]=now});
  S=freshState();S.del=del;S.su=now;persist();render()}

let acctPaint=null;
function openAccount(){
  const sh=openSheet(head('Backup & account')+'<div class="sheet-b" id="aB"></div>',{onClose:()=>{acctPaint=null}}),b=$('#aB',sh.el);
  let busy='';
  const ago=ts=>{if(!ts)return 'never';const m=Math.round((Date.now()-ts)/60000);return m<1?'just now':m<60?m+' min ago':m<1440?Math.round(m/60)+' h ago':new Date(ts).toLocaleDateString()};
  const hasSample=S.tx.some(t=>t.smp);
  function paint(){
    let h='';
    h+='<div class="sec" style="margin-top:6px">Google Drive</div>';
    if(D.user){
      h+='<div class="who"><div class="avatar">'+esc((D.user.name||D.user.email||'?').charAt(0).toUpperCase())+'</div><div><b>'+esc(D.user.name||'Signed in')+'</b><div class="sub">'+esc(D.user.email||'')+'</div></div></div>'+
        '<p class="sub">Last synced: '+ago(D.last)+(!navigator.onLine?' · offline':'')+'</p>'+
        (D.err?'<div class="note w">Last sync failed: '+esc(D.err)+'</div>':'')+
        '<div class="stack"><button class="btn pri block" id="aSync" type="button"'+(busy?' disabled':'')+'>'+(busy==='sync'?'<span class="spin"></span>Syncing…':'Sync now')+'</button></div>'+
        '<label class="inl">Sync automatically<span class="switch"><input type="checkbox" id="aAuto"'+(D.auto?' checked':'')+'><i></i></span></label>'+
        '<p class="sub">Your data is saved in a private folder in your Drive that only Spendly can open. Syncing combines this phone with the backup, so nothing is overwritten.</p>'+
        '<div class="stack"><button class="btn block" id="aUp" type="button">Replace the backup with this phone</button><button class="btn block" id="aDown" type="button">Replace this phone with the backup</button><button class="btn block" id="aOut" type="button">Sign out</button></div>';
    }else if(!googleConfigured()){
      h+='<p class="sub">Signing in is optional. Spendly works fully without it and keeps your data on this phone.</p><div class="note">Google backup is not switched on in this build yet. Add your Google Web client ID in <b>www/js/config.js</b> (see SETUP-GOOGLE.md), then rebuild.</div>'}
    else if(!isNative()){h+='<p class="sub">Google sign-in works in the Android app.</p>'}
    else{h+='<p class="sub">Signing in is optional. Your data stays on this phone and keeps working offline. Sign in to back it up to your Google Drive and bring it to another phone.</p><div class="stack"><button class="btn pri block" id="aIn" type="button"'+(busy?' disabled':'')+'>'+(busy==='in'?'<span class="spin"></span>Signing in…':'Sign in with Google')+'</button></div>'}
    h+='<div class="sec">Backup file</div><p class="sub">A copy you can keep anywhere. Import it later on any phone. Receipt photos stay on this phone and are not included in backups.</p><div class="stack"><button class="btn block" id="aExp" type="button">Export backup file</button><button class="btn block" id="aImp" type="button">Import a file (backup or CSV)</button><button class="btn block" id="aCsv" type="button">Export spreadsheet (CSV)</button></div>'+
      '<div class="sec">Data</div><div class="stack"><button class="btn block" id="aSmp" type="button">'+(hasSample?'Remove sample data':'Load sample data')+'</button><button class="btn danger block" id="aRst" type="button">Delete all data</button></div>';
    b.innerHTML=h;wire()}
  acctPaint=paint;
  const run=async(kind,fn)=>{busy=kind;paint();try{await fn()}catch(e){const m=friendlyErr(e);if(m)toast(m,{kind:'err',ms:6500})}finally{busy='';paint();paintAcctBtn()}};
  function wire(){
    const g=id=>$(id,b),on=(id,f)=>{const n=g(id);if(n)n.onclick=f};
    on('#aIn',()=>run('in',async()=>{const r=await signIn();render();if(r==='created')toast('Signed in · backup created');else if(r==='restored')toast('Signed in · your backup was restored');else if(r==='synced')toast('Signed in · data combined')}));
    on('#aSync',()=>run('sync',async()=>{await syncNow({mode:'merge'});render();toast('Synced')}));
    on('#aUp',async()=>{if(await ask({title:'Replace the backup?',text:'The Drive backup will become a copy of this phone.',ok:'Replace backup',danger:true}))run('sync',async()=>{await syncNow({mode:'local'});toast('Backup replaced')})});
    on('#aDown',async()=>{if(await ask({title:'Replace this phone?',text:'This phone’s data will be replaced by the Drive backup.',ok:'Replace phone',danger:true}))run('sync',async()=>{await syncNow({mode:'cloud'});render();toast('Restored from backup')})});
    on('#aOut',async()=>{if(await ask({title:'Sign out?',text:'Your data stays on this phone. It just stops syncing.',ok:'Sign out'})){await signOut();paint();paintAcctBtn();toast('Signed out')}});
    const au=g('#aAuto');if(au)au.onchange=e=>{D.auto=e.target.checked;saveDev()};
    on('#aExp',()=>exportFile('spendly-backup-'+fileStamp()+'.json',JSON.stringify({app:'spendly',v:2,saved:Date.now(),data:S},null,1),'application/json'));
    on('#aCsv',()=>exportFile('spendly-expenses-'+fileStamp()+'.csv',toCSV(exportRows()),'text/csv'));
    on('#aImp',()=>{sh.close();setTimeout(pickImport,60)});
    on('#aSmp',()=>{if(hasSample){removeSample();toast('Sample data removed',{action:'Undo',fn:undoSnap})}else{loadSample();toast('Sample data added',{action:'Undo',fn:undoSnap})}sh.close()});
    on('#aRst',async()=>{if(await ask({title:'Delete all data?',text:'Transactions, wallets, categories and settings on this phone will be erased.'+(D.user?' Because you are signed in, the Drive backup is cleared at the next sync.':'')+' You can undo right after.',ok:'Delete everything',danger:true})){resetAll();sh.close();toast('Everything was deleted',{action:'Undo',fn:undoSnap,ms:8000})}})}
  paint();
}
function onSyncState(state,changed){
  if(acctPaint)acctPaint();paintAcctBtn();
  if(state==='ok'&&changed)render()}

/* ===================== wire up & boot ===================== */
function bind(){
  $$('.tb').forEach(b=>b.onclick=()=>{buzz(5);showTab(b.dataset.tab)});
  $('#fab').onclick=()=>{buzz(8);openTx()};
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-act="add"]'))openTx();
    if(e.target.closest('[data-act="ask"]'))openAsk();
    if(e.target.id==='setBud'||e.target.id==='setBud2'){e.preventDefault();openSettings(true)}
    if(e.target.id==='clrF'){e.preventDefault();Object.assign(F,{type:'all',cat:'',acc:'',q:''});renderAct()}});
  $('#pv').onclick=()=>{M=shiftM(M,-1);F.cat='';renderHome();renderAct();renderIns()};
  $('#nx').onclick=()=>{M=shiftM(M,1);F.cat='';renderHome();renderAct();renderIns()};
  $('#goNow').onclick=()=>{M=todayStr().slice(0,7);renderHome();renderAct();renderIns()};
  $('#btnSet').onclick=()=>openSettings();$('#btnAcct').onclick=openAccount;
  // activity
  $('#fScope').onclick=e=>{const b=e.target.closest('button');if(b){F.scope=b.dataset.v;shown=120;render()}};
  $('#q').oninput=e=>{F.q=e.target.value;shown=120;renderAct()};
  $('#fType').onchange=e=>{F.type=e.target.value;shown=120;renderAct()};
  $('#fCat').onchange=e=>{F.cat=e.target.value;shown=120;renderAct()};
  $('#fAcc').onchange=e=>{F.acc=e.target.value;shown=120;renderAct()};
  const rowOpen=(host,fn)=>{host.addEventListener('click',e=>fn(e.target));host.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fn(e.target)}})};
  rowOpen($('#ls'),t=>{if(t.closest('#more')){shown+=120;renderAct();return}const r=t.closest('.tx[data-id]');if(r)openTx(r.dataset.id)});
  // insights
  $('#iRange').onclick=e=>{const b=e.target.closest('button');if(b){insRange=+b.dataset.v;renderIns()}};
  $('#yPv').onclick=()=>{insYear--;renderIns()};$('#yNx').onclick=()=>{insYear++;renderIns()};
  rowOpen($('#yTbl'),t=>{const r=t.closest('[data-month]');if(r){M=r.dataset.month;buzz();showTab('home')}});
  // wallets
  rowOpen($('#wList'),t=>{const r=t.closest('[data-wal]');if(r)openWallet(r.dataset.wal)});
  rowOpen($('#rList'),t=>{const r=t.closest('[data-rec]');if(r)openRec(r.dataset.rec)});
  $('#rpt').onclick=shareReport;$('#gAdd2').onclick=()=>openGoal();$('#dAdd').onclick=()=>openDebt();
  rowOpen($('#gList'),t=>{const r=t.closest('[data-goal]');if(r)openGoal(r.dataset.goal)});
  rowOpen($('#dList'),t=>{const r=t.closest('[data-debt]');if(r)openDebt(r.dataset.debt)});
  $('#wAdd').onclick=()=>openWallet();$('#wXfer').onclick=()=>openTx(null,{type:'t'});$('#rAdd').onclick=()=>openTx(null,{rep:'monthly'});
  $('#fileIn').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{await handleImport(f.name,await f.text())}catch(x){toast('Could not read that file.',{kind:'err'})}};
  // lifecycle
  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState!=='visible'){lockOnHide();return}
    lockOnShow();
    if(runRecurring())render();remindersSoon();
    if(googleAvailable()&&D.user&&D.auto&&navigator.onLine&&Date.now()-D.last>5*60000)syncNow({silent:true})});
  window.addEventListener('online',()=>{if(typeof syncSoon==='function')syncSoon()});
  if(window.matchMedia)matchMedia('(prefers-color-scheme: dark)').addEventListener&&matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(D.theme==='auto'){applyTheme();resetCharts();render()}});
}
function boot(){
  const had=loadAll();applyTheme();applyLang();bind();
  if(D.lock.on)showLock();
  runRecurring();showTab('home');
  if(!had)recoverFromFile().then(ok=>{if(ok){runRecurring();render();toast('Recovered your data from the app’s backup copy')}});
  // Native app: never keep a service worker (it would serve old files after an update). Web: offline cache.
  if('serviceWorker' in navigator){
    if(isNative()){navigator.serviceWorker.getRegistrations().then(rs=>rs.forEach(r=>r.unregister())).catch(()=>{});if(window.caches)caches.keys().then(k=>k.forEach(x=>caches.delete(x))).catch(()=>{})}
    else if(/^https?:/.test(location.protocol))navigator.serviceWorker.register('sw.js').catch(()=>{})}
  if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});
  if(googleAvailable()&&D.user&&D.auto&&navigator.onLine)setTimeout(()=>syncNow({silent:true}),1500);
  // links, shared text and app-icon shortcuts (native app only)
  const AppP=window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.App;
  if(AppP){try{AppP.addListener('appUrlOpen',e=>handleLink(e.url))}catch(e){}
    try{AppP.getLaunchUrl().then(r=>{if(r&&r.url)handleLink(r.url)}).catch(()=>{})}catch(e){}}
  cleanPics();remindersSoon();
}
boot();
