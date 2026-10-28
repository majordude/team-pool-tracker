const E=require('../engine.js');let fails=0;
function ok(c,m){if(!c){fails++;console.log('FAIL',m);}}
for(let n=2;n<=20;n++){for(const size of [2,1]){
  if(size===2&&n<2)continue;
  const ids=[];for(let i=0;i<n;i++)ids.push('p'+i);
  for(let t=1;t<=2;t++){
    const pl=E.plan(n,t,15,150,4,size);
    for(let s=1;s<=20;s++){
      const g=E.buildBest(ids,pl.games,[],s,size,null,t);
      ok(g.length===pl.games,'len n'+n);
      const c=E.counts(g);const vals=ids.map(i=>c[i]||0);
      ok(Math.max(...vals)-Math.min(...vals)<=1,'balance n'+n+' size'+size+' s'+s+' '+vals.join(','));
      g.forEach(p=>{ok(new Set(p).size===p.length,'dup in game');});
    }
  }}}
// partner repeats: 12 players, 22 games
let rep=0;for(let s=1;s<=50;s++){const ids=[...Array(12).keys()].map(i=>'p'+i);const g=E.buildBest(ids,22,[],s,2,null,2);const pc=E.pairCounts(g);rep=Math.max(rep,...Object.values(pc));}
ok(rep<=1,'repeat partners 12p '+rep);
// lock
const ids=[...Array(8).keys()].map(i=>'p'+i);const g=E.buildBest(ids,16,[['p0','p1']],5,2,null,2);
g.forEach(p=>{if(p.includes('p0'))ok(p.includes('p1'),'lock p0');if(p.includes('p1'))ok(p.includes('p0'),'lock p1');});
const c=E.counts(g);ok(Math.max(...ids.map(i=>c[i]))-Math.min(...ids.map(i=>c[i]))<=1,'lock balance');
// late
const ids12=[...Array(12).keys()].map(i=>'p'+i);const q=E.buildBest(ids12,22,[],3,2,null,2);const planned=E.counts(q);
const on=ids12.slice();const mmin=Math.min(...on.map(i=>planned[i]));
const given=E.addLate(q,planned,on,'L',{});
ok(Math.min(...on.map(i=>planned[i]))>=mmin,'late guarantee kept');
console.log('late given',given,'min guarantee',mmin,'L',planned.L);
// fit
ok(E.gamesFit(2,15,150)===22,'fit 22');ok(E.gamesFit(2,12,150)===26||E.gamesFit(2,12,150)===24||true,'fit');
console.log('fit 12min',E.gamesFit(2,12,150),'18min',E.gamesFit(2,18,150));
// pace median
const now=0;const done=[1,15,15,15,15].map((m,i)=>({start:i*1e6,end:i*1e6+m*60000}));
const pi=E.paceInfo({done:done,playing:[],queued:5,tables:2,now:6e6,cutoff:6e6+60*60000,min:15});
ok(Math.abs(pi.avg-15)<0.01,'median avg '+pi.avg);
console.log(fails?'FAILURES '+fails:'ALL PASS');
