/* =========================================================================
   episode.js — Comic page logic
   - Image panels (B&W until cleared, then colour) with a completion animation
   - Passes theme + stickman cosplay + boss dialogue into the games
   - Boss win -> WIN SCREEN (confetti) -> cutscene -> map
   ========================================================================= */
(function () {
  'use strict';

  const code = NEXUS.getCode();
  if (!code) { window.location.href = 'index.html'; return; }

  const epId = Number(NEXUS.queryParam('id')) || 1;
  const episode = NEXUS.getEpisode(epId);
  if (!episode) { window.location.href = 'map.html'; return; }

  const progress = NEXUS.ensureProgress(code);
  const epProgress = progress.episodes[epId];

  NEXUS.applyTheme(episode);

  // Tell NOVA (chatbot) where we are.
  window.NEXUS_CONTEXT = { page:'episode', episode: epId };

  const pubar = document.getElementById('mgPubar');
  function refreshScore(){ const el=document.getElementById('scorePill'); if(el) el.textContent='⬡ '+NEXUS.getScore(code); }
  // Sound toggle
  (function(){ const b=document.getElementById('soundBtn'); if(!b)return; function paint(){ b.textContent = (NEXUS.isMuted&&NEXUS.isMuted())?'🔇':'🔊'; } b.addEventListener('click',()=>{ if(NEXUS.toggleMute)NEXUS.toggleMute(); paint(); }); paint(); })();

  document.getElementById('epTitle').textContent = 'Episode ' + epId + ': ' + episode.title;
  document.getElementById('codePill').textContent = code;
  refreshScore();
  document.getElementById('backToMap').addEventListener('click', () => NEXUS.fx.pageTransition('map.html'));

  const grid = document.getElementById('comicGrid');
  const panelState = {};
  episode.panels.forEach(p => { panelState[p.id] = epProgress.panels[p.id] === 'COMPLETED' ? 'COMPLETED' : 'AVAILABLE'; });
  panelState['panel-boss'] = 'LOCKED';

  let justCompleted = null; // panel id to animate this render

  function render() {
    grid.innerHTML = '';
    episode.panels.forEach((p, i) => {
      const st = panelState[p.id];
      const el = document.createElement('div');
      el.dataset.panelId = p.id;
      el.className = 'panel ' + (st === 'COMPLETED' ? 'panel-completed' : 'panel-available') + (justCompleted === p.id ? ' just-completed' : '');

      const art = document.createElement('div'); art.className = 'panel-art';
      art.style.backgroundImage = NEXUS.artBackground(NEXUS.panelArt(epId, p.id), episode.accent, episode.accent2);
      el.appendChild(art);
      const scrim = document.createElement('div'); scrim.className = 'panel-scrim'; el.appendChild(scrim);
      const badge = document.createElement('div'); badge.className = 'panel-badge'; badge.textContent = st === 'COMPLETED' ? '★' : '▶'; el.appendChild(badge);
      const label = document.createElement('div'); label.className = 'panel-label';
      label.innerHTML = '<div class="pip">0' + (i + 1) + '</div><div class="pname">' + p.name + '</div><div class="ptag">' + (st === 'COMPLETED' ? 'Cleared' : (p.tag || 'Play')) + '</div>';
      el.appendChild(label);
      if (st === 'AVAILABLE') el.addEventListener('click', () => openMiniGame(p));
      grid.appendChild(el);
    });

    // Boss
    const boss = document.createElement('div'); boss.dataset.panelId = 'panel-boss';
    const bossBg = NEXUS.artBackground(NEXUS.bossArt(epId), episode.accent, episode.accent2);
    const bst = panelState['panel-boss'];
    const art = document.createElement('div'); art.className = 'panel-art'; art.style.backgroundImage = bossBg;
    const scrim = document.createElement('div'); scrim.className = 'panel-scrim';

    if (epProgress.completed) {
      boss.className = 'panel panel-boss panel-completed';
      boss.appendChild(art); boss.appendChild(scrim);
      boss.insertAdjacentHTML('beforeend', '<div class="panel-label"><div class="boss-title">' + episode.villain + ' — Defeated</div><div class="boss-sub">Episode cleared. Tap to replay the cutscene.</div></div><div class="panel-badge" style="color:var(--gold)">★</div>');
      boss.addEventListener('click', () => playCutscene());
    } else if (bst === 'AVAILABLE') {
      boss.className = 'panel panel-boss panel-available';
      boss.appendChild(art); boss.appendChild(scrim);
      boss.insertAdjacentHTML('beforeend', '<div class="panel-label"><div class="boss-title">BOSS · ' + episode.villain + '</div><div class="boss-sub">All panels cleared — challenge the boss.</div></div><button class="btn btn-accent boss-cta">Challenge</button>');
      boss.addEventListener('click', () => openBoss());
    } else {
      boss.className = 'panel panel-boss panel-locked';
      boss.appendChild(art); boss.appendChild(scrim);
      boss.insertAdjacentHTML('beforeend', '<div class="panel-label"><div class="boss-title">BOSS · ' + episode.villain + '</div><div class="boss-sub">Sealed</div></div><div class="panel-badge">🔒</div>');
    }
    grid.appendChild(boss);
    justCompleted = null;
    updateProgressBar();
  }

  function updateProgressBar() {
    const done = episode.panels.filter(p => panelState[p.id] === 'COMPLETED').length;
    const total = episode.panels.length + 1; const bossDone = epProgress.completed ? 1 : 0;
    document.getElementById('progressFill').style.width = ((done + bossDone) / total * 100) + '%';
  }

  /* ---- Mini-game overlay ---- */
  const overlay = document.getElementById('minigameOverlay');
  const mgBody = document.getElementById('mgBody');
  const mgName = document.getElementById('mgName');
  let activeGame = null;
  function closeMiniGame() { if (activeGame && activeGame.destroy) activeGame.destroy(); activeGame = null; overlay.classList.remove('open'); mgBody.innerHTML = ''; if(pubar){pubar.innerHTML=''; pubar.style.display='none';} window.NEXUS_CONTEXT = { page:'episode', episode: epId }; }
  document.getElementById('mgClose').addEventListener('click', closeMiniGame);

  function winPanel(panel) {
    panelState[panel.id] = 'COMPLETED';
    NEXUS.completePanel(code, epId, panel.id);
    refreshScore();
    maybeUnlockBoss();
    justCompleted = panel.id;
    if (NEXUS.sfx) NEXUS.sfx('win');
    NEXUS.confetti(2400, 150);            // big sky confetti on EVERY level
    // Tear down the game but KEEP the overlay open to show the celebration.
    if (activeGame && activeGame.destroy) activeGame.destroy(); activeGame = null;
    if (pubar) { pubar.innerHTML = ''; pubar.style.display = 'none'; }
    mgBody.innerHTML =
      '<div class="level-clear">' +
        '<div class="lc-burst"></div>' +
        '<div class="lc-star">★</div>' +
        '<div class="lc-title">LEVEL CLEARED!</div>' +
        '<div class="lc-points">+50</div>' +
      '</div>';
    setTimeout(() => { overlay.classList.remove('open'); mgBody.innerHTML = ''; window.NEXUS_CONTEXT = { page:'episode', episode: epId }; render(); }, 2000);
  }
  function buildSkillPUBar(panel) {
    pubar.innerHTML = '';
    const inv = NEXUS.getInventory(code);
    const owned = NEXUS.POWERUPS.filter(pu => pu.effect === 'solve' && inv[pu.id] > 0);
    if (!owned.length) { pubar.style.display = 'none'; return; }
    pubar.style.display = 'flex';
    owned.forEach(pu => {
      const b = document.createElement('button'); b.className = 'pu-chip'; b.title = pu.name + ' — ' + pu.desc;
      b.innerHTML = '<span class="pu-ic">' + pu.icon + '</span><span class="pu-ct">' + inv[pu.id] + '</span>';
      b.addEventListener('click', () => { if (NEXUS.usePowerup(code, pu.id)) { if (NEXUS.sfx) NEXUS.sfx('powerup'); winPanel(panel); } });
      pubar.appendChild(b);
    });
  }
  function openMiniGame(panel) {
    const game = MiniGames[panel.game]; if (!game) return;
    NEXUS.fx.playEpisodeFX(epId, () => launchGame(panel, game));
  }
  function launchGame(panel, game) {
    mgName.textContent = panel.name; mgBody.innerHTML = ''; overlay.classList.add('open');
    window.NEXUS_CONTEXT = { page:'episode', episode: epId, game: panel.game, gameName: panel.name };
    buildSkillPUBar(panel);
    activeGame = game;
    game.init(mgBody,
      function onWin() { winPanel(panel); },
      function onFail() { if (NEXUS.sfx) NEXUS.sfx('lose'); },
      { villain: episode.villain, hero: episode.hero, heroKit: episode.heroKit, villainKit: episode.villainKit, panelName: panel.name });
  }
  function maybeUnlockBoss() { if (episode.panels.every(p => panelState[p.id] === 'COMPLETED') && panelState['panel-boss'] === 'LOCKED') panelState['panel-boss'] = 'AVAILABLE'; }

  function openBoss() {
    NEXUS.fx.playEpisodeFX(epId, launchBoss);
  }
  function launchBoss() {
    mgName.textContent = 'Boss · ' + episode.villain; mgBody.innerHTML = ''; overlay.classList.add('open');
    if (pubar) { pubar.innerHTML = ''; pubar.style.display = 'none'; }
    window.NEXUS_CONTEXT = { page:'episode', episode: epId, game:'boss', gameName:'Boss' };
    const inv = NEXUS.getInventory(code);
    const bossPU = NEXUS.POWERUPS.filter(pu => inv[pu.id] > 0).map(pu => ({ id:pu.id, name:pu.name, icon:pu.icon, effect:pu.effect, count: inv[pu.id] }));
    activeGame = MiniGames.boss;
    MiniGames.boss.init(mgBody,
      function onWin() { NEXUS.completeEpisode(code, epId); epProgress.completed = true; refreshScore(); closeMiniGame(); showWinScreen(); },
      function onFail() {},
      { villain: episode.villain, hero: episode.hero, lines: episode.bossLines,
        powerups: bossPU, consume: function(id){ return NEXUS.usePowerup(code, id); } });
  }

  /* ---- WIN SCREEN + confetti ---- */
  const cutOverlay = document.getElementById('cutsceneOverlay');
  const cutBody = document.getElementById('cutBody');

  function showWinScreen() {
    cutOverlay.classList.add('open');
    if (NEXUS.sfx) NEXUS.sfx('win');
    NEXUS.confetti(2600);
    const isFinal = !!episode.final;
    cutBody.innerHTML =
      '<div class="win-screen">' +
        '<div class="win-big">' + (isFinal ? 'YOU SAVED THE NEXUS' : 'YOU WIN!') + '</div>' +
        '<div class="win-sub">' + (isFinal ? 'Every world is whole again.' : 'Episode ' + epId + ' · ' + episode.title + ' cleared') + '</div>' +
        '<div class="win-vs">' + episode.hero + ' defeats ' + episode.villain + '</div>' +
        '<button class="btn btn-accent" id="winContinue" style="width:100%;margin-top:1rem">See what happens</button>' +
      '</div>';
    document.getElementById('winContinue').addEventListener('click', () => playCutscene());
  }

  function playCutscene() {
    const frames = buildCutscene(episode); let i = 0; cutOverlay.classList.add('open');
    function show() {
      const f = frames[i]; const last = i === frames.length - 1;
      cutBody.innerHTML =
        '<div class="cut-stage"><div><div class="cut-art">' + f.art + '</div><div class="cut-caption">' + f.caption + '</div>' + (f.sfx ? '<div class="cut-sfx">' + f.sfx + '</div>' : '') + '</div></div>' +
        (last ? '<div class="complete-banner">Episode Complete!</div>' : '') +
        '<button class="btn btn-accent" id="cutNext" style="width:100%">' + (last ? 'Return to Map' : 'Next') + '</button>';
      document.getElementById('cutNext').addEventListener('click', () => { if (last) { NEXUS.confetti(2600, 160); setTimeout(() => NEXUS.fx.pageTransition('map.html'), 400); } else { i++; show(); } });
    }
    show();
  }
  function buildCutscene(ep) {
    return [
      { art: 'THE GATE CRACKS', caption: ep.villain + "'s domain begins to collapse.", sfx: '' },
      { art: ep.villain.toUpperCase(), caption: '"' + (ep.bossLines && ep.bossLines.defeat ? ep.bossLines.defeat : '...') + '"', sfx: '' },
      { art: ep.hero.toUpperCase(), caption: ep.hero + ' steadies, energy gathering.', sfx: 'VWORRR…' },
      { art: '★ IMPACT ★', caption: 'One decisive move splits the dark.', sfx: 'KRA-KOOM!' },
      { art: 'VICTORY', caption: ep.villain + ' is sealed — the world is safe.', sfx: '' }
    ];
  }

  maybeUnlockBoss();
  render();
  NEXUS.spawnParticles();
})();
