/* DOTv18 commercial rules. Loaded before the game engine; no saved state is reset. */
const V18 = Object.freeze({
  playerOverhead:{mid:25000,north:21875,south:37500},
  extensionCost:1000000, loanRate:.08/12, loanTerm:36, drawStep:25000,
  collateralAdvance:.55, loanCover:1.35, tradingMonths:6,
  spotPrice:1.65
});
function playerSiteOverhead(s) {
  const base=V18.playerOverhead[s.region]??V18.playerOverhead.mid;
  return base*s.sections; // Same £/sq ft per section; no automatic rent discount.
}
function siteRunningOverhead(c,s){return c.ai?siteOverhead(s):playerSiteOverhead(s);}
function freeForTender(s,t,capacity){
  const end=t.start+t.term-1;
  const relevant=s.contracts.filter(k=>k.end>=t.start&&k.start<=end);
  const starts=new Set([t.start,...relevant.map(k=>Math.max(t.start,k.start))]);
  return capacity-Math.max(0,...Array.from(starts,m=>relevant.reduce((n,k)=>n+(k.start<=m&&k.end>=m?k.spaces:0),0)));
}
function addSpotTenders(g,out){
  for (const r of regions){
    if(![g.player,...g.rivals].some(c=>!c.bankrupt&&owned(c,r.id).length)||Math.random()>=.34)continue;
    const spaces=pick([50,75,100,125,150,175,200,225,250]);
    out.push({id:'spot-'+g.month+'-'+r.id,region:r.id,name:'Short-term storage · '+monthName(g.month+1),spaces,moves:spaces*2,term:1,start:g.month+1,segment:'Spot',spot:true,marketPrice:marketPrice(g,r.id)*V18.spotPrice,variableVolume:false});
  }
}
function tenderDefault(t,key){
  if(t.trial)return key==='storage'?13:4.5; // Indicative trial quote, never a guaranteed win.
  return Math.round(standardRate(key)*(t.spot?V18.spotPrice:1)*100)/100;
}
function loanRound(x){return Math.max(0,Math.round(x*100)/100);}
function monthlyPayment(p,r=V18.loanRate,n=V18.loanTerm){
  return n>0?(r?p*r/(1-Math.pow(1+r,-n)):p/n):p;
}
function syncV18Loans(c){
  c.loans??=[];
  const tracked=loanRound(c.loans.reduce((n,l)=>n+l.balance,0));
  const incoming=loanRound((c.debt||0)-tracked);
  if(incoming>0)c.loans.push({balance:incoming,rate:V18.loanRate,months:V18.loanTerm,payment:loanRound(monthlyPayment(incoming))});
  c.debt=loanRound(c.loans.reduce((n,l)=>n+l.balance,0));
  return c.loans;
}
function v18OwnedValue(c){
  return total(c,s=>Math.max(0,s.ownedExtensions??s.sections-1)*V18.extensionCost+s.racks*C.rack+s.automated*C.auto);
}
function v18LoanOffer(c){
  const same=c.loans||[], trailing=c.history.slice(-V18.tradingMonths);
  const known=same.reduce((a,l)=>a+l.balance,0), carry=Math.max(0,(c.debt||0)-known);
  const debtService=same.reduce((a,l)=>a+l.payment,0)+monthlyPayment(carry);
  const recurring=trailing.length===V18.tradingMonths?trailing.reduce((a,r)=>a+(r.profit||0)+(r.interest||0)-(r.spotRevenue||0),0)/V18.tradingMonths:0;
  const assets=v18OwnedValue(c);
  const security=Math.max(0,Math.min(assets*V18.collateralAdvance,valuation(c)*.75)-(c.debt||0));
  const affordability=Math.max(0,recurring/V18.loanCover-debtService)/monthlyPayment(1);
  return {assets,security,affordability,available:Math.floor(Math.max(0,Math.min(security,affordability))/100)*100};
}
function v18LoanPayment(c){
  const loans=syncV18Loans(c);
  let interest=0,principal=0;
  for(const l of loans){
    const i=loanRound(l.balance*l.rate);
    const p=l.months<=1?l.balance:Math.min(l.balance,loanRound(l.payment-i));
    interest+=i;principal+=p;l.balance=loanRound(l.balance-p);l.months--;
  }
  c.loans=loans.filter(l=>l.balance>0);
  c.debt=loanRound(c.loans.reduce((n,l)=>n+l.balance,0));
  return {interest:loanRound(interest),principal:loanRound(principal)};
}
function v18Draw(c,amount){
  const n=loanRound(Math.min(amount,v18LoanOffer(c).available));
  if(!n)return 0;
  syncV18Loans(c).push({balance:n,rate:V18.loanRate,payment:loanRound(monthlyPayment(n)),months:V18.loanTerm});
  c.debt=loanRound(c.debt+n);c.cash+=n;return n;
}
function v18Prepay(c,requested){
  const loans=syncV18Loans(c);
  let amount=loanRound(Math.min(requested,c.debt,Math.max(c.cash,0))),left=amount;
  for(const l of loans){const n=Math.min(l.balance,left);l.balance=loanRound(l.balance-n);left=loanRound(left-n);}
  c.loans=loans.filter(l=>l.balance>0);c.debt=loanRound(c.debt-amount);c.cash-=amount;
  return amount;
}

// Old saves keep stored names; use the new wording when showing a one-month job.
function d26TenderName(t){
 return t.spot?t.name.replace(/^Overflow storage · /,'Short-term storage · '):t.name;
}
