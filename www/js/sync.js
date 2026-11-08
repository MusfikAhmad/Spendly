'use strict';
/* Optional Google sign-in + Drive backup. Everything here is skipped unless a Web client ID is set in config.js
   and the app is running as the Android app. Data goes to the hidden "appDataFolder" in the user's own Drive. */
const CFG=window.SPENDLY_CONFIG||{};
const DRIVE_SCOPE='https://www.googleapis.com/auth/drive.appdata';
const BK_NAME='spendly-data.json';
const isNative=()=>!!(window.Capacitor&&typeof Capacitor.isNativePlatform==='function'&&Capacitor.isNativePlatform());
const SL=()=>window.Capacitor&&Capacitor.Plugins&&Capacitor.Plugins.SocialLogin;
const googleConfigured=()=>!!CFG.googleWebClientId;
const googleAvailable=()=>isNative()&&!!SL()&&googleConfigured();
let tok=null,gInited=false,syncBusy=false,syncT=null;

function friendlyErr(e){
  const m=String((e&&(e.message||e.code))||e||'');
  if(/USER_CANCELLED|cancel/i.test(m))return '';
  if(/NoCredential/i.test(m))return 'No Google account found on this phone. Add one in Android settings and try again.';
  if(/28444|developer console|SHA|DEVELOPER_ERROR/i.test(m))return 'Google setup does not match this app (package name, SHA-1 or Web client ID). See SETUP-GOOGLE.md.';
  if(/Failed to fetch|NetworkError|network/i.test(m))return 'No internet connection.';
  if(/Drive 403/.test(m))return 'Google Drive refused access. Make sure the Drive API is enabled and the drive.appdata scope is added.';
  return m.slice(0,160)||'Something went wrong.';
}
async function gInit(){
  if(gInited)return;
  await SL().initialize({google:{webClientId:CFG.googleWebClientId,mode:'online'}});
  gInited=true}
function saveProfile(p){
  if(!p)return;
  D.user={email:p.email||(D.user&&D.user.email)||'',name:p.name||p.givenName||(D.user&&D.user.name)||''};saveDev()}
async function gLogin(opts){
  await gInit();
  const res=await SL().login({provider:'google',options:{scopes:[DRIVE_SCOPE],forceRefreshToken:true,...opts}});
  const r=res.result,t=r&&r.accessToken&&r.accessToken.token;
  if(!t)throw new Error('Google did not grant Drive access.');
  tok={t,exp:Date.now()+50*60000};saveProfile(r.profile);return t}
async function gToken(interactive){
  if(tok&&tok.exp>Date.now()+60000)return tok.t;
  try{return await gLogin({filterByAuthorizedAccounts:true,autoSelectEnabled:true})}
  catch(e){if(!interactive)throw e;return await gLogin({})}}
async function gfetch(url,opts={},retry=true){
  const {interactive,...init}=opts,t=await gToken(interactive);
  const r=await fetch(url,{...init,headers:{...(init.headers||{}),Authorization:'Bearer '+t}});
  if(r.status===401&&retry){tok=null;return gfetch(url,opts,false)}
  if(!r.ok){const b=await r.text().catch(()=>'');throw new Error('Drive '+r.status+(b?': '+b.slice(0,100):''))}
  return r}
async function findBackup(interactive){
  const q=encodeURIComponent("name='"+BK_NAME+"' and trashed=false");
  const r=await gfetch('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q='+q+'&fields=files(id,modifiedTime)&orderBy='+encodeURIComponent('modifiedTime desc')+'&pageSize=1',{interactive});
  const j=await r.json();return (j.files&&j.files[0])||null}
async function readBackup(f,interactive){
  const r=await gfetch('https://www.googleapis.com/drive/v3/files/'+f.id+'?alt=media',{interactive});
  return parseBackup(await r.text())}
async function writeBackup(id,interactive){
  const json=JSON.stringify({app:'spendly',v:2,saved:Date.now(),device:D.dev,data:S});
  if(id){await gfetch('https://www.googleapis.com/upload/drive/v3/files/'+id+'?uploadType=media',{method:'PATCH',headers:{'Content-Type':'application/json'},body:json,interactive});return id}
  const b='spendly'+Math.random().toString(36).slice(2);
  const body='--'+b+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+JSON.stringify({name:BK_NAME,parents:['appDataFolder']})+'\r\n--'+b+'\r\nContent-Type: application/json\r\n\r\n'+json+'\r\n--'+b+'--';
  const r=await gfetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',{method:'POST',headers:{'Content-Type':'multipart/related; boundary='+b},body,interactive});
  return (await r.json()).id}

/* mode: 'merge' (both ways, default) | 'cloud' (replace this phone with the backup) | 'local' (replace the backup with this phone) */
async function syncNow({silent=false,mode='merge'}={}){
  if(syncBusy||!D.user)return false;
  syncBusy=true;if(typeof onSyncState==='function')onSyncState('busy');
  const inter=!silent;let changed=false;
  try{
    const f=await findBackup(inter);
    let remote=null;if(f&&mode!=='local')remote=await readBackup(f,inter);
    if(remote){
      const next=mode==='cloud'?remote:mergeData(S,remote);
      if(JSON.stringify(next)!==JSON.stringify(S)){snapshot();S=next;persist(false);changed=true}}
    runRecurring();
    await writeBackup(f&&f.id,inter);
    D.last=Date.now();D.err='';saveDev();
    if(typeof onSyncState==='function')onSyncState('ok',changed);
    return true;
  }catch(e){
    D.err=friendlyErr(e)||'';saveDev();
    if(typeof onSyncState==='function')onSyncState('err',false,e);
    if(!silent)throw e;return false;
  }finally{syncBusy=false}}
function syncSoon(){
  if(!D||!D.user||!D.auto||!googleAvailable())return;
  clearTimeout(syncT);syncT=setTimeout(()=>{if(navigator.onLine)syncNow({silent:true})},20000)}

/* Sign in, then decide what to do with data that already exists on the phone and/or in the cloud. */
async function signIn(){
  tok=null;await gLogin({});D.auto=true;saveDev();
  const f=await findBackup(true);
  if(!f){D.last=0;await writeBackup(null,true);D.last=Date.now();D.err='';saveDev();return 'created'}
  const remote=await readBackup(f,true);
  if(isEmptyData(S)&&isEmptyData(remote)===false){snapshot();S=remote;persist(false);D.last=Date.now();D.err='';saveDev();return 'restored'}
  if(isEmptyData(remote)){await writeBackup(f.id,true);D.last=Date.now();saveDev();return 'created'}
  const pick=await choose({title:'You already have a backup',text:'This phone has data and so does your Google Drive backup. What should Spendly do?',
    options:[{id:'merge',label:'Combine both (recommended)',kind:'pri'},{id:'cloud',label:'Use the Drive backup'},{id:'local',label:'Keep this phone’s data'}]});
  if(!pick){await signOut();return 'cancelled'}
  await syncNow({mode:pick==='merge'?'merge':pick==='cloud'?'cloud':'local'});
  return pick==='cloud'?'restored':'synced'}
async function signOut(){
  try{if(SL())await SL().logout({provider:'google'})}catch(e){}
  tok=null;D.user=null;D.err='';D.last=0;saveDev()}
