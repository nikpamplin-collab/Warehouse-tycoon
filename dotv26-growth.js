/* DOTv26: early working capital, project-only mortgages, and physical capacity. */
const D26=Object.freeze({starter:100000,starterUntil:12,mortgageShare:.75,mortgageMonths:300,profitMonths:6});
const d26FreePlay=()=>!state.challenge;
function d26StarterAvailable(c){
 return d26FreePlay()&&state.month<=D26.starterUntil&&!state.finished&&c===state.player
  ? Math.max(0,D26.starter-(c.starterBorrowed||0)) : 0;
}
function d26Loan(c,n,months,purpose){
 const l={balance:n,rate:V18.loanRate,payment:loanRound(monthlyPayment(n,V18.loanRate,months)),months,purpose};
 syncV18Loans(c).push(l);
 c.debt=loanRound(c.debt+n);
 return l;
}
function d26BorrowStarter(){
 const c=state.player,n=Math.min(V18.drawStep,d26StarterAvailable(c));
 if(!n)return;
 d26Loan(c,n,V18.loanTerm,'starter');
 c.starterBorrowed=(c.starterBorrowed||0)+n;c.cash=Math.round((c.cash+n)*100)/100;
 save();render();
}
function d26MortgageOffer(s){
 const c=state.player,loan=V18.extensionCost*D26.mortgageShare,deposit=V18.extensionCost-loan;
 const payment=loanRound(monthlyPayment(loan,V18.loanRate,D26.mortgageMonths));
 const trailing=c.history.slice(-D26.profitMonths);
 const average=trailing.length===D26.profitMonths?trailing.reduce((a,r)=>a+(r.profit||0)-(r.spotRevenue||0)-(r.principal||0),0)/D26.profitMonths:0;
 const used=s?contracts(s).reduce((n,k)=>n+k.spaces,0)/Math.max(1,siteSpace(s)):0;
 const reserve=Math.ceil(playerRecurringCosts(c)+payment);
 const reasons=[];
 if(!d26FreePlay())reasons.push('Only available in free play.');
 if(state.finished||!s||!c.sites.includes(s))reasons.push('No trading warehouse selected.');
 if(s?.projects.some(p=>p.type==='Expansion'))reasons.push('An extension is already under way at this site.');
 if(c.sites.some(w=>w.projects.some(p=>p.mortgaged)))reasons.push('Finish the extension already funded by a mortgage first.');
 let streak=0;for(const r of [...trailing].reverse()){if(!(r.profit>0))break;streak++;}
 if(streak<D26.profitMonths)reasons.push('Unlock: six profitable months in a row ('+streak+' of 6).');
 else if(average<payment)reasons.push('Average monthly profit, less one-month job revenue and existing loan repayments, must cover '+fmt(payment)+' (currently '+money(average)+').');
 if(c.cash<deposit+reserve)reasons.push('Have '+fmt(deposit+reserve)+' cash for the deposit and one month of costs.');
 return {loan,deposit,payment,reserve,used,streak,reasons,available:!reasons.length};
}
function d26ConfirmMortgage(){
 const q=d26MortgageOffer(selectedSite());if(!q.available)return;
 dialog('<h2>Order the extension with a mortgage?</h2><p>Pay '+fmt(q.deposit)+' now. The bank pays '+fmt(q.loan)+' directly towards the build. Repay about '+fmt(q.payment)+' a month over 25 years at an 8% annual rate, starting when you complete this month.</p><p>Racking is extra. Running costs increase when the extension opens in '+EXPANSION_MONTHS+' months. You cannot cancel this order after drawing the mortgage.</p><div class="modal-actions"><button class="btn secondary" onclick="closeDialog()">Back</button><button class="btn" onclick="d26TakeMortgage()">Confirm mortgage</button></div>');
}
function d26TakeMortgage(){
 const s=selectedSite(),c=state.player,q=d26MortgageOffer(s);if(!q.available)return;
 d26Loan(c,q.loan,D26.mortgageMonths,'extension');
 c.cash=loanRound(c.cash-q.deposit);
 s.projects.push({type:'Expansion',remaining:EXPANSION_MONTHS,cost:V18.extensionCost,mortgaged:true});
 closeDialog();save();render();
}
function d26MortgageCard(s){
 if(!d26FreePlay())return '';
 const q=d26MortgageOffer(s);
 return '<h3>Extension mortgage</h3><p><b>'+q.streak+' of 6 profitable months in a row</b> · '+Math.floor(q.used*100)+'% of this site’s space booked this month.</p><p>'+fmt(q.deposit)+' cash deposit · '+fmt(q.loan)+' loan · about '+fmt(q.payment)+'/month for 25 years.</p><p>Cash now: '+cash(state.player)+' · cash after deposit: '+money(state.player.cash-q.deposit)+'. Undrawn credit does not count as cash.</p><p>First payment this month. Keep at least '+fmt(q.reserve)+' cash after the deposit. The mortgage pays only for construction. Budget for extra racking and higher running costs before ordering.</p>'+
 (q.reasons.length?'<ul class="list">'+q.reasons.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul>':'')+
 '<button class="btn secondary" onclick="d26ConfirmMortgage()" '+(!q.available?'disabled':'')+'>Use extension mortgage</button>';
}
function d26Bank(){
 const c=state.player,q=v18LoanOffer(c),starter=d26StarterAvailable(c);
 const card=d26FreePlay()?'<section class="d21-sub"><h3>Starter loan</h3><p>Up to £100,000 in your first 12 months. No assets or trading history needed. 8% annual rate, repaid over 36 months. Repayments do not renew the allowance.</p><p>'+fmt(starter)+' left to borrow'+(state.month>12?' · First-year window closed':'')+'.</p><button class="btn" onclick="d26BorrowStarter()" '+(!starter?'disabled':'')+'>Borrow '+fmt(Math.min(V18.drawStep,starter)||V18.drawStep)+' starter cash</button></section>':'';
 return card+d17Bank()+'<p class="muted">For a 25-year extension mortgage, open Sites &amp; expansion.</p>';
}
function d26Infrastructure(s){
 const doors=DOT17Facilities.doorCount(s), q=DOT17Facilities.quote(s,DOT17Facilities.DOCK);
 const shifts=dot19ShiftCount(s);
 const next=d21Projection(s);
 const nowSpace=siteSpace(s), nextSpace=d21Storage(s);
 const extra=q.available?d21Projection(s,[{type:DOT17Facilities.DOCK,remaining:1}]):next;
 const futureShifts=dot19TargetRoster(s,state.month+1).filter(n=>n>0).length;
 return '<section class="d21-option" id="d17-facilities"><h3>Racking &amp; dock capacity</h3>'+
 '<div class="d21-line"><span>Pallet spaces</span><strong>'+num(nowSpace)+'</strong></div>'+
 '<div class="d21-line"><span>Dock doors ready to use</span><strong>'+num(doors)+'</strong></div>'+
 '<p>'+num(DOT17Facilities.dockCapacity(s,shifts))+' pallet moves per month through the docks on currently staffed shifts. Receipt and despatch share this limit. A new door takes one month.</p>'+
 '<p>Next month with existing orders: '+num(nextSpace)+' pallet spaces and '+num(DOT17Facilities.doorCount(next))+' dock doors.'+(q.queued?' A dock door is already on order.':'')+'</p>'+
 (q.available?'<p>With one more door: '+num(DOT17Facilities.dockCapacity(next,futureShifts))+' → '+num(DOT17Facilities.dockCapacity(extra,futureShifts))+' moves the docks can handle next month on the saved shift plan. Staff can still limit output.</p>':!q.queued?'<p>The available dock positions are already built or on order.</p>':'')+
 '<button class="btn secondary" onclick="orderWarehouseFacility(\'dock\')" '+(!q.available||state.finished||state.player.cash<q.cost?'disabled':'')+'>Order dock door · '+fmt(q.cost)+'</button></section>';
}

