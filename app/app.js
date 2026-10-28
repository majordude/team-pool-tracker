'use strict';
var E=window.Engine,KEY='tpt.v1',VERSION='0.17 trial',BUILD='Oct 21, 2026',REQV='v29',CREDIT_AI='Claude Sonnet 5.5';
var EB='<svg width="36" height="36" viewBox="0 0 30 30" role="img" aria-label="8 ball"><circle cx="15" cy="15" r="14" fill="#2C2C2A" stroke="#fff" stroke-width="1"/><circle cx="15" cy="12" r="7" fill="#fff"/><text x="15" y="16" text-anchor="middle" font-size="11" font-weight="bold" fill="#2C2C2A">8</text></svg>';
function now(){return window.__now?window.__now():Date.now();}
function uid(){return Math.random().toString(36).slice(2,9)+now().toString(36).slice(-3);}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function fresh(){
  return {v:1,team:'',players:[],opponents:[],gameTypes:['8-ball','9-ball'],pin:null,
    settings:{tables:2,min:15,start:'09:00',cutoff:'11:30',target:4,minPlayerGames:4,minPairGames:2,manager:'',credit:'Fast Eddie G'},
    matches:[],current:null};
}
function load(){try{var r=localStorage.getItem(KEY);if(r)return JSON.parse(r);}catch(e){}return fresh();}
var S=load(),V={view:'home',undo:[],sheet:null,sheetRes:null,sheetTop:false,pinBuf:'',pinMeta:null,pinLock:false,draft:null,matchId:null};
if(S.settings&&S.settings.credit==='Ed')S.settings.credit='Fast Eddie G';
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){}}
function activeP(){return S.players.filter(function(p){return !p.off;});}
function pname(id){var p=S.players.filter(function(x){return x.id===id;})[0];return p?p.name:((S.gone&&S.gone[id])||'?');}
function cur(){return S.matches.filter(function(m){return m.id===S.current;})[0]||null;}
function viewMatch(){return S.matches.filter(function(m){return m.id===V.matchId;})[0]||null;}
function pad(n){return (n<10?'0':'')+n;}
function today(){var d=new Date(now());return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function hhmm(ms){var d=new Date(ms);var h=d.getHours()%12||12;return h+':'+pad(d.getMinutes());}
function size(m){return m.format==='Singles'?1:2;}
function gnamesPlain(m,g){return g.p.map(pname).join(' + ');}
function gnames(m,g){return g.p.map(function(id){return num(m,id)+' '+pname(id);}).join(' + ');}
function cutoffMs(m){return new Date(m.date+'T'+m.cutoff+':00').getTime();}
function startMs(m){return m.startedAt||new Date(m.date+'T'+m.start+':00').getTime();}
function windowMin(m){return Math.max(0,(cutoffMs(m)-startMs(m))/60000);}
function snap(){var m=cur();if(m){V.undo.push(JSON.stringify(m));if(V.undo.length>30)V.undo.shift();}}
function undo(){var m=cur();if(!m||!V.undo.length)return;var o=JSON.parse(V.undo.pop());S.matches=S.matches.map(function(x){return x.id===o.id?o:x;});save();render();}
function tableBall(t){return '<span class="ball'+(t===1?' b1':t===3?' b3':t===4?' b4':'')+'">'+t+'</span>';}
function hdr(title,back){return '<div class="hd">'+(back?'<button class="bk" data-act="go" data-v="'+back+'" aria-label="Back">&#8249;</button>':'')+'<span class="ttl">'+esc(title)+'</span>'+EB+'</div>';}
function btn(label,act,cls,data){return '<button class="bt '+(cls||'')+'" data-act="'+act+'"'+(data||'')+'>'+label+'</button>';}
function playing(m){return m.games.filter(function(g){return g.status==='playing';});}
function queued(m){return m.games.filter(function(g){return g.status==='queued';});}
function done(m){return m.games.filter(function(g){return g.status==='done';});}
function busyIds(m){var b={};playing(m).forEach(function(g){g.p.forEach(function(i){b[i]=1;});});return b;}
function eligible(m){var b=busyIds(m);return queued(m).filter(function(g){return g.p.every(function(i){return !b[i];});});}
function startOn(m,t,only){
  var b=busyIds(m),list=only?[only]:queued(m);
  for(var i=0;i<list.length;i++){var g=list[i];if(g.status!=='queued')continue;if(g.p.every(function(x){return !b[x];})){g.status='playing';g.table=t;g.startedAt=now();return true;}}
  return false;
}
function fillTables(m){for(var t=1;t<=m.tables;t++){if(!playing(m).some(function(g){return g.table===t;}))startOn(m,t);}}
function paceOf(m){
  return E.paceInfo({done:done(m).map(function(g){return {start:g.startedAt,end:g.endedAt};}),playing:playing(m).map(function(g){return {table:g.table,start:g.startedAt};}),queued:queued(m).length,tables:m.tables,now:now(),cutoff:cutoffMs(m),min:m.min});
}
function plannedCounts(m){var c={};m.games.forEach(function(g){g.p.forEach(function(i){c[i]=(c[i]||0)+1;});});return c;}
function hereIds(m){return m.here.map(function(h){return h.id;});}
function num(m,id){var h=m.here.filter(function(x){return x.id===id;})[0];return h&&h.num?h.num:hereIds(m).indexOf(id)+1;}
function assignNums(m){var order=S.players.map(function(p){return p.id;});m.here.sort(function(a,b){return order.indexOf(a.id)-order.indexOf(b.id);});m.here.forEach(function(h,i){h.num=i+1;});}
function totals(m){var w=0,l=0;m.games.forEach(function(g){if(g.result==='W')w++;if(g.result==='L')l++;});return {w:w,l:l,res:w+l===0?'':w>l?'Win':w<l?'Loss':'Tie'};}

function lockBox(m){if(!m.locks.length)return '';return '<div class="box info"><b>Locked pairs</b>'+m.locks.map(function(l,i){return '<div class="rw" style="padding:6px 0"><span>'+esc(pname(l[0]))+' + '+esc(pname(l[1]))+'</span><button class="bt sm" style="width:auto" data-act="unlock" data-i="'+i+'">Unlock</button></div>';}).join('')+'</div>';}
function rebuild(m,keepSeed){
  var ids=hereIds(m),sz=size(m);
  var started=m.games.filter(function(g){return g.status!=='queued';});
  var q=queued(m).length;
  var pre={cnt:E.counts(started.map(function(g){return g.p;})),pc:E.pairCounts(started.map(function(g){return g.p;}))};
  var seed=Math.floor(Math.random()*1e6)+1;
  var g=E.buildBest(ids,q,m.locks,seed,sz,pre,m.tables);
  var n=started.length;
  m.games=started.concat(g.map(function(p,i){return {n:n+i+1,p:p,status:'queued'};}));
}
function generate(m){
  var ids=hereIds(m),sz=size(m);
  var pl=E.plan(ids.length,m.tables,m.min,windowMin(m),m.target,sz);
  var g=E.buildBest(ids,pl.games,m.locks,Math.floor(Math.random()*1e6)+1,sz,null,m.tables);
  m.games=g.map(function(p,i){return {n:i+1,p:p,status:'queued'};});
}

var views={};
views.home=function(){
  var m=cur(),a=m&&m.status!=='complete'&&m.status!=='cancelled';
  return hdr('Team Pool Tracker v'+VERSION.split(' ')[0])+'<div class="bd">'+(V.upd?'<div class="box info"><b>A newer version is ready.</b><div style="height:8px"></div><button class="bt pr" style="margin:0" data-act="doupdate">Update now</button></div>':'')+'<p class="s">'+(S.team?esc(S.team):'Set your team name in Settings')+(S.players.length?'':' &middot; Then add your players')+'</p>'+
  (a?btn('Continue match','resume','pr'):'')+btn('Start match','newmatch',a?'':'pr')+
  btn('Players','go','bl',' data-v="players"')+btn('Past matches','go','am',' data-v="past"')+btn('Team stats (manager)','go','pu',' data-v="stats"')+btn('Help: how to use this app','go','am',' data-v="help"')+btn('Settings','go','',' data-v="settings"')+
  '<div class="foot" style="font-size:13px;color:#777">Team Pool Tracker<br>Version '+VERSION+' &middot; built '+BUILD+'<br>Requirements '+REQV+'</div></div>';
};
function inactRows(){var o=S.players.filter(function(p){return p.off;});if(!o.length)return '';return '<h2>Inactive</h2><p class="s">Not shown when you pick who is here. Past results keep their names.</p>'+o.map(function(p){return '<div class="rw" style="flex-wrap:wrap;padding:8px 0"><span style="font-size:19px;color:#777">'+esc(p.name)+'</span><button class="bt sm" style="width:auto" data-act="reactivate" data-id="'+p.id+'">Bring back</button></div>';}).join('');}
views.players=function(){
  var rows=activeP().map(function(p){return '<div class="rw" style="flex-wrap:wrap;padding:8px 0"><span style="font-size:19px">'+esc(p.name)+(p.sub?' <span class="tg lt">Sub</span>':'')+'</span><span style="display:flex;gap:8px;flex-wrap:wrap"><button class="bt sm" style="width:auto" data-act="togglesub" data-id="'+p.id+'">'+(p.sub?'Make regular':'Mark as sub')+'</button><button class="bt sm" style="width:auto" data-act="rename" data-id="'+p.id+'">Rename</button><button class="bt sm" style="width:auto" data-act="deactivate" data-id="'+p.id+'">Make inactive</button><button class="bt sm los" style="width:auto" data-act="rmplayer" data-id="'+p.id+'">Remove</button></span></div>';}).join('');
  var d=V.draft&&V.draft.names?V.draft.names:null;
  return hdr('Players','home')+'<div class="bd"><p class="s">'+activeP().length+' on the main roster</p>'+rows+inactRows()+
  '<button class="bt sm bl" data-act="sendroster">Send roster by text</button><h2>Add players</h2><p class="s">Add everyone who plays, including people who only come now and then. Type or use the keyboard microphone. Separate names with commas, for example: Ed G, Mike, Page. Mark occasional players as Sub if you like.</p><textarea id="addbox" placeholder="Ed G, Mike, Page">'+esc(d?d.join(', '):'')+'</textarea><div style="height:12px"></div>'+btn('Add players','addplayers','pr')+'</div>';
};
views.setup=function(){
  var m=cur(),here={};m.here.forEach(function(h){here[h.id]=1;});
  var opts=S.opponents.map(function(o){return '<option value="'+o.id+'"'+(o.id===m.oppId?' selected':'')+'>'+esc(o.name)+'</option>';}).join('');
  var rows=activeP().map(function(p){var on=!!here[p.id];return '<div class="rw" data-act="togglehere" data-id="'+p.id+'" role="checkbox" aria-checked="'+on+'"><span>'+esc(p.name)+(p.sub?' <span class="tg lt">Sub</span>':'')+'</span><span class="ck'+(on?' on':'')+'">'+(on?'&#10003;':'')+'</span></div>';}).join('');
  var n=m.here.length,note='';
  if(n>0&&n<4&&size(m)===2)note='<div class="box warn">'+(n<2?'Fewer than 2 players: a team cannot be fielded.':n<4?'Fewer than 4 players: one table. ':'')+(n>=2?(n===2?'Only 2 players: that pair plays every game.':'3 players: partners rotate.'):'')+'</div>';
  if(n===4&&size(m)===2)note='<div class="box info">Exactly 4 players. You can lock the two pairs on the Schedule screen.</div>';
  var oppBlock=S.opponents.length?'<label>Opponent</label><select data-bind="oppId">'+opts+'</select><div style="height:8px"></div><button class="bt sm" data-act="addopp">Add another opponent</button>':'<label>Opponent team name</label><input type="text" id="oppnew" placeholder="Type the other team name"><div style="height:8px"></div><button class="bt sm pr" data-act="addoppinline">Add opponent</button>';
  return hdr('Match setup','home')+'<div class="bd"><p class="st">Setup</p>'+
  oppBlock+'<label>Match date</label><input type="date" data-bind="date" value="'+esc(m.date)+'">'+
  '<label>Home or away</label><div class="row2"><button class="bt '+(m.home?'pr':'')+'" data-act="homeaway" data-v="1">Home</button><button class="bt '+(!m.home?'pr':'')+'" data-act="homeaway" data-v="0">Away</button></div>'+
  '<label>Real or practice</label><div class="row2"><button class="bt '+(!m.practice?'pr':'')+'" data-act="practice" data-v="0">Real match</button><button class="bt '+(m.practice?'am':'')+'" data-act="practice" data-v="1">Practice</button></div>'+(m.practice?'<div class="box warn">Practice matches never count in Past matches, Team stats, or the season record.</div>':'')+
  '<label>Game type</label><select data-bind="gameType">'+S.gameTypes.map(function(t){return '<option'+(t===m.gameType?' selected':'')+'>'+esc(t)+'</option>';}).join('')+'</select>'+
  '<label>Format</label><select data-bind="format">'+['Doubles','Scotch doubles','Singles'].map(function(t){return '<option'+(t===m.format?' selected':'')+'>'+t+'</option>';}).join('')+'</select>'+
  '<label>Manager for this match</label><input type="text" data-bind="manager" value="'+esc(m.manager)+'">'+
  '<label>Tracker (optional)</label><input type="text" data-bind="tracker" value="'+esc(m.tracker)+'">'+
  '<h2>Who is here today</h2><div class="row2"><button class="bt sm" data-act="allhere">Select all</button><button class="bt sm" data-act="nonehere">Clear</button></div><div style="height:6px"></div>'+rows+
  '<label>Someone not on the list? Type a name</label><input type="text" id="newhere" placeholder="Name, or several separated by commas"><div style="height:8px"></div><button class="bt sm" data-act="addhere">Add to roster and mark here</button>'+note+
  '<div style="height:16px"></div>'+btn(n+' here &middot; Continue','toplan','pr')+'</div>';
};
views.plan=function(){
  var m=cur(),sz=size(m),n=m.here.length,pl=E.plan(n,m.tables,m.min,windowMin(m),m.target,sz);
  function step(label,k,val){return '<label>'+label+'</label><div class="step"><button data-act="step" data-k="'+k+'" data-d="-1" aria-label="Less">&minus;</button><div class="v">'+val+'</div><button data-act="step" data-k="'+k+'" data-d="1" aria-label="More">+</button></div>';}
  var slots=pl.games*sz,base=n?Math.floor(slots/n):0,extra=n?slots%n:0;
  var line=(extra?'Planned '+base+' to '+(base+1)+' games each':'About '+base+' games each')+'. Not a guarantee: counts can vary.';
  var limit=pl.fit<pl.want?'Time limits the games. Target would need '+pl.want+'.':'';
  return hdr('Games that fit','setup')+'<div class="bd"><p class="st">Plan</p><p class="s">From your settings. Change anything here.</p>'+
  step('Tables','tables',m.tables)+step('Minutes per game','min',m.min)+step('Target games per player (a goal, not a promise)','target',m.target)+
  '<label>Start</label><input type="time" data-bind="start" value="'+m.start+'"><label>Last game starts by</label><input type="time" data-bind="cutoff" value="'+m.cutoff+'"><div style="height:16px"></div>'+
  '<div class="box ok"><div class="big"><b>'+pl.games+' games fit</b></div><div>'+line+'</div>'+(limit?'<div>'+limit+'</div>':'')+'</div>'+
  btn('Build schedule','build','pr')+'</div>';
};
views.schedule=function(){
  var m=cur(),c=plannedCounts(m);
  var rows=m.games.map(function(g,gi){
    var tb=gi<m.tables?'Table '+(gi+1):'Next free table';
    var names=g.p.map(function(id){return g.status==='queued'?'<button class="nm" data-act="swap" data-n="'+g.n+'" data-id="'+id+'">'+num(m,id)+' '+esc(pname(id))+'</button>':num(m,id)+' '+esc(pname(id));}).join(' + ');
    return '<div class="gm"><div class="t"><span>Game '+g.n+' &middot; '+tb+'</span><span class="tg">'+(g.edited?'Edited':'Auto')+'</span></div><div style="display:flex;justify-content:space-between;align-items:center"><span>'+names+'</span>'+(g.p.length===2&&g.status==='queued'?'<button class="bt sm" style="width:auto" data-act="lock" data-n="'+g.n+'">Lock</button>':'')+'</div></div>';}).join('');
  var locks=m.locks.map(function(l){return esc(pname(l[0]))+' + '+esc(pname(l[1]));}).join(', ');
  return hdr('Schedule','plan')+'<div class="bd"><p class="st">Schedule</p><p class="s">The first '+m.tables+' game'+(m.tables===1?'':'s')+' start on '+(m.tables===1?'the table':'Tables 1 to '+m.tables)+'. After that, each game goes to the next table that frees up. Tap a name to swap it. Lock keeps a pair together for this match.</p>'+lockBox(m)+
  '<div class="row2"><button class="bt sm" data-act="reshuffle">Reshuffle</button><button class="bt sm" data-act="undo">Undo</button></div><div style="height:8px"></div><button class="bt sm bl" data-act="printblank">Print blank score sheet</button><div style="height:12px"></div>'+rows+btn('Start match','startmatch','pr')+'</div>';
};
views.play=function(){
  var m=cur(),pc=paceOf(m),q=queued(m),cards='';
  for(var t=1;t<=m.tables;t++){
    var g=playing(m).filter(function(x){return x.table===t;})[0];
    if(g){
      var mins=Math.max(0,Math.floor((now()-g.startedAt)/60000));
      cards+='<div class="gm"><div class="t">'+tableBall(t)+'<span>Table '+t+' &middot; game '+g.n+'</span><span style="margin-left:auto;font-weight:400;color:#777">'+mins+' min</span></div><div class="big" style="margin-bottom:10px">'+esc(gnames(m,g))+'</div><div class="row2"><button class="bt win" data-act="result" data-n="'+g.n+'" data-r="W">&#10003; Win</button><button class="bt los" data-act="result" data-n="'+g.n+'" data-r="L">&#10005; Loss</button></div></div>';
    }else{
      var nx=eligible(m)[0];
      cards+='<div class="gm"><div class="t">'+tableBall(t)+'<span>Table '+t+' is free</span></div>'+(q.length?(nx?'<div style="margin-bottom:10px">Next: '+esc(gnames(m,nx))+'</div>'+btn('Start game '+nx.n,'startnext','pr',' data-t="'+t+'"'):'<div class="s">Waiting for a player to finish on another table.</div>')+'<button class="bt sm" data-act="choose" data-t="'+t+'">Choose another game</button>':'<div class="s">No games left.</div>')+'</div>';
    }
  }
  var nextList=q.slice(0,m.tables).map(function(g){return esc(gnames(m,g));}).join(' &middot; ');
  var cls=pc.status==='Running behind'?'warn':'ok';
  var warn=pc.status==='Running behind'?'<div class="box warn"><b>'+pc.over+' game'+(pc.over===1?'':'s')+' may not fit before '+m.cutoff+'.</b><div style="height:8px"></div><div class="row2"><button class="bt sm pr" data-act="waiting">Choose which to drop</button><button class="bt sm" data-act="dropgames" data-k="'+pc.over+'">Drop last '+pc.over+'</button></div></div>':'';
  var tt=totals(m);
  return hdr('Scorekeeper')+'<div class="bd"><p class="st">'+esc(S.team||'Our team')+' vs '+esc(m.oppName)+' &middot; '+tt.w+'-'+tt.l+'</p>'+
  (q.length?'<p class="s">Next up: '+nextList+'</p>':'')+cards+
  '<div class="box '+cls+'"><b>'+pc.status+'</b> &middot; '+pc.fit+' more game'+(pc.fit===1?'':'s')+' can start before '+m.cutoff+' &middot; '+q.length+' left</div>'+warn+
  '<div class="row2"><button class="bt sm" data-act="latepick">Add player now</button><button class="bt sm" data-act="undo">Undo</button></div><div style="height:10px"></div><button class="bt sm" data-act="waiting">Waiting games and drops</button><div style="height:12px"></div>'+btn('Finish match','finish','bl')+'</div>';
};
function resultBody(m){
  var tt=totals(m),rows=m.games.filter(function(g){return g.result;}).map(function(g){return '<tr><td>'+g.n+'</td><td>'+(g.table||'')+'</td><td>'+esc(gnames(m,g))+'</td><td>'+(g.result==='W'?'Win':'Loss')+'</td></tr>';}).join('');
  return '<div class="box '+(tt.res==='Loss'?'bad':'ok')+'" style="text-align:center"><div style="font-size:34px;font-weight:700">'+tt.w+' - '+tt.l+'</div><div>'+tt.res+'</div></div>'+
  btn('Send results to '+esc(m.manager||'the Manager'),'sendresults','pr')+btn('Print or save PDF','print','bl')+btn('Send to players','sendplayers','pu')+
  '<h2>Games</h2><table><tr><th>#</th><th>Table</th><th>Players</th><th>Result</th></tr>'+rows+'</table>'+(m.dropped&&m.dropped.length?'<h2>Not played (dropped)</h2>'+m.dropped.map(function(g){return '<p style="margin:0 0 6px">Game '+g.n+': '+esc(g.p.map(function(id){return num(m,id)+' '+pname(id);}).join(' + '))+'</p>';}).join(''):'');
}
views.result=function(){var m=viewMatch()||cur();if(!m)return views.home();
  return hdr('Match result','home')+'<div class="bd"><p class="st">'+esc(m.date)+' &middot; '+(m.home?'Home':'Away')+' vs '+esc(m.oppName)+(m.practice?' &middot; Practice, not counted':'')+'</p>'+resultBody(m)+'<div style="height:20px"></div><button class="bt sm los" data-act="delmatch" data-id="'+m.id+'">Delete this match</button></div>';};
views.past=function(){
  function row(m){var t=totals(m);return '<div class="gm" data-act="openmatch" data-id="'+m.id+'"><b>'+esc(m.date)+'</b> &middot; '+(m.home?'Home':'Away')+' vs '+esc(m.oppName)+'<div>'+t.w+'-'+t.l+' &middot; '+t.res+'</div></div>';}
  var all=S.matches.filter(function(m){return m.status==='complete';}).sort(function(a,b){return b.date<a.date?-1:1;});
  var list=all.filter(function(m){return !m.practice;}),prac=all.filter(function(m){return m.practice;});
  var rec={w:0,l:0,t:0};list.forEach(function(m){var t=totals(m);if(t.res==='Win')rec.w++;else if(t.res==='Loss')rec.l++;else rec.t++;});
  return hdr('Past matches','home')+'<div class="bd"><p class="s">Match record '+rec.w+'-'+rec.l+'-'+rec.t+'</p>'+(list.map(row).join('')||'<p class="s">No finished matches yet.</p>')+
  (prac.length?'<h2>Practice matches (not counted)</h2>'+prac.map(row).join('')+'<button class="bt los" data-act="delpractice">Delete all practice matches</button>':'')+'</div>';
};
function stats(){
  var P={},PR={};
  S.matches.filter(function(m){return m.status==='complete'&&!m.practice;}).forEach(function(m){m.games.forEach(function(g){
    if(!g.result)return;
    g.p.forEach(function(id){var p=P[id]=P[id]||{g:0,w:0,l:0,hw:0,hl:0,aw:0,al:0};p.g++;if(g.result==='W'){p.w++;m.home?p.hw++:p.aw++;}else{p.l++;m.home?p.hl++:p.al++;}});
    if(g.p.length===2){var k=E.key(g.p[0],g.p[1]);var q=PR[k]=PR[k]||{a:g.p[0],b:g.p[1],g:0,w:0};q.g++;if(g.result==='W')q.w++;}
  });});
  return {P:P,PR:PR};
}
views.stats=function(){
  var st=stats(),minG=S.settings.minPlayerGames,minP=S.settings.minPairGames;
  var rows=S.players.filter(function(p){return !p.off||st.P[p.id];}).map(function(p){
    var s=st.P[p.id];if(!s)return '<tr><td>'+esc(p.name)+'</td><td colspan="3">-</td></tr>';
    var pct=s.g>=minG?Math.round(100*s.w/s.g)+'%':'-';
    var best=null;Object.keys(st.PR).forEach(function(k){var q=st.PR[k];if(q.a!==p.id&&q.b!==p.id)return;if(q.g<minP)return;var r=q.w/q.g;if(!best||r>best.r)best={r:r,o:q.a===p.id?q.b:q.a,g:q.g,w:q.w};});
    return '<tr><td>'+esc(p.name)+'</td><td>'+s.w+'-'+s.l+'</td><td>'+pct+'</td><td>'+(best?esc(pname(best.o))+' ('+best.w+'-'+(best.g-best.w)+')':'-')+'</td></tr><tr><td></td><td colspan="3" style="font-size:13px;color:#777">Home '+s.hw+'-'+s.hl+' &middot; Away '+s.aw+'-'+s.al+'</td></tr>';
  }).join('');
  return hdr('Team stats','home')+'<div class="bd"><p class="s">Manager view. Results while playing on a team. Percentages appear after '+minG+' games, and best partner after '+minP+' games together.</p><table><tr><th>Player</th><th>W-L</th><th>Win%</th><th>Best partner</th></tr>'+rows+'</table></div>';
};
views.settings=function(){
  var s=S.settings;
  function f(l,k,t){return '<label>'+l+'</label><input type="'+(t||'text')+'" data-set="'+k+'" value="'+esc(s[k])+'">';}
  return hdr('Settings','home')+'<div class="bd"><label>Our team name (required)</label><input type="text" data-team="1" value="'+esc(S.team)+'" placeholder="Ben Wilson Sr Ctr">'+
  f('Default manager','manager')+f('Default tables','tables','number')+f('Minutes per game','min','number')+f('Default start','start','time')+f('Last game starts by','cutoff','time')+f('Target games per player','target','number')+f('Games needed before win% is shown','minPlayerGames','number')+f('Games as partners before best partner shows','minPairGames','number')+f('Credit name','credit')+
  '<h2>Game types</h2>'+gameTypeRows()+'<label>Add a game type</label><select id="gtsel">'+gameTypeOptions()+'</select><div style="height:8px"></div><button class="bt sm" data-act="addgametype">Add game type</button>'+
  '<h2>Manager PIN</h2><p class="s">'+(S.pin?'A PIN protects Team stats.':'No PIN yet. You will be asked to set one the first time you open Team stats.')+'</p><button class="bt sm" data-act="changepin">'+(S.pin?'Change PIN':'Set PIN')+'</button>'+
  '<h2>Backup</h2><button class="bt bl" data-act="backup">Export backup file</button><label class="bt" style="cursor:pointer">Import file<input type="file" id="imp" accept=".json,application/json" style="display:none"></label>'+
  '<h2>About</h2><button class="bt sm bl" data-act="doupdate">Update app</button><p class="s" style="margin-top:12px">Team Pool Tracker<br>Version '+VERSION+' &middot; built '+BUILD+'<br>Requirements '+REQV+'<br>Created by '+esc(S.settings.credit)+', built with '+CREDIT_AI+' by Anthropic.</p></div>';
};
var PRESETS=['8-ball','9-ball','10-ball','Straight pool','One pocket','Bank pool','Cutthroat','Rotation'];
function gameTypeRows(){return S.gameTypes.map(function(t,i){return '<div class="rw"><span>'+esc(t)+'</span>'+(S.gameTypes.length>1?'<button class="bt sm los" style="width:auto" data-act="rmgametype" data-i="'+i+'">Remove</button>':'')+'</div>';}).join('');}
function gameTypeOptions(){var have=S.gameTypes.map(function(x){return x.toLowerCase();});return PRESETS.filter(function(p){return have.indexOf(p.toLowerCase())<0;}).map(function(p){return '<option>'+esc(p)+'</option>';}).join('')+'<option value="__other">Other (type a name)</option>';}
views.help=function(){
  function sec(t,items){return '<h2>'+t+'</h2>'+items.map(function(x){return '<p style="margin:0 0 10px;line-height:1.45">'+x+'</p>';}).join('');}
  return hdr('Help','home')+'<div class="bd"><p class="s">Written for the manager. Everything here works without internet.</p>'+
  sec('First time only',['1. Open Settings and type your team name. Everything else can stay as it is.','2. Open Players and add everyone who plays, including people who only come now and then. Separate names with commas. Mark occasional players as Sub if you like.','3. Settings, Manager PIN, Set PIN. Tap four numbers on the big number pad, then tap the same four numbers again. Write down the recovery code and keep it safe.'])+
  sec('Before the match',['1. Home, Start match.','2. Pick the opponent. The first time, type the other team\'s name in the box and tap Add opponent. After that, pick from the list or tap Add another opponent.','2b. Check the Match date. It shows today. Change it if you are entering a match from another day.','3. Pick Home or Away, the game type, and the format.','4. Turn on Practice if this is only a rehearsal. Practice matches are never counted.','5. Tap each person who is here. Someone not on the list? Type the name in the box and tap Add to roster and mark here.','6. Tap Continue.'])+
  sec('Games that fit',['The app shows how many games fit before the last start time. Change tables or minutes per game with the plus and minus buttons if needed. Tap Build schedule. The number of games each person gets is a plan, not a promise.'])+
  sec('Schedule',['The number in front of each name is that player\'s number for this match. Tap Print blank score sheet for a paper copy to write results on if a phone dies. Games 1 and 2 show their starting tables; later games take the next free table. Tap a name to swap that person. Tap Lock to keep two people together for this match. To release a pair, tap Unlock in the Locked pairs box; it is also on the Waiting games screen during the match. Reshuffle makes a new set. Undo takes back the last change. When it looks right, tap Start match.'])+
  sec('During the match',['1. The Scorekeeper screen shows what is on each table. When a game ends, tap Win or Loss for that table.','2. The next game starts by itself. Next up shows who is coming.','3. Tapped the wrong one? Tap Undo right away.','4. The pace line says On pace, Ahead, or Running behind. If it says behind, tap Choose which to drop. Tap the games you want to remove, so you decide who sits out. Check the counts at the bottom, then tap Drop selected games. You can also open Waiting games and drops at any time. Dropped games are listed on the result and the printed record.','5. Someone arrives late? Tap Add player now and pick the name. People who came on time keep their planned games.','6. Table is free but nobody can start? Tap Choose another game.'])+
  sec('After the match',['The result screen appears after the last game. Tap Send results to the Manager to share the results file. Tap Print or save PDF to print the record. Tap Send to players to text the score. To end early, tap Finish match on the Scorekeeper screen.'])+
  sec('Practice matches',['Want to try the app without counting it? On the setup screen tap Practice before you continue. Run the match as usual.','When you are done: Home, Past matches. Scroll to Practice matches (not counted) and tap Delete all practice matches, then confirm.','Forgot to tap Practice? Open the match from Past matches, scroll to the bottom, tap Delete this match, and confirm.','If you set a Manager PIN, delete asks for it first. Each phone has its own PIN.'])+
  sec('Stats and past matches',['Past matches shows the record. Team stats opens with the Manager PIN. Forgot the PIN? Type the recovery code instead and choose a new PIN. To remove any match, see Practice matches above.'])+
  sec('When a player leaves or a name is wrong',['Open Players. Tap Remove next to the name to delete the player for good. Old match records keep the name. Tap Make inactive instead if the person might come back.','Inactive players do not show when you pick who is here. They are listed at the bottom of Players. Tap Bring back if they return.','Spelled a name wrong but they already played? Tap Rename instead. History follows the new spelling.'])+
  sec('If something looks wrong',['The screen looks old or something is missing: tap Update now if the blue box shows on Home, or open Settings and tap Update app. If that does not help, type teampooltracker.com/update.html in the address bar and go. Your players and matches are kept. The version is shown at the bottom of the Home screen.','New phone, or a new person needs the player list: on Players tap Send roster by text. On the other phone, open Players, paste the names into the Add players box, and tap Add players.','To keep a full copy of all matches, open Settings and tap Export backup file now and then and save it. To restore, tap Import file.','No internet: the app still works after it has been opened once with internet.'])+
  sec('Settings you may want to change',['Settings has your team name, default manager, tables, minutes per game, start time, last start time, and target games per player.','Game types: tap the pulldown to pick a game such as 9-ball or straight pool and tap Add game type. Choose Other to type your own. Tap Remove to take one off the list.','Manager PIN: tap Set PIN or Change PIN. Tap four numbers on the number pad, then the same four again.'])+
  sec('Who to ask',['Questions? Ask '+esc(S.settings.credit||'the person who set this up')+'.'])+
  featuresHtml()+'<div class="foot" style="font-size:13px;color:#777">Team Pool Tracker<br>Version '+VERSION+' &middot; built '+BUILD+'<br>Requirements '+REQV+'</div></div>';
};
views.waiting=function(){
  var m=cur(),pc=paceOf(m),q=queued(m),sel=V.dropSel||{},k=0;
  q.forEach(function(g){if(sel[g.n])k++;});
  var rows=q.map(function(g){var on=!!sel[g.n];return '<div class="rw" data-act="toggledrop" data-n="'+g.n+'" role="checkbox" aria-checked="'+on+'"><span>Game '+g.n+': '+esc(gnames(m,g))+'</span><span class="ck'+(on?' on':'')+'">'+(on?'&#10003;':'')+'</span></div>';}).join('');
  var played={},waiting={};
  m.games.forEach(function(g){g.p.forEach(function(id){if(g.status==='done'||g.status==='playing')played[id]=(played[id]||0)+1;else if(!sel[g.n])waiting[id]=(waiting[id]||0)+1;});});
  var prow=m.here.map(function(h){var a=played[h.id]||0,b=waiting[h.id]||0;return '<tr><td>'+h.num+' '+esc(pname(h.id))+'</td><td>'+a+'</td><td>'+b+'</td><td><b>'+(a+b)+'</b></td></tr>';}).join('');
  var dropped=(m.dropped||[]).map(function(g){return '<div class="rw"><span>Game '+g.n+': '+esc(g.p.map(function(id){return num(m,id)+' '+pname(id);}).join(' + '))+'</span></div>';}).join('');
  var head=pc.status==='Running behind'?'<div class="box warn"><b>Running behind.</b> About '+pc.over+' game'+(pc.over===1?'':'s')+' may not fit before '+m.cutoff+'. Tap the games you want to drop. You pick who sits out.</div>':'<div class="box ok"><b>'+pc.status+'.</b> '+pc.fit+' more game'+(pc.fit===1?'':'s')+' can start before '+m.cutoff+'. You can still drop games if you wish.</div>';
  return hdr('Waiting games','play')+'<div class="bd">'+head+lockBox(m)+
  (q.length?'<p class="s">Tap a game to mark it to drop. Dropped games are not played and are listed on the result.</p>'+rows:'<p class="s">No games are waiting.</p>')+
  '<div style="height:10px"></div><div class="row2"><button class="bt sm" data-act="sellast">Select last '+Math.max(1,pc.over)+'</button><button class="bt sm" data-act="clrdrop">Clear</button></div><div style="height:10px"></div>'+
  btn('Drop '+k+' selected game'+(k===1?'':'s'),'dodrop',k?'los':'',k?'':' disabled')+
  '<h2>Games each player would get</h2><table><tr><th>Player</th><th>Played</th><th>Waiting</th><th>Total</th></tr>'+prow+'</table>'+
  (dropped?'<h2>Already dropped</h2>'+dropped:'')+'</div>';
};
views.late=function(){
  var m=cur(),here={};hereIds(m).forEach(function(i){here[i]=1;});
  var rows=activeP().filter(function(p){return !here[p.id];}).map(function(p){return '<button class="bt" data-act="addlate" data-id="'+p.id+'">'+esc(p.name)+'</button>';}).join('');
  return hdr('Add player now','play')+'<div class="bd"><p class="s">On-time players keep their planned games. A late player gets only spare games.</p>'+(rows||'<p class="s">Everyone is already here.</p>')+'</div>';
};

function checkUpdate(){
  if(!navigator.onLine||!window.fetch)return;
  fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.json();}).then(function(j){
    if(j&&j.version&&j.version!==VERSION){V.upd=j.version;if(V.view==='home')render();}
  }).catch(function(){});
}
var APP_FILES=['./','index.html','app.js','engine.js','style.css','manifest.webmanifest','version.json','icon-192.png','icon-512.png'];
function forceUpdate(){
  var jobs=[];
  try{if(navigator.serviceWorker&&navigator.serviceWorker.getRegistrations)jobs.push(navigator.serviceWorker.getRegistrations().then(function(rs){return Promise.all(rs.map(function(r){return r.unregister();}));}));}catch(e){}
  try{if(window.caches)jobs.push(caches.keys().then(function(ks){return Promise.all(ks.map(function(k){return caches.delete(k);}));}));}catch(e){}
  Promise.all(jobs).catch(function(){}).then(function(){
    return Promise.all(APP_FILES.map(function(f){return fetch(f,{cache:'reload'}).catch(function(){});}));
  }).then(function(){location.replace(location.pathname+'?u='+Date.now());},function(){location.replace(location.pathname+'?u='+Date.now());});
}
function dropGames(m,ns){
  m.dropped=m.dropped||[];
  m.games.forEach(function(g){if(ns.indexOf(g.n)>=0&&g.status==='queued')m.dropped.push({n:g.n,p:g.p.slice()});});
  m.games=m.games.filter(function(g){return !(ns.indexOf(g.n)>=0&&g.status==='queued');});
}
function finishNow(m){m.status='complete';m.finishedAt=now();V.matchId=m.id;save();go('result');}
var FEATURES=[
 ['Players and roster',['Add players by typing or dictating names separated by commas','Mark occasional players as Sub','Remove a player for good, or Make inactive someone who may return','Send the roster to another phone by text message','Add someone not on the list while setting up a match','Rename a player, remove a misspelled one, or move someone who left to Inactive']],
 ['Setting up a match',['Opponent list, with a name box the first time','Match date picker','Home or away, game type, and format (doubles, scotch doubles, singles)','Real or Practice match. Practice matches never count','Tap who is here; players get numbers for the match']],
 ['Schedule',['Automatic fair pairings and tables from who is here','Number of games based on the time that fits and your target','Swap a player, lock a pair for the match, reshuffle, and undo','Auto and Edited tags show what the app chose and what you changed','Print a blank score sheet as a paper backup']],
 ['During the match',['Tap Win or Loss per table and the next game starts by itself','Next up list and a pace line: On pace, Ahead, or Running behind','If behind, choose which waiting games to drop and see each player\'s counts first','Dropped games are listed on the result and the printed record','Add a late player, who gets only spare games','Choose another game for a free table; finish the match early']],
 ['After the match',['Result screen with the score','Send the results file to the manager','Print or save a PDF record with player numbers','Text the score to players','Past matches record; delete a match with the PIN']],
 ['Stats',['Team stats behind the Manager PIN','Wins and losses, win percentage after enough games, and best partner','Home versus away results']],
 ['Safety and privacy',['Works without internet after the first visit','Everything stays on your phone; no account','Manager PIN with a recovery code','Backup file export and import','Not listed in search engines']],
 ['Updates and help',['Version and build date shown on Home and in Settings','Update now button and Update app button keep your data','Repair page teampooltracker.com/update.html for a phone stuck on an old copy','This Help screen']],
 ['Coming later',['Tournaments that group many matches','Results split by opponent team','Spreadsheet (CSV) export and a change log','Manager invite and scorekeeper links','A wall display for the match']]
];
function featuresHtml(){return '<h2>What this app can do</h2><p class="s">Version '+VERSION+'</p>'+FEATURES.map(function(g){return '<p style="margin:12px 0 4px"><b>'+esc(g[0])+'</b></p>'+g[1].map(function(f){return '<p style="margin:0 0 4px;padding-left:16px;text-indent:-16px;line-height:1.4">&bull; '+esc(f)+'</p>';}).join('');}).join('');}
function sheet(html){V.sheet=html;render();}
function render(){
  var v=V.view;if((v==='play'||v==='schedule'||v==='setup'||v==='plan'||v==='late'||v==='waiting')&&!cur())v='home';
  var h=views[v]();
  if(V.sheet)h+='<div class="sheet'+(V.sheetTop?' top':'')+'"><div data-stop="1">'+V.sheet+'</div></div>';
  document.getElementById('app').innerHTML=h;
  var fs=document.querySelectorAll('#app input,#app textarea');for(var i=0;i<fs.length;i++){fs[i].setAttribute('autocomplete','off');fs[i].setAttribute('data-1p-ignore','true');fs[i].setAttribute('data-lpignore','true');fs[i].setAttribute('data-form-type','other');}
}
function hpin(x){var h=5381,t='tpt|'+x;for(var i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;return String(h);}
function ui(html,after,top){return new Promise(function(res){V.sheetRes=res;V.sheet=html;V.sheetTop=!!top;render();if(after)setTimeout(after,40);});}
function closeUi(val){var r=V.sheetRes;V.sheetRes=null;V.sheet=null;V.sheetTop=false;V.pinBuf='';V.pinLock=false;render();if(r)r(val);}
function uiAlert(msg,label){return ui('<p style="font-size:19px;line-height:1.45;margin:4px 0 14px">'+esc(msg).replace(/\n/g,'<br>')+'</p><button class="bt pr" data-act="uiok">'+esc(label||'OK')+'</button>').then(function(){return true;});}
function uiConfirm(msg,yes,danger){return ui('<p style="font-size:19px;line-height:1.45;margin:4px 0 14px">'+esc(msg).replace(/\n/g,'<br>')+'</p><div class="row2"><button class="bt" data-act="uino">Cancel</button><button class="bt '+(danger?'los':'pr')+'" data-act="uiyes">'+esc(yes||'Yes')+'</button></div>').then(function(v){return v===true;});}
function uiPrompt(title,initial,o){o=o||{};
  return ui('<h2 style="margin-top:4px">'+esc(title)+'</h2>'+(o.hint?'<p class="s">'+esc(o.hint)+'</p>':'')+'<input type="text" id="uiin" value="'+esc(initial||'')+'"><div style="height:12px"></div><div class="row2"><button class="bt" data-act="uino">Cancel</button><button class="bt pr" data-act="uisave">'+esc(o.ok||'Save')+'</button></div>'+(o.extra?'<button class="bt sm" style="margin-top:10px" data-act="uiextra">'+esc(o.extra)+'</button>':''),function(){var i=document.getElementById('uiin');if(i)i.focus();},true);}
function pinHtml(){
  var m=V.pinMeta||{},d='';for(var i=0;i<4;i++)d+='<span class="dot'+(i<V.pinBuf.length?' on':'')+'"></span>';
  var pad='';'123456789'.split('').forEach(function(k){pad+='<button class="pk" data-act="pinkey" data-k="'+k+'">'+k+'</button>';});
  pad+='<button class="pk" data-act="pinback" aria-label="Delete last number">&#9003;</button><button class="pk" data-act="pinkey" data-k="0">0</button><button class="pk sm" data-act="uino">Cancel</button>';
  return '<h2 style="margin-top:4px;text-align:center">'+esc(m.title)+'</h2>'+(m.hint?'<p class="s" style="text-align:center">'+esc(m.hint)+'</p>':'')+'<div class="dots">'+d+'</div><div class="pad">'+pad+'</div>'+(m.extra?'<button class="bt sm" style="margin-top:12px" data-act="uiextra">'+esc(m.extra)+'</button>':'');
}
function uiPin(title,hint,extra){V.pinBuf='';V.pinMeta={title:title,hint:hint,extra:extra};V.pinLock=false;return ui(pinHtml());}
async function newPin(){
  var p=await uiPin('Choose a 4-digit PIN','Tap four numbers. It protects Team stats.');
  if(p===null)return false;
  var p2=await uiPin('Enter the same PIN again');
  if(p2===null)return false;
  if(p2!==p){await uiAlert('The two PINs did not match. Nothing was saved. Try again.');return false;}
  var rc='',ch='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';for(var i=0;i<8;i++)rc+=ch.charAt(Math.floor(Math.random()*ch.length));
  S.pin={h:hpin(p),r:hpin(rc)};save();
  await uiAlert('Your recovery code is\n\n'+rc+'\n\nWrite it down and keep it safe. It resets your PIN if you forget it. It will not be shown again.','I wrote it down');
  return true;
}
async function askPin(){
  if(!S.pin)return newPin();
  var p=await uiPin('Enter your Manager PIN','','Forgot PIN');
  if(p===null)return false;
  if(p==='__extra'){
    var c=await uiPrompt('Enter your recovery code','',{ok:'Reset PIN'});if(c===null)return false;
    if(hpin(c.trim().toUpperCase())===S.pin.r){S.pin=null;save();await uiAlert('PIN reset. Choose a new one next.');return newPin();}
    await uiAlert('That recovery code is not right.');return false;
  }
  if(hpin(p)===S.pin.h)return true;
  await uiAlert('That PIN is not right.');return false;
}
function goNow(v){V.view=v;V.sheet=null;V.sheetRes=null;render();window.scrollTo(0,0);}
function go(v){
  if(v==='stats'&&V.view!=='stats'){askPin().then(function(ok){if(ok)goNow('stats');});return;}
  goNow(v);
}

function parseNames(t){return t.split(/[,\n;]|\band\b/i).map(function(x){return x.trim();}).filter(Boolean);}
function similar(a,b){a=a.toLowerCase();b=b.toLowerCase();return a===b?2:(a.indexOf(b)===0||b.indexOf(a)===0)?1:0;}
async function addNames(names){
  var added=0,ids=[];
  for(var k=0;k<names.length;k++){
    var n=names[k];
    var ex=S.players.filter(function(p){return similar(p.name,n)===2;})[0];if(ex){ids.push(ex.id);continue;}
    var sm=S.players.filter(function(p){return similar(p.name,n)===1;})[0];
    if(sm&&!(await uiConfirm('"'+n+'" looks like "'+sm.name+'".\nAdd "'+n+'" as a new player?','Add as new'))){ids.push(sm.id);continue;}
    var np={id:uid(),name:n};S.players.push(np);ids.push(np.id);added++;
  }
  return {added:added,ids:ids};
}
function download(name,text){var a=document.createElement('a');a.href='data:application/json;charset=utf-8,'+encodeURIComponent(text);a.download=name;document.body.appendChild(a);a.click();document.body.removeChild(a);}
function shareFile(name,text,fallbackText){
  try{var f=new File([text],name,{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],title:name,text:fallbackText||''}).catch(function(){});return;}}catch(e){}
  download(name,text);
}
function resultsFile(m){
  var ids={};m.games.forEach(function(g){g.p.forEach(function(i){ids[i]=1;});});
  return JSON.stringify({type:'results',app:'Team Pool Tracker',version:1,exported:now(),team:S.team,players:S.players.filter(function(p){return ids[p.id];}),match:m});
}
function fname(m,ext){return m.date+' '+m.oppName.replace(/[^\w ]/g,'')+' Record'+ext;}
function printRecord(m){
  var tt=totals(m),sz=size(m);
  var pl=m.here.map(function(h,i){var w=0,l=0;m.games.forEach(function(g){if(g.p.indexOf(h.id)>=0){if(g.result==='W')w++;if(g.result==='L')l++;}});return '<tr><td>'+(h.num||i+1)+'</td><td>'+esc(pname(h.id))+(h.late?' (late)':'')+'</td><td>'+w+'</td><td>'+l+'</td></tr>';}).join('');
  var gr=m.games.filter(function(g){return g.status==='done';}).map(function(g){return '<tr><td>'+g.n+'</td><td>'+g.p.map(function(i){return num(m,i);}).join(' + ')+'</td><td>'+esc(gnamesPlain(m,g))+'</td><td>'+(g.table||'')+'</td><td>'+(g.result==='W'?'Win':'')+'</td><td>'+(g.result==='L'?'Loss':'')+'</td></tr>';}).join('');
  document.getElementById('print').innerHTML='<h1>'+esc(S.team||'Our team')+' vs '+esc(m.oppName)+(m.practice?' (practice)':'')+'</h1><div>'+esc(m.date)+' &middot; '+(m.home?'Home':'Away')+' &middot; '+esc(m.gameType)+' &middot; '+esc(m.format)+(m.tracker?' &middot; Tracker: '+esc(m.tracker):'')+'</div><div style="margin:8px 0 12px;font-size:20px"><b>Games won '+tt.w+', lost '+tt.l+' &middot; '+tt.res+'</b></div>'+
  '<table style="width:36%;float:left;margin-right:3%"><tr><th>No.</th><th>Name</th><th>W</th><th>L</th></tr>'+pl+'</table><table style="width:60%"><tr><th>Game</th><th>Players</th><th>Names</th><th>Table</th><th>Win</th><th>Lose</th></tr>'+gr+'</table><div style="clear:both"></div>'+(m.dropped&&m.dropped.length?'<div style="margin-top:10px"><b>Not played (dropped):</b> '+m.dropped.map(function(g){return 'Game '+g.n+' ('+esc(gnamesPlain(m,g))+')';}).join('; ')+'</div>':'')+'<div class="pf">Created by '+esc(S.settings.credit)+', built with '+CREDIT_AI+' by Anthropic &middot; Team Pool Tracker version '+VERSION+'</div>';
  var old=document.title;document.title=fname(m,'').replace(/\.pdf$/,'');window.print();setTimeout(function(){document.title=old;},800);
}

function printBlank(m){
  var sz=size(m);
  var pl=m.here.map(function(h,i){return '<tr><td>'+(h.num||i+1)+'</td><td>'+esc(pname(h.id))+'</td><td style="width:36px"></td><td style="width:36px"></td></tr>';}).join('');
  var gr=m.games.map(function(g){return '<tr style="height:30px"><td>'+g.n+'</td><td>'+g.p.map(function(i){return num(m,i);}).join(' + ')+'</td><td>'+esc(gnamesPlain(m,g))+'</td><td style="width:44px"></td><td style="width:44px"></td><td style="width:44px"></td></tr>';}).join('');
  document.getElementById('print').innerHTML='<h1>'+esc(S.team||'Our team')+' vs '+esc(m.oppName)+(m.practice?' (practice)':'')+'</h1><div>'+esc(m.date)+' &middot; '+(m.home?'Home':'Away')+' &middot; '+esc(m.gameType)+' &middot; '+esc(m.format)+'</div><div style="margin:8px 0 12px"><b>Score sheet: mark Win or Lose for each game. Total wins ____ losses ____</b></div>'+
  '<table style="width:36%;float:left;margin-right:3%"><tr><th>No.</th><th>Name</th><th>W</th><th>L</th></tr>'+pl+'</table><table style="width:60%"><tr><th>Game</th><th>Players</th><th>Names</th><th>Table</th><th>Win</th><th>Lose</th></tr>'+gr+'</table><div style="clear:both"></div><div class="pf">Created by '+esc(S.settings.credit)+', built with '+CREDIT_AI+' by Anthropic &middot; Team Pool Tracker version '+VERSION+'</div>';
  var old=document.title;document.title=m.date+' '+m.oppName.replace(/[^\w ]/g,'')+' Score sheet';window.print();setTimeout(function(){document.title=old;},800);
}
async function act(a,d,el){
  var m=cur();
  switch(a){
    case 'go':go(d.v);break;
    case 'resume':go(m.status==='active'?'play':m.status==='setup'?(m.games.length?'schedule':'setup'):'result');break;
    case 'newmatch':{
      var ex=cur();if(ex&&(ex.status==='setup'||ex.status==='active')){if(!(await uiConfirm('A match is in progress. Start a new one instead?','Start new')))return;ex.status='cancelled';}
      var s=S.settings,o=S.opponents[0]||{id:'',name:''};if(!s.manager)s.manager='';
      var nm={id:uid(),date:today(),oppId:o.id,oppName:o.name,home:true,gameType:S.gameTypes[0],format:'Doubles',manager:s.manager,tracker:'',tables:+s.tables,min:+s.min,start:s.start,cutoff:s.cutoff,target:+s.target,here:[],games:[],locks:[],status:'setup',startedAt:null,practice:false};
      S.matches.push(nm);S.current=nm.id;V.undo=[];save();go('setup');break;}
    case 'practice':m.practice=d.v==='1';save();render();break;
    case 'homeaway':m.home=d.v==='1';save();render();break;
    case 'addopp':{var n=await uiPrompt('Opponent team name','',{ok:'Add'});if(n&&n.trim()){var o2={id:uid(),name:n.trim()};S.opponents.push(o2);m.oppId=o2.id;m.oppName=o2.name;save();render();}break;}
    case 'addoppinline':{var bx=document.getElementById('oppnew'),nm2=bx?bx.value.trim():'';if(!nm2){await uiAlert('Type the opponent team name first.');break;}var o3={id:uid(),name:nm2};S.opponents.push(o3);m.oppId=o3.id;m.oppName=o3.name;save();render();break;}
    case 'togglehere':{var i=hereIds(m).indexOf(d.id);if(i>=0)m.here.splice(i,1);else m.here.push({id:d.id,late:false,at:now()});save();render();break;}
    case 'allhere':m.here=activeP().map(function(p){return {id:p.id,late:false,at:now()};});save();render();break;
    case 'nonehere':m.here=[];save();render();break;
    case 'toplan':
      if(!S.team.trim()){await uiAlert('Enter your team name in Settings first.');go('settings');return;}
      if(!m.oppName){await uiAlert('Pick or add the opponent first.');return;}
      if(m.here.length<(size(m)===1?1:2)){await uiAlert('Pick who is here first.');return;}
      assignNums(m);
      if(m.here.length<4&&size(m)===2)m.tables=1;
      go('plan');break;
    case 'step':{var k=d.k,dl=+d.d,lim={tables:[1,8],min:[3,60],target:[1,12]}[k];m[k]=Math.min(lim[1],Math.max(lim[0],m[k]+dl));save();render();break;}
    case 'build':generate(m);save();go('schedule');break;
    case 'reshuffle':snap();rebuild(m);save();render();break;
    case 'undo':undo();break;
    case 'unlock':{snap();m.locks.splice(+d.i,1);rebuild(m);save();render();break;}
    case 'lock':{var g=m.games.filter(function(x){return x.n===+d.n;})[0];snap();m.locks.push([g.p[0],g.p[1]]);rebuild(m);save();render();break;}
    case 'swap':{
      var g2=m.games.filter(function(x){return x.n===+d.n;})[0];
      var opts=m.here.filter(function(h){return g2.p.indexOf(h.id)<0;}).map(function(h){return '<button class="bt" data-act="doswap" data-n="'+g2.n+'" data-from="'+d.id+'" data-to="'+h.id+'">'+esc(pname(h.id))+'</button>';}).join('');
      sheet('<h2>Replace '+esc(pname(d.id))+' with</h2>'+opts+'<button class="bt" data-act="closesheet">Cancel</button>');break;}
    case 'doswap':{var g3=m.games.filter(function(x){return x.n===+d.n;})[0];snap();g3.p=g3.p.map(function(x){return x===d.from?d.to:x;});g3.edited=true;V.sheet=null;save();render();break;}
    case 'closesheet':case 'uino':closeUi(null);break;
    case 'uiok':case 'uiyes':closeUi(true);break;
    case 'uisave':{var inp=document.getElementById('uiin');closeUi(inp?inp.value:'');break;}
    case 'uiextra':closeUi('__extra');break;
    case 'pinkey':{
      if(V.pinLock||!V.sheetRes)break;
      V.pinBuf+=d.k;
      if(V.pinBuf.length>=4){V.pinLock=true;V.sheet=pinHtml();render();var v=V.pinBuf;setTimeout(function(){closeUi(v);},160);}
      else{V.sheet=pinHtml();render();}
      break;}
    case 'pinback':if(!V.pinLock){V.pinBuf=V.pinBuf.slice(0,-1);V.sheet=pinHtml();render();}break;
    case 'startmatch':snap();m.status='active';m.startedAt=now();fillTables(m);save();go('play');break;
    case 'result':{
      var g4=m.games.filter(function(x){return x.n===+d.n;})[0];snap();g4.status='done';g4.result=d.r;g4.endedAt=now();
      fillTables(m);
      if(!queued(m).length&&!playing(m).length){m.status='complete';m.finishedAt=now();V.matchId=m.id;save();go('result');return;}
      save();render();break;}
    case 'startnext':snap();startOn(m,+d.t);save();render();break;
    case 'choose':{
      var b=busyIds(m);var opts2=queued(m).map(function(g){var free=g.p.every(function(i){return !b[i];});return '<button class="bt'+(free?'':' los')+'" '+(free?'data-act="startthis" data-t="'+d.t+'" data-n="'+g.n+'"':'data-act="closesheet"')+'>Game '+g.n+': '+esc(gnames(m,g))+(free?'':' (busy)')+'</button>';}).join('');
      sheet('<h2>Choose a game for Table '+d.t+'</h2>'+opts2+'<button class="bt" data-act="closesheet">Cancel</button>');break;}
    case 'startthis':{var g5=m.games.filter(function(x){return x.n===+d.n;})[0];snap();startOn(m,+d.t,g5);V.sheet=null;save();render();break;}
    case 'dropgames':{snap();var k2=+d.k,qs=queued(m).slice(-k2).map(function(g){return g.n;});dropGames(m,qs);if(!queued(m).length&&!playing(m).length){finishNow(m);break;}save();render();break;}
    case 'waiting':V.dropSel={};go('waiting');break;
    case 'toggledrop':{V.dropSel=V.dropSel||{};if(V.dropSel[d.n])delete V.dropSel[d.n];else V.dropSel[d.n]=1;render();break;}
    case 'sellast':{var pc2=paceOf(m),kk=Math.max(1,pc2.over);V.dropSel={};queued(m).slice(-kk).forEach(function(g){V.dropSel[g.n]=1;});render();break;}
    case 'clrdrop':V.dropSel={};render();break;
    case 'dodrop':{
      var picks=queued(m).filter(function(g){return V.dropSel&&V.dropSel[g.n];}).map(function(g){return g.n;});
      if(!picks.length)break;
      snap();dropGames(m,picks);V.dropSel={};
      if(!queued(m).length&&!playing(m).length){finishNow(m);break;}
      fillTables(m);save();go('play');break;}
    case 'latepick':go('late');break;
    case 'addlate':{
      snap();var L=d.id;var onTime=hereIds(m);m.here.push({id:L,late:true,at:now(),num:Math.max.apply(null,[0].concat(m.here.map(function(h){return h.num||0;})))+1});
      if(m.status==='setup'||!m.games.length){generate(m);}
      else{
        var qd=queued(m),planned=plannedCounts(m),lockedMap={};m.locks.forEach(function(l){lockedMap[l[0]]=1;lockedMap[l[1]]=1;});
        var arrs=qd.map(function(g){return g.p;});var given=E.addLate(arrs,planned,onTime,L,lockedMap);
        qd.forEach(function(g,i){g.p=arrs[i];});
        await uiAlert(given?pname(L)+' added to '+given+' remaining game'+(given===1?'':'s')+'. On-time players keep their planned games.':'No spare games for '+pname(L)+'. You can still swap them in from the Schedule.');
        fillTables(m);
      }
      save();go('play');break;}
    case 'finish':{
      var left=queued(m).length+playing(m).length;
      if(left&&!(await uiConfirm(left+' game'+(left===1?'':'s')+' not finished. Finish anyway? Unplayed games are removed.','Finish anyway')))return;
      snap();m.games=m.games.filter(function(g){return g.status==='done';});m.status='complete';m.finishedAt=now();V.matchId=m.id;save();go('result');break;}
    case 'delmatch':{
      var dm=S.matches.filter(function(x){return x.id===d.id;})[0];if(!dm)break;
      if(S.pin&&!(await askPin()))break;
      if(!(await uiConfirm('Delete the match vs '+dm.oppName+' on '+dm.date+'? This cannot be undone.','Delete',true)))break;
      S.matches=S.matches.filter(function(x){return x.id!==d.id;});if(S.current===d.id)S.current=null;V.matchId=null;save();go('past');break;}
    case 'delpractice':{
      if(S.pin&&!(await askPin()))break;
      var np=S.matches.filter(function(x){return x.practice&&x.status==='complete';}).length;
      if(!(await uiConfirm('Delete '+np+' practice match'+(np===1?'':'es')+'? This cannot be undone.','Delete',true)))break;
      S.matches=S.matches.filter(function(x){return !(x.practice&&x.status==='complete');});save();render();break;}
    case 'openmatch':V.matchId=d.id;go('result');break;
    case 'sendresults':{var mm=viewMatch()||m;shareFile(fname(mm,'.json').replace(' Record',' Results'),resultsFile(mm),'Results for '+mm.date);break;}
    case 'print':printRecord(viewMatch()||m);break;
    case 'printblank':printBlank(m);break;
    case 'sendplayers':{
      var m2=viewMatch()||m,t2=totals(m2),txt=(S.team||'Our team')+' vs '+m2.oppName+', '+m2.date+': '+t2.w+'-'+t2.l+' '+t2.res+'. Team Pool Tracker: https://teampooltracker.com';
      if(navigator.share)navigator.share({text:txt}).catch(function(){});else{try{await navigator.clipboard.writeText(txt);await uiAlert('Copied. Paste it into a text message.');}catch(e){await uiPrompt('Copy this text',txt,{ok:'Done'});}}break;}
    case 'rename':{var p=S.players.filter(function(x){return x.id===d.id;})[0],n2=await uiPrompt('Rename player',p.name,{ok:'Save'});if(n2&&n2.trim()){p.name=n2.trim();save();render();}break;}
    case 'rmplayer':{if(await uiConfirm('Remove '+pname(d.id)+' from the roster for good? Old match records keep the name.','Remove',true)){var nm0=pname(d.id);S.gone=S.gone||{};S.gone[d.id]=nm0;S.players=S.players.filter(function(x){return x.id!==d.id;});var cm=cur();if(cm&&cm.status==='setup')cm.here=cm.here.filter(function(h){return h.id!==d.id;});save();render();}break;}
    case 'deactivate':{var pp=S.players.filter(function(x){return x.id===d.id;})[0];if(pp&&await uiConfirm('Make '+pp.name+' inactive? They will not show when you pick who is here. You can bring them back any time.','Make inactive')){pp.off=true;var cm2=cur();if(cm2&&cm2.status==='setup')cm2.here=cm2.here.filter(function(h){return h.id!==d.id;});save();render();}break;}
    case 'reactivate':{var pr=S.players.filter(function(x){return x.id===d.id;})[0];if(pr){delete pr.off;save();render();}break;}
    case 'addplayers':{var txtv=document.getElementById('addbox').value,r1=await addNames(parseNames(txtv));save();V.draft=null;await uiAlert(r1.added+' player'+(r1.added===1?'':'s')+' added.');render();break;}
    case 'addhere':{
      var box=document.getElementById('newhere'),r2=await addNames(parseNames(box.value));
      r2.ids.forEach(function(id){if(hereIds(m).indexOf(id)<0)m.here.push({id:id,late:false,at:now()});});
      save();render();break;}
    case 'togglesub':{var ps=S.players.filter(function(x){return x.id===d.id;})[0];ps.sub=!ps.sub;save();render();break;}
    case 'addgametype':{
      var gt=document.getElementById('gtsel').value;
      if(gt==='__other'){gt=await uiPrompt('Name of the game type','',{ok:'Add'});}
      gt=(gt||'').trim();
      if(gt&&!S.gameTypes.some(function(x){return x.toLowerCase()===gt.toLowerCase();})){S.gameTypes.push(gt);save();}
      render();break;}
    case 'sendroster':{var txt=activeP().map(function(p){return p.name;}).join(', ');if(navigator.share)navigator.share({text:txt}).catch(function(){});else{try{await navigator.clipboard.writeText(txt);await uiAlert('Roster copied. Paste it into a text message.');}catch(e){await uiPrompt('Copy this text',txt,{ok:'Done'});}}break;}
    case 'doupdate':forceUpdate();break;
    case 'changepin':{if(S.pin&&!(await askPin()))break;var old=S.pin;S.pin=null;var okp=await newPin();if(!okp)S.pin=old;save();render();break;}
    case 'rmgametype':{
      var removed=S.gameTypes[+d.i];
      if(S.gameTypes.length>1&&(await uiConfirm('Remove '+removed+' from the list? Past matches keep it.','Remove',true))){
        S.gameTypes.splice(+d.i,1);
        S.matches.forEach(function(x){if(x.status==='setup'&&x.gameType===removed)x.gameType=S.gameTypes[0];});
        save();render();}
      break;}
    case 'backup':download('Team Pool Tracker backup '+today()+'.json',JSON.stringify({type:'backup',version:1,exported:now(),data:S}));break;
  }
}
document.addEventListener('click',function(e){
  var t=e.target.closest('[data-act]');if(!t)return;
  if(t.classList.contains('sheet')&&e.target!==t)return;
  act(t.dataset.act,t.dataset,t);
});
document.addEventListener('change',function(e){
  var t=e.target,m=cur();
  if(t.dataset.bind&&m){var k=t.dataset.bind;m[k]=t.value;if(k==='oppId'){var o=S.opponents.filter(function(x){return x.id===t.value;})[0];m.oppName=o?o.name:'';}save();if(k==='start'||k==='cutoff')render();}
  else if(t.dataset.set){var k2=t.dataset.set,v=t.value;S.settings[k2]=(t.type==='number')?+v:v;save();}
  else if(t.dataset.team){S.team=t.value.trim();save();}
  else if(t.id==='imp'&&t.files[0]){var r=new FileReader();r.onload=function(){importFile(r.result);};r.readAsText(t.files[0]);t.value='';}
});
async function importFile(txt){
  try{
    var o=JSON.parse(txt);
    if(o.type==='backup'){if(await uiConfirm('Replace everything on this phone with the backup?','Replace',true)){S=o.data;V.undo=[];save();await uiAlert('Backup restored.');go('home');}return;}
    if(o.type==='results'){
      var map={};
      o.players.forEach(function(p){var ex=S.players.filter(function(x){return x.id===p.id||x.name.toLowerCase()===p.name.toLowerCase();})[0];if(ex)map[p.id]=ex.id;else{S.players.push({id:p.id,name:p.name});map[p.id]=p.id;}});
      var mt=o.match;if(S.matches.some(function(x){return x.id===mt.id;})){await uiAlert('That match is already here. Nothing changed.');return;}
      mt.here.forEach(function(h){h.id=map[h.id]||h.id;});mt.games.forEach(function(g){g.p=g.p.map(function(i){return map[i]||i;});});mt.locks=(mt.locks||[]).map(function(l){return l.map(function(i){return map[i]||i;});});
      if(!S.opponents.some(function(x){return x.name.toLowerCase()===mt.oppName.toLowerCase();}))S.opponents.push({id:uid(),name:mt.oppName});
      if(!S.team&&o.team)S.team=o.team;
      S.matches.push(mt);save();await uiAlert('Imported match vs '+mt.oppName+', '+mt.date+'.');go('past');return;
    }
    await uiAlert('That file is not from Team Pool Tracker.');
  }catch(e){await uiAlert('Could not read that file.');}
}
document.addEventListener('keydown',function(e){if(e.key==='Enter'&&document.getElementById('uiin')){var b=document.querySelector('.sheet [data-act="uisave"]');if(b)b.click();}});
checkUpdate();
setInterval(function(){if(V.view==='play'&&!V.sheet&&!document.activeElement.matches('input,textarea,select'))render();},30000);
if('serviceWorker' in navigator&&location.protocol!=='file:'){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}
if(navigator.storage&&navigator.storage.persist){navigator.storage.persist().catch(function(){});}
window.__app={S:function(){return S;},V:V,act:act,render:render};
render();
