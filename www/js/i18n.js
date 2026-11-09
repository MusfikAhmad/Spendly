'use strict';
/* English is the source language. Bengali strings live in bn.js, keyed by the exact English text. */
const lang=()=>(typeof D==='object'&&D&&D.lang)||'en';
const bnDigits=x=>String(x).replace(/\d/g,d=>'০১২৩৪৫৬৭৮৯'[d]);
const _=(s,v)=>{const bn=lang()==='bn';let r=(bn&&typeof BN!=='undefined'&&BN[s])||s;if(v)r=r.replace(/\{(\w+)\}/g,(m,k)=>v[k]!=null?(bn?bnDigits(v[k]):v[k]):m);return r};
const DEF_CAT_BN={c0:['Food','খাবার'],c1:['Transport','যাতায়াত'],c2:['Bills','বিল'],c3:['Shopping','কেনাকাটা'],c4:['Health','স্বাস্থ্য'],c5:['Fun','বিনোদন'],c6:['Education','শিক্ষা'],c7:['Other','অন্যান্য']};
const cname=c=>{const d=DEF_CAT_BN[c.id];return(d&&lang()==='bn'&&c.name===d[0])?d[1]:c.name};
/* translate the plain text and a few attributes inside an HTML string (templates only, never user data tags) */
function sx(html){
  if(lang()!=='bn'||typeof BN==='undefined')return html;
  return html.replace(/>([^<>]+)</g,(m,txt)=>{const k=txt.trim(),v=k&&BN[k];return v?m.replace(k,v):m})
             .replace(/\b(placeholder|aria-label|title)="([^"]*)"/g,(m,a,txt)=>BN[txt]?a+'="'+BN[txt]+'"':m)}
/* translate (or restore) the static page */
function trDom(root){
  const bn=lang()==='bn';
  const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;
  while((n=w.nextNode())){const raw=n._o!==undefined?n._o:n.nodeValue,k=raw.trim();
    if(!k)continue;const v=bn&&BN[k];
    if(v){n._o=raw;n.nodeValue=raw.replace(k,v)}else if(n._o!==undefined){n.nodeValue=n._o;delete n._o}}
  root.querySelectorAll('[placeholder],[aria-label],[title]').forEach(el=>{for(const a of ['placeholder','aria-label','title']){
    if(!el.hasAttribute(a))continue;const key='_o_'+a,raw=el[key]!==undefined?el[key]:el.getAttribute(a),v=bn&&BN[raw];
    if(v){el[key]=raw;el.setAttribute(a,v)}else if(el[key]!==undefined){el.setAttribute(a,el[key]);delete el[key]}}})}
function applyLang(){document.documentElement.lang=lang();trDom(document.body)}
