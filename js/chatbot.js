/* =========================================================================
   chatbot.js — "NOVA", a hardcoded in-game helper (no API key needed).
   Floating button + chat panel injected on every page. Answers from a
   keyword-matched knowledge base and is aware of the current episode/game
   via window.NEXUS_CONTEXT (set by episode.js).
   ========================================================================= */
(function () {
  'use strict';

  // Per-game tips NOVA can give.
  const GAME_TIPS = {
    sequenceRecall: 'Watch the whole flash first, then repeat. Whisper the colours to yourself — it really helps memory.',
    reactionGate:   'Only tap GREEN. Resist the red ones — patience beats speed here.',
    patternMatch:   'Read the rhythm of the row out loud: is it A-B-A-B or A-A-B? The blank follows the same beat.',
    oddOneOut:      'Relax your eyes and let the odd colour "pop" instead of checking each tile one by one.',
    rhythmTap:      'Tap a hair EARLY — the ring keeps shrinking. Land 3 good taps and you win.',
    memoryGrid:     'Trace the path with your finger as the cells light up, then retrace it.',
    wireConnect:    'Tap a colour on the left, then the SAME colour on the right. Match all four.',
    maze:           'Use the arrow pad or arrow keys. The green tile is the exit — hug the open paths.',
    lightsOut:      'Each tap flips a light AND its neighbours. Work row by row from the top.',
    memoryMatch:    'Remember positions, not just symbols. Flip a known card first, then hunt its pair.',
    sortBins:       'Send each shape to the bin of the SAME colour. Two mis-sorts and it resets.',
    anagram:        'Look for common endings first (-ING, -ER). Tap letters in order; Clear to restart.',
    stroop:         'Tap the INK colour of the word, NOT what it says. Trust the colour, ignore the letters.',
    quickMath:      'Find every tile that equals the target number. Add carefully before you tap.',
    ascend:         'Tap the numbers from smallest to largest as fast as you can.',
    stickFight:     'Solve the maths to land a hit. A wrong answer costs YOU health, so double-check.'
  };

  // Keyword knowledge base. First matching rule wins.
  const RULES = [
    { k:['hello','hi','hey','yo'], a:()=>'Hey! I\u2019m NOVA, your Nexus guide. Ask me how to play, how to beat a boss, or for a tip on the game you\u2019re on.' },
    { k:['who are you','what are you','your name','nova'], a:()=>'I\u2019m NOVA \u2014 a built-in helper for Nexus Academy. No internet needed, I live right inside the game.' },
    { k:['how','play','start','begin','what do i do'], a:()=>'Pick a gate on the map, clear its 6 challenge panels, then beat the boss to win the episode and unlock the next gate.' },
    { k:['boss','phase'], a:()=>'Bosses have 3 phases. A wrong answer costs you a LIFE (the boss never heals). Lose all lives and you redo the boss. Save a Shield or +Life power-up for the tricky phase!' },
    { k:['life','lives','heart','health'], a:()=>'You have 3 lives in a boss fight. Mistakes cost a life. The \u201cguard\u201d power-ups block a mistake and \u201clife\u201d power-ups give you +1.' },
    { k:['power','powerup','power-up','item'], a:()=>'Each episode rewards a unique power-up when you clear it. Tap a power-up in the bar during a challenge: some instantly solve it, some shield you, some give extra lives.' },
    { k:['stuck','help','hint','tip','how do i beat','cant'], a:ctxTip },
    { k:['code','save','saves','access'], a:()=>'Your 6-character access code is your save. The title screen lists all your saves so you can switch or delete them \u2014 no login required.' },
    { k:['image','art','picture','photo','colour','color','black'], a:()=>'Drop your colour art into assets/e1\u2026e10 (panel-1.png\u2026, boss.png, cover.png). Panels stay black & white until you clear them, then reveal in colour automatically.' },
    { k:['confetti','win','reward','points','score'], a:()=>'You get confetti and points for every panel you clear, and a big celebration when you beat an episode. Points stack up on your save.' },
    { k:['sound','music','audio','mute'], a:()=>'Tap the speaker icon in the top bar to mute or unmute the sound effects.' },
    { k:['thanks','thank you','ty'], a:()=>'Anytime! Go win this. \u2728' }
  ];

  function ctxTip(){
    const c = window.NEXUS_CONTEXT || {};
    if (c.game && GAME_TIPS[c.game]) return 'Tip for ' + (c.gameName||'this challenge') + ': ' + GAME_TIPS[c.game];
    if (c.episode) return 'You\u2019re on Episode ' + c.episode + '. Clear all 6 panels to face the boss. Open any panel and ask me again for a game-specific tip!';
    return 'Open a challenge and ask me again \u2014 I\u2019ll give you a tip for that exact game.';
  }

  function answer(text){
    const t = (text||'').toLowerCase();
    for (const r of RULES){ if (r.k.some(k=>t.includes(k))) return r.a(); }
    // Game name mentioned directly?
    for (const g in GAME_TIPS){ if (t.includes(g.toLowerCase())) return GAME_TIPS[g]; }
    return 'I can help with: how to play, bosses, lives, power-ups, saves, adding images, or a tip for your current game. What do you need?';
  }

  // ---- Build the widget ----
  function build(){
    if (document.getElementById('nova-fab')) return;
    const fab = document.createElement('button');
    fab.id = 'nova-fab'; fab.className = 'nova-fab'; fab.title = 'Ask NOVA for help';
    fab.innerHTML = '<span>?</span>';
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.id = 'nova-panel'; panel.className = 'nova-panel';
    panel.innerHTML =
      '<div class="nova-head"><span class="nova-title">NOVA \u00b7 Guide</span><button class="nova-close" aria-label="Close">\u00d7</button></div>' +
      '<div class="nova-log" id="nova-log"></div>' +
      '<div class="nova-chips" id="nova-chips"></div>' +
      '<div class="nova-input"><input id="nova-text" type="text" placeholder="Ask for help\u2026" autocomplete="off"/><button id="nova-send">Send</button></div>';
    document.body.appendChild(panel);

    const log = panel.querySelector('#nova-log');
    const chipsWrap = panel.querySelector('#nova-chips');
    const input = panel.querySelector('#nova-text');

    function add(text, who){ const b=document.createElement('div'); b.className='nova-msg '+who; b.textContent=text; log.appendChild(b); log.scrollTop=log.scrollHeight; }
    function botSay(text){ add(text,'bot'); if(window.NEXUS&&NEXUS.sfx)NEXUS.sfx('open'); }
    function send(text){ if(!text)return; add(text,'me'); setTimeout(()=>botSay(answer(text)), 220); }

    const CHIPS = ['How do I play?','How do I beat the boss?','Give me a tip','Power-ups?'];
    CHIPS.forEach(c=>{ const b=document.createElement('button'); b.className='nova-chip'; b.textContent=c; b.addEventListener('click',()=>send(c)); chipsWrap.appendChild(b); });

    function open(){ panel.classList.add('open'); if(!log.dataset.greeted){ botSay('Hi, I\u2019m NOVA. Need a hand? Tap a question below or type one.'); log.dataset.greeted='1'; } input.focus(); }
    function close(){ panel.classList.remove('open'); }
    fab.addEventListener('click', ()=> panel.classList.contains('open') ? close() : open());
    panel.querySelector('.nova-close').addEventListener('click', close);
    panel.querySelector('#nova-send').addEventListener('click', ()=>{ send(input.value.trim()); input.value=''; });
    input.addEventListener('keydown', e=>{ if(e.key==='Enter'){ send(input.value.trim()); input.value=''; } });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
