'use strict';
/* ===================== Quick-add text parser (English + Bengali basics) ===================== */
const KW={
  food:['lunch','dinner','breakfast','snack','snacks','restaurant','grocery','groceries','tea','coffee','biryani','burger','pizza','meal','cafe','food','খাবার','নাস্তা','চা','বাজার'],
  transport:['bus','uber','pathao','rickshaw','cng','taxi','train','ticket','metro','ride','fare','transport','বাস','রিকশা','টিকিট'],
  bills:['electricity','gas','wifi','internet','recharge','bill','bills','water','phone','mobile','বিদ্যুৎ','ইন্টারনেট','বিল','রিচার্জ'],
  shopping:['clothes','shirt','shoes','shopping','bag','gift','dress','কেনাকাটা','জামা','জুতা'],
  health:['medicine','doctor','hospital','pharmacy','medical','ওষুধ','ডাক্তার','হাসপাতাল'],
  fun:['movie','game','netflix','zoo','trip','cinema','party','fun','সিনেমা','ঘুরতে'],
  education:['book','books','course','tuition','school','exam','fee','বই','কোর্স'],
  fuel:['petrol','octane','diesel','fuel','পেট্রোল','অকটেন'],
  rent:['rent','ভাড়া'],
  car:['parking','mechanic','carwash','car']
};
const INCOME_WORDS=/\b(salary|income|received|receive|earned|bonus|refund|deposit|freelance)\b|বেতন|আয়|পেয়েছি|পেলাম/i;
const MONTHS=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'],DAYS=['sun','mon','tue','wed','thu','fri','sat'];
const FILLER=/\b(spent|spend|paid|pay|bought|buy|got|for|on|in|at|to|from|using|via|with|the|a|an|my|category|expense|of|tk|taka|bdt|usd|received|add|please)\b|[৳$]|টাকা/gi;
const escRe=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const wordRe=w=>new RegExp('(^|[^\\p{L}\\p{N}])'+escRe(w)+'(?=$|[^\\p{L}\\p{N}])','iu');

function catFromText(text){
  const low=text.toLowerCase();
  // 1) a category name written out in full (works for your own categories too)
  const byName=S.cats.filter(c=>c.name.trim()&&wordRe(c.name.trim()).test(low)).sort((a,b)=>b.name.length-a.name.length)[0];
  if(byName)return {id:byName.id,how:'name',word:byName.name};
  // 2) common words (lunch -> Food, uber -> Transport) when such a category exists
  for(const key in KW)for(const w of KW[key])if(wordRe(w).test(low)){
    const c=S.cats.find(c=>c.name.toLowerCase()===key||c.name.toLowerCase().startsWith(key));
    if(c)return {id:c.id,how:'kw',word:w}}
  return {id:'',how:'none',word:''}}
function matchCategory(name,note){
  const n=String(name||'').trim().toLowerCase();
  if(n){const c=S.cats.find(c=>c.name.toLowerCase()===n)||S.cats.find(c=>c.name.toLowerCase().startsWith(n)||n.startsWith(c.name.toLowerCase()))||S.cats.find(c=>c.name.toLowerCase().includes(n));if(c)return c.id;
    const g=catFromText(n);if(g.id)return g.id}
  const g=catFromText(String(note||''));if(g.id)return g.id;
  const o=S.cats.find(c=>/^other/i.test(c.name));return o?o.id:S.cats[0].id}

function parseQuick(input){
  let s=String(input||'').replace(/[০-৯]/g,c=>'০১২৩৪৫৬৭৮৯'.indexOf(c)).trim();
  const out={ok:false,type:'e',amt:0,cat:'',note:'',date:todayStr(),acc:'',how:'none'};
  if(!s)return out;
  let low=s.toLowerCase();const cut=re=>{const m=low.match(re);if(m){s=s.slice(0,m.index)+' '+s.slice(m.index+m[0].length);low=s.toLowerCase()}return m};
  const now=new Date(),shift=n=>{const d=new Date(now);d.setDate(d.getDate()+n);return dstr(d)};
  // date
  let m;
  if((m=cut(/\b(\d{4})-(\d{2})-(\d{2})\b/)))out.date=isDate(m[0])?m[0]:out.date;
  else if(cut(/day before yesterday|পরশু/))out.date=shift(-2);
  else if(cut(/yesterday|last night|গতকাল/))out.date=shift(-1);
  else if(cut(/\btoday\b|আজ/))out.date=shift(0);
  else if((m=cut(/\b(\d{1,2})\s*days?\s*ago\b/)))out.date=shift(-(+m[1]));
  else if((m=cut(new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+('+MONTHS.join('|')+')[a-z]*\\b'))))out.date=monthDay(+m[1],MONTHS.indexOf(m[2]),now);
  else if((m=cut(new RegExp('\\b('+MONTHS.join('|')+')[a-z]*\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b'))))out.date=monthDay(+m[2],MONTHS.indexOf(m[1]),now);
  else if((m=cut(new RegExp('\\b(?:on\\s+|last\\s+)?('+DAYS.join('|')+')[a-z]*\\b')))){const diff=(now.getDay()-DAYS.indexOf(m[1])+7)%7;out.date=shift(-diff)}
  // wallet
  for(const a of S.accs){if(S.accs.length>1&&wordRe(a.name).test(low)){out.acc=a.id;cut(new RegExp('(?:\\b(?:from|using|via|with|in|by)\\s+)?'+escRe(a.name.toLowerCase())));break}}
  // type
  if(INCOME_WORDS.test(low))out.type='i';
  // amount: first number, with k / হাজার suffix
  const am=low.match(/(\d[\d,]*(?:\.\d+)?)\s*(k\b|হাজার)?/);
  if(am){let v=parseFloat(am[1].replace(/,/g,''));if(am[2])v*=1000;out.amt=round2(v);s=s.slice(0,am.index)+' '+s.slice(am.index+am[0].length);low=s.toLowerCase()}
  // category
  if(out.type==='e'){const g=catFromText(low);out.cat=g.id||matchCategory('', '');out.how=g.how;if(g.how==='name')cut(wordRe(g.word))}
  // note = what is left
  let note=s.replace(FILLER,' ').replace(/[^\p{L}\p{N}\s&'’.-]/gu,' ').replace(/\s+/g,' ').trim();
  if(note)note=note.charAt(0).toUpperCase()+note.slice(1);
  out.note=note.slice(0,120);out.ok=out.amt>0;return out}
function monthDay(d,mi,now){let y=now.getFullYear();let t=new Date(y,mi,d);if(t>now)t=new Date(y-1,mi,d);return dstr(t)}

/* ===================== Coach: how much to spend / save ===================== */
function upcomingBills(){
  const td=todayStr(),end=dstr(new Date(new Date().getFullYear(),new Date().getMonth()+1,0));let sum=0;const list=[];
  for(const r of S.rec){if(!r.on||r.type!=='e')continue;let k=r.n,g=0;
    while(g++<60){const d=occ(r,k++);if(r.end&&d>r.end)break;if(d>end)break;if(d>td){const v=r.amt*rate(acc(r.acc).cur);sum+=v;list.push({d,v,name:r.note||cat(r.cat).name})}}}
  return {sum,list}}
function coach(){
  const now=new Date(),cur=todayStr().slice(0,7),dim=new Date(now.getFullYear(),now.getMonth()+1,0).getDate(),day=now.getDate(),left=dim-day+1;
  const st=monthStats(cur),mm=monthMap(),prev=[1,2,3].map(i=>mm[shiftM(cur,-i)]).filter(Boolean);
  const avgSp=prev.length?prev.reduce((a,x)=>a+x.sp,0)/prev.length:0,avgInc=prev.length?prev.reduce((a,x)=>a+x.inc,0)/prev.length:0;
  const budget=S.budget||0,usedEstimate=!budget&&avgSp>0,plan=budget||avgSp;
  const bills=upcomingBills();
  const room=plan?plan-st.sp-bills.sum:null;
  const perDay=room!=null?Math.max(0,room)/left:null;
  const incomeRef=st.inc||avgInc;
  // monthly amount needed for goals that have a due date
  let goalNeed=0;const goals=[];
  for(const g of S.goals){const saved=g.hist.reduce((a,x)=>a+x.amt,0),remain=Math.max(0,g.target-saved);goals.push({name:g.name,saved,target:g.target,due:g.due});
    if(g.due&&remain>0){const months=Math.max(1,(new Date(g.due)-now)/(30.4*864e5));goalNeed+=remain/months}}
  const rule=incomeRef*0.2,saveTarget=Math.max(goalNeed,rule);
  return {cur,dim,day,daysLeft:left,spent:st.sp,income:st.inc,budget,plan,usedEstimate,bills:bills.sum,billList:bills.list,room,perDay,projected:day?st.sp/day*dim:0,
    incomeRef,saveTarget,savedSoFar:st.inc-st.sp,goalNeed,goals,avgSp,avgInc,byCat:st.bc}}

/* A privacy-friendly text summary (no notes, no wallet names) the user can hand to any AI assistant. */
function aiSnapshot(question){
  const c=coach(),lines=[];
  lines.push('My money summary from the Spendly app ('+mname(c.cur)+', currency '+S.cur+'):');
  lines.push('- Income so far: '+fmt(c.income)+'; spent so far: '+fmt(c.spent)+'; balance: '+fmt(c.income-c.spent));
  if(c.plan)lines.push('- '+(c.usedEstimate?'Typical monthly spending (last months)':'Monthly budget')+': '+fmt(c.plan));
  lines.push('- Day '+c.day+' of '+c.dim+' ('+c.daysLeft+' days left including today)');
  if(c.bills)lines.push('- Bills still due this month: '+fmt(c.bills));
  const cats=Object.keys(c.byCat).sort((a,b)=>c.byCat[b]-c.byCat[a]).slice(0,8).map(i=>cat(i).name+' '+fmt(c.byCat[i])+(cat(i).limit?' (limit '+fmt(cat(i).limit)+')':''));
  if(cats.length)lines.push('- Spending by category: '+cats.join(', '));
  const mm=monthMap(),hist=[1,2,3].map(i=>shiftM(c.cur,-i)).filter(m=>mm[m]).map(m=>mname(m)+': spent '+fmt(mm[m].sp)+', income '+fmt(mm[m].inc));
  if(hist.length)lines.push('- Previous months: '+hist.join('; '));
  if(c.goals.length)lines.push('- Savings goals: '+c.goals.map(g=>g.name+' '+fmt(g.saved)+' of '+fmt(g.target)+(g.due?' by '+g.due:'')).join('; '));
  const owed=S.debts.filter(b=>b.dir==='lent').reduce((a,b)=>a+debtLeft(b),0),owe=S.debts.filter(b=>b.dir==='borrowed').reduce((a,b)=>a+debtLeft(b),0);
  if(owed||owe)lines.push('- People owe me '+fmt(owed)+'; I owe others '+fmt(owe));
  lines.push('');lines.push(question||'Based on this, how much should I save and how much can I spend per day for the rest of this month? Keep it short and practical.');
  return lines.join('\n')}
const debtLeft=b=>Math.max(0,b.amt-b.pay.reduce((a,x)=>a+x.amt,0));

/* ===================== Links & shared text from other apps / assistants ===================== */
let lastLink={u:'',t:0};
function saveParsed(p){ // p: {type,amt,cat,note,date,acc}
  const t={id:uid('t'),type:p.type,amt:p.amt,cat:p.type==='e'?p.cat:'',acc:p.acc||S.accs[0].id,date:p.date,note:p.note||'',u:Date.now()};
  S.tx.push(t);M=t.date.slice(0,7);lastAdded=t.id;persist();return t}
function handleLink(url){
  if(!url||!/^spendly:/i.test(url))return;
  const now=Date.now();if(lastLink.u===url&&now-lastLink.t<3000)return;lastLink={u:url,t:now};
  if(typeof lockState==='function'&&lockState().locked){pendingLink=url;return}
  const rest=url.replace(/^spendly:\/\//i,''),qi=rest.indexOf('?'),what=(qi<0?rest:rest.slice(0,qi)).replace(/\/+$/,'').toLowerCase();
  const q={};if(qi>=0)for(const kv of rest.slice(qi+1).split('&')){const i=kv.indexOf('=');if(i<0)continue;try{q[kv.slice(0,i).toLowerCase()]=decodeURIComponent(kv.slice(i+1).replace(/\+/g,' '))}catch(e){}}
  let p=null;
  if(what==='quick'&&q.text)p=parseQuick(q.text);
  else if(what==='add'){
    const amt=parseNum(q.amount||q.amt),type=/^i/i.test(q.type||'')?'i':'e',note=(q.note||q.description||'').slice(0,120),date=isDate(q.date)?q.date:todayStr();
    const wal=q.wallet||q.account,a=wal&&S.accs.find(a=>a.name.toLowerCase()===String(wal).toLowerCase());
    p={ok:amt>0,type,amt:round2(amt||0),cat:type==='e'?matchCategory(q.category||q.cat,note):'',note,date,acc:a?a.id:''}}
  else if(what==='summary'||what==='ask'){showTab('home');openAsk();return}
  else if(what.startsWith('open')){const t=(q.tab||what.split('/')[1]||'home');if(['home','act','ins','wal'].includes(t))showTab(t);return}
  else return;
  if(!p||!p.ok){const bare=!q.amount&&!q.amt&&!q.text;openTx(null,{prefill:p||{}});if(!bare)toast(_('Could not find an amount. Please check the details.'));return}
  if(D.assist.auto&&q.auto==='1'){
    const x=saveParsed(p);render();buzz(12);
    toast(_('Added {amt} · {cat}',{amt:fmt(x.amt,acc(x.acc).cur),cat:x.type==='i'?_('Income'):cname(cat(x.cat))}),{action:_('Undo'),fn:()=>{removeTx(x.id);persist();render()},ms:6000})
  }else openTx(null,{prefill:p})}
let pendingLink='';
