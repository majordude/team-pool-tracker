(function(root){
'use strict';
function rng(seed){let t=(seed>>>0)||1;return function(){t+=0x6D2B79F5;let r=Math.imul(t^(t>>>15),1|t);r^=r+Math.imul(r^(r>>>7),61|r);return((r^(r>>>14))>>>0)/4294967296;};}
function median(a){const s=a.slice().sort(function(x,y){return x-y;});const n=s.length;if(!n)return 0;return n%2?s[(n-1)/2]:(s[n/2-1]+s[n/2])/2;}
function gamesFit(tables,min,windowMin){if(windowMin<0||min<=0)return 0;return tables*(Math.floor(windowMin/min)+1);}
function plan(n,tables,min,windowMin,target,size){
  const fit=gamesFit(tables,min,windowMin);
  const want=size>0?Math.floor(n*target/size):0;
  return {fit:fit,want:want,games:Math.min(fit,want)};
}
function key(a,b){return a<b?a+'|'+b:b+'|'+a;}
function build(ids,G,locks,seed,size,pre){
  const r=rng(seed),cnt={},pc={},last={},lp={},out=[];
  ids.forEach(function(i){cnt[i]=(pre&&pre.cnt&&pre.cnt[i])||0;});
  if(pre&&pre.pc)Object.keys(pre.pc).forEach(function(k){pc[k]=pre.pc[k];});
  (locks||[]).forEach(function(l){if(ids.indexOf(l[0])>=0&&ids.indexOf(l[1])>=0){lp[l[0]]=l[1];lp[l[1]]=l[0];}});
  for(let g=0;g<G;g++){
    let best=null;
    if(size===1){
      for(let i=0;i<ids.length;i++){const a=ids[i];let c=1000*cnt[a]+(last[a]===g-1?200:0)+r()*5;if(!best||c<best.c)best={c:c,p:[a]};}
      if(!best)break;out.push(best.p);cnt[best.p[0]]++;last[best.p[0]]=g;continue;
    }
    for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
      const a=ids[i],b=ids[j];
      if((lp[a]&&lp[a]!==b)||(lp[b]&&lp[b]!==a))continue;
      let c=1000*(cnt[a]+cnt[b]);const p=pc[key(a,b)]||0;c+=25*p*p;
      if(last[a]===g-1)c+=200;if(last[b]===g-1)c+=200;c+=r()*5;
      if(!best||c<best.c)best={c:c,p:[a,b]};
    }
    if(!best)break;
    const a=best.p[0],b=best.p[1];out.push([a,b]);cnt[a]++;cnt[b]++;pc[key(a,b)]=(pc[key(a,b)]||0)+1;last[a]=g;last[b]=g;
  }
  return out;
}
function score(g,tables){
  const pc=pairCounts(g);let c=0;Object.keys(pc).forEach(function(k){if(pc[k]>1)c+=100*(pc[k]-1)*(pc[k]-1);});
  for(let i=1;i<g.length;i++)for(let d=1;d<tables&&i-d>=0;d++)g[i].forEach(function(x){if(g[i-d].indexOf(x)>=0)c+=3;});
  return c;
}
function buildBest(ids,G,locks,seed,size,pre,tables){
  let best=null;
  for(let k=0;k<40;k++){const g=build(ids,G,locks,seed*100+k+1,size,pre);const sc=score(g,tables||2);if(!best||sc<best.sc){best={sc:sc,g:g};if(sc===0)break;}}
  return best.g;
}
function counts(games){const c={};games.forEach(function(p){p.forEach(function(i){c[i]=(c[i]||0)+1;});});return c;}
function pairCounts(games){const c={};games.forEach(function(p){if(p.length===2)c[key(p[0],p[1])]=(c[key(p[0],p[1])]||0)+1;});return c;}
function addLate(queued,planned,onTime,L,locked){
  const m=Math.min.apply(null,onTime.map(function(i){return planned[i]||0;}));
  planned[L]=planned[L]||0;let given=0;
  for(let g=0;g<queued.length;g++){
    if(planned[L]>=m)break;
    const p=queued[g];if(p.indexOf(L)>=0)continue;
    for(let k=0;k<p.length;k++){
      const x=p[k];
      if(locked&&locked[x])continue;
      if((planned[x]||0)>m){p[k]=L;planned[x]--;planned[L]++;given++;break;}
    }
  }
  return given;
}
function paceInfo(o){
  const durs=o.done.slice().sort(function(a,b){return a.end-b.end;}).slice(-5).map(function(g){return Math.max(0.2,(g.end-g.start)/60000);});
  const avg=o.done.length>=3?median(durs):o.min;
  let fit=0;
  for(let t=0;t<o.tables;t++){
    const pl=o.playing.filter(function(g){return g.table===t+1;})[0];
    let time=pl?Math.max(o.now,pl.start+avg*60000):o.now;
    while(time<=o.cutoff){fit++;time+=avg*60000;}
  }
  let status='On pace';
  if(o.done.length>=3){if(fit<o.queued)status='Running behind';else if(fit>=o.queued+o.tables)status='Ahead';}
  return {avg:avg,fit:fit,status:status,over:Math.max(0,o.queued-fit)};
}
const api={rng:rng,median:median,gamesFit:gamesFit,plan:plan,build:build,buildBest:buildBest,counts:counts,pairCounts:pairCounts,addLate:addLate,paceInfo:paceInfo,key:key};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Engine=api;
})(typeof window!=='undefined'?window:this);
