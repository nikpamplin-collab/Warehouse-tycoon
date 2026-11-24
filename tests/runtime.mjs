import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
export function compile(folder){
 const html=fs.readFileSync(path.join(folder,'index.html'),'utf8');
 const blocks=[...html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)].map(([,file,inline])=>file?fs.readFileSync(path.join(folder,file),'utf8'):inline);
 return new vm.Script('var window=this;\n'+blocks.join('\n'),{filename:path.join(folder,'index.html')});
}
export function boot(script,seed=731,storage=new Map()){
 const elements=new Map(), events=new Map();
 function el(id){
  if(!elements.has(id))elements.set(id,{innerHTML:'',textContent:'',value:'',classList:{add(){},remove(){}},focus(){}});
  return elements.get(id);
 }
 let next=seed>>>0;
 const math=Object.create(Math);math.random=()=>((next=(Math.imul(next,1664525)+1013904223)>>>0)/4294967296);
 const document={getElementById:el,querySelector:el,addEventListener:(t,fn)=>events.set(t,fn)};
 const context=vm.createContext({document,console,navigator:{},Math:math,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},alert:x=>{throw Error(x)}});
 const run=code=>vm.runInContext(code,context);
 script.runInContext(context);
 return {run,el,events,store:storage,u:()=>el('view').innerHTML,click:dataset=>events.get('click')({target:{closest:()=>({dataset})}})};
}
export function setup(g,name='Amber Pallet Co',site='Mercia DC'){
 g.el('newBusiness').value=name;g.el('newSite').value=site;g.run('startConfiguredGame()');
 assert.equal(g.run('state.player.name'),name);
}
