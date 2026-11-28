/* In-game People desk. Presentation contains no numeric game modifiers. */
const D30={mode:'recruit',role:'ops'};
function d30PeopleOpen(role,inPost){
 if(!Object.hasOwn(DOT30People.roles,role))return;
 D30.role=role;D30.mode=inPost?'team':'recruit';goFromContext('people');
}
function d30PeopleMode(mode){
 if(!['recruit','team'].includes(mode))return;
 D30.mode=mode;render();document.getElementById('d30-mode-'+mode)?.focus({preventScroll:true});
}
function d30PeopleRole(role){
 if(!Object.hasOwn(DOT30People.roles,role))return;
 D30.role=role;render();document.getElementById('d30-role-'+role)?.focus({preventScroll:true});
}
function d30Mood(s){
 const m=DOT30People.moodView(s), word=m.trend>0?'Improving':m.trend<0?'Worsening':'Stable';
 return '<span class="d30-mood" aria-label="Workforce mood: '+m.label+', '+word+'"><span aria-hidden="true">'+m.icon+'</span><small>'+m.label+(m.trend?' '+(m.trend>0?'↑':'↓'):'')+'</small></span>';
}
function d30Avatar(seed,name){
 const numSeed=Number.isFinite(seed)?Math.abs(Math.round(seed)):0;
 const bg=['#466775','#635675','#59664d','#596783','#6c6156','#425968'][numSeed%6],
 skin=['#ebba98','#ad7659','#8c5238','#c58963','#f3c5a3','#704b39'][Math.floor(numSeed/6)%6],
 hair=['#384046','#292729','#754d37','#323543','#8b624c','#403833'][(numSeed*5)%6],
 shirt=['#a8e2ce','#f5be76','#bac9f1','#d9c9ec','#d5e7a7','#f6c6a9'][(numSeed*7+2)%6];
 const cuts=['M11 24C8 13 14 7 24 7c10-1 17 4 17 14l-4 4-5-9c-6 3-10 4-17 3z','M10 23C8 13 15 6 26 6c12 0 17 8 17 17l-4 10-3-12-7-5c-3 6-8 7-14 7l-4 10z','M10 23c-4-10 3-16 9-16 4-5 14-5 18 0 6 0 10 7 6 17l-6-3-4-5-6 4-6-4-6 5z','M11 25C8 14 13 7 22 7c7-2 8 4 17 0 4 7 3 16 0 19l-6-8c-5 3-11 4-17 2z'];
 return '<svg class="d30-avatar" viewBox="0 0 52 52" role="img" aria-label="Portrait of '+esc(name)+'"><rect width="52" height="52" rx="8" fill="'+bg+'"/><circle cx="41" cy="10" r="15" fill="#ffffff14"/><path d="M5 52c1-11 8-16 21-16s20 5 21 16" fill="'+shirt+'"/><path d="M21 34h10v8l-5 3-5-3z" fill="'+skin+'"/><ellipse cx="26" cy="23" rx="12" ry="15" fill="'+skin+'"/><path d="'+cuts[numSeed%4]+'" fill="'+hair+'"/><circle cx="21" cy="25" r="1.1" fill="#27272a"/><circle cx="31" cy="25" r="1.1" fill="#27272a"/><path d="M23 31q3 2 6 0" stroke="#553833" stroke-width="1.2" stroke-linecap="round" fill="none"/>'+
  (numSeed%3===0?'<path d="M16 22h10v6H16zm11 0h10v6H27z M26 24h1" stroke="#293e44" stroke-width="1.2" fill="none"/>':'')+'<path d="M15 52l4-12m18 12-4-12" stroke="#fff" stroke-width="2.4" stroke-opacity=".5"/></svg>';
}
function d30Ratings(p,compact=false){
 if(p.legacy)return '';
 const defs=p.role==='ops'?
  [['Experience','Exp.',p.experience],['People management','People',p.people],['Health & safety focus','Safety',p.safety],['Stock diligence','Stock',p.stock]]:
  [['Experience','Exp.',p.experience],['Competency','Skill',p.skill]];
 return '<span class="d30-ratings">'+defs.map(([long,short,n])=>'<span aria-label="'+esc(long)+': '+n+' out of 10">'+(compact?short:esc(long))+' <b>'+n+'/10</b></span>').join('')+'</span>';
}
function d30Identity(p,sub){
 return '<span class="d30-identity">'+d30Avatar(p.avatar,p.name)+'<span><b>'+esc(p.name)+'</b><small>'+esc(sub)+'</small></span></span>';
}
function d30PeopleScreen(){
 const s=selectedSite(), switcher='<div class="d30-segments">'+
  d27Choice('Recruitment',"d30PeopleMode('recruit')",D30.mode==='recruit','d30-mode-recruit')+
  d27Choice('Your team',"d30PeopleMode('team')",D30.mode==='team','d30-mode-team')+'</div>';
 const header=d27Heading('People',s);
 if(!s)return header+d27Panel('<p class="d30-empty">Open a warehouse before recruiting managers.</p>');
 if(D30.mode==='team'){
  const group=DOT30People.team(s);
  return header+switcher+'<h3>Managers in post</h3>'+(!group.length?d27Panel('<p class="d30-empty">No managers in post at this site.</p>'+d27Button('Browse candidates',"d30PeopleMode('recruit')",false,'wide')):
   d27Panel(group.map((p,i)=>{
    const a=p.stats||{}, title=DOT30People.roles[p.role].name;
    return '<button type="button" class="d30-entry" data-person="'+i+'" onclick="d30Employee(this,'+i+')">'+
     d30Identity(p,title)+'<span class="d30-entry-end">'+(p.legacy?'Existing':num(a.months||0)+' mo.')+' <span aria-hidden="true">›</span></span></button>';
   }).join('')))+'<div class="d30-mood-head"><h3>Workforce mood</h3>'+d30Mood(s)+'</div>';
 }
 const role=D30.role, def=DOT30People.roles[role], market=DOT30People.market(state), pool=DOT30People.pool(state,s,role);
 return header+switcher+'<div class="d30-role-tab" aria-label="Recruit by role">'+Object.entries(DOT30People.roles).map(([id,d])=>d27Choice(esc(d.short),"d30PeopleRole('"+id+"')",id===role,'d30-role-'+id)).join('')+'</div>'+
  '<p class="d30-market"><b>'+market.name+'</b> · '+market.copy+'</p><div class="d30-mood-head"><h3>'+esc(def.short)+' shortlist</h3>'+d27Info('recruit-role',def.name,'<p>'+esc(def.info)+'</p>')+'</div>'+
  d27Panel(pool.length?pool.map((p,i)=>'<button type="button" class="d30-entry" data-candidate="'+i+'" onclick="d30Candidate(this,'+i+')">'+
   '<span class="d30-identity">'+d30Avatar(p.avatar,p.name)+'<span><b>'+esc(p.name)+'</b>'+d30Ratings(p,true)+'</span></span>'+
   '<span class="d30-entry-end"><b>'+fmt(p.salary)+'</b><small>/ month</small></span></button>').join(''):'<p class="d30-empty">No candidates left this month. Check next month.</p>');
}
function d30Candidate(source,i){
 const s=selectedSite(), role=D30.role,p=DOT30People.pool(state,s,role)[i];if(!p)return;
 const def=DOT30People.roles[role],copy='Adds to your team. Salary applies from this month.';
 d27Modal(p.name,d30Identity(p,def.name)+d30Ratings(p)+'<p>'+esc(DOT30People.quirks[p.bio])+'</p>'+
  '<p><b>'+fmt(p.salary)+' / month</b><br>'+copy+'</p>'+
  d27Button('Confirm hire',"d30Hire('"+role+"','"+p.id+"')",state.finished,'wide'),source);
}
function d30Hire(role,id){
 const s=selectedSite(),hired=DOT30People.hire(state,s,role,id);if(!hired)return;
 state.log.unshift('HIRED: '+hired.name+' joined '+s.name+' as '+DOT30People.roles[role].name.toLowerCase()+'.');
 d27Close(false);D30.mode='team';save();render();
 document.getElementById('d30-mode-team')?.focus({preventScroll:true});
}
function d30Employee(source,i){
 const s=selectedSite(),p=s&&DOT30People.team(s)[i];if(!p)return;
 const a=p.stats||{}, months=a.months||0, n=a.compare||0;
 const delta=n>=3&&a.beforeMoves>0?(a.afterMoves/a.beforeMoves-1)*100:null;
 const status=months?num(months)+' month'+(months===1?'':'s')+' recorded'+(p.legacy?' since update':''):p.legacy?'Appointed before the People update':'No completed months yet';
 const results=(p.role==='ops'?[['Moves per staffed hour',delta===null?'Not enough comparable months':(delta>=0?'+':'−')+Math.abs(delta).toFixed(1)+'% against similar months']]:[])
  .concat(p.role!=='stock'?[['Safety incidents',months?num(a.safety||0)+(a.worstSafety?' · worst: '+a.worstSafety.toLowerCase():''):'Not recorded yet']]:[])
  .concat(p.role!=='safety'?[['Stock incidents',months?num(a.stock||0)+(a.worstStock?' · worst: '+num(a.worstStock)+' pallets missing':''):'Not recorded yet']]:[]);
 const content=d30Identity(p,DOT30People.roles[p.role].name)+d30Ratings(p)+
  '<p><b>'+fmt(p.salary)+' / month</b> · '+esc(status)+'</p>'+
  '<dl class="d30-review">'+results.map(([label,v])=>'<div><dt>'+esc(label)+'</dt><dd>'+esc(v)+'</dd></div>').join('')+'</dl>'+
  '<p>Results while in post, not a claim this manager caused every change.</p>';
 d27Modal(p.name,content+d27Button('Release manager','d30ReleasePrompt('+i+')',state.finished,'quiet'),source);
}
function d30ReleasePrompt(i){
 const s=selectedSite(), p=s&&DOT30People.team(s)[i];if(!p||state.finished)return;
 d27Modal('Release '+p.name+'?', '<p>This ends their appointment and monthly salary immediately.</p>'+
  d27Button('Confirm release','d30Release('+i+')',false,'wide'),D27.modalFocus);
}
function d30Release(i){
 const s=selectedSite(),p=s&&DOT30People.team(s)[i];if(!p||!DOT30People.release(state,s,p.role,p.id))return;
 state.log.unshift('RELEASED: '+p.name+' left '+s.name+'.');
 d27Close(false);save();render();document.getElementById('d30-mode-team')?.focus({preventScroll:true});
}
