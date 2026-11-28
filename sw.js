// Versioned static app cache. Restrict fetches and cleanup to this deployment.
const VERSION='DOTv30';
const FILES=['./dotv30-people.js?release=DOTv30','./dotv30-people-ui.js?release=DOTv30','./dotv30-people.css?release=DOTv30','./night-shift.css?release=DOTv29','./dotv27-desks.css?release=DOTv30','./dotv27-desks.js?release=DOTv30','./dotv26-growth.js?release=DOTv26.1','./dotv25-campaign.js?release=DOTv26.1','./dotv24-diagnostics.js?release=DOTv26.1','./dotv23-pressure.js?release=DOTv28','./dotv22-first.js?release=DOTv26.1','./dotv22-first.css?release=DOTv26.1','./dotv21-warehouse.js?release=DOTv29','./dotv21-warehouse.css?release=DOTv29','./dotv21-ui.js?release=DOTv28','./dotv21-ui.css?release=DOTv26.1','./v18-economy.js?release=DOTv26.1','./v18-economy.css','./manifest.webmanifest','./icon.png','./icon-512.png','./dotv13.css','./dotv13.js','./dotv14.css','./dotv14.js','./v15.css','./v16.css','./v16.js?release=DOTv28','./v17-nav.css','./dotv17-facilities.css','./dotv17-facilities.js','./v17-staff.css','./v17-staff.js?release=DOTv30','./dotv20-fire.css','./dotv20-fire.js?release=DOTv30'];
const scope=new URL(self.registration.scope);
const family="warehouse-tycoon:"+scope.pathname+":";
const CACHE=family+"30.0.0";
const shell=new URL('index.html',scope);shell.searchParams.set('release',VERSION);
const assets=new Set([...FILES,'./','./index.html'].map(f=>new URL(f,scope).pathname));
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const response=await fetch(shell.href,{cache:'reload'});
 if(!response.ok||!(await response.clone().text()).includes('<title>Warehouse Tycoon '+VERSION+'</title>'))throw Error('Wrong release shell');
 const cache=await caches.open(CACHE);
 await cache.addAll(FILES.map(file=>new Request(new URL(file,scope).href,{cache:'reload'})));
 await cache.put(shell.href,response);
 await self.skipWaiting();
})()));
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
   return (await cache.match(shell.href))||Response.error();
  })());
 }else event.respondWith(caches.open(CACHE).then(cache=>cache.match(u.href).then(c=>c||fetch(event.request))));
});
