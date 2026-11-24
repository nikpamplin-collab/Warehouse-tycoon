// Versioned static app cache. Restrict fetches and cleanup to this deployment.
const FILES=['./','./index.html','./manifest.webmanifest','./icon.png','./icon-512.png','./dotv13.css','./dotv13.js'];
const scope=new URL(self.registration.scope);
const family="warehouse-tycoon:"+scope.pathname+":";
const CACHE=family+"13.0.0";
const assets=new Set(FILES.map(f=>new URL(f,scope).pathname));
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(
 caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(family)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())
));
self.addEventListener('fetch',event=>{
 const u=new URL(event.request.url);
 if(event.request.method!=='GET'||u.origin!==scope.origin||!u.pathname.startsWith(scope.pathname)||!assets.has(u.pathname))return;
 if(event.request.mode==='navigate'){
  event.respondWith((async()=>{
   try{const response=await fetch(event.request);if(response.status<500)return response;}catch{}
   const cache=await caches.open(CACHE);
   return (await cache.match(new URL('index.html',scope).href))||Response.error();
  })());
 }else event.respondWith(caches.open(CACHE).then(cache=>cache.match(u.href).then(c=>c||fetch(event.request))));
});
