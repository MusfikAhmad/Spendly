// Web/PWA only. The Android app does not use this file (it removes any old service worker on start).
const C='spendly-v3',F=['./','index.html','css/app.css','js/config.js','js/store.js','js/i18n.js','js/bn.js','js/sync.js','js/app.js','js/assist.js','js/extras.js','js/forms.js','chart.umd.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(F)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
// network first (so updates show up), cache as the offline fallback
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||!e.request.url.startsWith(self.location.origin))return;
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request)))});
