/* =========================================================================
   fx.js — animation engine
   - NEXUS.fx.playEpisodeFX(epId, cb): a UNIQUE themed burst per episode,
     played when you open a panel or a map gate.
   - NEXUS.fx.pageTransition(url): a colourful portal wipe between pages.
   Attaches to window.NEXUS.fx.
   ========================================================================= */
(function () {
  'use strict';
  const N = window.NEXUS || (window.NEXUS = {});
  function rand(n){ return Math.floor(Math.random()*n); }

  // Episode -> signature effect type.
  const FX_TYPES = { 1:'hex', 2:'web', 3:'slash', 4:'cards', 5:'rings', 6:'waves', 7:'flame', 8:'crumble', 9:'glitch', 10:'prism' };

  function buildFX(ov, type) {
    if (type === 'hex')      { for (let i=0;i<3;i++){ const d=document.createElement('div'); d.className='hexring'; d.style.animationDelay=(i*0.1)+'s'; ov.appendChild(d); } }
    else if (type === 'web') { for (let i=0;i<12;i++){ const d=document.createElement('div'); d.className='webline'; d.style.transform='rotate('+(i*30)+'deg)'; d.style.animationDelay=(i*0.012)+'s'; ov.appendChild(d); } }
    else if (type === 'slash'){ const d=document.createElement('div'); d.className='slashfx'; ov.appendChild(d); }
    else if (type === 'cards'){ for (let i=0;i<3;i++){ const d=document.createElement('div'); d.className='card3d'; d.style.left=(34+i*11)+'%'; d.style.animationDelay=(i*0.09)+'s'; ov.appendChild(d); } }
    else if (type === 'rings'){ for (let i=0;i<4;i++){ const d=document.createElement('div'); d.className='ringfx'; d.style.animationDelay=(i*0.1)+'s'; ov.appendChild(d); } }
    else if (type === 'waves'){ const d=document.createElement('div'); d.className='wavefx'; ov.appendChild(d); }
    else if (type === 'flame'){ const s=document.createElement('div'); s.className='slashfx flame'; ov.appendChild(s); for (let i=0;i<12;i++){ const e=document.createElement('div'); e.className='ember'; e.style.left=(20+rand(60))+'%'; e.style.top=(30+rand(40))+'%'; e.style.animationDelay=(rand(35)/100)+'s'; ov.appendChild(e); } }
    else if (type === 'crumble'){ ov.classList.add('crumble-grid'); for (let i=0;i<28;i++){ const c=document.createElement('div'); c.className='crumb'; c.style.animationDelay=(rand(45)/100)+'s'; ov.appendChild(c); } }
    else if (type === 'glitch'){ for (let i=0;i<4;i++){ const b=document.createElement('div'); b.className='glitchbar'; b.style.top=(15+i*22)+'%'; b.style.animationDelay=(i*0.07)+'s'; ov.appendChild(b); } }
    else if (type === 'prism'){ for (let i=0;i<12;i++){ const r=document.createElement('div'); r.className='rayfx'; r.style.transform='rotate('+(i*30)+'deg)'; r.style.background='linear-gradient(90deg, hsl('+(i*30)+',95%,62%), transparent)'; ov.appendChild(r); } }
  }

  function playEpisodeFX(epId, cb) {
    let a = '#8A5CFF', a2 = '#2EE6FF';
    const ep = N.getEpisode ? N.getEpisode(epId) : null;
    if (ep) { a = ep.accent; a2 = ep.accent2 || ep.accent; }
    const type = FX_TYPES[epId] || 'rings';
    const ov = document.createElement('div'); ov.className = 'fx fx-' + type;
    ov.style.setProperty('--a', a); ov.style.setProperty('--a2', a2);
    buildFX(ov, type);
    document.body.appendChild(ov);
    if (N.sfx) N.sfx('open');
    setTimeout(() => { ov.remove(); if (cb) cb(); }, 720);
  }

  function pageTransition(url) {
    const ov = document.createElement('div'); ov.className = 'page-wipe';
    document.body.appendChild(ov);
    requestAnimationFrame(() => ov.classList.add('go'));
    if (N.sfx) N.sfx('open');
    setTimeout(() => { window.location.href = url; }, 520);
  }

  N.fx = { playEpisodeFX, pageTransition };
})();
