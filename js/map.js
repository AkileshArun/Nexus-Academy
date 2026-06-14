/* =========================================================================
   map.js — Shadow-Fight-style world map
   Circular level nodes along a glowing road. Tapping a node opens a
   description card; from there the player starts the episode.
   ========================================================================= */
(function () {
  'use strict';

  const code = NEXUS.getCode();
  if (!code) { window.location.href = 'index.html'; return; }
  const progress = NEXUS.ensureProgress(code);
  window.NEXUS_CONTEXT = { page:'map' };
  const sp=document.getElementById('scorePill'); if(sp) sp.textContent='⬡ '+NEXUS.getScore(code);
  (function(){ const b=document.getElementById('soundBtn'); if(!b)return; function paint(){ b.textContent=(NEXUS.isMuted&&NEXUS.isMuted())?'🔇':'🔊'; } b.addEventListener('click',()=>{ if(NEXUS.toggleMute)NEXUS.toggleMute(); paint(); }); paint(); })();

  document.getElementById('codePill').textContent = code;
  document.getElementById('backToTitle').addEventListener('click', () => { window.location.href = 'index.html'; });
  const htp = document.getElementById('howToPlay');
  if (htp) htp.addEventListener('click', () => { window.location.href = 'tutorial.html'; });

  /* ---- Build the circular nodes, alternating left/right down the road ---- */
  const road = document.getElementById('road');
  NEXUS.EPISODES.forEach((ep, i) => {
    const state = progress.episodes[ep.id];
    const row = document.createElement('div');
    row.className = 'node-row ' + (i % 2 === 0 ? 'left' : 'right');

    const node = document.createElement('div');
    let cls = state.completed ? 'completed' : (state.unlocked ? 'unlocked' : 'locked');
    node.className = 'node ' + cls;
    node.style.setProperty('--node', ep.accent);

    const art = document.createElement('div');
    art.className = 'node-art';
    art.style.backgroundImage = NEXUS.artBackground(NEXUS.coverArt(ep.id), ep.accent, ep.accent2);
    node.appendChild(art);

    const scrim = document.createElement('div'); scrim.className = 'node-scrim'; node.appendChild(scrim);

    const num = document.createElement('div'); num.className = 'node-num'; num.textContent = ep.id; node.appendChild(num);

    if (!state.unlocked) { const lk = document.createElement('div'); lk.className = 'node-lock'; lk.textContent = '🔒'; node.appendChild(lk); }

    const cap = document.createElement('div'); cap.className = 'node-caption'; cap.textContent = ep.title; node.appendChild(cap);

    node.style.animationDelay = (i * 0.18) + 's';
    node.addEventListener('click', () => NEXUS.fx.playEpisodeFX(ep.id, () => openModal(ep, state)));

    row.appendChild(node);
    road.appendChild(row);
  });

  /* ---- Description modal ---- */
  const modal = document.getElementById('nodeModal');
  function openModal(ep, state) {
    document.documentElement.style.setProperty('--accent', ep.accent);
    document.documentElement.style.setProperty('--accent2', ep.accent2 || ep.accent);
    document.documentElement.style.setProperty('--accent-soft', soft(ep.accent));

    document.getElementById('modalArt').style.backgroundImage = NEXUS.artBackground(NEXUS.coverArt(ep.id), ep.accent, ep.accent2);
    document.getElementById('modalEyebrow').textContent = 'Episode ' + ep.id + (state.completed ? ' · Cleared' : (state.unlocked ? '' : ' · Locked'));
    document.getElementById('modalTitle').textContent = ep.title;
    document.getElementById('modalVs').textContent = ep.hero + '  vs  ' + ep.villain;
    document.getElementById('modalBlurb').textContent = ep.blurb || '';

    const chips = document.getElementById('modalChips'); chips.innerHTML = '';
    (ep.panels || []).forEach(p => { const c = document.createElement('span'); c.className = 'chip'; c.textContent = p.tag || p.name; chips.appendChild(c); });

    const actions = document.getElementById('modalActions'); actions.innerHTML = '';
    if (state.unlocked) {
      const start = document.createElement('button');
      start.className = 'btn btn-accent'; start.style.width = '100%';
      start.textContent = state.completed ? 'Replay episode' : 'Start episode';
      start.addEventListener('click', () => NEXUS.fx.pageTransition('episode.html?id=' + ep.id));
      const back = document.createElement('button'); back.className = 'btn btn-ghost'; back.style.width = '100%'; back.style.marginTop = '0.5rem'; back.textContent = 'Close'; back.addEventListener('click', closeModal);
      const wrap = document.createElement('div'); wrap.className = 'modal-actions'; wrap.style.flexDirection = 'column'; wrap.appendChild(start); wrap.appendChild(back);
      actions.appendChild(wrap);
    } else {
      const locked = document.createElement('div'); locked.className = 'modal-locked'; locked.textContent = '🔒 Clear Episode ' + (ep.id - 1) + ' to unlock this gate.';
      const back = document.createElement('button'); back.className = 'btn btn-ghost'; back.style.width = '100%'; back.textContent = 'Close'; back.addEventListener('click', closeModal);
      actions.appendChild(locked); actions.appendChild(back);
    }
    modal.classList.add('open');
  }
  function closeModal() { modal.classList.remove('open'); }
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  function soft(hex) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
    return 'rgba(' + r + ',' + g + ',' + b + ',0.22)';
  }

  NEXUS.spawnParticles();
})();
