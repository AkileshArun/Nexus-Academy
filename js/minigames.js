/* =========================================================================
   minigames.js — Mini-game engine for Nexus Academy
   Interface (every game): init(container, onWin, onFail [, opts]); destroy()
   Library: sequenceRecall, reactionGate, patternMatch, oddOneOut, rhythmTap,
   memoryGrid, wireConnect, maze, lightsOut, memoryMatch, sortBins, anagram,
   stickFight (themed cosplay), and a lives-based boss with unique dialogue.
   ========================================================================= */
(function () {
  'use strict';

  /* ---------------------------- helpers ---------------------------- */
  function clearAll(g){ (g._timers||[]).forEach(t=>{clearTimeout(t);clearInterval(t);}); g._timers=[]; if(g._raf){cancelAnimationFrame(g._raf); g._raf=null;} if(g._keyHandler){window.removeEventListener('keydown',g._keyHandler); g._keyHandler=null;} }
  function later(g,fn,ms){ const t=setTimeout(fn,ms); g._timers.push(t); return t; }
  function every(g,fn,ms){ const t=setInterval(fn,ms); g._timers.push(t); return t; }
  function frame(host,instr){ host.innerHTML='<p class="mg-instructions">'+instr+'</p><div class="mg-status"></div><div class="mg-area"></div>'; return {area:host.querySelector('.mg-area'),status:host.querySelector('.mg-status')}; }
  function setStatus(el,t,k){ el.textContent=t; el.className='mg-status'+(k?' '+k:''); }
  function retryButton(area,fn,label){ const b=document.createElement('button'); b.className='btn btn-ghost'; b.style.marginTop='1rem'; b.textContent=label||'Try again'; b.addEventListener('click',fn); area.appendChild(b); }
  function rand(n){ return Math.floor(Math.random()*n); }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=rand(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }

  const TILE_COLORS=['#FF5D73','#2EE6FF','#3DDC97','#FFC857','#8A5CFF','#FF8A3D'];
  const SHAPES=['▲','●','■','◆','★','✦'];
  const MiniGames=(window.MiniGames=window.MiniGames||{});
  function sfx(n){ if(window.NEXUS&&NEXUS.sfx)NEXUS.sfx(n); }

  /* ====================== 1) SEQUENCE RECALL ====================== */
  MiniGames.sequenceRecall={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail){ const self=this; clearAll(self); self._host=host;
      const ui=frame(host,'Watch the lights, then tap them back in the same order.');
      const colors=TILE_COLORS.slice(0,4);
      const row=document.createElement('div'); row.className='tile-row';
      const tiles=colors.map((c,i)=>{const t=document.createElement('div');t.className='tile';t.style.background=c;t.style.color=c;t.dataset.idx=i;row.appendChild(t);return t;});
      ui.area.appendChild(row);
      const seq=[]; for(let i=0;i<4;i++) seq.push(rand(4));
      let input=[],accepting=false;
      function flash(i){ tiles[i].classList.add('flash'); later(self,()=>tiles[i].classList.remove('flash'),380); }
      function play(){ accepting=false; setStatus(ui.status,'Watch…'); seq.forEach((idx,k)=>later(self,()=>flash(idx),600*(k+1))); later(self,()=>{accepting=true; setStatus(ui.status,'Your turn — repeat it.');},600*(seq.length+1)); }
      tiles.forEach(t=>t.addEventListener('click',()=>{ if(!accepting)return; const i=Number(t.dataset.idx); flash(i); input.push(i); const p=input.length-1;
        if(input[p]!==seq[p]){ accepting=false; setStatus(ui.status,'Wrong order — reset.','bad'); onFail(); later(self,()=>{input=[]; const o=ui.area.querySelector('.btn'); if(o)o.remove(); retryButton(ui.area,()=>{input=[];play();},'Replay sequence');},250); return; }
        if(input.length===seq.length){ accepting=false; setStatus(ui.status,'Sequence matched!','good'); onWin(); } }));
      later(self,play,500); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== 2) REACTION GATE ====================== */
  MiniGames.reactionGate={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail){ const self=this; clearAll(self); self._host=host;
      const ui=frame(host,'Tap the GREEN orbs. Do NOT tap red. Get 6 before 3 mistakes.');
      const arena=document.createElement('div'); arena.className='arena'; ui.area.appendChild(arena);
      let hits=0,misses=0,done=false;
      function tally(){ setStatus(ui.status,'Hits '+hits+'/6   ·   Mistakes '+misses+'/3'); } tally();
      function spawn(){ if(done)return; const good=Math.random()<0.68; const orb=document.createElement('div'); orb.className='target '+(good?'good':'bad'); orb.textContent=good?'✓':'✕'; orb.style.left=(12+rand(76))+'%'; orb.style.top=(16+rand(68))+'%'; arena.appendChild(orb); const life=later(self,()=>{if(orb.parentNode)orb.remove();},1050);
        orb.addEventListener('click',()=>{ if(done)return; if(good)hits++; else misses++; clearTimeout(life); orb.remove(); tally(); check(); }); }
      function check(){ if(hits>=6){done=true;setStatus(ui.status,'Reflexes sharp — cleared!','good');onWin();} else if(misses>=3){done=true;setStatus(ui.status,'Too many mistakes.','bad');onFail();retryButton(ui.area,()=>self.init(host,onWin,onFail));} }
      every(self,spawn,720); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== 3) PATTERN MATCH ====================== */
  MiniGames.patternMatch={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail){ const self=this; clearAll(self); self._host=host;
      const ui=frame(host,'Pick the shape that completes the pattern. Three in a row to win.'); let round=0;
      function newRound(){ round++; setStatus(ui.status,'Round '+round+' of 3'); ui.area.innerHTML='';
        const a=rand(SHAPES.length); let b=rand(SHAPES.length); while(b===a)b=rand(SHAPES.length);
        const doubled=Math.random()<0.5; const base=doubled?[a,a,b,a,a,b]:[a,b,a,b,a,b]; const answer=base[base.length-1];
        const row=document.createElement('div'); row.className='tile-row';
        base.slice(0,-1).forEach(s=>{const t=document.createElement('div');t.className='tile';t.textContent=SHAPES[s];row.appendChild(t);});
        const q=document.createElement('div'); q.className='tile'; q.textContent='?'; q.style.borderColor='var(--accent)'; row.appendChild(q); ui.area.appendChild(row);
        let opts=[answer,a,b,rand(SHAPES.length)].filter((v,i,arr)=>arr.indexOf(v)===i); while(opts.length<3){const x=rand(SHAPES.length); if(!opts.includes(x))opts.push(x);} shuffle(opts);
        const orow=document.createElement('div'); orow.className='options-row';
        opts.forEach(o=>{const t=document.createElement('div');t.className='tile';t.textContent=SHAPES[o];
          t.addEventListener('click',()=>{ if(o===answer){ q.textContent=SHAPES[answer]; q.classList.add('flash'); if(round>=3){setStatus(ui.status,'Pattern mastered!','good');onWin();} else later(self,newRound,600);} else {setStatus(ui.status,'Not quite — restart.','bad');onFail();round=0;later(self,newRound,700);} }); orow.appendChild(t);});
        ui.area.appendChild(orow); }
      newRound(); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== 4) ODD ONE OUT ====================== */
  MiniGames.oddOneOut={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail){ const self=this; clearAll(self); self._host=host;
      const ui=frame(host,'One tile is a different colour. Tap it. Three rounds.'); let round=0;
      function shade(hex,amt){const c=hex.replace('#','');let r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16);r=Math.min(255,r+amt);g=Math.max(0,g-amt);b=Math.min(255,b+amt);return 'rgb('+r+','+g+','+b+')';}
      function newRound(){ round++; setStatus(ui.status,'Round '+round+' of 3'); ui.area.innerHTML='';
        const grid=document.createElement('div'); grid.className='grid4'; const count=12+round*2; const sym=SHAPES[rand(SHAPES.length)]; const base=TILE_COLORS[rand(TILE_COLORS.length)]; const odd=rand(count);
        for(let i=0;i<count;i++){const t=document.createElement('div');t.className='tile';t.textContent=sym;t.style.color=(i===odd)?shade(base,38):base;
          t.addEventListener('click',()=>{ if(i===odd){t.classList.add('flash'); if(round>=3){setStatus(ui.status,'Sharp eyes — cleared!','good');onWin();} else later(self,newRound,450);} else {setStatus(ui.status,'That one matches — restart.','bad');onFail();round=0;later(self,newRound,650);} }); grid.appendChild(t);} 
        ui.area.appendChild(grid); }
      newRound(); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== 5) RHYTHM TAP ====================== */
  MiniGames.rhythmTap={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail){ const self=this; clearAll(self); self._host=host;
      const ui=frame(host,'Tap when the moving ring lines up with the glowing ring. Land 3 of 6.');
      const stage=document.createElement('div'); stage.className='ring-stage';
      const target=document.createElement('div'); target.className='ring-target';
      const shrink=document.createElement('div'); shrink.className='ring-shrink';
      const zone=document.createElement('div'); zone.className='tap-zone';
      stage.appendChild(target); stage.appendChild(shrink); stage.appendChild(zone); ui.area.appendChild(stage);
      const TR=60,MAX=110,TOL=16,DUR=1400; let goods=0,sweeps=0,start=performance.now(),done=false,tapped=false;
      function radius(now){ const p=((now-start)%DUR)/DUR; return MAX*(1-p); }
      function tally(){ setStatus(ui.status,'Landed '+goods+'/3   ·   Sweeps '+sweeps+'/6'); } tally();
      function loop(now){ if(done)return; const r=radius(now); shrink.style.width=shrink.style.height=(r*2)+'px'; if(r>MAX-4&&tapped)tapped=false; if(r<6&&!tapped){sweeps++;tapped=true;tally();end();} self._raf=requestAnimationFrame(loop); }
      function end(){ if(goods>=3){done=true;setStatus(ui.status,'Perfect timing — cleared!','good');onWin();} else if(sweeps>=6){done=true;setStatus(ui.status,'Out of sweeps.','bad');onFail();retryButton(ui.area,()=>self.init(host,onWin,onFail));} }
      zone.addEventListener('click',()=>{ if(done||tapped)return; const r=radius(performance.now()); tapped=true; sweeps++; if(Math.abs(r-TR)<=TOL){goods++;target.style.boxShadow='0 0 24px var(--accent)';later(self,()=>target.style.boxShadow='',200);} tally(); end(); });
      self._raf=requestAnimationFrame(loop); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== 6) MEMORY GRID ====================== */
  MiniGames.memoryGrid={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail){ const self=this; clearAll(self); self._host=host;
      const ui=frame(host,'Memorise the cells that glow, then tap them in order.');
      const grid=document.createElement('div'); grid.className='grid4'; ui.area.appendChild(grid);
      const cells=[]; for(let i=0;i<16;i++){const c=document.createElement('div');c.className='tile';c.style.color='var(--accent)';c.dataset.idx=i;cells.push(c);grid.appendChild(c);}
      const seq=[]; while(seq.length<4){const x=rand(16); if(!seq.includes(x))seq.push(x);} let input=[],accepting=false;
      function play(){ accepting=false; setStatus(ui.status,'Watch…'); seq.forEach((idx,k)=>{later(self,()=>cells[idx].classList.add('flash'),550*(k+1));later(self,()=>cells[idx].classList.remove('flash'),550*(k+1)+380);}); later(self,()=>{accepting=true;setStatus(ui.status,'Your turn — tap them in order.');},550*(seq.length+1)); }
      cells.forEach(c=>c.addEventListener('click',()=>{ if(!accepting)return; const i=Number(c.dataset.idx); c.classList.add('flash'); later(self,()=>c.classList.remove('flash'),220); input.push(i); const p=input.length-1;
        if(input[p]!==seq[p]){ accepting=false; setStatus(ui.status,'Wrong cell — reset.','bad'); onFail(); input=[]; later(self,()=>{const o=ui.area.querySelector('.btn');if(o)o.remove();retryButton(ui.area,()=>{input=[];play();},'Replay');},250); return; }
        if(input.length===seq.length){ accepting=false; setStatus(ui.status,'Recalled perfectly!','good'); onWin(); } }));
      later(self,play,500); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== 7) WIRE CONNECT (Among-Us style) ====================== */
  MiniGames.wireConnect={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail){ const self=this; clearAll(self); self._host=host;
      const ui=frame(host,'Connect each wire to the matching colour on the other side.');
      const wires=shuffle(TILE_COLORS.slice(0,4)); const rightOrder=shuffle(wires.slice());
      const wrap=document.createElement('div'); wrap.className='wire-wrap';
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg'); svg.setAttribute('class','wire-svg');
      const left=document.createElement('div'); left.className='wire-col left';
      const right=document.createElement('div'); right.className='wire-col right';
      wrap.appendChild(left); wrap.appendChild(svg); wrap.appendChild(right); ui.area.appendChild(wrap);
      let selected=null, connected=0;
      const leftNodes={}, rightNodes={};
      wires.forEach(c=>{ const d=document.createElement('div'); d.className='wire-node'; d.style.background=c; d.dataset.color=c; leftNodes[c]=d; left.appendChild(d);
        d.addEventListener('click',()=>{ if(d.dataset.done)return; document.querySelectorAll('.wire-node.sel').forEach(n=>n.classList.remove('sel')); selected=c; d.classList.add('sel'); }); });
      rightOrder.forEach(c=>{ const d=document.createElement('div'); d.className='wire-node'; d.style.background=c; d.dataset.color=c; rightNodes[c]=d; right.appendChild(d);
        d.addEventListener('click',()=>{ if(!selected||d.dataset.done)return; if(selected===c){ drawLine(leftNodes[c],d,c); leftNodes[c].dataset.done='1'; d.dataset.done='1'; leftNodes[c].classList.remove('sel'); leftNodes[c].classList.add('done'); d.classList.add('done'); selected=null; connected++; if(connected===wires.length){setStatus(ui.status,'All wired up!','good');onWin();} } else { setStatus(ui.status,'Colours must match.','bad'); } }); });
      function drawLine(a,b,color){ const wr=wrap.getBoundingClientRect(),ar=a.getBoundingClientRect(),br=b.getBoundingClientRect(); const ln=document.createElementNS('http://www.w3.org/2000/svg','line'); ln.setAttribute('x1',ar.right-wr.left); ln.setAttribute('y1',ar.top-wr.top+ar.height/2); ln.setAttribute('x2',br.left-wr.left); ln.setAttribute('y2',br.top-wr.top+br.height/2); ln.setAttribute('stroke',color); ln.setAttribute('stroke-width','6'); ln.setAttribute('stroke-linecap','round'); svg.appendChild(ln); }
      setStatus(ui.status,'Tap a colour, then its match.'); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== 8) MAZE ====================== */
  MiniGames.maze={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail){ const self=this; clearAll(self); self._host=host;
      const ui=frame(host,'Reach the glowing exit. Use the arrow pad (or arrow keys).');
      // 1 = wall, 0 = path. Start top-left (1,1), exit bottom-right.
      const layouts=[
        ["1111111","1000101","1011101","1000001","1110111","1000001","1111111"],
        ["1111111","1000001","1110101","1010101","1010001","1011101","1111111"],
        ["1111111","1010001","1010111","1000101","1110101","1000001","1111111"]
      ];
      const M=layouts[rand(layouts.length)].map(r=>r.split('').map(Number));
      const ROWS=M.length, COLS=M[0].length; const exit={r:ROWS-2,c:COLS-2}; let pos={r:1,c:1};
      const board=document.createElement('div'); board.className='maze-board'; board.style.gridTemplateColumns='repeat('+COLS+',1fr)'; ui.area.appendChild(board);
      const cells=[];
      for(let r=0;r<ROWS;r++){cells[r]=[]; for(let c=0;c<COLS;c++){const d=document.createElement('div'); d.className='maze-cell '+(M[r][c]?'wall':'path'); if(r===exit.r&&c===exit.c)d.classList.add('exit'); board.appendChild(d); cells[r][c]=d;}}
      function paint(){ cells.forEach((row,r)=>row.forEach((d,c)=>{ d.classList.toggle('player', r===pos.r&&c===pos.c); })); }
      function move(dr,dc){ const nr=pos.r+dr,nc=pos.c+dc; if(nr<0||nc<0||nr>=ROWS||nc>=COLS)return; if(M[nr][nc]===1)return; pos={r:nr,c:nc}; paint(); if(pos.r===exit.r&&pos.c===exit.c){ setStatus(ui.status,'Exit reached — cleared!','good'); onWin(); } }
      paint();
      // on-screen dpad
      const pad=document.createElement('div'); pad.className='dpad';
      pad.innerHTML='<button data-d="up">▲</button><div class="dpad-mid"><button data-d="left">◀</button><button data-d="down">▼</button><button data-d="right">▶</button></div>';
      pad.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{const d=b.dataset.d; if(d==='up')move(-1,0); if(d==='down')move(1,0); if(d==='left')move(0,-1); if(d==='right')move(0,1);}));
      ui.area.appendChild(pad);
      self._keyHandler=(e)=>{ if(e.key==='ArrowUp'){e.preventDefault();move(-1,0);} else if(e.key==='ArrowDown'){e.preventDefault();move(1,0);} else if(e.key==='ArrowLeft'){e.preventDefault();move(0,-1);} else if(e.key==='ArrowRight'){e.preventDefault();move(0,1);} };
      window.addEventListener('keydown',self._keyHandler);
      setStatus(ui.status,'Find your way out.'); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== 9) LIGHTS OUT ====================== */
  MiniGames.lightsOut={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail){ const self=this; clearAll(self); self._host=host;
      const ui=frame(host,'Tapping a light flips it and its neighbours. Turn them ALL off.');
      const N=4; const on=[]; for(let i=0;i<N*N;i++)on[i]=false;
      const board=document.createElement('div'); board.className='lights-board'; ui.area.appendChild(board);
      const cells=[]; for(let i=0;i<N*N;i++){const d=document.createElement('div'); d.className='light'; d.dataset.i=i; cells.push(d); board.appendChild(d); d.addEventListener('click',()=>tap(i));}
      function idx(r,c){ return r*N+c; }
      function flip(i){ on[i]=!on[i]; cells[i].classList.toggle('lit',on[i]); }
      function tap(i){ const r=Math.floor(i/N),c=i%N; flip(i); if(r>0)flip(idx(r-1,c)); if(r<N-1)flip(idx(r+1,c)); if(c>0)flip(idx(r,c-1)); if(c<N-1)flip(idx(r,c+1)); check(); }
      function check(){ if(on.every(v=>!v)){ setStatus(ui.status,'All lights out — cleared!','good'); onWin(); } else { setStatus(ui.status,'Lights on: '+on.filter(Boolean).length); } }
      // scramble from solved state so it is always solvable
      const scrambles=6+rand(4); for(let s=0;s<scrambles;s++) tap(rand(N*N));
      setStatus(ui.status,'Lights on: '+on.filter(Boolean).length); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== 10) MEMORY MATCH (pairs) ====================== */
  MiniGames.memoryMatch={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail){ const self=this; clearAll(self); self._host=host;
      const ui=frame(host,'Flip cards to find the matching pairs.');
      const syms=SHAPES.slice(0,6); const deck=shuffle(syms.concat(syms));
      const board=document.createElement('div'); board.className='match-board'; ui.area.appendChild(board);
      let first=null, lock=false, found=0;
      deck.forEach((s,i)=>{ const card=document.createElement('div'); card.className='match-card'; card.dataset.sym=s; card.innerHTML='<span>'+s+'</span>'; board.appendChild(card);
        card.addEventListener('click',()=>{ if(lock||card.classList.contains('flip')||card.classList.contains('done'))return; card.classList.add('flip');
          if(!first){ first=card; return; }
          if(first.dataset.sym===card.dataset.sym){ first.classList.add('done'); card.classList.add('done'); first=null; found++; if(found===syms.length){setStatus(ui.status,'All pairs found!','good');onWin();} }
          else { lock=true; const a=first,b=card; first=null; later(self,()=>{a.classList.remove('flip');b.classList.remove('flip');lock=false;},650); }
        }); });
      setStatus(ui.status,'Pairs found: 0/'+syms.length); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== 11) SORT BINS ====================== */
  MiniGames.sortBins={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail){ const self=this; clearAll(self); self._host=host;
      const ui=frame(host,'Send each shape to the bin of the same colour. Clear 8, 2 misses allowed.');
      const colors=TILE_COLORS.slice(0,3);
      const bins=document.createElement('div'); bins.className='bins';
      colors.forEach(c=>{const b=document.createElement('div');b.className='bin';b.dataset.color=c;b.style.borderColor=c;b.style.color=c;b.textContent='▼';bins.appendChild(b);});
      const stageItem=document.createElement('div'); stageItem.className='sort-item';
      ui.area.appendChild(stageItem); ui.area.appendChild(bins);
      let solved=0,misses=0,current=null,done=false;
      function next(){ if(done)return; current=colors[rand(colors.length)]; stageItem.style.background=current; stageItem.textContent=SHAPES[rand(SHAPES.length)]; setStatus(ui.status,'Sorted '+solved+'/8 · Misses '+misses+'/2'); }
      bins.querySelectorAll('.bin').forEach(b=>b.addEventListener('click',()=>{ if(done||!current)return; if(b.dataset.color===current){ solved++; if(solved>=8){done=true;setStatus(ui.status,'Sorted clean — cleared!','good');onWin();return;} next(); } else { misses++; if(misses>=2){done=true;setStatus(ui.status,'Too many mis-sorts.','bad');onFail();retryButton(ui.area,()=>self.init(host,onWin,onFail));return;} setStatus(ui.status,'Wrong bin! Sorted '+solved+'/8 · Misses '+misses+'/2'); } }));
      next(); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== 12) ANAGRAM (unscramble) ====================== */
  MiniGames.anagram={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail){ const self=this; clearAll(self); self._host=host;
      const ui=frame(host,'Tap the letters in order to spell the word. Solve 3.');
      const WORDS=['NEXUS','POWER','LOGIC','FOCUS','BRAVE','GUARD','SPARK','RIVAL','STORM','BLADE','RESOLVE','DOMAIN'];
      let solved=0;
      function scramble(w){ let s; do{ s=shuffle(w.split('')).join(''); }while(s===w); return s; }
      function round(){ const word=WORDS[rand(WORDS.length)]; const letters=scramble(word).split('');
        setStatus(ui.status,'Word '+(solved+1)+' of 3'); ui.area.innerHTML='';
        const answer=document.createElement('div'); answer.className='anagram-answer';
        const pool=document.createElement('div'); pool.className='tile-row';
        ui.area.appendChild(answer); ui.area.appendChild(pool);
        let built='';
        function refreshAnswer(){ answer.textContent=built||'\u00A0'; }
        refreshAnswer();
        letters.forEach((ch)=>{ const t=document.createElement('div'); t.className='tile'; t.textContent=ch;
          t.addEventListener('click',()=>{ if(t.dataset.used)return; t.dataset.used='1'; t.style.opacity='0.3'; built+=ch; refreshAnswer();
            if(built.length===word.length){ if(built===word){ if(solved>=2){setStatus(ui.status,'Wordsmith — cleared!','good');onWin();} else {solved++;later(self,round,500);} } else { setStatus(ui.status,'Not the word — try again.','bad'); onFail(); built=''; later(self,round,700);} } });
          pool.appendChild(t); });
        const clear=document.createElement('button'); clear.className='btn btn-ghost'; clear.style.marginTop='0.8rem'; clear.textContent='Clear'; clear.addEventListener('click',round); ui.area.appendChild(clear);
      }
      round(); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== 13) STROOP (Color Trap) ====================== */
  MiniGames.stroop={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail){ const self=this; clearAll(self); self._host=host;
      const ui=frame(host,'Tap the INK colour of the word \u2014 NOT what it says. Get 6, 2 misses allowed.');
      const NAMES=['RED','BLUE','GREEN','YELLOW','PURPLE']; const HEX={RED:'#FF5D73',BLUE:'#2EE6FF',GREEN:'#3DDC97',YELLOW:'#FFC857',PURPLE:'#8A5CFF'};
      const word=document.createElement('div'); word.style.fontFamily='var(--display)'; word.style.fontSize='2.6rem'; word.style.textAlign='center'; word.style.margin='0.4rem 0 1rem';
      const opts=document.createElement('div'); opts.className='options-row';
      ui.area.appendChild(word); ui.area.appendChild(opts);
      let hits=0,misses=0,ink=null,done=false;
      function tally(){ setStatus(ui.status,'Correct '+hits+'/6 \u00b7 Misses '+misses+'/2'); }
      function round(){ if(done)return; const w=NAMES[rand(NAMES.length)]; let ic=NAMES[rand(NAMES.length)]; while(ic===w)ic=NAMES[rand(NAMES.length)]; ink=ic; word.textContent=w; word.style.color=HEX[ic];
        opts.innerHTML=''; shuffle(NAMES.slice()).forEach(n=>{const t=document.createElement('div');t.className='tile';t.style.background=HEX[n];t.style.width='60px';t.title=n;
          t.addEventListener('click',()=>{ if(done)return; if(n===ink){hits++;sfx('correct'); if(hits>=6){done=true;setStatus(ui.status,'Focus locked \u2014 cleared!','good');sfx('win');onWin();return;} tally(); round();} else {misses++;sfx('wrong'); if(misses>=2){done=true;setStatus(ui.status,'Too many slips.','bad');onFail();retryButton(ui.area,()=>self.init(host,onWin,onFail));return;} tally();} }); opts.appendChild(t);}); }
      tally(); round(); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== 14) QUICK MATH ====================== */
  MiniGames.quickMath={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail){ const self=this; clearAll(self); self._host=host;
      const ui=frame(host,'Tap EVERY tile that equals the target. 2 wrong taps allowed.');
      const target=8+rand(8);
      const head=document.createElement('div'); head.style.textAlign='center'; head.style.fontFamily='var(--display)'; head.style.fontSize='1.8rem'; head.style.marginBottom='0.8rem'; head.textContent='Target = '+target;
      const grid=document.createElement('div'); grid.className='grid4'; ui.area.appendChild(head); ui.area.appendChild(grid);
      // build expressions
      const tiles=[]; let needed=0;
      function expr(val){ const a=1+rand(val-1>0?val-1:1); const b=val-a; return {txt:a+'+'+b,val}; }
      for(let i=0;i<12;i++){ const correct=Math.random()<0.42; let e; if(correct){e=expr(target);needed++;} else { let v; do{ v=2+rand(18);}while(v===target); e=expr(v);} tiles.push(e); }
      if(needed===0){ tiles[0]=expr(target); needed=1; }
      shuffle(tiles); let found=0,misses=0,done=false;
      function tally(){ setStatus(ui.status,'Found '+found+'/'+needed+' \u00b7 Misses '+misses+'/2'); }
      tiles.forEach(e=>{ const t=document.createElement('div'); t.className='tile'; t.style.fontSize='1rem'; t.textContent=e.txt;
        t.addEventListener('click',()=>{ if(done||t.dataset.used)return; if(e.val===target){t.dataset.used='1';t.classList.add('flash');t.style.background='var(--success)';t.style.color='#06231a';found++;sfx('correct'); if(found>=needed){done=true;setStatus(ui.status,'Maths master \u2014 cleared!','good');sfx('win');onWin();return;} tally();} else {misses++;t.style.background='var(--danger)';later(self,()=>{t.style.background='';},250);sfx('wrong'); if(misses>=2){done=true;setStatus(ui.status,'Too many wrong taps.','bad');onFail();retryButton(ui.area,()=>self.init(host,onWin,onFail));return;} tally();} }); grid.appendChild(t); });
      tally(); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== 15) ASCEND (Order Up) ====================== */
  MiniGames.ascend={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail){ const self=this; clearAll(self); self._host=host;
      const ui=frame(host,'Tap the numbers from smallest to largest, as fast as you can.');
      const N=9; const grid=document.createElement('div'); grid.className='grid4'; grid.style.gridTemplateColumns='repeat(3,64px)'; ui.area.appendChild(grid);
      const order=shuffle(Array.from({length:N},(_,i)=>i+1)); let expect=1,done=false;
      const tiles=order.map(v=>{ const t=document.createElement('div'); t.className='tile'; t.textContent=v; t.dataset.v=v;
        t.addEventListener('click',()=>{ if(done||t.dataset.done)return; const v=Number(t.dataset.v);
          if(v===expect){ t.dataset.done='1'; t.classList.add('flash'); t.style.background='var(--success)'; t.style.color='#06231a'; sfx('correct'); expect++; if(expect>N){done=true;setStatus(ui.status,'Lightning order \u2014 cleared!','good');sfx('win');onWin();} else setStatus(ui.status,'Next: '+expect); }
          else { sfx('wrong'); setStatus(ui.status,'Out of order! Start again from 1.','bad'); onFail(); expect=1; tiles.forEach(x=>{x.dataset.done='';x.classList.remove('flash');x.style.background='';x.style.color='';}); } });
        grid.appendChild(t); return t; });
      setStatus(ui.status,'Next: 1'); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== STICK FIGHT (themed cosplay) ====================== */
  function accessory(kit){
    switch(kit){
      case 'blindfold': return '<rect x="20" y="13" width="30" height="7" rx="2" fill="#0d0d10"/>';
      case 'crown':     return '<path d="M20 8 L24 -2 L30 5 L35 -5 L40 5 L46 -2 L50 8 Z" fill="#FFC857" stroke="#b9892b" stroke-width="1"/>';
      case 'mask':      return '<rect x="19" y="11" width="32" height="9" rx="4" fill="#15151c"/><circle cx="28" cy="16" r="2" fill="#fff"/><circle cx="42" cy="16" r="2" fill="#fff"/>';
      case 'jester':    return '<path d="M24 6 Q18 -10 11 0" stroke="#9CFF3D" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M46 6 Q52 -10 59 0" stroke="#9CFF3D" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="11" cy="0" r="3" fill="#FFC857"/><circle cx="59" cy="0" r="3" fill="#FFC857"/>';
      case 'headband':  return '<rect x="19" y="10" width="32" height="5" fill="#E5404F"/><path d="M51 12 l11 5 M51 13 l10 9" stroke="#E5404F" stroke-width="3" stroke-linecap="round"/>';
      case 'spikes':    return '<path d="M22 8 L20 -4 L27 5 L31 -7 L35 5 L39 -7 L43 5 L50 -4 L48 8 Z" fill="#1b1b22" stroke="currentColor" stroke-width="1"/>';
      case 'cowl':      return '<path d="M22 6 L18 -7 L29 4 Z" fill="#2A3150"/><path d="M48 6 L52 -7 L41 4 Z" fill="#2A3150"/>';
      case 'helmet':    return '<path d="M20 17 A15 15 0 0 1 50 17 Z" fill="#2EE6FF" opacity="0.85"/><rect x="22" y="14" width="26" height="4" fill="#0b2630"/>';
      case 'horns':     return '<path d="M24 6 Q15 -2 17 -11 Q24 -4 28 4 Z" fill="#3a2230"/><path d="M46 6 Q55 -2 53 -11 Q46 -4 42 4 Z" fill="#3a2230"/>';
      case 'hat':       return '<ellipse cx="35" cy="9" rx="26" ry="6" fill="#d9b06a"/><path d="M24 9 Q35 -7 46 9 Z" fill="#c69f54"/>';
      case 'hood':      return '<path d="M18 18 Q35 -11 52 18 L48 20 Q35 1 22 20 Z" fill="#2A3150"/>';
      case 'glasses':   return '<circle cx="29" cy="16" r="4" fill="none" stroke="#0d0d10" stroke-width="2"/><circle cx="41" cy="16" r="4" fill="none" stroke="#0d0d10" stroke-width="2"/><line x1="33" y1="16" x2="37" y2="16" stroke="#0d0d10" stroke-width="2"/>';
      case 'halo':      return '<ellipse cx="35" cy="-2" rx="14" ry="4" fill="none" stroke="#FFC857" stroke-width="3"/>';
      case 'sword':     return '<rect x="19" y="10" width="32" height="5" fill="#3D7BFF"/><line x1="58" y1="42" x2="80" y2="26" stroke="#dfe9ff" stroke-width="4" stroke-linecap="round"/><line x1="56" y1="40" x2="62" y2="46" stroke="#9aa6c8" stroke-width="4" stroke-linecap="round"/>';
      default: return '';
    }
  }
  function stickSVG(kit){
    return '<svg viewBox="-8 -16 86 150" width="80" height="132" aria-hidden="true">' +
      '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round">' +
      '<circle cx="35" cy="18" r="13" fill="currentColor" stroke="none"/>' +
      '<line x1="35" y1="31" x2="35" y2="78"/>' +
      '<line x1="35" y1="44" x2="12" y2="60"/>' +
      '<line x1="35" y1="44" x2="60" y2="40"/>' +
      '<line x1="35" y1="78" x2="18" y2="118"/>' +
      '<line x1="35" y1="78" x2="55" y2="118"/>' +
      '</g>' + accessory(kit) + '</svg>';
  }

  MiniGames.stickFight={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail,opts){ const self=this; clearAll(self); self._host=host;
      const enemyName=(opts&&opts.villain)||'Rival';
      const heroKit=(opts&&opts.heroKit)||'headband';
      const villainKit=(opts&&opts.villainKit)||'horns';
      const ui=frame(host,'Solve the problem to strike. A wrong answer lets '+enemyName+' hit you!');
      const stage=document.createElement('div'); stage.className='fight-stage';
      stage.innerHTML='<div class="fighter player" style="color:var(--accent2)">'+stickSVG(heroKit)+'</div>'+
        '<div class="fighter enemy" style="color:var(--danger)">'+stickSVG(villainKit)+'</div><div class="fight-ground"></div>';
      const player=stage.querySelector('.fighter.player'), enemy=stage.querySelector('.fighter.enemy');
      const ENEMY_HP=5, PLAYER_HP=3; let eHP=ENEMY_HP,pHP=PLAYER_HP,done=false;
      const hpWrap=document.createElement('div'); hpWrap.className='hp-wrap';
      hpWrap.innerHTML='<div class="hp"><div class="who">You</div><div class="hp-bar player"><span style="width:100%"></span></div></div>'+
        '<div class="hp"><div class="who enemy">'+enemyName+'</div><div class="hp-bar enemy"><span style="width:100%"></span></div></div>';
      const pBar=hpWrap.querySelector('.hp-bar.player>span'), eBar=hpWrap.querySelector('.hp-bar.enemy>span');
      const question=document.createElement('div'); question.className='question';
      const opts3=document.createElement('div'); opts3.className='options-row';
      ui.area.appendChild(hpWrap); ui.area.appendChild(stage); ui.area.appendChild(question); ui.area.appendChild(opts3);
      function spark(txt,atEnemy){ const s=document.createElement('div'); s.className='hit-spark'; s.textContent=txt; s.style.top='40px'; s.style[atEnemy?'right':'left']='22%'; stage.appendChild(s); later(self,()=>s.remove(),520); }
      function newQuestion(){ if(done)return; const op=['+','-','×'][rand(3)]; let a,b,ans;
        if(op==='+'){a=6+rand(40);b=3+rand(40);ans=a+b;} else if(op==='-'){a=15+rand(40);b=2+rand(a-2);ans=a-b;} else {a=3+rand(9);b=3+rand(9);ans=a*b;}
        question.textContent=a+' '+op+' '+b+' = ?';
        const choices=[ans]; while(choices.length<3){const d=(rand(2)?1:-1)*(1+rand(6)); const w=ans+d; if(w>=0&&!choices.includes(w))choices.push(w);} shuffle(choices);
        opts3.innerHTML=''; choices.forEach(c=>{const t=document.createElement('div');t.className='tile';t.style.width='84px';t.textContent=c;t.addEventListener('click',()=>answer(c===ans));opts3.appendChild(t);}); }
      function answer(correct){ if(done)return;
        if(correct){ player.classList.add('lunge-r'); later(self,()=>player.classList.remove('lunge-r'),200); enemy.classList.add('hurt'); later(self,()=>enemy.classList.remove('hurt'),320); eHP--; eBar.style.width=(eHP/ENEMY_HP*100)+'%'; spark('POW!',true);
          if(eHP<=0){done=true;setStatus(ui.status,enemyName+' is down — you win!','good');later(self,onWin,400);return;} setStatus(ui.status,'Hit! Keep going.','good'); }
        else { enemy.classList.add('lunge-l'); later(self,()=>enemy.classList.remove('lunge-l'),200); player.classList.add('hurt'); later(self,()=>player.classList.remove('hurt'),320); pHP--; pBar.style.width=Math.max(0,pHP/PLAYER_HP*100)+'%'; spark('OUCH',false);
          if(pHP<=0){done=true;setStatus(ui.status,'You were knocked out!','bad');onFail();retryButton(ui.area,()=>self.init(host,onWin,onFail,opts));return;} setStatus(ui.status,'Wrong — you took a hit.','bad'); }
        later(self,newQuestion,360); }
      newQuestion(); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

  /* ====================== BOSS (lives + unique dialogue, no HP regen) ====================== */
  MiniGames.boss={ _timers:[],_raf:null,_host:null,
    init(host,onWin,onFail,opts){ const self=this; clearAll(self); self._host=host;
      const villain=(opts&&opts.villain)||'The Boss';
      const lines=(opts&&opts.lines)||{intro:'Face me.',phases:['','',''],defeat:'No...'};
      const MAX_LIVES=3;

      host.innerHTML=
        '<div class="boss-dialogue" id="bossLine">'+lines.intro+'</div>'+
        '<div class="phase-pips"><span class="pip-dot active"></span><span class="pip-dot"></span><span class="pip-dot"></span></div>'+
        '<div class="resolve"><div class="resolve-label"><span>'+villain+' · Resolve</span><span class="rv-num">100%</span></div>'+
        '<div class="resolve-bar"><div class="resolve-fill" style="width:100%"></div></div></div>'+
        '<div class="lives" id="lives"></div>'+
        '<div class="pu-bar" id="puBar"></div>'+
        '<div class="mg-status"></div><div class="mg-area"></div>';

      const pips=host.querySelectorAll('.pip-dot');
      const rvFill=host.querySelector('.resolve-fill'), rvNum=host.querySelector('.rv-num');
      const status=host.querySelector('.mg-status'), area=host.querySelector('.mg-area');
      const lineEl=host.querySelector('#bossLine'), livesEl=host.querySelector('#lives');
      const puBar=host.querySelector('#puBar');

      let phase=0, lives=MAX_LIVES, shield=false;
      const powerups=(opts&&opts.powerups)?opts.powerups.map(x=>Object.assign({},x)):[];
      const consume=(opts&&opts.consume)||function(){return false;};

      function renderPU(){ puBar.innerHTML=''; powerups.forEach(pu=>{ if(pu.count<=0)return; const b=document.createElement('button'); b.className='pu-chip'; b.style.borderColor='var(--accent)'; b.innerHTML='<span class="pu-ic">'+pu.icon+'</span><span class="pu-ct">'+pu.count+'</span>'; b.title=pu.name;
        b.addEventListener('click',()=>{ if(pu.count<=0)return; if(!consume(pu.id))return; pu.count--; sfx('powerup'); usePU(pu.effect); renderPU(); }); puBar.appendChild(b); }); }
      function usePU(effect){ if(effect==='solve'){ say('—'); clearedPhase(); } else if(effect==='guard'){ shield=true; setStatus(status,'Shield ready — next mistake blocked.','good'); } else if(effect==='life'){ lives=Math.min(5,lives+1); drawLives(); setStatus(status,'+1 life!','good'); } }
      const phases=[phaseMemory,phaseReflex,phasePattern];
      const taunts=['Not enough!','Too slow!','Is that all?','Pathetic.','Try harder!'];

      function drawLives(){ livesEl.innerHTML=''; for(let i=0;i<MAX_LIVES;i++){const h=document.createElement('span'); h.className='life'+(i<lives?'':' lost'); h.textContent='❤'; livesEl.appendChild(h);} }
      function setResolve(v){ v=Math.max(0,v); rvFill.style.width=v+'%'; rvNum.textContent=v+'%'; }
      function say(t){ lineEl.textContent=t; }

      function startPhase(){ if(phase>0)pips[phase-1].className='pip-dot cleared'; if(phase<pips.length)pips[phase].className='pip-dot active'; setResolve(100-Math.round(phase/phases.length*100)); say(lines.phases[phase]||''); phases[phase](); }
      function clearedPhase(){ setStatus(status,'Phase cleared!','good'); sfx('phase'); phase++; if(phase>=phases.length){ pips[phases.length-1].className='pip-dot cleared'; setResolve(0); say(lines.defeat); setStatus(status,villain+' is defeated!','good'); later(self,onWin,600); return; } later(self,startPhase,650); }
      // A MISTAKE only costs the player a life (boss never recovers). 0 lives = redo whole boss.
      function mistake(restartPhase){
        if(shield){ shield=false; say('Shield held!'); setStatus(status,'Shield blocked the hit!','good'); later(self,restartPhase,500); return; }
        lives--; drawLives(); sfx('wrong'); say(taunts[rand(taunts.length)]);
        if(lives<=0){ setStatus(status,'Knocked out! You must redo the boss.','bad'); sfx('lose'); onFail(); area.innerHTML=''; retryButton(area,()=>self.init(host,onWin,onFail,opts),'Retry boss'); return; }
        setStatus(status,'You took a hit! Lives left: '+lives,'bad'); later(self,restartPhase,500); }

      /* Phase 1: memory */
      function phaseMemory(){ area.innerHTML=''; setStatus(status,'Phase 1 · Read the domain pattern.');
        const colors=TILE_COLORS.slice(0,4); const row=document.createElement('div'); row.className='tile-row';
        const tiles=colors.map((c,i)=>{const t=document.createElement('div');t.className='tile';t.style.background=c;t.style.color=c;t.dataset.idx=i;row.appendChild(t);return t;}); area.appendChild(row);
        const seq=[]; for(let i=0;i<4;i++)seq.push(rand(4)); let input=[],accepting=false;
        function flash(i){tiles[i].classList.add('flash');later(self,()=>tiles[i].classList.remove('flash'),350);}
        function play(){accepting=false;seq.forEach((idx,k)=>later(self,()=>flash(idx),520*(k+1)));later(self,()=>{accepting=true;},520*(seq.length+1));}
        tiles.forEach(t=>t.addEventListener('click',()=>{ if(!accepting)return; const i=Number(t.dataset.idx); flash(i); input.push(i); const p=input.length-1;
          if(input[p]!==seq[p]){accepting=false; mistake(phaseMemory); return;} if(input.length===seq.length){accepting=false; clearedPhase();} }));
        later(self,play,400); }

      /* Phase 2: reflex (red tap = mistake) */
      function phaseReflex(){ area.innerHTML=''; setStatus(status,'Phase 2 · Counter the strikes — tap green only.');
        const arena=document.createElement('div'); arena.className='arena'; area.appendChild(arena); let hits=0,over=false;
        const spawnT=every(self,spawn,680);
        function spawn(){ if(over)return; const good=Math.random()<0.66; const orb=document.createElement('div'); orb.className='target '+(good?'good':'bad'); orb.textContent=good?'✓':'✕'; orb.style.left=(12+rand(76))+'%'; orb.style.top=(16+rand(68))+'%'; arena.appendChild(orb); const life=later(self,()=>{if(orb.parentNode)orb.remove();},980);
          orb.addEventListener('click',()=>{ if(over)return; clearTimeout(life); orb.remove(); if(good){hits++; setStatus(status,'Phase 2 · Hits '+hits+'/5'); if(hits>=5){over=true;clearInterval(spawnT);clearedPhase();}} else { over=true; clearInterval(spawnT); mistake(phaseReflex);} }); } }

      /* Phase 3: pattern (wrong pick = mistake) */
      function phasePattern(){ area.innerHTML=''; let solved=0;
        function round(){ setStatus(status,'Phase 3 · Finish the seal ('+(solved+1)+'/2).'); area.innerHTML='';
          const a=rand(SHAPES.length); let b=rand(SHAPES.length); while(b===a)b=rand(SHAPES.length); const base=[a,b,a,b,a,b]; const answer=base[base.length-1];
          const row=document.createElement('div'); row.className='tile-row'; base.slice(0,-1).forEach(s=>{const t=document.createElement('div');t.className='tile';t.textContent=SHAPES[s];row.appendChild(t);});
          const q=document.createElement('div'); q.className='tile'; q.textContent='?'; q.style.borderColor='var(--accent)'; row.appendChild(q); area.appendChild(row);
          const opts2=shuffle([answer,a,b]); const orow=document.createElement('div'); orow.className='options-row';
          opts2.forEach(o=>{const t=document.createElement('div');t.className='tile';t.textContent=SHAPES[o];t.addEventListener('click',()=>{ if(o===answer){q.textContent=SHAPES[answer];q.classList.add('flash');solved++; if(solved>=2)clearedPhase(); else later(self,round,500);} else { mistake(phasePattern);} });orow.appendChild(t);});
          area.appendChild(orow); }
        round(); }

      drawLives(); renderPU(); startPhase(); },
    destroy(){ clearAll(this); if(this._host)this._host.innerHTML=''; } };

})();
