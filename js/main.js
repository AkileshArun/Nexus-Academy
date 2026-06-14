/* =========================================================================
   main.js — Shared logic for Nexus Academy
   - Access-code system + MULTIPLE saves the player can switch between
   - Per-code progress save/load
   - Episode data: titles, accents, blurbs, unique game lineups,
     stickman "cosplay" kits, and unique boss dialogue
   - Art-path helpers, confetti, particles
   Global: window.NEXUS
   ========================================================================= */
(function () {
  'use strict';

  const CODE_KEY = 'nexus_access_code';        // currently selected code
  const CODES_KEY = 'nexus_codes';             // list of all saved codes
  const PROGRESS_PREFIX = 'nexus_progress_';   // + CODE
  const TUTORIAL_KEY = 'nexus_tutorial_done';

  /* ---- ART PATHS (drop colour images here; shown B&W until cleared) ---- */
  function panelArt(epId, panelId) { return 'assets/e' + epId + '/' + panelId + '.png'; }
  function bossArt(epId)           { return 'assets/e' + epId + '/boss.png'; }
  function coverArt(epId)          { return 'assets/e' + epId + '/cover.png'; }

  /* ---- Game catalogue: display name + skill tag for each mechanic ---- */
  const GAME_META = {
    sequenceRecall: { name: 'Recall',     tag: 'Memory' },
    reactionGate:   { name: 'Reflex',     tag: 'Reaction' },
    patternMatch:   { name: 'Pattern',    tag: 'Logic' },
    oddOneOut:      { name: 'Odd One',    tag: 'Focus' },
    rhythmTap:      { name: 'Rhythm',     tag: 'Timing' },
    memoryGrid:     { name: 'Grid',       tag: 'Spatial' },
    wireConnect:    { name: 'Wires',      tag: 'Focus' },
    maze:           { name: 'Maze',       tag: 'Navigation' },
    lightsOut:      { name: 'Lights Out', tag: 'Logic' },
    memoryMatch:    { name: 'Pairs',      tag: 'Memory' },
    sortBins:       { name: 'Sort',       tag: 'Categorize' },
    anagram:        { name: 'Unscramble', tag: 'Words' },
    stroop:         { name: 'Color Trap', tag: 'Focus' },
    quickMath:      { name: 'Quick Math', tag: 'Mental Math' },
    ascend:         { name: 'Order Up',   tag: 'Speed' },
    stickFight:     { name: 'Duel',       tag: 'Mental Math' }
  };

  /* ---- Unique 6-game lineup per episode (stickFight is always last) ---- */
  const LINEUPS = {
    1:  ['sequenceRecall','reactionGate','patternMatch','oddOneOut','rhythmTap','stickFight'],
    2:  ['wireConnect','maze','stroop','oddOneOut','sortBins','stickFight'],
    3:  ['sequenceRecall','memoryMatch','quickMath','lightsOut','rhythmTap','stickFight'],
    4:  ['lightsOut','ascend','anagram','maze','sortBins','stickFight'],
    5:  ['wireConnect','quickMath','sequenceRecall','lightsOut','stroop','stickFight'],
    6:  ['rhythmTap','maze','patternMatch','memoryMatch','reactionGate','stickFight'],
    7:  ['rhythmTap','sequenceRecall','stroop','anagram','memoryGrid','stickFight'],
    8:  ['wireConnect','lightsOut','ascend','maze','quickMath','stickFight'],
    9:  ['anagram','memoryMatch','lightsOut','stroop','wireConnect','stickFight'],
    10: ['sequenceRecall','maze','wireConnect','ascend','rhythmTap','stickFight']
  };

  /* ---- Episode meta: theme, characters, blurb, stickman kits, boss lines ---- */
  const EP_META = [
    { id:1, title:'The Infinity Gate', accent:'#8A5CFF', accent2:'#2EE6FF', hero:'Vael', villain:'Korrun',
      heroKit:'blindfold', villainKit:'crown',
      blurb:'Korrun has been sealed inside the simulation and is rewriting its rules. Out-think the domain before his grid completes.',
      bossLines:{ intro:'You step into MY domain, little Warden.',
        phases:['Numbers won\u2019t save you.','Faster \u2014 or be unmade.','The seal is mine to complete!'],
        defeat:'Impossible... the gate... holds.' } },
    { id:2, title:'Threads of the City', accent:'#E5404F', accent2:'#FFC857', hero:'Webrunner', villain:'The Grin',
      heroKit:'mask', villainKit:'jester',
      blurb:'The Grin rigged the bridges with logic-locked bombs. Swing, defuse, and out-react the chaos.',
      bossLines:{ intro:'Ha! Let\u2019s play a GAME, hero!',
        phases:['Tick tock, tick tock!','Ooh, so close!','No no NO, you\u2019re cheating!'],
        defeat:'You... took my punchline...' } },
    { id:3, title:'The Twin Rivals', accent:'#FF8A3D', accent2:'#3D7BFF', hero:'Riku', villain:'Kaen',
      heroKit:'headband', villainKit:'spikes',
      blurb:'Two friends turned rivals. Match and understand Kaen\u2019s every move to reach him.',
      bossLines:{ intro:'You always did chase me, Riku.',
        phases:['Predictable.','Is that all your resolve?','...Why won\u2019t you fall?'],
        defeat:'...Maybe I was the one running.' } },
    { id:4, title:'The Riddle Vault', accent:'#9CFF3D', accent2:'#19C3B1', hero:'Nightwarden', villain:'Mr. Glee',
      heroKit:'cowl', villainKit:'jester',
      blurb:'Mr. Glee locked the city\u2019s records behind riddles. Keep a cool head and out-deduce him.',
      bossLines:{ intro:'Riddle me this, detective!',
        phases:['Wrong answer, ha!','Tick \u2014 I mean, think!','You can\u2019t out-clever ME!'],
        defeat:'The joke\u2019s... on me.' } },
    { id:5, title:'The Core Meltdown', accent:'#2EE6FF', accent2:'#8A5CFF', hero:'AEGIS', villain:'Mordax',
      heroKit:'helmet', villainKit:'horns',
      blurb:'Mordax\u2019s gauntlet is overloading the planet\u2019s core. Engineer, route power, and balance the reactor.',
      bossLines:{ intro:'Your little suit cannot hold.',
        phases:['Power is everything.','Overload imminent!','No \u2014 my gauntlet!'],
        defeat:'Engineered... to lose.' } },
    { id:6, title:'Storm Above the Sea', accent:'#19C3B1', accent2:'#FFC857', hero:'Jolo', villain:'Kaijin',
      heroKit:'hat', villainKit:'horns',
      blurb:'Kaijin\u2019s storm will sink the islands. Master momentum and timing to split the sky.',
      bossLines:{ intro:'The sky bows to no pirate!',
        phases:['Drown in my storm!','Hold your course... if you can!','The winds turn?!'],
        defeat:'My storm... split in two.' } },
    { id:7, title:'The Ember Blade', accent:'#FF6A2C', accent2:'#FF3DA5', hero:'Haru', villain:'Ashka',
      heroKit:'sword', villainKit:'horns',
      blurb:'Ashka regenerates \u2014 force won\u2019t work. Master breath, rhythm, and focus to find the true opening.',
      bossLines:{ intro:'Strike me. I always return.',
        phases:['Find the opening \u2014 if you dare.','Patience, little blade.','...You actually saw it.'],
        defeat:'Warm... at last.' } },
    { id:8, title:'The Decay Protocol', accent:'#FF3DA5', accent2:'#8A5CFF', hero:'Spark', villain:'Crumble',
      heroKit:'spikes', villainKit:'hood',
      blurb:'Crumble\u2019s decay is spreading. Control your borrowed power and predict the chain reaction.',
      bossLines:{ intro:'Everything I touch ends.',
        phases:['It all decays.','Predict THIS.','You held it back...?'],
        defeat:'You... reached me.' } },
    { id:9, title:'The Null Sword', accent:'#CFE9FF', accent2:'#3D7BFF', hero:'Ash', villain:'Dane',
      heroKit:'sword', villainKit:'glasses',
      blurb:'Dane bends every rule. Win by inverting the puzzle \u2014 counter, negate, think opposite.',
      bossLines:{ intro:'You have no magic. You have NOTHING.',
        phases:['The rules are mine.','Invert THIS.','How \u2014 you have no power!'],
        defeat:'The underdog... wins.' } },
    { id:10, title:'The Convergence', accent:'#8A5CFF', accent2:'#FF6A2C', hero:'The Roster', villain:'The Unmaker',
      heroKit:'halo', villainKit:'horns',
      blurb:'The Unmaker is erasing the worlds. Only mastery of every skill can hold reality together.',
      bossLines:{ intro:'All worlds return to nothing.',
        phases:['Memory fades.','Order crumbles.','Nothing remains.'],
        defeat:'...Reality... holds.' }, final:true }
  ];

  // Build full EPISODES (with panels) from meta + lineups.
  const EPISODES = EP_META.map(ep => {
    const lineup = LINEUPS[ep.id];
    const customNames = ep.id === 1
      ? ['Infinity Steps','Domain Pulse','Cursed Pattern','Hollow Sigil','Barrier Rhythm','Cursed Clash']
      : null;
    const panels = lineup.map((g, i) => ({
      id: 'panel-' + (i + 1),
      game: g,
      name: customNames ? customNames[i] : GAME_META[g].name,
      tag: GAME_META[g].tag
    }));
    return Object.assign({}, ep, { panels });
  });

  /* ---------------------------- POWER-UPS ----------------------------
     Each episode has ONE unique signature power-up. Effects:
       solve = clear the current challenge (skill panel) / current boss phase
       guard = block the next mistake in a boss fight (shield)
       life  = +1 boss life (max 5)
     ------------------------------------------------------------------ */
  const POWERUPS = [
    { id:'pu1',  ep:1,  name:'Hollow Insight',   icon:'✦', effect:'solve', desc:'Instantly clears the current challenge.' },
    { id:'pu2',  ep:2,  name:'Web Shield',       icon:'🕸', effect:'guard', desc:'Blocks the next mistake in a boss fight.' },
    { id:'pu3',  ep:3,  name:'Clone Echo',       icon:'❂', effect:'solve', desc:'Instantly clears the current challenge.' },
    { id:'pu4',  ep:4,  name:'Detective Hunch',  icon:'🔍', effect:'solve', desc:'Instantly clears the current challenge.' },
    { id:'pu5',  ep:5,  name:'Arc Overcharge',   icon:'⚡', effect:'life',  desc:'+1 life in a boss fight.' },
    { id:'pu6',  ep:6,  name:'Second Wind',      icon:'🌀', effect:'life',  desc:'+1 life in a boss fight.' },
    { id:'pu7',  ep:7,  name:'Calm Breath',      icon:'☯', effect:'guard', desc:'Blocks the next mistake in a boss fight.' },
    { id:'pu8',  ep:8,  name:'Restraint Field',  icon:'✛', effect:'guard', desc:'Blocks the next mistake in a boss fight.' },
    { id:'pu9',  ep:9,  name:'Null Reset',       icon:'⊘', effect:'solve', desc:'Instantly clears the current challenge.' },
    { id:'pu10', ep:10, name:'Convergence Core', icon:'◆', effect:'solve', desc:'Instantly clears the current challenge.' }
  ];
  function powerupById(id){ return POWERUPS.find(p=>p.id===id); }
  function powerupForEpisode(ep){ return POWERUPS.find(p=>p.ep===ep); }

  /* ---------------------------- ACCESS CODES ---------------------------- */
  function genCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = ''; for (let i = 0; i < 6; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }
  function getCodes() { try { return JSON.parse(localStorage.getItem(CODES_KEY)) || []; } catch (e) { return []; } }
  function addToCodes(code) { const list = getCodes(); if (!list.includes(code)) { list.push(code); localStorage.setItem(CODES_KEY, JSON.stringify(list)); } }
  function removeCode(code) {
    localStorage.setItem(CODES_KEY, JSON.stringify(getCodes().filter(c => c !== code)));
    localStorage.removeItem(PROGRESS_PREFIX + code);
    if (getCode() === code) localStorage.removeItem(CODE_KEY);
  }
  function setCode(code) { localStorage.setItem(CODE_KEY, code); addToCodes(code); }
  function getCode() { return localStorage.getItem(CODE_KEY); }

  /* ---- Tutorial flag ---- */
  function tutorialDone() { return localStorage.getItem(TUTORIAL_KEY) === '1'; }
  function markTutorialDone() { localStorage.setItem(TUTORIAL_KEY, '1'); }

  /* ---------------------------- PROGRESS ---------------------------- */
  function freshProgress() {
    const episodes = {};
    EPISODES.forEach(ep => { episodes[ep.id] = { unlocked: ep.id === 1, completed: false, panels: {} }; });
    // Starting kit so the power-up system is usable from Episode 1.
    return { episodes, score: 0, inventory: { pu1: 1, pu2: 1 } };
  }
  function getInventory(code){ const p=ensureProgress(code); if(!p.inventory){ p.inventory={}; saveProgress(code,p);} return p.inventory; }
  function addPowerup(code, id, n){ const p=ensureProgress(code); if(!p.inventory)p.inventory={}; p.inventory[id]=(p.inventory[id]||0)+(n||1); saveProgress(code,p); return p.inventory; }
  function usePowerup(code, id){ const p=ensureProgress(code); if(!p.inventory||!p.inventory[id]) return false; p.inventory[id]--; if(p.inventory[id]<=0) delete p.inventory[id]; saveProgress(code,p); return true; }
  function getScore(code){ const p=ensureProgress(code); return p.score||0; }
  function addScore(code, n){ const p=ensureProgress(code); p.score=(p.score||0)+n; saveProgress(code,p); return p.score; }
  function loadProgress(code) { try { const r = localStorage.getItem(PROGRESS_PREFIX + code); return r ? JSON.parse(r) : null; } catch (e) { return null; } }
  function saveProgress(code, p) { localStorage.setItem(PROGRESS_PREFIX + code, JSON.stringify(p)); }
  function ensureProgress(code) { let p = loadProgress(code); if (!p) { p = freshProgress(); saveProgress(code, p); } return p; }
  function completedCount(code) { const p = ensureProgress(code); return Object.values(p.episodes).filter(e => e.completed).length; }
  function completePanel(code, epId, panelId) { const p = ensureProgress(code); if(p.episodes[epId].panels[panelId] !== 'COMPLETED'){ p.score=(p.score||0)+50; } p.episodes[epId].panels[panelId] = 'COMPLETED'; saveProgress(code, p); return p; }
  function completeEpisode(code, epId) {
    const p = ensureProgress(code);
    const firstTime = !p.episodes[epId].completed;
    p.episodes[epId].completed = true;
    const n = p.episodes[epId + 1]; if (n) n.unlocked = true;
    if (firstTime) { p.score = (p.score||0) + 200; const pu = powerupForEpisode(epId); if(pu){ if(!p.inventory)p.inventory={}; p.inventory[pu.id]=(p.inventory[pu.id]||0)+2; } }
    saveProgress(code, p); return p;
  }
  function getEpisode(id) { return EPISODES.find(e => e.id === Number(id)); }

  /* ---------------------------- UI HELPERS ---------------------------- */
  function spawnParticles() {
    const host = document.getElementById('particles'); if (!host) return;
    for (let i = 0; i < 30; i++) {
      const dot = document.createElement('span'); dot.className = 'mote';
      dot.style.left = Math.random() * 100 + 'vw';
      dot.style.animationDelay = (Math.random() * 12).toFixed(2) + 's';
      dot.style.animationDuration = (10 + Math.random() * 12).toFixed(2) + 's';
      dot.style.opacity = (0.2 + Math.random() * 0.5).toFixed(2);
      const s = (2 + Math.random() * 4).toFixed(1) + 'px'; dot.style.width = s; dot.style.height = s;
      host.appendChild(dot);
    }
  }
  // Confetti - rich sky-falling pieces (squares, circles, ribbons, stars) that sway + spin.
  function confetti(ms, count) {
    ms = ms || 2600; count = count || 120;
    const layer = document.createElement('div'); layer.className = 'confetti-layer';
    document.body.appendChild(layer);
    const colors = ['#8A5CFF','#2EE6FF','#3DDC97','#FFC857','#FF5D73','#FF3DA5','#9CFF3D','#FF8A3D'];
    const shapes = ['sq','ci','ribbon','star'];
    for (let i = 0; i < count; i++) {
      const fall = document.createElement('span'); fall.className = 'conf-fall';
      fall.style.left = (Math.random() * 100) + 'vw';
      fall.style.animationDelay = (Math.random() * 0.9).toFixed(2) + 's';
      fall.style.animationDuration = (2.4 + Math.random() * 2.4).toFixed(2) + 's';
      const piece = document.createElement('span');
      const shape = shapes[Math.floor(Math.random() * shapes.length)];
      piece.className = 'conf-piece ' + shape;
      const col = colors[Math.floor(Math.random() * colors.length)];
      if (shape === 'star') { piece.textContent = '★'; piece.style.color = col; piece.style.fontSize = (12 + Math.random() * 12) + 'px'; }
      else { piece.style.background = col; }
      piece.style.animationDuration = (0.5 + Math.random() * 0.9).toFixed(2) + 's';
      fall.appendChild(piece); layer.appendChild(fall);
    }
    setTimeout(() => layer.remove(), ms + 1400);
  }
  function queryParam(name) { return new URLSearchParams(window.location.search).get(name); }
  function artBackground(url, a, b) { return "url('" + url + "'), linear-gradient(150deg, " + a + ", " + (b || '#1b1430') + ")"; }
  function soft(hex) { const c = hex.replace('#',''); const r=parseInt(c.substr(0,2),16),g=parseInt(c.substr(2,2),16),b=parseInt(c.substr(4,2),16); return 'rgba('+r+','+g+','+b+',0.22)'; }
  function applyTheme(ep) {
    document.documentElement.style.setProperty('--accent', ep.accent);
    document.documentElement.style.setProperty('--accent2', ep.accent2 || ep.accent);
    document.documentElement.style.setProperty('--accent-soft', soft(ep.accent));
  }

  window.NEXUS = {
    EPISODES, GAME_META,
    genCode, setCode, getCode, getCodes, addToCodes, removeCode,
    tutorialDone, markTutorialDone,
    freshProgress, loadProgress, saveProgress, ensureProgress, completedCount,
    completePanel, completeEpisode, getEpisode,
    POWERUPS, powerupById, powerupForEpisode,
    getInventory, addPowerup, usePowerup, getScore, addScore,
    panelArt, bossArt, coverArt, artBackground, applyTheme, soft,
    spawnParticles, confetti, queryParam
  };
})();
