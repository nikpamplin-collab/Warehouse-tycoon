// Versioned static app cache. Restrict fetches and cleanup to this deployment.
const FILES=['./','./index.html','./manifest.webmanifest','./icon.png','./icon-512.png','./visual-v12.css','./visual-v12.js'];
const scope=new URL(self.registration.scope);
const family="warehouse-tycoon:"+scope.pathname+":";
const CACHE=family+"12.0.0";
const assets=new Set(FILES.map(f=>new URL(f,scope).pathname));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(family)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url);
 if(event.request.method!=='GET'||u.origin!==scope.origin||!u.pathname.startsWith(scope.pathname)||!assets.has(u.pathname))return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).catch(()=>caches.open(CACHE).then(c=>c.match('./index.html'))));
 }else event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request).then(c=>c||fetch(event.request))));
});
